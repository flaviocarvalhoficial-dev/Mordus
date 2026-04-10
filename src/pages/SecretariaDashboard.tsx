import { useState, useEffect } from "react";
import { Users, Building2, UsersRound, CalendarDays, Crown, FileText, Heart, Handshake, Loader2, Plus, Home, Landmark, MapPinned, User, UserPlus, LayoutDashboard, PieChart as PieChartIcon, BarChart as BarChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";

export default function SecretariaDashboard({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { organization } = useChurch();
  const [loading, setLoading] = useState(true);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    members: 0,
    departments: 0,
    events: 0,
    assets: 0,
    families: 0,
    partners: 0,
    congregations: 0,
    leaders: 0,
    documents: 0
  });

  const [incompleteProfiles, setIncompleteProfiles] = useState(0);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [genderData, setGenderData] = useState<any[]>([]);
  const [ageData, setAgeData] = useState<any[]>([]);
  const [maritalData, setMaritalData] = useState<any[]>([]);
  const [baptismData, setBaptismData] = useState<any[]>([]);
  const [rolesData, setRolesData] = useState<any[]>([]);
  const [congregations, setCongregations] = useState<any[]>([]);
  const [selectedCongregation, setSelectedCongregation] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [period, setPeriod] = useState("12_months");
  const [congregationGrowthData, setCongregationGrowthData] = useState<any[]>([]);
  const [activeBoard, setActiveBoard] = useState("overview"); // overview, demography, church, operational
  const [demographySubBoard, setDemographySubBoard] = useState("gender"); // gender, marital, age
  const [churchSubBoard, setChurchSubBoard] = useState("baptism"); // baptism, roles, congregation

  const COLORS = ["hsl(var(--chart-blue))", "hsl(var(--chart-pink))", "hsl(var(--chart-amber))", "hsl(var(--chart-emerald))"];

  useEffect(() => {
    if (organization?.id) {
      fetchCongregations();
      fetchCounts();
      fetchRecentActivity();
      fetchIncompleteProfiles();
      fetchBirthdays();
      fetchGrowthData();
      fetchDemographics();
    }
  }, [organization?.id, selectedCongregation, selectedStatus, period]);

  const fetchCongregations = async () => {
    try {
      const { data } = await supabase.from("congregations").select("id, name").eq("organization_id", organization!.id);
      setCongregations(data || []);
    } catch (err) { }
  };

  const fetchGrowthData = async () => {
    try {
      const monthsToFetch = period === "3_months" ? 3 : period === "6_months" ? 6 : 12;
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (monthsToFetch - 1));
      startDate.setDate(1);

      let query = supabase
        .from("members")
        .select("created_at, congregation_id")
        .eq("organization_id", organization!.id)
        .gte("created_at", startDate.toISOString());

      if (selectedCongregation !== "all") {
        query = query.eq("congregation_id", selectedCongregation);
      }

      if (selectedStatus !== "all") {
        query = query.eq("status", selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      const months = Array.from({ length: monthsToFetch }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (monthsToFetch - 1 - i));
        return {
          month: d.toLocaleString('pt-BR', { month: 'short' }),
          count: 0,
          fullDate: d
        };
      });

      data?.forEach(m => {
        const d = new Date(m.created_at);
        const mIdx = months.findIndex(mo => mo.fullDate.getMonth() === d.getMonth() && mo.fullDate.getFullYear() === d.getFullYear());
        if (mIdx !== -1) months[mIdx].count++;
      });

      let total = 0; // Simplified for the chart view
      const results = months.map(m => {
        total += m.count;
        return { ...m, total };
      });

      setGrowthData(results);

      // Comparative data by congregation
      if (selectedCongregation === "all") {
        const comp: Record<string, any> = {};
        congregations.forEach(c => comp[c.name] = { name: c.name, count: 0 });
        comp["Sede"] = { name: "Sede", count: 0 };

        data?.forEach(m => {
          const cName = congregations.find(c => c.id === m.congregation_id)?.name || "Sede";
          if (comp[cName]) comp[cName].count++;
        });
        setCongregationGrowthData(Object.values(comp).filter(c => c.count > 0));
      } else {
        setCongregationGrowthData([]);
      }

    } catch (err) { }
  };

  const fetchDemographics = async () => {
    try {
      let query = supabase
        .from("members")
        .select("gender, age_group, marital_status, is_baptized, role_in_church")
        .eq("organization_id", organization!.id);

      if (selectedCongregation !== "all") {
        query = query.eq("congregation_id", selectedCongregation);
      }

      if (selectedStatus !== "all") {
        query = query.eq("status", selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      const genders: Record<string, number> = {};
      const ages: Record<string, number> = {};
      const maritals: Record<string, number> = {};
      const baptisms: Record<string, number> = { "Batizados": 0, "Não Batizados": 0 };
      const roles: Record<string, number> = {};

      (data as any[])?.forEach(m => {
        if (m.gender) genders[m.gender] = (genders[m.gender] || 0) + 1;
        if (m.age_group) ages[m.age_group] = (ages[m.age_group] || 0) + 1;
        if (m.marital_status) maritals[m.marital_status] = (maritals[m.marital_status] || 0) + 1;
        if (m.is_baptized) baptisms["Batizados"]++; else baptisms["Não Batizados"]++;
        if (m.role_in_church) roles[m.role_in_church] = (roles[m.role_in_church] || 0) + 1;
      });

      setGenderData(Object.entries(genders).map(([name, value]) => ({ name, value })));
      setAgeData(Object.entries(ages).map(([name, value]) => ({ name, value })));
      setMaritalData(Object.entries(maritals).map(([name, value]) => ({ name, value })));
      setBaptismData(Object.entries(baptisms).map(([name, value]) => ({ name, value })));
      setRolesData(Object.entries(roles).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5));
    } catch (err) { }
  };

  const fetchIncompleteProfiles = async () => {
    try {
      let query = supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization!.id)
        .or("phone.is.null,email.is.null,avatar_url.is.null");

      if (selectedCongregation !== "all") {
        query = query.eq("congregation_id", selectedCongregation);
      }

      const { count } = await query;
      setIncompleteProfiles(count || 0);
    } catch (err) { }
  };

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const orgId = organization!.id;

      const filters = { organization_id: orgId };
      const getQuery = (table: "members" | "departments" | "events" | "assets" | "families" | "partners" | "congregations" | "leaders" | "documents") => {
        let q = supabase.from(table).select("*", { count: "exact", head: true }).eq("organization_id", orgId);

        if (selectedCongregation !== "all" && !["congregations", "departments", "events"].includes(table)) {
          // @ts-ignore
          q = q.eq("congregation_id", selectedCongregation);
        }

        if (selectedStatus !== "all" && (table === "members" || table === "leaders")) {
          // @ts-ignore
          q = q.eq("status", selectedStatus);
        }

        return q;
      };

      const [
        { count: mCount },
        { count: dCount },
        { count: eCount },
        { count: aCount },
        { count: fCount },
        { count: pCount },
        { count: cCount },
        { count: lCount },
        { count: docCount }
      ] = await Promise.all([
        getQuery("members"),
        supabase.from("departments").select("*", { count: "exact", head: true }).eq("organization_id", orgId), // Dept are global
        supabase.from("events").select("*", { count: "exact", head: true }).eq("organization_id", orgId), // Events are global
        getQuery("assets"),
        getQuery("families"),
        getQuery("partners"),
        supabase.from("congregations").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
        getQuery("leaders"),
        getQuery("documents"),
      ]);

      setCounts({
        members: mCount || 0,
        departments: dCount || 0,
        events: eCount || 0,
        assets: aCount || 0,
        families: fCount || 0,
        partners: pCount || 0,
        congregations: cCount || 0,
        leaders: lCount || 0,
        documents: docCount || 0
      });
    } catch (err) {
      console.error("Erro ao carregar contagens:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      let query = supabase
        .from("members")
        .select("full_name, created_at, congregation_id")
        .eq("organization_id", organization!.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (selectedCongregation !== "all") {
        query = query.eq("congregation_id", selectedCongregation);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecentMembers(data || []);
    } catch (err) { }
  };

  const fetchBirthdays = async () => {
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;

      let query = supabase
        .from("members")
        .select("full_name, birth_date, congregation_id")
        .eq("organization_id", organization!.id);

      if (selectedCongregation !== "all") {
        query = query.eq("congregation_id", selectedCongregation);
      }

      const { data, error } = await query;

      if (error) throw error;

      const monthly = (data || []).filter(m => {
        if (!m.birth_date) return false;
        // Postgres birth_date is YYYY-MM-DD
        const bMonth = parseInt(m.birth_date.split('-')[1]);
        return bMonth === currentMonth;
      })
        .sort((a, b) => parseInt(a.birth_date.split('-')[2]) - parseInt(b.birth_date.split('-')[2]));

      setUpcomingBirthdays(monthly);
    } catch (err) { }
  };

  const kpis = [
    { title: "Membros Ativos", value: counts.members, icon: Users, color: "text-primary", bg: "bg-primary/5", border: "border-primary/10", tab: "membros" },
    { title: "Departamentos", value: counts.departments, icon: UsersRound, color: "text-primary/70", bg: "bg-secondary/50", border: "border-border/50", tab: "departamentos" },
    { title: "Patrimônio", value: counts.assets, icon: Landmark, color: "text-primary/70", bg: "bg-secondary/50", border: "border-border/50", tab: "patrimonio" },
    { title: "Congregações", value: counts.congregations, icon: MapPinned, color: "text-primary/70", bg: "bg-secondary/50", border: "border-border/50", tab: "congregacoes" },
  ];

  const quickLinks = [
    { title: "Membros", icon: Users, tab: "membros", count: counts.members },
    { title: "Liderança", icon: Crown, tab: "lideranca", count: counts.leaders },
    { title: "Departamentos", icon: UsersRound, tab: "departamentos", count: counts.departments },
    { title: "Patrimônio", icon: Landmark, tab: "patrimonio", count: counts.assets },
    { title: "Documentos", icon: FileText, tab: "documentos", count: counts.documents },
    { title: "Congregações", icon: MapPinned, tab: "congregacoes", count: counts.congregations },
    { title: "Eventos", icon: CalendarDays, tab: "calendario", count: counts.events },
    { title: "Ação Social", icon: Heart, tab: "social", count: counts.families },
    { title: "Parcerias", icon: Handshake, tab: "parceiros", count: counts.partners },
  ];

  if (!organization) return null;

  return (
    <div className="animate-fade-in space-y-10">
      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-sm p-4 rounded-3xl border border-border/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-secondary/30 rounded-2xl border border-border/50">
          {[
            { id: "3_months", label: "3 Meses" },
            { id: "6_months", label: "6 Meses" },
            { id: "12_months", label: "12 Meses" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 text-[11px] font-bold rounded-xl transition-all ${period === p.id ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] font-medium text-muted-foreground">Filtrar congregação:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCongregation("all")}
              className={`h-9 px-4 rounded-xl text-[11px] font-bold transition-all border ${selectedCongregation === "all" ? "bg-primary/10 border-primary/20 text-primary" : "bg-background border-border text-muted-foreground hover:bg-secondary/50"
                }`}
            >
              Todas
            </button>
            {congregations.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCongregation(c.id)}
                className={`h-9 px-4 rounded-xl text-[11px] font-bold transition-all border ${selectedCongregation === c.id ? "bg-primary/10 border-primary/20 text-primary" : "bg-background border-border text-muted-foreground hover:bg-secondary/50"
                  }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[12px] font-medium text-muted-foreground">Status:</span>
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "Todos" },
              { id: "active", label: "Ativos" },
              { id: "inactive", label: "Inativos" },
              { id: "pending", label: "Pendentes" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStatus(s.id)}
                className={`h-9 px-4 rounded-xl text-[11px] font-bold transition-all border ${selectedStatus === s.id ? "bg-primary/10 border-primary/20 text-primary" : "bg-background border-border text-muted-foreground hover:bg-secondary/50"
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="bg-card border-border shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-2xl" onClick={() => onNavigate?.(kpi.tab)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <kpi.icon className="h-4 w-4 text-primary/60" />
                  <span className="text-[13px] text-muted-foreground font-medium">{kpi.title}</span>
                </div>
                <Badge variant="secondary" className="bg-secondary/50 text-[10px] font-bold">Resumo</Badge>
              </div>
              <div className="mt-2">
                <div className="text-xl font-black text-foreground font-mono tabular-nums leading-tight">
                  {loading ? <Skeleton className="h-8 w-12" /> : kpi.value}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 p-1.5 bg-secondary/30 rounded-2xl border border-border/50 w-full md:w-fit overflow-x-auto">
        {[
          { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
          { id: "demography", label: "Demografia", icon: Users },
          { id: "church", label: "Eclesiástico", icon: Crown },
          { id: "operational", label: "Operacional", icon: Building2 },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveBoard(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold rounded-xl transition-all whitespace-nowrap ${activeBoard === t.id ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {activeBoard === "overview" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden border-t-2 border-t-primary/10">
            <CardHeader className="bg-secondary/5 border-b border-border/50 py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary/60" /> Crescimento de Membros
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-blue))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="hsl(var(--chart-blue))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="total" name="Crescimento" stroke="hsl(var(--chart-blue))" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} />
                    <Bar dataKey="count" name="Novas Admissões" fill="hsl(var(--chart-pink))" radius={[4, 4, 0, 0]} barSize={20} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden border-t-2 border-t-primary/10">
              <CardHeader className="bg-secondary/5 border-b border-border/50 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary/60" /> Aniversariantes do Mês
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold bg-background border-border/50 capitalize">{new Date().toLocaleString('pt-BR', { month: 'long' })}</Badge>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {upcomingBirthdays.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                      <Heart className="h-8 w-8 mx-auto" />
                      <p className="text-[11px] mt-2">Nenhum aniversariante este mês</p>
                    </div>
                  ) : upcomingBirthdays.map((m, i) => (
                    <div key={i} className="flex items-center justify-between group p-2 hover:bg-secondary/5 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center border border-border font-bold text-muted-foreground text-xs">
                          {m.birth_date ? parseInt(m.birth_date.split('-')[2]) : '--'}
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-foreground">{m.full_name}</p>
                          <p className="text-[10px] text-muted-foreground">Dia {m.birth_date ? parseInt(m.birth_date.split('-')[2]) : '--'}</p>
                        </div>
                      </div>
                      <span className="text-lg">🎂</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden border-t-2 border-t-primary/10">
              <CardHeader className="bg-secondary/5 border-b border-border/50 py-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary/60" /> Últimas Admissões
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentMembers.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                      <User className="h-8 w-8 mx-auto" />
                      <p className="text-[11px] mt-2">Nenhuma admissão recente</p>
                    </div>
                  ) : recentMembers.map((m, i) => (
                    <div key={i} className="flex items-center justify-between group p-2 hover:bg-secondary/5 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                          <User className="h-5 w-5 text-primary/70" />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-foreground leading-tight">{m.full_name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium mt-1">{new Date(m.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[8px] font-black">NEW</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeBoard === "demography" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden border-t-2 border-t-primary/10">
            <CardHeader className="bg-secondary/5 border-b border-border/50 py-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-primary/60" />
                <CardTitle className="text-sm font-bold">Perfil Demográfico</CardTitle>
              </div>
              <div className="flex items-center gap-1 p-1 bg-background/50 rounded-xl border border-border/50">
                {[
                  { id: "gender", label: "Sexo" },
                  { id: "marital", label: "Estado Civil" },
                  { id: "age", label: "Idade" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setDemographySubBoard(s.id)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${demographySubBoard === s.id ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid md:grid-cols-5 gap-10 items-center">
                <div className="md:col-span-3 h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {demographySubBoard === "gender" ? (
                      <PieChart>
                        <Pie data={genderData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                          {genderData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                      </PieChart>
                    ) : demographySubBoard === "marital" ? (
                      <PieChart>
                        <Pie data={maritalData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                          {maritalData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                      </PieChart>
                    ) : (
                      <BarChart data={ageData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={80} />
                        <Tooltip cursor={{ fill: 'hsl(var(--secondary)/0.1)' }} contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                        <Bar dataKey="value" name="Membros" fill="hsl(var(--chart-emerald))" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-4">
                      {demographySubBoard === "gender" ? "Distribuição Sexual" : demographySubBoard === "marital" ? "Estado Civil" : "Faixa Etária"}
                    </h4>
                    <div className="space-y-3">
                      {(demographySubBoard === "gender" ? genderData : demographySubBoard === "marital" ? maritalData : ageData).map((entry, index) => (
                        <div key={entry.name} className="flex items-center justify-between group">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-[12px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{entry.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[12px] font-mono font-bold">{entry.value}</span>
                            <span className="text-[10px] text-muted-foreground font-mono w-10 text-right">
                              {Math.round((entry.value / (demographySubBoard === "age" ? ageData : demographySubBoard === "gender" ? genderData : maritalData).reduce((a, b) => a + b.value, 0) || 1) * 100)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-border/50">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {demographySubBoard === "gender"
                        ? "Análise da diversidade de gênero no corpo de membros para planejamento de ministérios específicos."
                        : demographySubBoard === "marital"
                          ? "Visão geral da estrutura familiar para suporte e aconselhamento pastoral direcionado."
                          : "Distribuição etária para organização de departamentos de ensino e atividades geracionais."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeBoard === "church" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden border-t-2 border-t-primary/10">
            <CardHeader className="bg-secondary/5 border-b border-border/50 py-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary/60" />
                <CardTitle className="text-sm font-bold">Saúde Eclesiástica</CardTitle>
              </div>
              <div className="flex items-center gap-1 p-1 bg-background/50 rounded-xl border border-border/50">
                {[
                  { id: "baptism", label: "Batismo" },
                  { id: "roles", label: "Funções" },
                  { id: "congregation", label: "Congregações" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setChurchSubBoard(s.id)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${churchSubBoard === s.id ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-10">
              {churchSubBoard === "baptism" && (
                <div className="grid md:grid-cols-5 gap-10 items-center">
                  <div className="md:col-span-3 h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={baptismData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                          <Cell fill="hsl(var(--chart-blue))" />
                          <Cell fill="hsl(var(--chart-pink))" />
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="md:col-span-2 space-y-6">
                    <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-4">Membros Batizados</h4>
                    <div className="space-y-4">
                      {baptismData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: index === 0 ? "hsl(var(--chart-blue))" : "hsl(var(--chart-pink))" }} />
                            <span className="text-[12px] font-medium text-muted-foreground">{entry.name}</span>
                          </div>
                          <span className="text-[12px] font-mono font-bold">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {churchSubBoard === "roles" && (
                <div className="space-y-8 max-w-2xl mx-auto">
                  <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider text-center">Distribuição de Liderança e Funções</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {(rolesData.length > 0 ? rolesData : [{ name: 'Membro', value: 0 }]).map((role, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-foreground">{role.name}</span>
                          <span className="text-muted-foreground">{role.value}</span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/40 rounded-full"
                            style={{ width: `${(role.value / (Math.max(...rolesData.map(r => r.value)) || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {churchSubBoard === "congregation" && (
                <div className="h-[300px] w-full">
                  <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-wider text-center mb-6">Membros por Congregação</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={congregationGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip cursor={{ fill: 'hsl(var(--secondary)/0.1)' }} contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "12px", fontSize: "12px" }} />
                      <Bar dataKey="count" fill="hsl(var(--chart-amber))" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeBoard === "operational" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Completar Perfis", icon: UserPlus, sub: `${incompleteProfiles} perfis pendentes`, tab: "membros" },
              { title: "Próximos Eventos", icon: CalendarDays, sub: `${counts.events} eventos agendados`, tab: "calendario" },
              { title: "Documentos", icon: FileText, sub: `Organizar arquivos`, tab: "documentos" },
            ].map((action) => (
              <Card
                key={action.title}
                className="bg-card border-border shadow-sm hover:border-primary/30 transition-all cursor-pointer group rounded-2xl"
                onClick={() => onNavigate?.(action.tab)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/5 transition-colors">
                    <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold leading-tight">{action.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{action.sub}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden border-t-2 border-t-primary/10">
            <CardHeader className="bg-secondary/5 border-b border-border/50 py-4 flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary/60" /> Resumo do Patrimônio
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-background border-border/50 font-bold">Estado de Conservação</Badge>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Excelente", count: 12, sub: "Prontos", color: "bg-emerald-500", text: "text-emerald-500", w: "70%" },
                  { label: "Bom", count: 8, sub: "Em uso", color: "bg-blue-500", text: "text-blue-500", w: "45%" },
                  { label: "Regular", count: 3, sub: "Revisão", color: "bg-amber-500", text: "text-amber-500", w: "20%" },
                  { label: "Manutenção", count: 1, sub: "Urgente", color: "bg-destructive", text: "text-destructive", w: "10%" },
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.label}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-xl font-black font-mono">{String(item.count).padStart(2, '0')}</span>
                      <span className={`text-[10px] ${item.text} font-bold mb-1`}>{item.sub}</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full ${item.color}`} style={{ width: item.w }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
