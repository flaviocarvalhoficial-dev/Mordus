import { useLocation, Link } from "react-router-dom";
import {
    Users, Building2, FileText, MapPinned, UsersRound,
    Heart, CalendarDays, Handshake, Crown, LayoutDashboard,
    ArrowUpDown, FolderOpen, Lock, Bell, AlertCircle, TrendingUp,
    ChevronRight, ArrowRight
} from "lucide-react";
import { useChurch } from "@/contexts/ChurchContext";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

interface SubItem {
    title: string;
    url: string;
    icon: any;
    badge?: string;
}

const SECRETARIA_ITEMS: SubItem[] = [
    { title: "Dashboard", url: "/secretaria", icon: LayoutDashboard },
    { title: "Membros", url: "/membros", icon: Users },
    { title: "Liderança", url: "/lideranca", icon: Crown },
    { title: "Departamentos", url: "/departamentos", icon: UsersRound },
    { title: "Patrimônio", url: "/patrimonio", icon: Building2 },
    { title: "Documentos", url: "/documentos", icon: FileText },
    { title: "Congregações", url: "/congregacoes", icon: MapPinned },
    { title: "Calendário", url: "/calendario", icon: CalendarDays },
    { title: "Ação Social", url: "/servico-social", icon: Heart },
    { title: "Parcerias", url: "/parceiros", icon: Handshake },
];

const TESOURARIA_ITEMS: SubItem[] = [
    { title: "Resumo Financeiro", url: "/", icon: LayoutDashboard },
    { title: "Lançamentos", url: "/lancamentos", icon: ArrowUpDown },
    { title: "Categorias", url: "/categorias", icon: FolderOpen },
    { title: "Fechamento", url: "/fechamento", icon: Lock, badge: "Novo" },
    { title: "Relatórios", url: "/relatorios", icon: FileText },
];

export function ContextSidebar() {
    const location = useLocation();
    const { organization } = useChurch();
    const path = location.pathname;

    const context = useMemo(() => {
        if (path === "/configuracoes" || path === "/ajuda") return "sistema";
        if (path.startsWith("/membros") ||
            path.startsWith("/secretaria") ||
            path.startsWith("/patrimonio") ||
            path.startsWith("/documentos") ||
            path.startsWith("/congregacoes") ||
            path.startsWith("/departamentos") ||
            path.startsWith("/servico-social") ||
            path.startsWith("/calendario") ||
            path.startsWith("/parceiros") ||
            path.startsWith("/lideranca")) {
            return "secretaria";
        }
        return "tesouraria";
    }, [path]);

    const items = context === "secretaria" ? SECRETARIA_ITEMS : context === "tesouraria" ? TESOURARIA_ITEMS : [];
    const title = context === "secretaria" ? "Secretaria" : context === "tesouraria" ? "Tesouraria" : "Configurações";

    if (context === "sistema") return null;

    return (
        <div className="w-64 border-r border-border bg-secondary/10 flex flex-col h-screen">
            <div className="p-6 pb-2">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 mb-4">{title}</h2>
            </div>

            <div className="flex-1 px-3 overflow-y-auto no-scrollbar">
                <div className="space-y-1 py-2">
                    {items.map((item) => {
                        const isActive = path === item.url;
                        return (
                            <Link
                                key={item.url}
                                to={item.url}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${isActive
                                    ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : "text-muted-foreground/60"}`} />
                                    <span className={`text-[13px] ${isActive ? "font-bold" : "font-medium"}`}>{item.title}</span>
                                </div>
                                {item.badge ? (
                                    <Badge variant="secondary" className="bg-primary/10 text-primary text-[8px] font-black uppercase px-1.5 py-0 h-4 border-primary/20">
                                        {item.badge}
                                    </Badge>
                                ) : (
                                    isActive && <ChevronRight className="h-3 w-3 opacity-50" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Opção 2: Alertas e Atividades incorporados */}
            <div className="p-4 mt-auto">
                <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="h-12 w-12 text-primary" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status do Dia</span>
                    </div>
                    <p className="text-[11px] font-medium text-foreground leading-tight">
                        {context === 'secretaria' ? 'Não há aniversariantes hoje.' : 'Todas as contas estão em dia.'}
                    </p>
                    <Link to="/ajuda" className="flex items-center gap-1 text-[10px] text-primary font-bold mt-3 hover:gap-2 transition-all">
                        VER DETALHES <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
