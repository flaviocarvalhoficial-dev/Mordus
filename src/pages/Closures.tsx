import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Unlock, Eye, ChevronDown, ChevronUp, Loader2, ArrowRight, Trash2, Calendar, Wallet, AlertTriangle } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { toast } from "sonner";
import type { Database } from "@/types/database.types";

const months = [
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" }, { value: "03", label: "Março" },
  { value: "04", label: "Abril" }, { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" }, { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" }, { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

const currentYearConst = new Date().getFullYear();
const years = Array.from({ length: 3 }, (_, i) => String(currentYearConst - 1 + i));

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

  // States for period selection
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(String(currentMonth).padStart(2, "0"));
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [lastClosure, setLastClosure] = useState<Closure | null>(null);
  const [hasRetroactiveUnclosed, setHasRetroactiveUnclosed] = useState(false);

  const [currentPeriodStats, setCurrentPeriodStats] = useState({
    income: 0,
    expense: 0,
    count: 0,
    initial: 0,
    start: "",
    end: "",
    error: null as string | null
  });

  useEffect(() => {
    if (organization?.id) {
      fetchClosuresAndLast();
    }
  }, [organization?.id]);

  useEffect(() => {
    if (organization?.id && (lastClosure !== undefined)) {
      fetchCurrentMonthStats();
    }
  }, [organization?.id, selectedMonth, selectedYear, lastClosure]);

  const fetchClosuresAndLast = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("monthly_closures")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("end_date", { ascending: false });

      if (error) throw error;
      setClosures(data || []);
      const last = data && data.length > 0 ? data[0] : null;
      setLastClosure(last);

      const isFlexible = (organization as any)?.closure_mode === 'flexible';

      if (data && data.length > 0 && !isFlexible) {
        const oldestClosure = data[data.length - 1];
        const { count } = await supabase
          .from("transactions")
          .select("*", { count: 'exact', head: true })
          .eq("organization_id", organization!.id)
          .lt("date", oldestClosure.start_date);
        setHasRetroactiveUnclosed((count || 0) > 0);
      } else {
        setHasRetroactiveUnclosed(false);
      }
    } catch (err) {
      toast.error("Erro ao carregar históricos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentMonthStats = async () => {
    // Calculamos o primeiro dia do mês que o usuário selecionou
    const targetStartDateStr = `${selectedYear}-${selectedMonth}-01`;
    const targetStartDate = new Date(targetStartDateStr + "T12:00:00");

    // Buscamos se existe algum fechamento que termina ANTES desse mês selecionado
    // Como closures está ordenado por end_date desc, vamos filtrar
    const previousClosures = closures.filter(c => new Date(c.end_date) < targetStartDate);
    const immediatePrevious = previousClosures.length > 0 ? previousClosures[0] : null;

    const isFlexible = (organization as any)?.closure_mode === 'flexible';
    let startDateStr = "";

    if (isFlexible) {
      // Modo Flexível: O início é sempre o dia 1 do mês selecionado
      startDateStr = targetStartDateStr;
    } else if (immediatePrevious) {
      // Modo Contínuo: O início é o dia seguinte ao último fechamento
      const lastEnd = new Date(immediatePrevious.end_date + "T12:00:00");
      lastEnd.setDate(lastEnd.getDate() + 1);
      startDateStr = lastEnd.toISOString().split('T')[0];
    } else {
      // Se não há nenhum fechamento ANTES deste mês, buscamos desde o início dos tempos
      startDateStr = "2020-01-01";
    }

    // O fim é sempre o último dia do mês selecionado
    const lastDay = new Date(Number(selectedYear), Number(selectedMonth), 0);
    const endDateStr = lastDay.getFullYear() + '-' + String(lastDay.getMonth() + 1).padStart(2, '0') + '-' + String(lastDay.getDate()).padStart(2, '0');

    // O saldo inicial deste período deve vir do último fechamento ANTES dele
    const initialBalance = immediatePrevious?.final_balance || 0;

    // Proteção: Verificar se este mês (especificamente este range) já está coberto por algum fechamento
    const alreadyClosed = closures.find(c => c.end_date === endDateStr);

    if (alreadyClosed) {
      setCurrentPeriodStats({
        income: 0,
        expense: 0,
        count: 0,
        initial: 0,
        start: alreadyClosed.start_date,
        end: alreadyClosed.end_date,
        error: `Este período (${months.find(m => m.value === selectedMonth)?.label}/${selectedYear}) já foi fechado.`
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("organization_id", organization!.id)
        .gte("date", startDateStr)
        .lte("date", endDateStr);

      if (error) throw error;

      const stats = {
        income: 0,
        expense: 0,
        count: data?.length || 0,
        initial: initialBalance,
        start: startDateStr,
        end: endDateStr,
        error: null as string | null
      };

      data?.forEach(tx => {
        if (tx.type === "income") stats.income += tx.amount;
        else stats.expense += tx.amount;
      });
      setCurrentPeriodStats(stats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactionsForClosure = async (closure: Closure) => {
    if (expandedTxs[closure.id]) return;
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`*, categories!category_id(name)`)
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
    setIsClosingId("current");
    try {
      const finalBalance = currentPeriodStats.initial + currentPeriodStats.income - currentPeriodStats.expense;

      const { error } = await supabase.from("monthly_closures").insert([{
        organization_id: organization!.id,
        start_date: currentPeriodStats.start,
        end_date: currentPeriodStats.end,
        initial_balance: currentPeriodStats.initial,
        total_income: currentPeriodStats.income,
        total_expense: currentPeriodStats.expense,
        final_balance: finalBalance,
        status: 'closed',
        closed_by: profile?.id,
        closed_at: new Date().toISOString()
      }]);

      if (error) throw error;
      toast.success("Mês fechado com sucesso!");
      fetchClosuresAndLast();
    } catch (err) {
      toast.error("Erro ao realizar fechamento");
    } finally {
      setIsClosingId(null);
    }
  };

  const handleDeleteClosure = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este fechamento? O período voltará a ficar em aberto para alterações. Recomenda-se excluir apenas o fechamento mais recente para manter a integridade dos saldos transportados.")) return;

    try {
      const { error } = await supabase.from("monthly_closures").delete().eq("id", id);
      if (error) throw error;
      toast.success("Fechamento removido com sucesso!");
      fetchClosuresAndLast(); // Refresh to update lastClosure
    } catch (err) {
      toast.error("Erro ao excluir fechamento");
    }
  };

  if (!organization) return <div className="p-8 text-center text-muted-foreground font-mono">Carregando...</div>;

  const saldoProjetado = currentPeriodStats.initial + currentPeriodStats.income - currentPeriodStats.expense;
  const isDifferentMonth = (selectedMonth !== String(currentMonth).padStart(2, "0")) || (selectedYear !== String(currentYear));

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">Fechamento de Caixa</h2>
            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-secondary/30 border-primary/20">
              Modo {(organization as any)?.closure_mode === 'flexible' ? 'Flexível' : 'Contínuo'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-[12px] mt-1">Audit trail e encerramento de períodos — {organization.name}</p>
        </div>

        <div className="flex items-center gap-2 bg-secondary/20 p-1.5 rounded-lg border border-border/50">
          <Calendar className="h-4 w-4 text-muted-foreground ml-1 mr-1" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-8 w-32 text-xs bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-8 w-24 text-xs bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasRetroactiveUnclosed && (
        <Card className="bg-destructive/5 border-destructive/20 border-l-4 border-l-destructive shadow-none">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-destructive">Lançamentos Retroativos Detectados</h4>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] uppercase font-black">Atenção</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Existem transações datadas <strong>antes</strong> do seu primeiro fechamento registrado que não foram incluídas em nenhum período.
                Isso causa inconsistência no saldo inicial. Recomendamos excluir os fechamentos atuais e refazê-los a partir do mês desta transação.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={`bg-card border-border border-l-4 ${isDifferentMonth ? 'border-l-orange-500/40' : 'border-l-primary/40'}`}>
        <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <Unlock className={`h-4 w-4 ${isDifferentMonth ? 'text-orange-500' : 'text-primary'}`} />
            <div>
              <CardTitle className="text-sm font-semibold">
                Período em Aberto {isDifferentMonth && <span className="text-orange-500 ml-1 text-[10px] uppercase font-black">(Seleção)</span>}
              </CardTitle>
              {currentPeriodStats.start && (
                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                  {formatDate(currentPeriodStats.start)} <ArrowRight className="h-3 w-3 inline mx-1 opacity-40" /> {formatDate(currentPeriodStats.end)}
                </p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className={`${isDifferentMonth ? 'bg-orange-500/15 text-orange-600' : 'bg-success/15 text-success'} border-0 text-[10px]`}>
            {isDifferentMonth ? 'Revisando Período' : 'Aguardando Fechamento'}
          </Badge>
        </CardHeader>
        <CardContent className="pb-4 pt-2">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1"><Wallet className="h-3 w-3" /> Saldo Anterior</p>
              {loading ? <Skeleton className="h-6 w-24" /> : <p className="text-lg font-bold font-mono text-muted-foreground">{formatCurrency(currentPeriodStats.initial)}</p>}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Entradas</p>
              {loading ? <Skeleton className="h-6 w-24" /> : <p className="text-lg font-bold font-mono text-success">{formatCurrency(currentPeriodStats.income)}</p>}
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Saídas</p>
              {loading ? <Skeleton className="h-6 w-24" /> : <p className="text-lg font-bold font-mono text-destructive">{formatCurrency(currentPeriodStats.expense)}</p>}
            </div>
            <div>
              <p className="text-[10px] text-primary uppercase font-bold">Saldo Projetado</p>
              {loading ? <Skeleton className="h-6 w-24" /> : <p className={`text-lg font-bold font-mono ${saldoProjetado >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(saldoProjetado)}</p>}
            </div>
            <div className="flex flex-col justify-end">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" onClick={handleClosePeriod} disabled={isClosingId === "current" || currentPeriodStats.error !== null || (currentPeriodStats.count === 0 && currentPeriodStats.initial === 0)}>
                {isClosingId === "current" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5 mr-2" />}
                Finalizar Mês
              </Button>
            </div>
          </div>

          {currentPeriodStats.error && (
            <div className="mt-4 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-[10px] text-destructive flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              {currentPeriodStats.error}
            </div>
          )}

          {!currentPeriodStats.error && lastClosure && currentPeriodStats.start && new Date(currentPeriodStats.start) > new Date(lastClosure.end_date) && (
            <div className="mt-4 p-2 bg-secondary/10 border border-border rounded-md text-[10px] text-muted-foreground flex items-center gap-2 italic">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Este fechamento iniciará exatamente onde o último parou ({formatDate(lastClosure.end_date)}).
            </div>
          )}
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><p className="text-[10px] text-muted-foreground uppercase">S. Anterior</p><p className="text-[13px] font-bold text-muted-foreground font-mono tabular-nums">{formatCurrency(Number(closure.initial_balance || 0))}</p></div>
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
