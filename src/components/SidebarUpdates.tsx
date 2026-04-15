import { useState, useMemo, useEffect } from "react";
import { Cake, AlertCircle, CalendarDays, TrendingUp, ArrowRight, Wallet, User, History, Sparkles, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useChurch } from "@/contexts/ChurchContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { MemberDrawer } from "@/components/MemberDrawer";
import { useCopilot } from "@/contexts/CopilotContext";

// --- Types ---
interface InsightItem {
    id: string;
    category: "FINANCIAL" | "ATTENTION" | "PEOPLE";
    title?: string;
    description: string;
    icon?: any;
    colorClass: string;
    url?: string;
    onClick?: () => void;
    member?: any;
    amount?: number;
    date?: string;
    isOverdue?: boolean;
}

// --- Helper Components ---

function InsightSlot({ items, slotIndex, fallback }: { items: InsightItem[], slotIndex: number, fallback: React.ReactNode }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (items.length <= 1) {
            setCurrentIndex(0);
            return;
        }

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 6000 + (slotIndex * 1500));

        return () => clearInterval(timer);
    }, [items.length, slotIndex]);

    if (items.length === 0) return <>{fallback}</>;

    const activeItem = items[currentIndex];

    return (
        <div key={activeItem.id} className="animate-in slide-in-from-right-4 fade-in duration-700 ease-out">
            <CardLayout item={activeItem} count={items.length} />
        </div>
    );
}

function CardLayout({ item, count }: { item: InsightItem, count: number }) {
    if (item.category === "PEOPLE" && item.member) {
        return <BirthdayCard member={item.member} count={count} />;
    }

    if (item.category === "FINANCIAL") {
        return <BillCard item={item} count={count} />;
    }

    return <GeneralCard item={item} count={count} />;
}

