import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Eye, ChevronDown, ChevronUp, Loader2, ArrowRight, Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { toast } from "sonner";
import type { Database } from "@/types/database.types";

type Closure = Database["public"]["Tables"]["monthly_closures"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & { categories?: { name: string } | null };

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function Closures() {
  const { organization, profile } = useChurch();
  const [closures, setClosures] = useState<Closure[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedTxs, setExpandedTxs] = useState<Record<string, Transaction[]>>({});
  const [loading, setLoading] = useState(true);
  const [isClosingId, setIsClosingId] = useState<string | null>(null);

  const [currentPeriodStats, setCurrentPeriodStats] = useState({
    income: 0,
    expense: 0,
    count: 0
  });

  useEffect(() => {
    if (organization?.id) {
      fetchClosures();
      fetchCurrentMonthStats();
    }
  }, [organization?.id]);

  const fetchClosures = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("monthly_closures")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("end_date", { ascending: false });
      if (error) throw error;
      setClosures(data || []);
    } catch (err) {
      toast.error("Erro ao carregar históricos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentMonthStats = async () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("organization_id", organization!.id)
        .gte("date", start)
        .lte("date", end);

      if (error) throw error;

      const stats = { income: 0, expense: 0, count: data?.length || 0 };
      data?.forEach(tx => {
        if (tx.type === "income") stats.income += tx.amount;
        else stats.expense += tx.amount;
      });
      setCurrentPeriodStats(stats);
    } catch (err) { }
  };

  const fetchTransactionsForClosure = async (closure: Closure) => {
    if (expandedTxs[closure.id]) return;
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`*, categories(name)`)
        .eq("organization_id", organization!.id)
        .gte("date", closure.start_date)
        .lte("date", closure.end_date)
        .order("date");
      if (error) throw error;
      setExpandedTxs(prev => ({ ...prev, [closure.id]: (data as any) || [] }));
    } catch (err) {
      toast.error("Erro ao carregar transações do período");
    }
  };

  const handleClosePeriod = async () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    setIsClosingId("current");
    try {
      const { error } = await supabase.from("monthly_closures").insert([{
        organization_id: organization!.id,
        start_date: start,
        end_date: end,
        total_income: currentPeriodStats.income,
        total_expense: currentPeriodStats.expense,
        final_balance: currentPeriodStats.income - currentPeriodStats.expense,
        status: 'closed',
        closed_by: profile?.id,
        closed_at: new Date().toISOString()
      }]);

      if (error) throw error;
      toast.success("Mês fechado com sucesso!");
      fetchClosures();
    } catch (err) {
      toast.error("Erro ao realizar fechamento");
    } finally {
      setIsClosingId(null);
    }
  };

  const handleDeleteClosure = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este fechamento? O período voltará a ficar em aberto para alterações.")) return;

    try {
      const { error } = await supabase.from("monthly_closures").delete().eq("id", id);
      if (error) throw error;
      toast.success("Fechamento removido com sucesso!");
      setClosures(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      toast.error("Erro ao excluir fechamento");
    }
  };

  if (!organization) return <div className="p-8 text-center text-muted-foreground font-mono">Carregando...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Fechamento de Caixa</h2>
          <p className="text-muted-foreground text-[12px] mt-1">Audit trail e encerramento de períodos — {organization.name}</p>
        </div>
      </div>

      <Card className="bg-card border-border border-l-4 border-l-primary/40">
        <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Unlock className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Período Atual (Em Aberto)</CardTitle>
          </div>
          <Badge variant="secondary" className="bg-success/15 text-success border-0 text-[10px]">Aguardando Fechamento</Badge>
        </CardHeader>
        <CardContent className="pb-4 pt-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Movimentações</p>
              {loading ? <Skeleton className="h-6 w-12" /> : <p className="text-lg font-bold font-mono">{currentPeriodStats.count}</p>}
            </div>
            <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Entradas</p>
              {loading ? <Skeleton className="h-6 w-24" /> : <p className="text-lg font-bold font-mono text-success">{formatCurrency(currentPeriodStats.income)}</p>}
            </div>
            <div><p className="text-[10px] text-muted-foreground uppercase font-semibold">Saídas</p>
              {loading ? <Skeleton className="h-6 w-24" /> : <p className="text-lg font-bold font-mono text-destructive">{formatCurrency(currentPeriodStats.expense)}</p>}
            </div>
            <div className="flex flex-col justify-end">
              <Button size="sm" className="bg-primary text-primary-foreground font-semibold" onClick={handleClosePeriod} disabled={isClosingId === "current" || currentPeriodStats.count === 0}>
                {isClosingId === "current" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5 mr-2" />}
                Finalizar Mês
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4">
        <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Histórico de Fechamentos</h3>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-card border-border border-l-4 border-l-muted">
                <CardContent className="p-4"><Skeleton className="h-10 w-full" /></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {closures.map((closure) => (
              <Card key={closure.id} className="bg-card border-border border-l-4 border-l-secondary/40">
                <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[13px] font-bold text-foreground">
                      {formatDate(closure.start_date)} <ArrowRight className="h-3 w-3 inline mx-1 opacity-40" /> {formatDate(closure.end_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] text-muted-foreground hover:bg-secondary/50"
                      onClick={() => {
                        const nextId = expandedId === closure.id ? null : closure.id;
                        setExpandedId(nextId);
                        if (nextId) fetchTransactionsForClosure(closure);
                      }}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      {expandedId === closure.id ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteClosure(closure.id)}
                      title="Excluir Fechamento"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 pt-0">
                  <div className="grid grid-cols-3 gap-4">
                    <div><p className="text-[10px] text-muted-foreground uppercase">Entradas</p><p className="text-[13px] font-bold text-success font-mono tabular-nums">{formatCurrency(Number(closure.total_income || 0))}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase">Saídas</p><p className="text-[13px] font-bold text-destructive font-mono tabular-nums">{formatCurrency(Number(closure.total_expense || 0))}</p></div>
                    <div><p className="text-[10px] text-muted-foreground uppercase">Saldo Final</p><p className="text-[13px] font-bold text-foreground font-mono tabular-nums">{formatCurrency(Number(closure.final_balance || 0))}</p></div>
                  </div>

                  {expandedId === closure.id && (
                    <div className="mt-4 border-t border-border pt-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <Table>
                          <TableHeader className="bg-secondary/20">
                            <TableRow>
                              <TableHead className="text-[10px] font-bold">DATA</TableHead>
                              <TableHead className="text-[10px] font-bold">DESCRIÇÃO</TableHead>
                              <TableHead className="text-[10px] font-bold">CAT.</TableHead>
                              <TableHead className="text-[10px] font-bold text-right">VALOR</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {!expandedTxs[closure.id] ? (
                              Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                  <TableCell><Skeleton className="h-3 w-16" /></TableCell>
                                  <TableCell><Skeleton className="h-3 w-40" /></TableCell>
                                  <TableCell><Skeleton className="h-3 w-20" /></TableCell>
                                  <TableCell className="text-right"><Skeleton className="h-3 w-20 ml-auto" /></TableCell>
                                </TableRow>
                              ))
                            ) : expandedTxs[closure.id].length === 0 ? (
                              <TableRow><TableCell colSpan={4} className="text-center py-4 text-xs">Sem transações no período</TableCell></TableRow>
                            ) : expandedTxs[closure.id].map((tx) => (
                              <TableRow key={tx.id}>
                                <TableCell className="text-[10px] font-mono whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                                <TableCell className="text-[11px] font-medium max-w-[150px] truncate">{tx.description}</TableCell>
                                <TableCell><Badge variant="outline" className="text-[9px] border-border/50">{tx.categories?.name || "Geral"}</Badge></TableCell>
                                <TableCell className={`text-[11px] text-right font-bold font-mono ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                                  {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
