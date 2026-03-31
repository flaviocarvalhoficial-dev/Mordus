import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, Receipt, Loader2, Plus, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/AppLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

export default function Dashboard() {
  const { organization } = useChurch();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showExpenses, setShowExpenses] = useState(false);
  const [stats, setStats] = useState({
    entradas: 0,
    saidas: 0,
    dizimos: 0,
    ofertas: 0,
    count: 0
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
        .select(`*, categories(name)`)
        .eq("organization_id", organization!.id);

      // Filtro de ano aproximado (Supabase range ou raw filter)
      query = query.gte("date", `${year}-01-01`).lte("date", `${year}-12-31`);

      if (month !== "all") {
        query = query.gte("date", `${year}-${month}-01`).lte("date", `${year}-${month}-31`);
      }

      const { data: txs, error } = await query;
      if (error) throw error;

      // Processar dados para estatísticas e gráficos
      const newStats = { entradas: 0, saidas: 0, dizimos: 0, ofertas: 0, count: txs?.length || 0 };
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
    { title: "Saldo Líquido", value: `R$ ${saldo.toLocaleString("pt-BR")}`, icon: Wallet, positive: saldo >= 0 },
    { title: "Total Entradas", value: `R$ ${stats.entradas.toLocaleString("pt-BR")}`, icon: TrendingUp, positive: true },
    { title: "Total Saídas", value: `R$ ${stats.saidas.toLocaleString("pt-BR")}`, icon: TrendingDown, positive: false },
    { title: "Movimentações", value: `${stats.count}`, icon: Receipt, positive: true },
  ];

  const periodLabel = month === "all"
    ? `Jan ${year} — Dez ${year}`
    : `${monthNames[parseInt(month) - 1]} ${year}`;

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Inicializando...</div>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Painel de Gestão</h1>
            <p className="text-[12px] text-muted-foreground mt-1">{organization.name} — {periodLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="h-9 px-4 text-xs font-semibold gap-2 shadow-sm">
              <Link to="/lancamentos?new=true">
                <Plus className="h-4 w-4" />
                Novo Lançamento
              </Link>
            </Button>
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

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.title} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[13px] text-muted-foreground">{card.title}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-xl font-bold font-mono text-foreground tabular-nums">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : card.value}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_280px]">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[15px] font-semibold">Fluxo de Caixa Mensal</CardTitle>
                <p className="text-[11px] text-muted-foreground mt-1">Entradas vs Saídas</p>
              </div>
            </CardHeader>
            <CardContent className="pt-4 px-2">
              <div className="h-[280px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                        formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]}
                      />
                      <Bar dataKey="entradas" fill="hsl(var(--chart-blue))" radius={[4, 4, 0, 0]} barSize={16} />
                      <Bar dataKey="saidas" fill="hsl(var(--chart-pink))" radius={[4, 4, 0, 0]} barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-semibold">Detalhamento</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase hidden sm:inline">Exibir Saídas</span>
                <Switch
                  checked={showExpenses}
                  onCheckedChange={setShowExpenses}
                  className="scale-75 origin-right data-[state=checked]:bg-destructive"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                {showExpenses && (
                  <div className="flex justify-between items-center pb-2 border-b border-border animate-in slide-in-from-top-1 duration-300">
                    <span className="text-[12px] text-muted-foreground">Total Saídas</span>
                    <span className="text-[13px] font-bold font-mono text-destructive">
                      {loading ? "..." : `- R$ ${stats.saidas.toLocaleString("pt-BR")}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-[12px] text-muted-foreground">Dízimos</span>
                  <span className="text-[13px] font-bold font-mono text-success">
                    {loading ? "..." : `R$ ${stats.dizimos.toLocaleString("pt-BR")}`}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border">
                  <span className="text-[12px] text-muted-foreground">Ofertas</span>
                  <span className="text-[13px] font-bold font-mono text-success">
                    {loading ? "..." : `R$ ${stats.ofertas.toLocaleString("pt-BR")}`}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[12px] font-semibold text-foreground">Total Líquido</span>
                  <span className={`text-[14px] font-bold font-mono ${saldo >= 0 ? "text-success" : "text-destructive"}`}>
                    {loading ? "..." : `R$ ${saldo.toLocaleString("pt-BR")}`}
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-8 h-9 text-[12px] border-border group">
                <Download className="h-3.5 w-3.5 mr-2 group-hover:text-primary transition-colors" />
                Baixar Relatório
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-[15px] font-semibold">Dízimos & Ofertas (Consolidado)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 px-2">
            <div className="h-[240px]">
              {loading ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
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
      </div>
    </AppLayout>
  );
}
