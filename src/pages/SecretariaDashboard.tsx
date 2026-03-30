import { useState, useEffect } from "react";
import { Users, Building2, UsersRound, CalendarDays, Crown, FileText, Heart, Handshake, Loader2, Plus, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";

export default function SecretariaDashboard() {
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
    { title: "Membros Ativos", value: counts.members, icon: Users, color: "text-primary" },
    { title: "Departamentos", value: counts.departments, icon: UsersRound, color: "text-chart-blue" },
    { title: "Liderança", value: counts.leaders, icon: Crown, color: "text-chart-pink" },
    { title: "Eventos Anuais", value: counts.events, icon: CalendarDays, color: "text-success" },
  ];

  const quickLinks = [
    { title: "Membros", icon: Users, url: "/membros", count: counts.members },
    { title: "Departamentos", icon: UsersRound, url: "/departamentos", count: counts.departments },
    { title: "Patrimônio", icon: Building2, url: "/patrimonio", count: counts.assets },
    { title: "Liderança", icon: Crown, url: "/lideranca", count: counts.leaders },
    { title: "Documentos", icon: FileText, url: "/documentos", count: counts.documents },
    { title: "Calendário", icon: CalendarDays, url: "/calendario", count: counts.events },
    { title: "Congregações", icon: Home, url: "/congregacoes", count: counts.congregations },
    { title: "Serviço Social", icon: Heart, url: "/servico-social", count: counts.families },
    { title: "Parceiros", icon: Handshake, url: "/parceiros", count: counts.partners },
  ];

  if (!organization) return null;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-chart-blue flex items-center justify-center border border-white/20 shadow-lg shrink-0">
            <UsersRound className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Painel da Secretaria</h1>
            <p className="text-muted-foreground text-[12px] font-medium uppercase tracking-[0.1em]">{organization.name}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {kpis.map((card) => (
                <Card key={card.title} className="bg-card border-border border-l-4 border-l-primary/40 hover:translate-y-[-2px] transition-all cursor-default group">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <card.icon className={`h-4 w-4 ${card.color} group-hover:scale-110 transition-transform`} />
                      <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">{card.title}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold font-mono text-foreground tabular-nums">{card.value}</span>
                      <Badge variant="secondary" className="text-[9px] bg-secondary/60 border-0 uppercase tracking-tighter">Realtime</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1fr_300px]">
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-[14px] font-bold uppercase tracking-widest text-muted-foreground">Módulos de Gestão</CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickLinks.map((link) => (
                      <a
                        key={link.title}
                        href={link.url}
                        className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-secondary/20 hover:bg-secondary/40 border border-border/40 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                          <link.icon className="h-10 w-10 text-primary" />
                        </div>
                        <link.icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform mb-1" />
                        <span className="text-[12px] font-bold text-foreground">{link.title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono bg-background/50 px-2 py-0.5 rounded-full">{link.count} Itens</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[13px] font-bold text-muted-foreground uppercase">Atividade Recente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recentMembers.map((m, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-foreground truncate">Novo Membro</p>
                          <p className="text-[11px] text-muted-foreground truncate">{m.full_name}</p>
                        </div>
                        <span className="text-[9px] text-muted-foreground whitespace-nowrap mt-1 uppercase font-mono">Just Now</span>
                      </div>
                    ))}
                    {recentMembers.length === 0 && (
                      <p className="text-[11px] text-center text-muted-foreground py-4 italic">Sem atividades recentes</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest">Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-[11px] h-9 border-dashed rounded-lg" asChild>
                      <a href="/membros"><Plus className="h-3 w-3 mr-2 text-primary" />Novo Membro</a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-[11px] h-9 border-dashed rounded-lg" asChild>
                      <a href="/patrimonio"><Plus className="h-3 w-3 mr-2 text-primary" />Novo Patrimônio</a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