function BirthdayCard({ member, count }: { member: any, count: number }) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    return (
        <>
            <MemberDrawer
                member={member}
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
            />
            <div
                onClick={() => setIsDrawerOpen(true)}
                className="bg-card border border-border/50 rounded-2xl p-5 relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-all h-[120px] flex flex-col justify-center"
            >
                <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/30 group-hover:scale-105 transition-transform duration-500 shadow-inner">
                            {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.full_name} className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-8 w-8 text-primary/40" />
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-sm border border-border/50">
                            <div className="bg-primary/20 rounded-full p-1 leading-none">
                                <Cake className="h-3 w-3 text-primary" />
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                        <h4 className="text-[15px] font-black text-foreground truncate leading-none mb-1.5 tracking-tight">{member.full_name}</h4>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-primary font-black uppercase tracking-[0.15em] opacity-90">Aniversariante do Dia</span>
                            <div className="h-0.5 w-8 bg-primary/30 rounded-full mt-1" />
                        </div>
                    </div>
                </div>
                {count > 1 && (
                    <div className="absolute bottom-2 right-3">
                        <div className="flex items-center gap-1 opacity-30">
                            <span className="text-[8px] font-black uppercase">Próximo</span>
                            <ArrowRight className="h-2 w-2" />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

function BillCard({ item, count }: { item: InsightItem, count: number }) {
    return (
        <div className={cn(
            "rounded-2xl p-5 border relative overflow-hidden group transition-all duration-300 h-[120px] flex flex-col justify-center shadow-sm",
            item.isOverdue ? "bg-destructive/5 border-destructive/20" : "bg-orange-500/5 border-orange-500/20"
        )}>
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet className={cn("h-12 w-12", item.isOverdue ? "text-destructive" : "text-orange-500")} />
            </div>
            <div className="flex items-center gap-2 mb-3">
                <div className={cn("h-2 w-2 rounded-full animate-pulse", item.isOverdue ? "bg-destructive" : "bg-orange-500")} />
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", item.isOverdue ? "text-destructive" : "text-orange-500/80")}>
                    {item.isOverdue ? "Conta em Atraso" : "Contas Próximas"}
                </span>
            </div>
            <div className="flex justify-between items-center pr-4">
                <div className="min-w-0">
                    <p className="text-[12px] font-bold text-foreground/80 truncate leading-tight mb-1">{item.description}</p>
                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">Vencimento: {item.date}</p>
                </div>
                <div className="text-right shrink-0">
                    <p className={cn("text-[13px] font-mono font-black", item.isOverdue ? "text-destructive" : "text-foreground")}>
                        {item.amount?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>
            </div>
            {count > 1 && (
                <div className="absolute bottom-2 right-3">
                    <div className="flex items-center gap-1 opacity-30">
                        <span className="text-[8px] font-black uppercase">Próximo</span>
                        <ArrowRight className="h-2 w-2" />
                    </div>
                </div>
            )}
        </div>
    );
}

function GeneralCard({ item, count }: { item: InsightItem, count: number }) {
    const { clearAlert } = useCopilot();
    const isCopilot = item.id.startsWith("copilot-");

    return (
        <div className={cn(
            "rounded-2xl p-5 border relative overflow-hidden group transition-all duration-300 h-[120px] flex flex-col justify-center shadow-sm",
            item.colorClass === "primary" ? "bg-primary/5 border-primary/20" :
                item.colorClass === "amber" ? "bg-amber-500/5 border-amber-500/20" :
                    "bg-secondary/20 border-border/50"
        )}>
            {isCopilot && (
                <div className="absolute top-0 right-0 p-2 z-10">
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearAlert(); }} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
            <div className="absolute top-0 right-0 p-2 opacity-10">
                {isCopilot ? <Sparkles className="h-10 w-10 text-primary" /> : <History className="h-10 w-10 text-amber-500" />}
            </div>
            <div className="flex items-center gap-2 mb-2">
                <div className={cn("h-3 w-3 flex items-center justify-center", item.colorClass === 'primary' ? 'text-primary' : 'text-amber-500')}>
                    {isCopilot ? <Sparkles className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", item.colorClass === 'primary' ? 'text-primary' : 'text-amber-500/80')}>
                    {item.title || "Atenção"}
                </span>
            </div>
            <p className="text-[11px] font-medium text-foreground leading-tight pr-4">
                {item.description}
            </p>
            {item.url && (
                <Link to={item.url} className={cn("flex items-center gap-1 text-[10px] font-bold mt-4 hover:gap-2 transition-all w-fit", item.colorClass === 'primary' ? 'text-primary' : 'text-amber-600')}>
                    {isCopilot ? "RESOLVER AGORA" : "VER DETALHES"} <ArrowRight className="h-3 w-3" />
                </Link>
            )}
            {count > 1 && (
                <div className="absolute bottom-2 right-3">
                    <div className="flex items-center gap-1 opacity-30">
                        <span className="text-[8px] font-black uppercase">Próximo</span>
                        <ArrowRight className="h-2 w-2" />
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Main Component ---

export function SidebarUpdates() {
    const { organization, settings } = useChurch();
    const { sidebarAlert } = useCopilot();

    const { data: birthdays = [] } = useQuery({
        queryKey: ["sidebar-birthdays", organization?.id],
        queryFn: async () => {
            if (!organization?.id) return [];
            const { data } = await supabase.from("members").select("*").eq("organization_id", organization.id).not("birth_date", "is", null);
            if (!data) return [];
            const today = new Date();
            return data.filter(m => {
                const [_, mMonth, mDay] = m.birth_date.split('-').map(Number);
                return mMonth === (today.getMonth() + 1) && mDay === today.getDate();
            });
        },
        enabled: !!organization?.id,
    });

    const { data: bills = [] } = useQuery({
        queryKey: ["sidebar-bills", organization?.id, settings.reminderDays],
        queryFn: async () => {
            if (!organization?.id) return [];
            const today = new Date();
            const reminderDate = new Date();
            reminderDate.setDate(today.getDate() + settings.reminderDays);

            const { data: inst } = await supabase.from("installments").select("id, amount, due_date, purchase:installment_purchases(description)").eq("organization_id", organization.id).in("status", ["PENDENTE", "VENCIDA"]).lte("due_date", reminderDate.toISOString().split('T')[0]);
            const { data: txs } = await supabase.from("transactions").select("id, amount, date, description").eq("organization_id", organization.id).eq("type", "expense").eq("status", "pending").lte("date", reminderDate.toISOString().split('T')[0]);

            const mapped = [
                ...(inst || []).map(i => ({ id: i.id, amount: i.amount, date: i.due_date, description: (i.purchase as any)?.description || "Compra parcelada", isOverdue: new Date(i.due_date) < today })),
                ...(txs || []).map(t => ({ id: t.id, amount: t.amount, date: t.date, description: t.description || "Lançamento", isOverdue: new Date(t.date) < today }))
            ];
            return mapped.sort((a, b) => a.date.localeCompare(b.date));
        },
        enabled: !!organization?.id,
    });

    const { data: missingReceipts = 0 } = useQuery({
        queryKey: ["sidebar-missing-receipts", organization?.id],
        queryFn: async () => {
            if (!organization?.id) return 0;
            const { count } = await supabase.from("transactions").select("*", { count: 'exact', head: true }).eq("organization_id", organization.id).is("receipt_url", null);
            return count || 0;
        },
        enabled: !!organization?.id,
    });

    const categories = useMemo(() => {
        const financialItems: InsightItem[] = bills.map(b => ({
            id: b.id,
            category: "FINANCIAL",
            description: b.description,
            amount: b.amount,
            date: b.date,
            isOverdue: b.isOverdue,
            colorClass: b.isOverdue ? "destructive" : "orange",
            url: "/lancamentos"
        }));

        const attentionItems: InsightItem[] = [];
        if (sidebarAlert.active) {
            attentionItems.push({
                id: `copilot-${sidebarAlert.title}`,
                category: "ATTENTION",
                title: "Insight da IA",
                description: `${sidebarAlert.title}: ${sidebarAlert.message}`,
                colorClass: "primary",
                url: sidebarAlert.url
            });
        }
        if (missingReceipts > 0) {
            attentionItems.push({
                id: "missing-receipts",
                category: "ATTENTION",
                title: "Pendência",
                description: `Existem ${missingReceipts} lançamentos aguardando comprovante.`,
                colorClass: "amber",
                url: "/lancamentos?filter=no-receipt"
            });
        }

        const peopleItems: InsightItem[] = birthdays.map(m => ({
            id: `bday-${m.id}`,
            category: "PEOPLE",
            description: `${m.full_name} faz aniversário hoje!`,
            colorClass: "primary",
            member: m
        }));

        return { FINANCIAL: financialItems, ATTENTION: attentionItems, PEOPLE: peopleItems };
    }, [bills, sidebarAlert, missingReceipts, birthdays]);

    return (
        <div className="space-y-4">
            {/* SLOT 1: FINANCIAL */}
            <InsightSlot
                items={categories.FINANCIAL}
                slotIndex={0}
                fallback={
                    <div className="bg-secondary/10 border border-border/40 rounded-2xl p-5 h-[120px] flex flex-col justify-center transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 opacity-60" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Finanças em Dia</span>
                        </div>
                        <p className="text-[11px] font-medium text-muted-foreground/50 leading-tight">
                            Nenhuma conta próxima ao vencimento por enquanto.
                        </p>
                    </div>
                }
            />

            {/* SLOT 2: ATTENTION */}
            <InsightSlot
                items={categories.ATTENTION}
                slotIndex={1}
                fallback={
                    <div className="bg-secondary/10 border border-border/40 rounded-2xl p-5 h-[120px] flex flex-col justify-center transition-all">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 opacity-60" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Sem Pendências</span>
                        </div>
                        <p className="text-[11px] font-medium text-muted-foreground/50 leading-tight">
                            Tudo organizado! Não encontramos alertas operacionais.
                        </p>
                    </div>
                }
            />

            {/* SLOT 3: PEOPLE / STATUS */}
            <InsightSlot
                items={categories.PEOPLE}
                slotIndex={2}
                fallback={
                    <div className="bg-secondary/20 border border-border/50 rounded-2xl p-5 h-[120px] flex flex-col justify-center transition-all group">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <TrendingUp className="h-10 w-10 text-primary" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status do Dia</span>
                        </div>
                        <p className="text-[11px] font-medium text-foreground leading-tight">
                            Excelente trabalho hoje! Sua igreja está bem cuidada.
                        </p>
                    </div>
                }
            />
        </div>
    );
}
