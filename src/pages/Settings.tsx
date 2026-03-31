import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Church, Shield, Bell, Share2, Loader2, Camera, Copy, Check, Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useChurch } from "@/contexts/ChurchContext";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Settings() {
  const { organization, profile, user, canManageFinances, isAdmin, canWrite } = useChurch();
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [team, setTeam] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Form states for Organization
  const [orgForm, setOrgForm] = useState({
    name: "", cnpj: "", address: "", pastor_name: "", phone: "",
    bank_name: "", bank_agency: "", bank_account: "",
    pix_key_type: "", pix_key: "",
    instagram: "", facebook: "", youtube: "", whatsapp: ""
  });

  // Form states for Profile
  const [profileForm, setProfileForm] = useState({
    full_name: "", phone: ""
  });

  useEffect(() => {
    if (organization) {
      setOrgForm({
        name: organization.name || "",
        cnpj: (organization as any).cnpj || "",
        address: (organization as any).address || "",
        pastor_name: (organization as any).pastor_name || "",
        phone: (organization as any).phone || "",
        bank_name: (organization as any).bank_name || "",
        bank_agency: (organization as any).bank_agency || "",
        bank_account: (organization as any).bank_account || "",
        pix_key_type: (organization as any).pix_key_type || "",
        pix_key: (organization as any).pix_key || "",
        instagram: (organization as any).instagram || "",
        facebook: (organization as any).facebook || "",
        youtube: (organization as any).youtube || "",
        whatsapp: (organization as any).whatsapp || ""
      });
    }
  }, [organization]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        phone: (profile as any).phone || ""
      });
    }
  }, [profile]);

  useEffect(() => {
    if (organization?.id) {
      fetchTeam();
      fetchDepartments();
    }
  }, [organization?.id]);

  const fetchTeam = async () => {
    setLoadingTeam(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`*, departments(name)`)
        .eq("organization_id", organization!.id);
      if (error) throw error;
      setTeam(data || []);
    } catch (err) {
      console.error("Erro ao carregar equipe:", err);
    } finally {
      setLoadingTeam(false);
    }
  };

  const fetchDepartments = async () => {
    const { data } = await supabase
      .from("departments")
      .select("id, name")
      .eq("organization_id", organization!.id);
    setDepartments(data || []);
  };

  const filteredTeam = (team || []).filter(m => {
    const name = (m.full_name || "Sem nome").toLowerCase();
    const id = (m.id || "").toLowerCase();
    const query = teamSearchQuery.toLowerCase();
    return name.includes(query) || id.includes(query);
  });

  const updateMember = async (memberId: string, updates: any) => {
    try {
      const { error } = await supabase.from("profiles").update(updates).eq("id", memberId);
      if (error) throw error;
      toast.success("Membro atualizado");
      fetchTeam();
    } catch (err) {
      toast.error("Erro ao atualizar membro");
    }
  };

  const handleSaveOrg = async () => {
    if (!organization?.id) return;
    setIsSavingOrg(true);
    try {
      const { error } = await (supabase.from("organizations") as any).update(orgForm).eq("id", organization.id);
      if (error) throw error;
      toast.success("Dados da igreja atualizados");
    } catch (err) {
      toast.error("Erro ao atualizar igreja");
    } finally {
      setIsSavingOrg(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSavingUser(true);
    try {
      const { error } = await (supabase.from("profiles") as any).update(profileForm).eq("id", user.id);
      if (error) throw error;
      toast.success("Perfil atualizado");
    } catch (err) {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await (supabase.storage
        .from('avatars') as any)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = (supabase.storage
        .from('avatars') as any)
        .getPublicUrl(filePath);

      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success("Foto de perfil atualizada!");
      window.location.reload(); // Quick way to refresh context data
    } catch (error: any) {
      toast.error("Erro ao enviar foto: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!organization || !profile) return <div className="p-8 text-center text-muted-foreground font-mono">Carregando configurações...</div>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground text-[13px] mt-1">Gerencie seu perfil, dados da igreja e preferências do sistema</p>
        </div>

        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="bg-secondary/50 p-1 mb-6 h-10 border border-border/50 justify-start inline-flex overflow-x-auto max-w-full no-scrollbar">
            <TabsTrigger value="perfil" className="px-6 py-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Meu Perfil
            </TabsTrigger>
            <TabsTrigger value="igreja" className="px-6 py-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Instituição
            </TabsTrigger>
            {canManageFinances && (
              <TabsTrigger value="financeiro" className="px-6 py-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Financeiro
              </TabsTrigger>
            )}
            <TabsTrigger value="digital" className="px-6 py-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Digital
            </TabsTrigger>
            <TabsTrigger value="preferencias" className="px-6 py-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Configurações
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="equipe" className="px-6 py-2 text-xs font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Equipe
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="perfil" className="animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="max-w-2xl">
              <Card className="bg-card border-border shadow-sm overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/50 py-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-6">
                    <div
                      className="relative h-24 w-24 rounded-2xl bg-secondary flex items-center justify-center border-2 border-border overflow-hidden cursor-pointer group shadow-inner"
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                    >
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-10 w-10 text-muted-foreground" />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                      {isUploading && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    <div>
                      <h3 className="text-lg font-bold text-foreground leading-tight">{profile.full_name || "Membro"}</h3>
                      <p className="text-[12px] text-muted-foreground mt-1">{user?.email}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] h-5 px-2 font-black uppercase tracking-widest">{profile.role}</Badge>
                        <span className="text-[10px] text-muted-foreground italic">Membro desde {new Date(profile.created_at).getFullYear()}</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="opacity-50" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">Nome Completo</Label>
                      <Input
                        value={profileForm.full_name}
                        onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        className="h-10 focus-visible:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">Telefone Central</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="(11) 99999-0000"
                        className="h-10 focus-visible:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSaveProfile} disabled={isSavingUser} className="bg-primary h-11 px-8 font-bold shadow-lg shadow-primary/20">
                      {isSavingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar Dados do Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="igreja" className="animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="max-w-2xl">
              <Card className="bg-card border-border shadow-sm border-l-4 border-l-primary/40 overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/50 py-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Church className="h-4 w-4 text-primary" /> Cadastro Institucional
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="bg-secondary/20 p-4 rounded-xl border border-border/50 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1">Código de Acesso para Equipe</p>
                        <p className="font-mono text-sm font-bold text-primary">{organization.id}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px] font-bold"
                        onClick={() => {
                          navigator.clipboard.writeText(organization.id);
                          toast.success("Código copiado!");
                        }}
                      >
                        Copiar Código
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">Compartilhe este código com sua equipe para que eles possam se vincular a esta organização durante o cadastro.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">Nome da Organização</Label>
                      <Input value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">CNPJ</Label>
                      <Input value={orgForm.cnpj} onChange={e => setOrgForm({ ...orgForm, cnpj: e.target.value })} placeholder="00.000.000/0001-00" className="h-10" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-[13px] font-semibold">Endereço da Sede</Label>
                      <Input value={orgForm.address} onChange={e => setOrgForm({ ...orgForm, address: e.target.value })} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">Pastor / Responsável</Label>
                      <Input value={orgForm.pastor_name} onChange={e => setOrgForm({ ...orgForm, pastor_name: e.target.value })} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">Telefone Comercial</Label>
                      <Input value={orgForm.phone} onChange={e => setOrgForm({ ...orgForm, phone: e.target.value })} className="h-10" />
                    </div>
                  </div>
                  {canWrite && (
                    <Button onClick={handleSaveOrg} disabled={isSavingOrg} className="w-full h-11 font-bold text-base shadow-lg shadow-primary/10 text-white">
                      {isSavingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Atualizar Dados Institucionais
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financeiro" className="animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="max-w-2xl">
              <Card className="bg-card border-border shadow-sm border-l-4 border-l-chart-blue/40 overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/50 py-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-chart-blue" /> Dados de Recebimento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[12px]">Banco</Label>
                        <Input value={orgForm.bank_name} onChange={e => setOrgForm({ ...orgForm, bank_name: e.target.value })} className="h-10" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[12px]">Agência</Label>
                        <Input value={orgForm.bank_agency} onChange={e => setOrgForm({ ...orgForm, bank_agency: e.target.value })} className="h-10" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[12px]">Número da Conta</Label>
                        <Input value={orgForm.bank_account} onChange={e => setOrgForm({ ...orgForm, bank_account: e.target.value })} className="h-10" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary/20 p-6 rounded-2xl border border-border/50">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Transferência PIX</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[12px]">Tipo de Chave</Label>
                        <Select value={orgForm.pix_key_type} onValueChange={v => setOrgForm({ ...orgForm, pix_key_type: v })}>
                          <SelectTrigger className="h-10 bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CNPJ">CNPJ</SelectItem>
                            <SelectItem value="E-mail">E-mail</SelectItem>
                            <SelectItem value="Telefone">Telefone</SelectItem>
                            <SelectItem value="Aleatória">Chave Aleatória</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[12px]">Chave PIX</Label>
                        <Input value={orgForm.pix_key} onChange={e => setOrgForm({ ...orgForm, pix_key: e.target.value })} className="h-10 bg-background" />
                      </div>
                    </div>
                  </div>

                  {canWrite && (
                    <Button onClick={handleSaveOrg} disabled={isSavingOrg} className="w-full h-11 font-bold text-base bg-chart-blue hover:bg-chart-blue/90 text-white shadow-lg shadow-chart-blue/10">
                      {isSavingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar Dados Financeiros
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="digital" className="animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="max-w-2xl">
              <Card className="bg-card border-border shadow-sm border-l-4 border-l-chart-pink/40 overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/50 py-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-chart-pink" /> Presença Digital
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">Instagram</Label>
                      <Input value={orgForm.instagram} onChange={e => setOrgForm({ ...orgForm, instagram: e.target.value })} placeholder="@igreja" className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-semibold">WhatsApp Comercial</Label>
                      <Input value={orgForm.whatsapp} onChange={e => setOrgForm({ ...orgForm, whatsapp: e.target.value })} placeholder="5511999990000" className="h-10" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-[13px] font-semibold">Página do Facebook</Label>
                      <Input value={orgForm.facebook} onChange={e => setOrgForm({ ...orgForm, facebook: e.target.value })} className="h-10" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-[13px] font-semibold">Canal no Youtube</Label>
                      <Input value={orgForm.youtube} onChange={e => setOrgForm({ ...orgForm, youtube: e.target.value })} className="h-10" />
                    </div>
                  </div>
                  {canWrite && (
                    <Button onClick={handleSaveOrg} disabled={isSavingOrg} className="w-full h-11 font-bold text-base bg-chart-pink hover:bg-chart-pink/90 text-white shadow-lg shadow-chart-pink/10">
                      {isSavingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar Canais Digitais
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preferencias" className="animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="max-w-2xl">
              <Card className="bg-card border-border shadow-sm overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/50 py-4">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" /> Preferências do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-secondary/10 transition-colors">
                      <div className="space-y-0.5">
                        <p className="text-[14px] font-bold">Alertas de Lançamento</p>
                        <p className="text-[11px] text-muted-foreground">Notificar quando houver lançamentos sem comprovante anexo.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-secondary/10 transition-colors">
                      <div className="space-y-0.5">
                        <p className="text-[14px] font-bold">Lembrete de Fechamento</p>
                        <p className="text-[11px] text-muted-foreground">Lembrar o tesoureiro de realizar o fechamento mensal no dia 30.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-secondary/10 transition-colors">
                      <div className="space-y-0.5">
                        <p className="text-[14px] font-bold">Relatórios Semanais</p>
                        <p className="text-[11px] text-muted-foreground">Enviar resumo de entradas/saídas por e-mail toda segunda-feira.</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="equipe" className="animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="max-w-4xl">
              <Card className="bg-card border-border shadow-sm overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/50 py-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" /> Gestão de Equipe e Permissões
                  </CardTitle>
                  <div className="flex items-center gap-2 bg-background border border-border px-3 py-1.5 rounded-lg shadow-sm">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mr-1">Cód. Convite:</span>
                    <code className="text-xs font-mono font-bold text-primary">{organization?.id}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => {
                        if (organization?.id) {
                          navigator.clipboard.writeText(organization.id);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                          toast.success("Código copiado!");
                        }
                      }}
                    >
                      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4 bg-secondary/5 border-b border-border/50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou ID..."
                        className="pl-9 h-10 text-xs bg-background border-border/50"
                        value={teamSearchQuery}
                        onChange={(e) => setTeamSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-secondary/5 text-muted-foreground font-black uppercase tracking-widest border-b border-border/50">
                        <tr>
                          <th className="px-6 py-4">Usuário</th>
                          <th className="px-6 py-4">Papel (Role)</th>
                          <th className="px-6 py-4">Departamento (Líder)</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {loadingTeam ? (
                          [1, 2, 3].map(i => (
                            <tr key={i}><td colSpan={4} className="px-6 py-4"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></td></tr>
                          ))
                        ) : filteredTeam.map((m) => (
                          <tr key={m.id} className="hover:bg-secondary/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                                  {m.avatar_url ? <img src={m.avatar_url} className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-muted-foreground" />}
                                </div>
                                <div>
                                  <p className="font-bold text-foreground capitalize">{m.full_name || 'Sem nome'}</p>
                                  <p className="text-[10px] text-muted-foreground">{m.id === user?.id ? '(Você)' : ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Select
                                value={m.role || "viewer"}
                                onValueChange={(role) => updateMember(m.id, { role })}
                                disabled={m.id === user?.id}
                              >
                                <SelectTrigger className="h-8 text-xs w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="treasurer">Tesoureiro</SelectItem>
                                  <SelectItem value="secretary">Secretário</SelectItem>
                                  <SelectItem value="leader">Líder Dept.</SelectItem>
                                  <SelectItem value="viewer">Visualizador</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-6 py-4">
                              {m.role === 'leader' ? (
                                <Select
                                  value={m.department_id || "none"}
                                  onValueChange={(val) => updateMember(m.id, { department_id: val === "none" ? null : val })}
                                >
                                  <SelectTrigger className="h-8 text-xs w-40">
                                    <SelectValue placeholder="Selecione Dept." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    {departments.map((d) => (
                                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className="text-muted-foreground italic text-[10px]">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Badge variant="outline" className={`text-[9px] font-bold uppercase tracking-tighter ${m.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                {m.role}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
