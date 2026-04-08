import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, Receipt, Loader2, Plus, Download, Users, UsersRound, CalendarDays, MapPinned, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickEntryDialog } from "@/components/QuickEntryDialog";
import { TransactionsDialog } from "@/components/TransactionsDialog";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { toast } from "sonner";

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const formatYAxis = (v: number) => {
  if (v === 0) return "0";
  if (v < 1000) return v.toString();
  return `${(v / 1000).toFixed(1)}k`;
};

const Counter = ({ value, prefix = "", suffix = "", decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    const duration = 800; // 0.8 seconds
    const stepTime = 20; // 50fps
    const totalSteps = duration / stepTime;
    const increment = end / totalSteps;

    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
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
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showExpenses, setShowExpenses] = useState(() => {
    return localStorage.getItem("dashboard-show-expenses") === "true";
  });

  useEffect(() => {
    localStorage.setItem("dashboard-show-expenses", String(showExpenses));
  }, [showExpenses]);
  const [stats, setStats] = useState({
    entradas: 0,
    saidas: 0,
    dizimos: 0,
    ofertas: 0,
    count: 0,
    memberCount: 0,
    deptCount: 0,
    eventCount: 0
  });
  const [chartData, setChartData] = useState<{ month: string; entradas: number; saidas: number; dizimos: number; ofertas: number }[]>([]);

  useEffect(() => {
    if (organization?.id) {
      fetchDashboardData();
    }
  }, [organization?.id, year, month]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("transactions")
        .select(`*, categories!category_id(name)`)
        .eq("organization_id", organization!.id);

      // Filtro de ano aproximado (Supabase range ou raw filter)
      query = query.gte("date", `${year}-01-01`).lte("date", `${year}-12-31`);

      if (month !== "all") {
        query = query.gte("date", `${year}-${month}-01`).lte("date", `${year}-${month}-31`);
      }

      const { data: txs, error } = await query;
      if (error) throw error;

      // Fetch Secretariat counts
      const [
        { count: mCount },
        { count: dCount },
        { count: eCount }
      ] = await Promise.all([
        supabase.from("members").select("*", { count: "exact", head: true }).eq("organization_id", organization!.id).eq("status", "active"),
        supabase.from("departments").select("*", { count: "exact", head: true }).eq("organization_id", organization!.id),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("organization_id", organization!.id),
      ]);

      // Processar dados para estatísticas e gráficos
      const newStats = {
        entradas: 0,
        saidas: 0,
        dizimos: 0,
        ofertas: 0,
        count: txs?.length || 0,
        memberCount: mCount || 0,
        deptCount: dCount || 0,
        eventCount: eCount || 0
      };
      const monthlyAggr: Record<string, any> = {};

      monthNames.forEach(m => {
        monthlyAggr[m] = { month: m, entradas: 0, saidas: 0, dizimos: 0, ofertas: 0 };
      });

      txs?.forEach(tx => {
        const date = new Date(tx.date);
        const mName = monthNames[date.getMonth()];
        const amount = tx.amount || 0;
        const isIncome = tx.type === "income";
        const catName = tx.categories?.name?.toLowerCase() || "";

        if (isIncome) {
          newStats.entradas += amount;
          monthlyAggr[mName].entradas += amount;
          if (catName.includes("dízimo")) {
            newStats.dizimos += amount;
            monthlyAggr[mName].dizimos += amount;
          } else if (catName.includes("oferta")) {
            newStats.ofertas += amount;
            monthlyAggr[mName].ofertas += amount;
          }
        } else {
          newStats.saidas += amount;
          monthlyAggr[mName].saidas += amount;
        }
      });

      setStats(newStats);
      setChartData(Object.values(monthlyAggr));
    } catch (err) {
      toast.error("Erro ao carregar dados do painel");
    } finally {
      setLoading(false);
    }
  };

  const saldo = stats.entradas - stats.saidas;

  const summaryCards = [
    { title: "Membros Ativos", value: stats.memberCount, suffix: "", decimals: 0, icon: Users, color: "text-primary", primary: true, link: "/membros" },
    { title: "Saldo Líquido", value: saldo, prefix: "R$ ", decimals: 2, icon: Wallet, positive: saldo >= 0, primary: false },
    { title: "Total Entradas", value: stats.entradas, prefix: "R$ ", decimals: 2, icon: TrendingUp, positive: true },
    { title: "Total Saídas", value: stats.saidas, prefix: "R$ ", decimals: 2, icon: TrendingDown, positive: false },
  ];

  const periodLabel = month === "all"
    ? `Jan ${year} — Dez ${year}`
    : `${monthNames[parseInt(month) - 1]} ${year}`;

  const visibleCards = useMemo(() => {
    if (canManageFinances) return summaryCards;
    return summaryCards.filter(c => c.title === "Membros Ativos");
  }, [canManageFinances, summaryCards]);

  if (!organization) return null; // Modal de onboarding irá cobrir

  return (
    <>
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Painel de Gestão</h1>
            <p className="text-[12px] text-muted-foreground mt-1">{organization.name} — {periodLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {canManageFinances && (
              <>
                <QuickEntryDialog onSuccess={fetchDashboardData} />
                <TransactionsDialog
                  onSuccess={fetchDashboardData}
                  trigger={
                    <Button className="h-9 px-4 text-xs font-semibold gap-2 shadow-sm">
                      <Plus className="h-4 w-4" />
                      Novo Lançamento
                    </Button>
                  }
                />
              </>
            )}
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-9 w-24 text-xs border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-9 w-36 text-xs border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o ano</SelectItem>
                {monthNames.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={`grid gap-4 ${canManageFinances ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
          {visibleCards.map((card) => (
            <Card key={card.title} className={`bg-card ${card.primary ? 'border-primary/40 shadow-md ring-2 ring-primary/5' : 'border-border'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <card.icon className={`h-4 w-4 ${card.primary ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-[13px] ${card.primary ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>{card.title}</span>
                  </div>
                  {card.link && (
                    <Link to={card.link} className="text-[10px] text-primary font-bold hover:underline">VER TODOS</Link>
                  )}
                </div>
                <div className="flex items-end justify-between">
                  {loading ? (
                    <Skeleton className="h-7 w-[100px]" />
                  ) : (
                    <span className={`text-xl font-black font-mono tabular-nums ${card.title === 'Total Saídas' ? 'text-destructive' : 'text-foreground'}`}>
                      <Counter
                        value={card.value}
                        prefix={card.prefix}
                        suffix={card.suffix}
                        decimals={card.decimals}
                      />
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className={`grid gap-4 grid-cols-1 ${canManageFinances ? 'lg:grid-cols-[1fr_280px]' : ''}`}>
          {canManageFinances && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-[15px] font-semibold">Fluxo de Caixa Mensal</CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-1">Entradas vs Saídas</p>
                </div>
              </CardHeader>
              <CardContent className="pt-2 px-2 pb-0">
                <div className="h-[260px]">
                  {loading ? (
                    <div className="h-full flex flex-col gap-2 p-4">
                      <div className="flex h-full items-end gap-2">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <Skeleton key={i} className="w-full" style={{ height: `${Math.random() * 80 + 20}%` }} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: -5 }} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} height={20} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                        <Tooltip
                          cursor={false}
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                          formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]}
                        />
                        <Bar dataKey="entradas" fill="hsl(var(--chart-blue))" radius={[4, 4, 0, 0]} barSize={28} />
                        <Bar dataKey="saidas" fill="hsl(var(--chart-pink))" radius={[4, 4, 0, 0]} barSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold">Detalhamento</CardTitle>
              {canManageFinances && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase hidden sm:inline">Exibir Saídas</span>
                  <Switch
                    checked={showExpenses}
                    onCheckedChange={setShowExpenses}
                    className="scale-75 origin-right data-[state=checked]:bg-destructive"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                {canManageFinances && (
                  <>
                    {showExpenses && (
                      <div className="flex justify-between items-center pb-2 border-b border-border animate-in slide-in-from-top-1 duration-300">
                        <span className="text-[12px] text-muted-foreground">Total Saídas</span>
                        <span className="text-[13px] font-bold font-mono text-destructive">
                          {loading ? <Skeleton className="h-4 w-20" /> : `- R$ ${stats.saidas.toLocaleString("pt-BR")}`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pb-2 border-b border-border">
                      <span className="text-[12px] text-muted-foreground">Dízimos</span>
                      <span className="text-[13px] font-bold font-mono text-success">
                        {loading ? <Skeleton className="h-4 w-20" /> : `R$ ${stats.dizimos.toLocaleString("pt-BR")}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-border">
                      <span className="text-[12px] text-muted-foreground">Ofertas</span>
                      <span className="text-[13px] font-bold font-mono text-success">
                        {loading ? <Skeleton className="h-4 w-20" /> : `R$ ${stats.ofertas.toLocaleString("pt-BR")}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[12px] font-semibold text-foreground">Total Líquido</span>
                      {loading ? (
                        <Skeleton className="h-5 w-24" />
                      ) : (
                        <span className={`text-[14px] font-bold font-mono ${saldo >= 0 ? "text-success" : "text-destructive"}`}>
                          {`R$ ${saldo.toLocaleString("pt-BR")}`}
                        </span>
                      )}
                    </div>
                  </>
                )}

                <div className={`mt-6 pt-6 border-t border-border space-y-4 ${!canManageFinances ? 'mt-0 pt-0 border-t-0' : ''}`}>
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Secretaria</h4>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <UsersRound className="h-3.5 w-3.5 text-primary/60" />
                      <span className="text-[12px] text-muted-foreground">Departamentos</span>
                    </div>
                    <span className="text-[13px] font-bold font-mono text-foreground">
                      {loading ? <Skeleton className="h-4 w-10" /> : stats.deptCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 text-primary/60" />
                      <span className="text-[12px] text-muted-foreground">Eventos</span>
                    </div>
                    <span className="text-[13px] font-bold font-mono text-foreground">
                      {loading ? <Skeleton className="h-4 w-10" /> : stats.eventCount}
                    </span>
                  </div>
                </div>
              </div>
              <Link to="/lancamentos?tab=relatorios" className="block w-full mt-4">
                <Button variant="outline" className="w-full h-8 text-[11px] border-border group">
                  <Eye className="h-3.5 w-3.5 mr-2 group-hover:text-primary transition-colors" />
                  Visualizar Relatório
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {canManageFinances && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] font-semibold">Dízimos & Ofertas (Consolidado)</CardTitle>
            </CardHeader>
            <CardContent className="pt-2 px-2 pb-0">
              <div className="h-[220px]">
                {loading ? (
                  <div className="h-full w-full flex items-end px-4 pb-2">
                    <Skeleton className="h-full w-full rounded-lg opacity-20" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: -5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} height={20} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                      <Tooltip cursor={false} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                      <defs>
                        <linearGradient id="gradAreaBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--chart-blue))" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="hsl(var(--chart-blue))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="dizimos" name="Dízimos" stroke="hsl(var(--chart-blue))" strokeWidth={3} fill="url(#gradAreaBlue)" dot={false} />
                      <Area type="monotone" dataKey="ofertas" name="Ofertas" stroke="hsl(210, 85%, 70%)" strokeWidth={2} fill="none" dot={false} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
