import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Users,
    Building2,
    ArrowUpDown,
    Command as CommandIcon,
    Loader2,
    CalendarDays,
    FileText,
    LayoutDashboard,
    UsersRound,
    Settings
} from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";

interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    type: "member" | "department" | "transaction" | "page";
    url: string;
    icon: any;
}

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const { organization } = useChurch();
    const navigate = useNavigate();

    // Pages to include in search
    const pages: SearchResult[] = [
        { id: "p-dashboard", title: "Painel Geral", type: "page", url: "/", icon: LayoutDashboard },
        { id: "p-lancamentos", title: "Financeiro (Lançamentos)", type: "page", url: "/lancamentos", icon: ArrowUpDown },
        { id: "p-membros", title: "Membros (Secretaria)", type: "page", url: "/membros", icon: Users },
        { id: "p-departamentos", title: "Departamentos", type: "page", url: "/departamentos", icon: UsersRound },
        { id: "p-relatorios", title: "Relatórios", type: "page", url: "/relatorios", icon: FileText },
        { id: "p-patrimonio", title: "Patrimônio", type: "page", url: "/patrimonio", icon: Building2 },
        { id: "p-configuracoes", title: "Configurações", type: "page", url: "/configuracoes", icon: Settings },
    ];

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const performSearch = useCallback(async (searchTerm: string) => {
        if (!searchTerm || searchTerm.length < 2 || !organization?.id) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const [{ data: members }, { data: depts }, { data: txs }] = await Promise.all([
                supabase
                    .from("members")
                    .select("id, full_name, phone")
                    .eq("organization_id", organization.id)
                    .ilike("full_name", `%${searchTerm}%`)
                    .limit(5),
                supabase
                    .from("departments")
                    .select("id, name")
                    .eq("organization_id", organization.id)
                    .ilike("name", `%${searchTerm}%`)
                    .limit(5),
                supabase
                    .from("transactions")
                    .select("id, description, amount, type")
                    .eq("organization_id", organization.id)
                    .ilike("description", `%${searchTerm}%`)
                    .limit(5),
            ]);

            const formattedResults: SearchResult[] = [];

            members?.forEach((m) => {
                formattedResults.push({
                    id: m.id,
                    title: m.full_name,
                    subtitle: m.phone || "Sem telefone",
                    type: "member",
                    url: `/membros`,
                    icon: Users,
                });
            });

            depts?.forEach((d) => {
                formattedResults.push({
                    id: d.id,
                    title: d.name,
                    type: "department",
                    url: `/departamentos`,
                    icon: Building2,
                });
            });

            txs?.forEach((t) => {
                formattedResults.push({
                    id: t.id,
                    title: t.description,
                    subtitle: `${t.type === "income" ? "+" : "-"} R$ ${t.amount.toLocaleString("pt-BR")}`,
                    type: "transaction",
                    url: "/lancamentos",
                    icon: ArrowUpDown,
                });
            });

            setResults(formattedResults);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setLoading(false);
        }
    }, [organization?.id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, performSearch]);

    const onSelect = (url: string) => {
        setOpen(false);
        setQuery("");
        navigate(url);
    };

    const filteredPages = pages.filter(p =>
        p.title.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <>
            <div
                onClick={() => setOpen(true)}
                className="flex-1 max-w-sm relative group mx-4 h-8 flex items-center cursor-pointer"
            >
                <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="w-full h-8 bg-secondary/50 border border-border/50 pl-8 pr-3 flex items-center text-[13px] text-muted-foreground hover:bg-secondary/70 transition-all rounded-lg">
                    <span>Pesquisar no Mordus...</span>
                    <div className="ml-auto flex items-center gap-1 opacity-50">
                        <CommandIcon className="h-2.5 w-2.5" />
                        <span className="text-[10px]">K</span>
                    </div>
                </div>
            </div>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="O que você está procurando?"
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>
                        {loading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Pesquisando...</span>
                            </div>
                        ) : (
                            "Nenhum resultado encontrado."
                        )}
                    </CommandEmpty>

                    {filteredPages.length > 0 && (
                        <CommandGroup heading="Páginas e Navegação">
                            {filteredPages.map((item) => (
                                <CommandItem key={item.id} onSelect={() => onSelect(item.url)}>
                                    <item.icon className="mr-2 h-4 w-4 text-primary" />
                                    <span>{item.title}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results.length > 0 && (
                        <>
                            <CommandSeparator />
                            <CommandGroup heading="Resultados da Busca">
                                {results.map((item) => (
                                    <CommandItem key={item.id} onSelect={() => onSelect(item.url)}>
                                        <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span>{item.title}</span>
                                            {item.subtitle && <span className="text-[10px] text-muted-foreground">{item.subtitle}</span>}
                                        </div>
                                        <span className="ml-auto text-[10px] uppercase text-muted-foreground/50 font-bold tracking-tighter">
                                            {item.type === "member" ? "Membro" : item.type === "department" ? "Depto" : "Financeiro"}
                                        </span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
