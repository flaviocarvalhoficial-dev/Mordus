import { useState, useEffect } from "react";
import { Users, Building2, UsersRound, CalendarDays, Crown, FileText, Heart, Handshake, Loader2, Plus, Home, Landmark, MapPinned, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { Skeleton } from "@/components/ui/skeleton";

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

  useEffect(() => {
    if (organization?.id) {
      fetchCounts();
      fetchRecentActivity();
    }
  }, [organization?.id]);

  const fetchCounts = async () => {
    setLoading(true);
    try {
      const orgId = organization!.id;

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
        supabase.from("members").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("departments").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("assets").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("families").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("partners").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("congregations").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("leaders").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
        supabase.from("documents").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
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
      const { data, error } = await supabase
        .from("members")
        .select("full_name, created_at")
        .eq("organization_id", organization!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      setRecentMembers(data || []);
    } catch (err) { }
  };

  const kpis = [
    { title: "Membros Ativos", value: counts.members, icon: Users, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", tab: "membros" },
    { title: "Departamentos", value: counts.departments, icon: UsersRound, color: "text-chart-blue", bg: "bg-chart-blue/10", border: "border-chart-blue/20", tab: "departamentos" },
    { title: "Patrimônio", value: counts.assets, icon: Landmark, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", tab: "patrimonio" },
    { title: "Congregações", value: counts.congregations, icon: MapPinned, color: "text-success", bg: "bg-success/10", border: "border-success/20", tab: "congregacoes" },
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
    <div className="animate-fade-in space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className={`bg-card border-border shadow-sm hover:shadow-md transition-all cursor-pointer group rounded-2xl`} onClick={() => onNavigate?.(kpi.tab)}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`h-10 w-10 rounded-xl ${kpi.bg} ${kpi.border} border flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <Badge variant="secondary" className="bg-secondary/50 text-[10px] uppercase font-bold tracking-tight">Overview</Badge>
              </div>
              <div className="mt-4">
                <div className="text-[24px] font-black text-foreground tabular-nums leading-tight">
                  {loading ? <Skeleton className="h-8 w-12" /> : kpi.value}
                </div>
                <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider mt-1">{kpi.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-1 lg:col-span-2 bg-card border-border shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-secondary/10 border-b border-border/50 py-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" /> Acesso Rápido aos Módulos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickLinks.map((link) => (
                <button
                  key={link.title}
                  onClick={() => onNavigate?.(link.tab)}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border/50 bg-secondary/5 hover:bg-primary/5 hover:border-primary/20 transition-all group relative overflow-hidden"
                >
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border border-border group-hover:border-primary/30 group-hover:scale-110 transition-all shadow-sm">
                    <link.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-[12px] font-bold text-foreground mt-3">{link.title}</span>
                  <span className="text-[10px] text-muted-foreground mt-1 tabular-nums font-medium">{loading ? "..." : `${link.count} registros`}</span>
                  <div className="absolute top-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="h-3 w-3 text-primary" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden border-l-4 border-l-primary/40">
          <CardHeader className="bg-secondary/10 border-b border-border/50 py-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Últimas Admissões
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-3 w-32" /><Skeleton className="h-2 w-20" /></div></div>
                ))
              ) : recentMembers.map((m, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:border-primary/30 transition-all">
                      <User className="h-5 w-5 text-primary/70" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-foreground leading-tight">{m.full_name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">{new Date(m.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[8px] font-black opacity-0 group-hover:opacity-100 transition-opacity">NEW</Badge>
                </div>
              ))}
              {!loading && recentMembers.length === 0 && (
                <div className="text-center py-10">
                  <User className="h-8 w-8 text-muted-foreground mx-auto opacity-20" />
                  <p className="text-xs text-muted-foreground mt-2">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
            <Button variant="ghost" className="w-full mt-6 h-10 text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5 border border-dashed border-primary/20" onClick={() => onNavigate?.("membros")}>
              Ver Rol Completo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
