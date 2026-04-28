import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowUpDown,
    Users,
    Wallet,
    CalendarDays,
    Clock,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Cake,
    UserPlus,
    AlertCircle,
    CheckCircle2,
    Lock
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface UpdatesSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTab?: "treasury" | "secretary";
    lockTab?: boolean;
}

import { useQuery } from "@tanstack/react-query";

interface UpdatesSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTab?: "treasury" | "secretary";
    lockTab?: boolean;
}

export function UpdatesSheet({ open, onOpenChange, defaultTab = "treasury", lockTab = false }: UpdatesSheetProps) {
    const { organization } = useChurch();
    const [activeTab, setActiveTab] = useState<string>(defaultTab);

    useEffect(() => {
        if (open) {
            setActiveTab(defaultTab);
        }
    }, [open, defaultTab]);

    // Treasury Data Query
    const { data: treasuryData, isLoading: treasuryLoading } = useQuery({
        queryKey: ["updates-treasury", organization?.id],
        queryFn: async () => {
            if (!organization?.id) return null;
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

            // Fetch recent transactions
            const { data: txs } = await supabase
                .from("transactions")
                .select("*, categories!category_id(name)")
                .eq("organization_id", organization.id)
                .order("date", { ascending: false })
                .limit(3);

            // Monthly stats
            const { data: stats } = await supabase
                .from("transactions")
                .select("amount, type")
                .eq("organization_id", organization.id)
                .gte("date", firstDay)
                .lte("date", lastDay);

            let income = 0;
            let expense = 0;
            stats?.forEach(s => {
                if (s.type === 'income') income += s.amount;
                else expense += s.amount;
            });

            // Closure status
            const { data: closure } = await supabase
                .from("monthly_closures")
                .select("id")
                .eq("organization_id", organization.id)
                .eq("end_date", lastDay.split('T')[0])
                .maybeSingle();

            return {
                recentTransactions: txs || [],
                monthlySummary: { income, expense, balance: income - expense },
                isClosed: !!closure,
                nextClosureDate: format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "dd 'de' MMMM", { locale: ptBR })
            };
        },
        enabled: open && !!organization?.id && activeTab === 'treasury',
        staleTime: 1000 * 60 * 5,
    });

    // Secretary Data Query
    const { data: secretaryData, isLoading: secretaryLoading } = useQuery({
        queryKey: ["updates-secretary", organization?.id],
        queryFn: async () => {
            if (!organization?.id) return null;
            const now = new Date();

            const [
                { count: memberCount },
                { data: recentMembers },
                { data: allMembers }
            ] = await Promise.all([
                supabase.from("members").select("*", { count: 'exact', head: true }).eq("organization_id", organization.id),
                supabase.from("members").select("*").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(3),
                supabase.from("members").select("full_name, birth_date").eq("organization_id", organization.id).not("birth_date", "is", null)
            ]);

            const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
            const birthdays = allMembers?.filter(m => m.birth_date?.split('-')[1] === currentMonth)
                .map(m => ({
                    ...m,
                    day: parseInt(m.birth_date!.split('-')[2])
                }))
                .sort((a, b) => a.day - b.day)
                .slice(0, 5) || [];

            return {
                recentMembers: recentMembers || [],
                birthdays,
                totalMembers: memberCount || 0
            };
        },
        enabled: open && !!organization?.id && activeTab === 'secretary',
        staleTime: 1000 * 60 * 10,
    });

    const loading = treasuryLoading || secretaryLoading;


    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l border-border/50 bg-background/95 backdrop-blur-xl">
                <SheetHeader className="p-6 border-b border-border/50 bg-secondary/10">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                            <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-bold tracking-tight">Atualizações</SheetTitle>
                            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-widest">Resumo importante do sistema</p>
                        </div>
                    </div>
                </SheetHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="treasury" className="flex-1 flex flex-col overflow-hidden">
                    {!lockTab && (
                        <div className="px-6 py-4 bg-secondary/5 border-b border-border/30">
                            <TabsList className="grid w-full grid-cols-2 h-10 bg-background border border-border/50 p-1">
                                <TabsTrigger value="treasury" className="text-[11px] font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Wallet className="h-3.5 w-3.5 mr-2" /> Tesouraria
                                </TabsTrigger>
                                <TabsTrigger value="secretary" className="text-[11px] font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Users className="h-3.5 w-3.5 mr-2" /> Secretaria
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    )}

                    <ScrollArea className="flex-1 px-6">
                        <div className="py-6 space-y-8">
                            {/* TREASURY CONTENT */}
                            <TabsContent value="treasury" className="mt-0 space-y-8 outline-none">
                                {/* Status Card */}
                                <Card className="border-none bg-gradient-to-br from-primary/5 via-primary/10 to-transparent shadow-none overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                        <ArrowUpDown className="h-16 w-16" />
                                    </div>
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <Badge variant="outline" className={`text-[9px] uppercase font-black border-0 ${treasuryData.isClosed ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
                                                {treasuryData.isClosed ? 'Mês Fechado' : 'Período em Aberto'}
                                            </Badge>
                                            {!treasuryData.isClosed && (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                                                    Fim: <span className="text-foreground">{treasuryData.nextClosureDate}</span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mb-1">Saldo do Período</p>
                                                    <h3 className={`text-2xl font-black font-mono tracking-tighter ${treasuryData.monthlySummary.balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                                                        {formatCurrency(treasuryData.monthlySummary.balance)}
                                                    </h3>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1.5 text-success text-[12px] font-bold">
                                                        <TrendingUp className="h-3.5 w-3.5" />
                                                        {formatCurrency(treasuryData.monthlySummary.income)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-destructive text-[12px] font-bold">
                                                        <TrendingDown className="h-3.5 w-3.5" />
                                                        {formatCurrency(treasuryData.monthlySummary.expense)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-1.5 w-full bg-background/50 rounded-full overflow-hidden flex">
                                                {treasuryData.monthlySummary.income > 0 && (
                                                    <div
                                                        className="bg-primary h-full transition-all"
                                                        style={{ width: `${(treasuryData.monthlySummary.income / (treasuryData.monthlySummary.income + treasuryData.monthlySummary.expense || 1)) * 100}%` }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Recent Transactions List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                                            <Clock className="h-3.5 w-3.5" /> Recentemente
                                        </h4>
                                        <Link to="/lancamentos" onClick={() => onOpenChange(false)} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                                            Ver todos <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    </div>

                                    <div className="space-y-3">
                                        {loading ? (
                                            [1, 2, 3].map(i => (
                                                <div key={i} className="h-14 w-full bg-secondary/10 rounded-xl animate-pulse" />
                                            ))
                                        ) : treasuryData.recentTransactions.length > 0 ? (
                                            treasuryData.recentTransactions.map((tx) => (
                                                <div key={tx.id} className="group p-3 rounded-xl border border-border/50 bg-secondary/5 hover:bg-secondary/10 transition-all flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${tx.type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                                        {tx.type === 'income' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[12px] font-bold text-foreground truncate">{tx.description}</p>
                                                        <p className="text-[10px] text-muted-foreground">{tx.categories?.name || 'Geral'} • {format(new Date(tx.date + 'T12:00:00'), "dd MMM", { locale: ptBR })}</p>
                                                    </div>
                                                    <div className={`text-[12px] font-black font-mono ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center bg-secondary/5 rounded-xl border-2 border-dashed border-border/50">
                                                <AlertCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                                <p className="text-xs text-muted-foreground font-medium">Nenhum lançamento recente</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Treasury Alert/Tip */}
                                {!treasuryData.isClosed && (
                                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3">
                                        <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                                        <div>
                                            <h5 className="text-[12px] font-bold text-orange-600">Lembrete de Fechamento</h5>
                                            <p className="text-[11px] text-orange-600/80 leading-relaxed mt-0.5">
                                                O fechamento do mês de {format(new Date(), "MMMM", { locale: ptBR })} deve ser realizado até o quinto dia útil do próximo mês.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* SECRETARY CONTENT */}
                            <TabsContent value="secretary" className="mt-0 space-y-8 outline-none">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="border-none bg-primary/5 shadow-none p-4 relative overflow-hidden group">
                                        <Users className="absolute -bottom-2 -right-2 h-12 w-12 opacity-5 scale-125 group-hover:scale-150 transition-transform" />
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tight mb-1">Total Membros</p>
                                        <h3 className="text-3xl font-black font-mono tracking-tighter text-primary">{secretaryData.totalMembers}</h3>
                                    </Card>
                                    <Card className="border-none bg-success/5 shadow-none p-4 relative overflow-hidden group">
                                        <Cake className="absolute -bottom-2 -right-2 h-12 w-12 opacity-5 scale-125 group-hover:scale-150 transition-transform" />
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tight mb-1">Aniversariantes</p>
                                        <h3 className="text-3xl font-black font-mono tracking-tighter text-success">{secretaryData.birthdays.length}</h3>
                                    </Card>
                                </div>

                                {/* Birthdays section */}
                                {secretaryData.birthdays.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                                            <Cake className="h-3.5 w-3.5" /> Aniversários do Mês
                                        </h4>
                                        <div className="space-y-3">
                                            {secretaryData.birthdays.map((m, idx) => (
                                                <div key={idx} className="p-3 rounded-xl border border-border/50 bg-success/5 flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center font-bold text-success text-xs">
                                                        {m.day}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[12px] font-bold text-foreground">{m.full_name}</p>
                                                        <p className="text-[10px] text-muted-foreground">Comemora no dia {m.day}</p>
                                                    </div>
                                                    <Badge className="bg-success/20 text-success border-0 text-[10px] hover:bg-success/30">Parabéns!</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recent Members List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                                            <UserPlus className="h-3.5 w-3.5" /> Novos Membros
                                        </h4>
                                        <Link to="/membros?tab=membros" onClick={() => onOpenChange(false)} className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                                            Ver todos <ChevronRight className="h-3 w-3" />
                                        </Link>
                                    </div>

                                    <div className="space-y-3">
                                        {loading ? (
                                            [1, 2, 3].map(i => (
                                                <div key={i} className="h-14 w-full bg-secondary/10 rounded-xl animate-pulse" />
                                            ))
                                        ) : secretaryData.recentMembers.length > 0 ? (
                                            secretaryData.recentMembers.map((m) => (
                                                <div key={m.id} className="p-3 rounded-xl border border-border/50 bg-secondary/5 hover:bg-secondary/10 transition-all flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border ring-2 ring-transparent group-hover:ring-primary/10 transition-all">
                                                        {m.avatar_url ? <img src={m.avatar_url} className="h-full w-full object-cover" /> : <Users className="h-4 w-4 text-muted-foreground" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[12px] font-bold text-foreground truncate">{m.full_name}</p>
                                                        <p className="text-[10px] text-muted-foreground">{m.status === 'active' ? 'Ativo' : 'Pendente'} • Registrado há {format(new Date(m.created_at), "dd 'dias'", { locale: ptBR })}</p>
                                                    </div>
                                                    <CheckCircle2 className="h-4 w-4 text-primary opacity-40" />
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center bg-secondary/5 rounded-xl border-2 border-dashed border-border/50">
                                                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                                <p className="text-xs text-muted-foreground font-medium">Nenhum registro recente</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </ScrollArea>

                    <div className="p-6 bg-secondary/10 border-t border-border/50 space-y-3">
                        <Button className="w-full bg-primary text-primary-foreground font-bold h-11 shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all">
                            <Clock className="h-4 w-4 mr-2" /> Agendar Atualização
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-tighter">
                            Último sincronismo: {format(new Date(), "HH:mm:ss")}
                        </p>
                    </div>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}
