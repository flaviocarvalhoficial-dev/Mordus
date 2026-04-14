import { useState, useMemo, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Wallet, Loader2, Plus, Users, Layers, CalendarDays, Eye, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickEntryDialog } from "@/components/QuickEntryDialog";
import { TransactionsDialog } from "@/components/TransactionsDialog";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useChurch } from "@/contexts/ChurchContext";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SecretariaDashboard from "./SecretariaDashboard";
import { AIInsightCard } from "@/components/Dashboard/AIInsightCard";

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const formatYAxis = (v: number) => {
  if (v === 0) return "0";
  if (v < 1000) return v.toString();
  return `${(v / 1000).toFixed(1)}k`;
};

const Counter = ({ value, prefix = "", suffix = "", decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 800; // 0.8 seconds
    const startValue = previousValue.current;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuad = (t: number) => t * (2 - t);
      const current = easeOutQuad(progress) * (endValue - startValue) + startValue;

      setDisplayValue(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        previousValue.current = endValue;
      }
    };

    const animFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animFrame);
  }, [value]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
      {suffix}
    </span>
  );
};

export default function Dashboard() {
  const { organization, canManageFinances } = useChurch();
  const queryClient = useQueryClient();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState("all");
  const [showExpenses, setShowExpenses] = useState(() => {
    return localStorage.getItem("dashboard-show-expenses") === "true";
  });
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("view") || "tesouraria";

  useEffect(() => {
    localStorage.setItem("dashboard-show-expenses", String(showExpenses));
  }, [showExpenses]);

  // Fetch Transactions and Categories
  const { data: txs, isLoading: txsLoading, error: txsError } = useQuery({
    queryKey: ["dashboard-transactions", organization?.id, year, month],
    queryFn: async () => {
      if (!organization?.id) return [];
      let query = supabase
        .from("transactions")
        .select(`*, categories!category_id(name)`)
        .eq("organization_id", organization.id)
        .gte("date", `${year}-01-01`)
        .lte("date", `${year}-12-31`);

      if (month !== "all") {
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        query = query.gte("date", `${year}-${month}-01`).lte("date", `${year}-${month}-${lastDay.toString().padStart(2, '0')}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!organization?.id && canManageFinances,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch Secretariat Counts
  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ["dashboard-counts", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return { memberCount: 0, deptCount: 0, eventCount: 0 };
      const [
        { count: mCount },
        { count: dCount },
        { count: eCount }
      ] = await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }).eq("organization_id", organization.id).eq("status", "active"),
        supabase.from("departments").select("*", { count: "exact", head: true }).eq("organization_id", organization.id),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("organization_id", organization.id),
      ]);
      return {
        memberCount: mCount || 0,
        deptCount: dCount || 0,
        eventCount: eCount || 0
      };
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (txsError) toast.error("Erro ao carregar dados do financeiro");
  }, [txsError]);

  // Combined Data Processing
  const { stats, chartData } = useMemo(() => {
    const newStats = {
      entradas: 0,
      saidas: 0,
      pendenteSaida: 0,
      dizimos: 0,
      ofertas: 0,
      count: txs?.length || 0,
      memberCount: counts?.memberCount || 0,
      deptCount: counts?.deptCount || 0,
      eventCount: counts?.eventCount || 0
    };

    const monthlyAggr: Record<string, any> = {};
    monthNames.forEach(m => {
      monthlyAggr[m] = { month: m, entradas: 0, saidas: 0, dizimos: 0, ofertas: 0 };
    });

    txs?.forEach(tx => {
      const amt = tx.amount || 0;
      const inc = tx.type === "income";
      const cat = tx.categories?.name?.toLowerCase() || "";
      const tDate = new Date(tx.date);
      const mN = monthNames[tDate.getMonth()];

      // Se for saída e estiver pendente, somamos apenas ao total de saídas e pendentes
      if (tx.status === 'pending') {
        if (!inc) {
          newStats.pendenteSaida += amt;
          monthlyAggr[mN].saidas += amt;
        }
        return;
      }

      if (inc) {
        newStats.entradas += amt;
        monthlyAggr[mN].entradas += amt;
        if (cat.includes("dízimo")) {
          newStats.dizimos += amt;
          monthlyAggr[mN].dizimos += amt;
        } else if (cat.includes("oferta")) {
          newStats.ofertas += amt;
          monthlyAggr[mN].ofertas += amt;
        }
      } else {
        newStats.saidas += amt;
        monthlyAggr[mN].saidas += amt;
      }
    });

    return {
      stats: newStats,
      chartData: Object.values(monthlyAggr)
    };
  }, [txs, counts]);

  const saldoCaixa = stats.entradas - stats.saidas;
  const saldoProjetado = stats.entradas - (stats.saidas + stats.pendenteSaida);
  const loading = txsLoading || countsLoading;

  const summaryCards = useMemo(() => [
    { title: "Total Entradas", value: stats.entradas, prefix: "R$ ", suffix: "", decimals: 2, icon: TrendingUp, positive: true, muted: true },
    { title: "Total Saídas", value: stats.saidas + stats.pendenteSaida, prefix: "R$ ", suffix: "", decimals: 2, icon: TrendingDown, positive: false, muted: true },
    { title: "Saldo em Caixa", value: saldoCaixa, prefix: "R$ ", suffix: "", decimals: 2, icon: Wallet, positive: saldoCaixa >= 0, primary: true },
    { title: "Saldo Projetado", value: saldoProjetado, prefix: "R$ ", suffix: "", decimals: 2, icon: Layers, positive: saldoProjetado >= 0, muted: true },
    { title: "Contas a Pagar", value: stats.pendenteSaida, prefix: "R$ ", suffix: "", decimals: 2, icon: AlertCircle, positive: false, color: "text-orange-600", link: "/lancamentos?status=pending" },
  ], [stats, saldoCaixa, saldoProjetado]);

  const periodLabel = month === "all"
    ? `Jan ${year} — Dez ${year}`
    : `${monthNames[parseInt(month) - 1]} ${year}`;

  const visibleCards = useMemo(() => {
    if (canManageFinances) return summaryCards;
    return []; // No Treasury cards for non-treasury users
  }, [canManageFinances, summaryCards]);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-counts"] });
  };

  if (!organization) return null;

  return (
    <>
      <div className="animate-fade-in space-y-10 pb-10">
        <div className="flex items-center justify-between flex-wrap gap-6 bg-secondary/5 p-4 rounded-[1.5rem] border border-border/40">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Painel de Gestão</h1>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mt-1 opacity-70">{organization.name} — {periodLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            {canManageFinances && (
              <div className="flex items-center gap-2 mr-2">
                <QuickEntryDialog onSuccess={refreshData} />
                <TransactionsDialog
                  onSuccess={refreshData}
                  trigger={
                    <Button className="h-10 px-6 text-xs font-bold gap-2 premium-button bg-primary text-primary-foreground">
                      <Plus className="h-4.5 w-4.5" />
                      Novo Lançamento
                    </Button>
                  }
                />
              </div>
            )}
            <div className="h-8 w-[1px] bg-border/40 mx-1 hidden sm:block" />
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-10 w-24 text-xs bg-background border-border/40 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-10 w-40 text-xs bg-background border-border/40 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o ano</SelectItem>
                {monthNames.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <AIInsightCard mode={activeTab as "tesouraria" | "secretaria"} />

        {activeTab === "tesouraria" ? (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className={`grid gap-5 ${canManageFinances ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 md:grid-cols-3'}`}>
              {visibleCards.map((card) => (
                <Card key={card.title} className={cn(
                  "stat-card border-none hover:ring-2 ring-primary/5",
                  card.primary ? 'ring-2 ring-primary/40 bg-gradient-to-br from-card to-primary/5' : ''
                )}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/40">
                        <card.icon className={cn(
                          "h-5 w-5",
                          card.primary ? 'text-primary' : 'text-muted-foreground/60'
                        )} />
                      </div>
                      {card.link && (
                        <Link to={card.link} className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline">Ver todos</Link>
                      )}
                    </div>
                    <div className="space-y-1">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest block",
                        card.primary ? 'text-foreground' : 'text-muted-foreground/80'
                      )}>{card.title}</span>
                      <div className="flex items-baseline gap-1">
                        {loading ? (
                          <Skeleton className="h-8 w-24" />
                        ) : (
                          <span className="text-2xl font-black font-mono tabular-nums tracking-tight">
                            <Counter
                              value={card.value}
                              prefix={card.prefix}
                              suffix={card.suffix}
                              decimals={card.decimals}
                            />
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className={`grid gap-6 grid-cols-1 ${canManageFinances ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
              {canManageFinances && (
                <Card className="stat-card border-none overflow-hidden">
                  <CardHeader className="bg-secondary/10 border-b border-border/40 py-5 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold">Fluxo de Caixa Mensal</CardTitle>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Entradas vs Saídas</p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8 px-6 pb-6">
                    <div className="h-[280px]">
                      {loading ? (
                        <div className="h-full flex items-end gap-2 px-2 pb-4">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <Skeleton key={i} className="w-full" style={{ height: `${Math.random() * 60 + 20}%` }} />
                          ))}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6}>
                            <CartesianGrid strokeDasharray="4 4" stroke="hsla(var(--border), 0.5)" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} height={30} />
                            <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                            <Tooltip
                              cursor={{ fill: 'hsl(var(--secondary))', opacity: 0.4 }}
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 16, fontSize: 12, boxShadow: '0 10px 25px -10px rgba(0,0,0,0.1)' }}
                              formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]}
                            />
                            <Bar dataKey="entradas" fill="hsl(var(--chart-blue))" radius={[6, 6, 0, 0]} barSize={32} />
                            <Bar dataKey="saidas" fill="hsl(var(--chart-pink))" radius={[6, 6, 0, 0]} barSize={32} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="stat-card border-none overflow-hidden h-fit">
                <CardHeader className="bg-secondary/10 border-b border-border/40 py-4 flex flex-row items-center justify-between space-y-0 text-center">
                  <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] w-full">Resumo Mensal</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {canManageFinances && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/40">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Ver Despesas</span>
                          <Switch
                            checked={showExpenses}
                            onCheckedChange={setShowExpenses}
                            className="scale-75 data-[state=checked]:bg-destructive"
                          />
                        </div>

                        <div className="space-y-3 pt-2">
                          {showExpenses && (
                            <div className="flex justify-between items-center pb-2 border-b border-border/40 animate-in slide-in-from-top-2 duration-300">
                              <span className="text-[11px] font-medium text-muted-foreground">Total Saídas</span>
                              <span className="text-sm font-bold font-mono text-destructive">
                                {loading ? <Skeleton className="h-4 w-24" /> : `- R$ ${stats.saidas.toLocaleString("pt-BR")}`}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-[11px] font-medium text-muted-foreground">Dízimos</span>
                            <span className="text-sm font-bold font-mono text-emerald-500">
                              {loading ? <Skeleton className="h-4 w-24" /> : `R$ ${stats.dizimos.toLocaleString("pt-BR")}`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-[11px] font-medium text-muted-foreground">Ofertas</span>
                            <span className="text-sm font-bold font-mono text-emerald-500">
                              {loading ? <Skeleton className="h-4 w-24" /> : `R$ ${stats.ofertas.toLocaleString("pt-BR")}`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <span className="text-[11px] font-black uppercase text-foreground">Saldo Líquido</span>
                            {loading ? (
                              <Skeleton className="h-6 w-28" />
                            ) : (
                              <span className={cn(
                                "text-lg font-black font-mono tracking-tight",
                                saldoCaixa >= 0 ? "text-primary" : "text-destructive"
                              )}>
                                {`R$ ${saldoCaixa.toLocaleString("pt-BR")}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={cn(
                      "mt-6 pt-6 border-t border-border/40 space-y-4",
                      !canManageFinances ? 'mt-0 pt-0 border-t-0' : ''
                    )}>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">Controle Interno</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/20 group hover:border-primary/20 transition-all">
                          <Layers className="h-4 w-4 text-primary/60 mb-2 transition-transform group-hover:scale-110" />
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Deptos</span>
                            <p className="text-sm font-black tabular-nums">{loading ? "..." : stats.deptCount}</p>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/20 group hover:border-primary/20 transition-all">
                          <CalendarDays className="h-4 w-4 text-primary/60 mb-2 transition-transform group-hover:scale-110" />
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Eventos</span>
                            <p className="text-sm font-black tabular-nums">{loading ? "..." : stats.eventCount}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link to="/lancamentos?tab=relatorios" className="block w-full mt-6">
                    <Button variant="outline" className="w-full h-10 text-[10px] font-bold uppercase tracking-widest border-border/60 premium-button hover:bg-primary/5 hover:text-primary transition-all">
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar Relatório
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {canManageFinances && (
              <Card className="stat-card border-none overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/40 py-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Tendência: Dízimos & Ofertas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 px-6 pb-6">
                  <div className="h-[220px]">
                    {loading ? (
                      <Skeleton className="h-full w-full rounded-2xl opacity-20" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="4 4" stroke="hsla(var(--border), 0.5)" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} height={25} />
                          <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                          <Tooltip
                            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 16, fontSize: 11, boxShadow: '0 10px 25px -10px rgba(0,0,0,0.1)' }}
                          />
                          <defs>
                            <linearGradient id="gradAreaBlue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--chart-blue))" stopOpacity={0.25} />
                              <stop offset="100%" stopColor="hsl(var(--chart-blue))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="dizimos" name="Dízimos" stroke="hsl(var(--chart-blue))" strokeWidth={3} fill="url(#gradAreaBlue)" dot={{ r: 4, fill: 'hsl(var(--chart-blue))', strokeWidth: 2, stroke: 'hsl(var(--card))' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                          <Area type="monotone" dataKey="ofertas" name="Ofertas" stroke="hsl(var(--chart-pink))" strokeWidth={2} fill="none" dot={false} strokeDasharray="6 6" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-700">
            <SecretariaDashboard />
          </div>
        )}
      </div>
    </>
  );
}

