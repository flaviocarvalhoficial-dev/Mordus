import { useState, useEffect } from "react";
import { Users, Building2, UsersRound, CalendarDays, Crown, FileText, Heart, Handshake, Loader2, Plus, Home, Landmark, MapPinned, User, UserPlus } from "lucide-react";
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

  const [incompleteProfiles, setIncompleteProfiles] = useState(0);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([]);

  useEffect(() => {
    if (organization?.id) {
      fetchCounts();
      fetchRecentActivity();
      fetchIncompleteProfiles();
      fetchBirthdays();
    }
  }, [organization?.id]);

  const fetchIncompleteProfiles = async () => {
    try {
      const { count } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization!.id)
        .or("phone.is.null,email.is.null,avatar_url.is.null");
      setIncompleteProfiles(count || 0);
    } catch (err) { }
  };

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

  const fetchBirthdays = async () => {
    try {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;

      const { data, error } = await supabase
        .from("members")
        .select("full_name, birth_date")
        .eq("organization_id", organization!.id);

      if (error) throw error;

      const monthly = (data || []).filter(m => {
        if (!m.birth_date) return false;
        const bDate = new Date(m.birth_date);
        return (bDate.getMonth() + 1) === currentMonth;
      })
        .sort((a, b) => new Date(a.birth_date).getDate() - new Date(b.birth_date).getDate());

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

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Ações Recomendadas</Badge>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <div className="grid gap-4 md:grid-cols-4">

          <Card
            className="bg-card border-border shadow-sm hover:border-primary/30 transition-all cursor-pointer group rounded-2xl"
            onClick={() => onNavigate?.("membros")}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <UserPlus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-[13px] font-bold leading-tight">Completar Perfis</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{incompleteProfiles} membros com dados faltantes</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border shadow-sm hover:border-primary/30 transition-all cursor-pointer group rounded-2xl"
            onClick={() => onNavigate?.("calendario")}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <CalendarDays className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-[13px] font-bold leading-tight">Próximos Eventos</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{counts.events} eventos agendados</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border shadow-sm hover:border-primary/30 transition-all cursor-pointer group rounded-2xl"
            onClick={() => onNavigate?.("documentos")}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="text-[13px] font-bold leading-tight">Doc. Pendentes</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Organizar arquivo da igreja</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden border-t-2 border-t-primary/10">
          <CardHeader className="bg-secondary/5 border-b border-border/50 py-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary/60" /> Aniversariantes do Mês
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-bold bg-background uppercase border-border/50">{new Date().toLocaleString('pt-BR', { month: 'long' })}</Badge>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-3 w-32" /><Skeleton className="h-2 w-20" /></div></div>
                ))
              ) : upcomingBirthdays.length === 0 ? (
                <div className="text-center py-10">
                  <Heart className="h-8 w-8 text-muted-foreground mx-auto opacity-20" />
                  <p className="text-xs text-muted-foreground mt-2">Nenhum aniversariante este mês</p>
                </div>
              ) : upcomingBirthdays.map((m, i) => (
                <div key={i} className="flex items-center justify-between group p-2 hover:bg-secondary/5 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center border border-border group-hover:border-primary/20 transition-all font-bold text-muted-foreground text-xs">
                      {new Date(m.birth_date).getDate()}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-foreground leading-tight">{m.full_name}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">Dia {new Date(m.birth_date).getDate()}</p>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Badge variant="secondary" className="bg-primary/5 text-primary/60 text-[10px] p-0 h-6 w-6 rounded-full flex items-center justify-center">🎂</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden border-t-2 border-t-primary/10">
          <CardHeader className="bg-secondary/5 border-b border-border/50 py-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary/60" /> Últimas Admissões
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-3 w-32" /><Skeleton className="h-2 w-20" /></div></div>
                ))
              ) : recentMembers.map((m, i) => (
                <div key={i} className="flex items-center justify-between group p-2 hover:bg-secondary/5 rounded-xl transition-all">
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
