import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";
import { User, Church, Shield, Bell, Share2, Loader2, Camera, Copy, Check, Search, History, Eye, ArrowRight, Settings as SettingsIcon, ShieldCheck, Landmark, FileText, LayoutDashboard, ChevronRight, Home, Trash2, AlertCircle, Save, Pencil, UserCog } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useChurch } from "@/contexts/ChurchContext";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { GoogleDriveConnector } from "@/components/GoogleDriveConnector";
import { HardDrive } from "lucide-react";
import type { Database } from "@/types/database.types";

type AuditLogWithProfile = Database["public"]["Tables"]["audit_logs"]["Row"] & {
  profiles: { full_name: string | null } | null;
};

type TeamMemberWithDepartment = Database["public"]["Tables"]["profiles"]["Row"] & {
  departments: { name: string } | null;
};

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "perfil";

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const { organization, profile, user, canManageFinances, isAdmin, canWrite, refreshOrganization } = useChurch();
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [team, setTeam] = useState<TeamMemberWithDepartment[]>([]);
  const [departments, setDepartments] = useState<Database["public"]["Tables"]["departments"]["Row"][]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogWithProfile[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogWithProfile | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmCode, setResetConfirmCode] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const PAGE_SIZE = 50;

  // Form states for Organization
  const [orgForm, setOrgForm] = useState({
    name: "", cnpj: "", address: "", pastor_name: "", phone: "",
    bank_name: "", bank_agency: "", bank_account: "",
    pix_key_type: "", pix_key: "",
    instagram: "", facebook: "", youtube: "", whatsapp: "",
    closure_mode: "continuous",
    reminder_days: 3
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
        whatsapp: (organization as any).whatsapp || "",
        closure_mode: (organization as any).closure_mode || "continuous",
        reminder_days: (organization as any).reminder_days ?? 3
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
      if (isAdmin && activeTab === 'auditoria') fetchAuditLogs();
    }
  }, [organization?.id, isAdmin, activeTab]);

  const fetchAuditLogs = useCallback(async (isLoadMore = false) => {
    if (!organization?.id || !isAdmin) return;
    setLoadingLogs(true);
    try {
      const from = isLoadMore ? auditLogs.length : 0;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          *,
          profiles (full_name)
        `)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (isLoadMore) {
        setAuditLogs(prev => [...prev, ...(data as AuditLogWithProfile[] || [])]);
      } else {
        setAuditLogs(data as AuditLogWithProfile[] || []);
      }

      setHasMoreLogs(data?.length === PAGE_SIZE);
    } catch (err) {
      console.error("Erro ao carregar logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  }, [organization?.id, isAdmin, auditLogs.length]);

  const fetchTeam = useCallback(async () => {
    if (!organization?.id) return;
    setLoadingTeam(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`*, departments(name)`)
        .eq("organization_id", organization.id);
      if (error) throw error;
      setTeam(data as TeamMemberWithDepartment[] || []);
    } catch (err) {
      console.error("Erro ao carregar equipe:", err);
    } finally {
      setLoadingTeam(false);
    }
  }, [organization?.id]);

  const fetchDepartments = useCallback(async () => {
    if (!organization?.id) return;
    const { data } = await supabase
      .from("departments")
      .select("*")
      .eq("organization_id", organization.id);
    setDepartments(data || []);
  }, [organization?.id]);

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
      const { error } = await supabase.from("organizations").update(orgForm).eq("id", organization.id);
      if (error) {
        toast.error("Erro técnico: " + error.message);
        throw error;
      }
      await refreshOrganization();
      toast.success("Dados da igreja atualizados");
    } catch (err: any) {
      console.error("Erro ao atualizar igreja:", err);
      if (!err.message) toast.error("Erro ao atualizar igreja");
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

  const handleResetData = async () => {
    if (resetConfirmCode !== "ZERAR TUDO") {
      toast.error("Por favor, digite o código de confirmação corretamente.");
      return;
    }

    setIsResetting(true);
    try {
      const orgId = organization?.id;
      if (!orgId) return;

      // DELETE em cascata (manual por segurança RLS)
      const tables = [
        "transactions",
        "installments",
        "installment_purchases",
        "monthly_closures",
        "audit_logs",
        "events",
        "members",
        "departments",
        "leaders",
        "categories"
      ];

      for (const table of tables) {
        await (supabase.from(table as any) as any).delete().eq("organization_id", orgId);
      }

      // Deletar outros usuários vinculados (profiles), exceto o atual
      await supabase.from("profiles").delete().eq("organization_id", orgId).neq("id", user?.id);

      toast.success("Sistema resetado com sucesso!");
      setIsResetModalOpen(false);
      window.location.href = "/";
    } catch (error: any) {
      console.error("Erro no reset:", error);
      toast.error("Erro ao zerar dados: " + error.message);
    } finally {
      setIsResetting(false);
    }
  };

  if (!organization || !profile) return <div className="p-8 text-center text-muted-foreground font-mono">Carregando configurações...</div>;

  return (
    <>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-border/40">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Centro de Configurações</h1>
              <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest mt-1">Gestão da Organização e Preferências</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center gap-4 mb-8 bg-secondary/5 p-1 rounded-2xl border border-border/40 w-fit">
            <button
              onClick={() => setActiveTab("perfil")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                activeTab === "perfil" ? "bg-card text-primary shadow-sm ring-1 ring-border/50" : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              Meu Perfil
            </button>
            <button
              onClick={() => setActiveTab("igreja")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                activeTab === "igreja" ? "bg-card text-primary shadow-sm ring-1 ring-border/50" : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              Organização
            </button>
            <button
              onClick={() => setActiveTab("equipe")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                activeTab === "equipe" ? "bg-card text-primary shadow-sm ring-1 ring-border/50" : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              Equipe & Acessos
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("auditoria")}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                  activeTab === "auditoria" ? "bg-card text-primary shadow-sm ring-1 ring-border/50" : "text-muted-foreground/60 hover:text-foreground"
                )}
              >
                Auditoria
              </button>
            )}
          </div>

          <TabsContent value="perfil" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="max-w-3xl space-y-6">
              <Card className="stat-card border-none overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/40 py-5 px-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        Informações do Perfil
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-60">Seus dados pessoais no sistema</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <div
                      className="relative h-32 w-32 rounded-full bg-secondary/50 flex items-center justify-center border-2 border-border/40 overflow-hidden cursor-pointer group shadow-inner transition-all hover:scale-105 active:scale-95 ring-4 ring-transparent hover:ring-primary/10"
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                    >
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-12 w-12 text-muted-foreground/40" />
                      )}
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white mb-2" />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest px-2 py-1 bg-white/10 rounded-full">Trocar Foto</span>
                      </div>
                      {isUploading && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                    <div className="text-center md:text-left">
                      <h3 className="text-2xl font-bold text-foreground tracking-tight">{profile.full_name || "Membro"}</h3>
                      <p className="text-[13px] text-muted-foreground mt-1 font-medium">{user?.email}</p>
                      <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] h-6 px-3 font-black uppercase tracking-widest rounded-lg">{profile.role}</Badge>
                        <div className="h-4 w-[1px] bg-border/40" />
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-60">ID #{(profile.id || "").slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Nome Completo</Label>
                      <Input
                        value={profileForm.full_name}
                        onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        className="h-12 border-border/40 bg-background/50 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Telefone de Contato</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="h-12 border-border/40 bg-background/50 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveProfile} disabled={isSavingUser} className="premium-button bg-primary text-primary-foreground h-12 px-10 text-xs font-bold gap-2">
                      {isSavingUser ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                      Atualizar Meu Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="igreja" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="max-w-3xl space-y-6">
              <Card className="stat-card border-none overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/40 py-5 px-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        Cadastro Institucional
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-60">Dados oficiais da sua organização</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="bg-secondary/20 p-6 rounded-2xl border border-border/50">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="text-center md:text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">Código de Acesso para Equipe</p>
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                          <p className="font-mono text-lg font-bold text-primary tracking-tight">{organization.id}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 text-primary"
                            onClick={() => {
                              navigator.clipboard.writeText(organization.id);
                              toast.success("Código copiado!");
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="max-w-xs text-[10px] text-muted-foreground font-medium italic text-center md:text-right">Compartilhe este código para vincular novos perfis a esta organização.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Nome da Organização</Label>
                      <Input value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} className="h-12 border-border/40 bg-background/50 rounded-xl font-medium" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">CNPJ</Label>
                      <Input value={orgForm.cnpj} onChange={e => setOrgForm({ ...orgForm, cnpj: e.target.value })} placeholder="00.000.000/0001-00" className="h-12 border-border/40 bg-background/50 rounded-xl font-medium" />
                    </div>
                    <div className="md:col-span-2 space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Endereço Completo</Label>
                      <Input value={orgForm.address} onChange={e => setOrgForm({ ...orgForm, address: e.target.value })} className="h-12 border-border/40 bg-background/50 rounded-xl font-medium" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Pastor / Responsável Utama</Label>
                      <Input value={orgForm.pastor_name} onChange={e => setOrgForm({ ...orgForm, pastor_name: e.target.value })} className="h-12 border-border/40 bg-background/50 rounded-xl font-medium" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Telefone Comercial</Label>
                      <Input value={orgForm.phone} onChange={e => setOrgForm({ ...orgForm, phone: e.target.value })} placeholder="(00) 0000-0000" className="h-12 border-border/40 bg-background/50 rounded-xl font-medium" />
                    </div>
                  </div>

                  {canWrite && (
                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveOrg} disabled={isSavingOrg} className="premium-button bg-primary text-primary-foreground h-12 px-10 text-xs font-bold gap-2">
                        {isSavingOrg ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Salvar Dados Institucionais
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financeiro Section (Integrated into Organization for flow) */}
              <Card className="stat-card border-none overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/40 py-5 px-8">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-emerald-600">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Dados Bancários & PIX
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-60">Informações para recebimentos e depósitos</p>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Banco</Label>
                      <Input value={orgForm.bank_name} onChange={e => setOrgForm({ ...orgForm, bank_name: e.target.value })} className="h-12 border-border/40 bg-background/50 rounded-xl font-medium" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Agência</Label>
                      <Input value={orgForm.bank_agency} onChange={e => setOrgForm({ ...orgForm, bank_agency: e.target.value })} className="h-12 border-border/40 bg-background/50 rounded-xl font-medium" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Conta Corrente</Label>
                      <Input value={orgForm.bank_account} onChange={e => setOrgForm({ ...orgForm, bank_account: e.target.value })} className="h-12 border-border/40 bg-background/50 rounded-xl font-medium" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-secondary/10 p-6 rounded-2xl border border-border/40">
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Tipo de Chave PIX</Label>
                      <Select value={orgForm.pix_key_type} onValueChange={v => setOrgForm({ ...orgForm, pix_key_type: v })}>
                        <SelectTrigger className="h-12 border-border/40 bg-background rounded-xl font-medium tracking-tight">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40">
                          <SelectItem value="CNPJ">CNPJ</SelectItem>
                          <SelectItem value="E-mail">E-mail</SelectItem>
                          <SelectItem value="Telefone">Telefone</SelectItem>
                          <SelectItem value="Aleatória">Chave Aleatória</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Chave PIX</Label>
                      <Input value={orgForm.pix_key} onChange={e => setOrgForm({ ...orgForm, pix_key: e.target.value })} className="h-12 border-border/40 bg-background rounded-xl font-medium" />
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 transition-all hover:bg-emerald-500/10 active:scale-[0.99] cursor-pointer" onClick={() => setOrgForm({ ...orgForm, closure_mode: orgForm.closure_mode === 'flexible' ? 'continuous' : 'flexible' })}>
                    <div className="flex items-center justify-between gap-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-2.5 w-2.5 rounded-full", orgForm.closure_mode === 'flexible' ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                          <p className="text-sm font-black uppercase tracking-widest text-emerald-950">Modo de Fechamento Flexível</p>
                        </div>
                        <p className="text-[11px] text-emerald-700/60 leading-relaxed font-medium">
                          Permite fechar qualquer mês sem ordem cronológica. Recomendado apenas para ajustes retroativos ou igrejas começando agora.
                        </p>
                      </div>
                      <Switch
                        checked={orgForm.closure_mode === 'flexible'}
                        onCheckedChange={(checked) => setOrgForm({ ...orgForm, closure_mode: checked ? 'flexible' : 'continuous' })}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Alertas e Notificações</h4>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 bg-secondary/10 p-4 rounded-2xl border border-border/50">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Antecedência de Contas (dias)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="30"
                          value={orgForm.reminder_days}
                          onChange={(e) => setOrgForm({ ...orgForm, reminder_days: parseInt(e.target.value) || 0 })}
                          className="h-11 bg-background border-border/60 focus-visible:ring-primary/20 rounded-xl font-bold"
                          placeholder="Ex: 3"
                        />
                        <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed">Define quantos dias antes do vencimento uma conta aparecerá nos alertas da barra lateral.</p>
                      </div>
                    </div>
                  </div>

                  {canWrite && (
                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveOrg} disabled={isSavingOrg} className="premium-button bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-10 text-xs font-bold gap-2">
                        {isSavingOrg ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Salvar Informações Financeiras
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Digital Presence (Integrated) */}
              <Card className="stat-card border-none overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/40 py-5 px-8">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-orange-600">
                      <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                      Presença Digital
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-60">Redes sociais e canais oficiais</p>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Instagram</Label>
                      <Input value={orgForm.instagram} onChange={e => setOrgForm({ ...orgForm, instagram: e.target.value })} placeholder="@mordusapp" className="h-12 border-border/40 bg-background/50 rounded-xl" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">WhatsApp da Organização</Label>
                      <Input value={orgForm.whatsapp} onChange={e => setOrgForm({ ...orgForm, whatsapp: e.target.value })} placeholder="5500000000000" className="h-12 border-border/40 bg-background/50 rounded-xl" />
                    </div>
                    <div className="md:col-span-2 space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Página do Facebook (URL)</Label>
                      <Input value={orgForm.facebook} onChange={e => setOrgForm({ ...orgForm, facebook: e.target.value })} className="h-12 border-border/40 bg-background/50 rounded-xl" />
                    </div>
                    <div className="md:col-span-2 space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Canal no Youtube (URL)</Label>
                      <Input value={orgForm.youtube} onChange={e => setOrgForm({ ...orgForm, youtube: e.target.value })} className="h-12 border-border/40 bg-background/50 rounded-xl" />
                    </div>
                  </div>
                  {canWrite && (
                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveOrg} disabled={isSavingOrg} className="premium-button bg-orange-600 hover:bg-orange-700 text-white h-12 px-10 text-xs font-bold gap-2">
                        {isSavingOrg ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Salvar Canais Digitais
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preferencias" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="max-w-2xl space-y-6">
              <Card className="stat-card border-none overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/40 py-5 px-8">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      Interações & Alertas
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-60">Personalize como o sistema se comunica com você</p>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  {[
                    { title: "Alertas de Lançamento", desc: "Notificar quando houver lançamentos sem comprovante anexo.", checked: true },
                    { title: "Lembrete de Fechamento", desc: "Lembrar o tesoureiro de realizar o fechamento mensal no dia 30.", checked: true },
                    { title: "Relatórios Semanais", desc: "Enviar resumo de entradas/saídas por e-mail toda segunda-feira.", checked: false }
                  ].map((pref, i) => (
                    <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-border/40 hover:bg-secondary/5 transition-all group">
                      <div className="space-y-1">
                        <p className="text-sm font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">{pref.title}</p>
                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed max-w-sm">{pref.desc}</p>
                      </div>
                      <Switch defaultChecked={pref.checked} className="data-[state=checked]:bg-primary" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── FINANCEIRO ───────────────────────────────── */}
          <TabsContent value="financeiro" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="max-w-3xl space-y-6">
              <Card className="stat-card border-none overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/40 py-5 px-8">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-emerald-600">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Dados Bancários & PIX
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-60">Informações para recebimentos e depósitos</p>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Banco</Label>
                      <Input value={orgForm.bank_name} onChange={e => setOrgForm({ ...orgForm, bank_name: e.target.value })} className="h-12 border-border/40 bg-background/50 rounded-xl font-medium" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Agência</Label>
                      <Input value={orgForm.bank_agency} onChange={e => setOrgForm({ ...orgForm, bank_agency: e.target.value })} className="h-12 border-border/40 bg-background/50 rounded-xl font-medium" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Conta Corrente</Label>
                      <Input value={orgForm.bank_account} onChange={e => setOrgForm({ ...orgForm, bank_account: e.target.value })} className="h-12 border-border/40 bg-background/50 rounded-xl font-medium" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-secondary/10 p-6 rounded-2xl border border-border/40">
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Tipo de Chave PIX</Label>
                      <Select value={orgForm.pix_key_type} onValueChange={v => setOrgForm({ ...orgForm, pix_key_type: v })}>
                        <SelectTrigger className="h-12 border-border/40 bg-background rounded-xl font-medium tracking-tight">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border/40">
                          <SelectItem value="CNPJ">CNPJ</SelectItem>
                          <SelectItem value="E-mail">E-mail</SelectItem>
                          <SelectItem value="Telefone">Telefone</SelectItem>
                          <SelectItem value="Aleatória">Chave Aleatória</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Chave PIX</Label>
                      <Input value={orgForm.pix_key} onChange={e => setOrgForm({ ...orgForm, pix_key: e.target.value })} className="h-12 border-border/40 bg-background rounded-xl font-medium" />
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 transition-all hover:bg-emerald-500/10 active:scale-[0.99] cursor-pointer" onClick={() => setOrgForm({ ...orgForm, closure_mode: orgForm.closure_mode === 'flexible' ? 'continuous' : 'flexible' })}>
                    <div className="flex items-center justify-between gap-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-2.5 w-2.5 rounded-full", orgForm.closure_mode === 'flexible' ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                          <p className="text-sm font-black uppercase tracking-widest text-emerald-950">Modo de Fechamento Flexível</p>
                        </div>
                        <p className="text-[11px] text-emerald-700/60 leading-relaxed font-medium">
                          Permite fechar qualquer mês sem ordem cronológica. Recomendado apenas para ajustes retroativos.
                        </p>
                      </div>
                      <Switch
                        checked={orgForm.closure_mode === 'flexible'}
                        onCheckedChange={(checked) => setOrgForm({ ...orgForm, closure_mode: checked ? 'flexible' : 'continuous' })}
                        className="data-[state=checked]:bg-emerald-500"
                      />
                    </div>
                  </div>

                  {canWrite && (
                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveOrg} disabled={isSavingOrg} className="premium-button bg-emerald-600 hover:bg-emerald-700 text-white h-12 px-10 text-xs font-bold gap-2">
                        {isSavingOrg ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Salvar Informações Financeiras
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── ARMAZENAMENTO ──────────────────────────────── */}
          <TabsContent value="armazenamento" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="max-w-3xl space-y-6">
              <div className="pb-2">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  Armazenamento em Nuvem
                </h3>
                <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-60">Conecte o Google Drive para armazenar documentos da organização</p>
              </div>
              <GoogleDriveConnector />
            </div>
          </TabsContent>

          {/* ── DIGITAL ────────────────────────────────────── */}
          <TabsContent value="digital" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="max-w-3xl space-y-6">
              <Card className="stat-card border-none overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/40 py-5 px-8">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-orange-600">
                      <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                      Presença Digital
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-60">Redes sociais e canais oficiais</p>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Instagram</Label>
                      <Input value={orgForm.instagram} onChange={e => setOrgForm({ ...orgForm, instagram: e.target.value })} placeholder="@mordusapp" className="h-12 border-border/40 bg-background/50 rounded-xl" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">WhatsApp da Organização</Label>
                      <Input value={orgForm.whatsapp} onChange={e => setOrgForm({ ...orgForm, whatsapp: e.target.value })} placeholder="5500000000000" className="h-12 border-border/40 bg-background/50 rounded-xl" />
                    </div>
                    <div className="md:col-span-2 space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Página do Facebook (URL)</Label>
                      <Input value={orgForm.facebook} onChange={e => setOrgForm({ ...orgForm, facebook: e.target.value })} className="h-12 border-border/40 bg-background/50 rounded-xl" />
                    </div>
                    <div className="md:col-span-2 space-y-2.5">
                      <Label className="text-[11px] font-black uppercase tracking-widest opacity-60 ml-1">Canal no Youtube (URL)</Label>
                      <Input value={orgForm.youtube} onChange={e => setOrgForm({ ...orgForm, youtube: e.target.value })} className="h-12 border-border/40 bg-background/50 rounded-xl" />
                    </div>
                  </div>
                  {canWrite && (
                    <div className="flex justify-end pt-4">
                      <Button onClick={handleSaveOrg} disabled={isSavingOrg} className="premium-button bg-orange-600 hover:bg-orange-700 text-white h-12 px-10 text-xs font-bold gap-2">
                        {isSavingOrg ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        Salvar Canais Digitais
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="equipe" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="max-w-5xl space-y-6">
              <Card className="stat-card border-none overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/40 py-6 px-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        Gestão de Equipe & Acessos
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-60">Controle quem pode visualizar e editar dados</p>
                    </div>

                    <div className="flex items-center gap-4 bg-background/50 border border-border/40 p-2 pl-4 rounded-2xl shadow-sm backdrop-blur-sm">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Código da Organização</span>
                        <code className="text-sm font-mono font-black text-primary tracking-tighter">{organization?.id}</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl hover:bg-primary/10 text-primary transition-all active:scale-90"
                        onClick={() => {
                          if (organization?.id) {
                            navigator.clipboard.writeText(organization.id);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                            toast.success("Código copiado!");
                          }
                        }}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="px-8 py-6 border-b border-border/40 bg-secondary/5">
                    <div className="relative group max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        placeholder="Buscar por colaborador..."
                        className="pl-11 h-12 bg-background border-border/40 rounded-xl font-medium focus-visible:ring-primary/20"
                        value={teamSearchQuery}
                        onChange={(e) => setTeamSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-secondary/5 border-b border-border/40">
                          <th className="px-6 sm:px-8 py-5 text-left"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Colaborador</span></th>
                          <th className="px-6 sm:px-8 py-5 text-left hidden md:table-cell"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Nível de Acesso</span></th>
                          <th className="px-6 sm:px-8 py-5 text-left hidden sm:table-cell"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Atribuição</span></th>
                          <th className="px-6 sm:px-8 py-5 text-right"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Snapshot</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {loadingTeam ? (
                          [1, 2, 3].map(i => (
                            <tr key={i}><td colSpan={4} className="px-6 sm:px-8 py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/40" /></td></tr>
                          ))
                        ) : filteredTeam.map((m) => (
                          <tr key={m.id} className="hover:bg-secondary/5 transition-all group">
                            <td className="px-6 sm:px-8 py-5">
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border/40 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                                  {m.avatar_url ? <img src={m.avatar_url} className="h-full w-full object-cover" /> : <User className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/40" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-black text-xs sm:text-sm text-foreground tracking-tight truncate">{m.full_name || 'Usuário Sem Nome'}</p>
                                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5 opacity-60 truncate">{m.id === user?.id ? 'Você agora' : 'Membro da Equipe'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 sm:px-8 py-5 hidden md:table-cell">
                              <Select
                                value={m.role || "viewer"}
                                onValueChange={(role) => updateMember(m.id, { role })}
                                disabled={m.id === user?.id || !canWrite}
                              >
                                <SelectTrigger className="h-10 text-[11px] font-black uppercase tracking-widest w-40 bg-background border-border/40 rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/40">
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="treasurer">Tesoureiro</SelectItem>
                                  <SelectItem value="secretary">Secretário</SelectItem>
                                  <SelectItem value="leader">Líder Dept.</SelectItem>
                                  <SelectItem value="viewer">Visualizador</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-6 sm:px-8 py-5 hidden sm:table-cell">
                              {m.role === 'leader' ? (
                                <Select
                                  value={m.department_id || "none"}
                                  onValueChange={(val) => updateMember(m.id, { department_id: val === "none" ? null : val })}
                                  disabled={!canWrite}
                                >
                                  <SelectTrigger className="h-10 text-[11px] font-black uppercase tracking-widest w-48 bg-background border-border/40 rounded-xl">
                                    <SelectValue placeholder="Selecione Dept." />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl border-border/40">
                                    <SelectItem value="none">Nenhum vínculo</SelectItem>
                                    {departments.map((d) => (
                                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <div className="px-4 py-2 bg-secondary/10 border border-border/20 rounded-xl w-fit">
                                  <span className="text-[10px] font-bold text-muted-foreground italic">Permissão Global</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 sm:px-8 py-5 text-right">
                              <div className="flex flex-col items-end gap-2">
                                <Badge variant="outline" className={cn(
                                  "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border-primary/20",
                                  m.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground opacity-60'
                                )}>
                                  {m.role}
                                </Badge>
                                <div className="md:hidden">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10">
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
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

          <TabsContent value="auditoria" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="max-w-5xl space-y-6">
              <Card className="stat-card border-none overflow-hidden">
                <CardHeader className="bg-secondary/10 border-b border-border/40 py-6 px-8 flex flex-row items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      Trilha de Auditoria Universal
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-60">Histórico completo de alterações e acessos</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => fetchAuditLogs()} disabled={loadingLogs} className="premium-button border-primary/20 text-primary h-10 px-5 text-[10px] font-black uppercase tracking-widest">
                    {loadingLogs ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <History className="h-4 w-4 mr-2" />}
                    Recarregar Fluxo
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-secondary/5 border-b border-border/40">
                          <th className="px-6 sm:px-8 py-5 text-left"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Timestamp</span></th>
                          <th className="px-6 sm:px-8 py-5 text-left hidden sm:table-cell"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Executor</span></th>
                          <th className="px-6 sm:px-8 py-5 text-left hidden md:table-cell"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Ambiente</span></th>
                          <th className="px-6 sm:px-8 py-5 text-left"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Intervenção</span></th>
                          <th className="px-6 sm:px-8 py-5 text-right"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Análise</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {loadingLogs && auditLogs.length === 0 ? (
                          [1, 2, 3].map(i => (
                            <tr key={i}><td colSpan={5} className="px-6 sm:px-8 py-12 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary/30" /></td></tr>
                          ))
                        ) : auditLogs.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 sm:px-8 py-20 text-center text-[11px] text-muted-foreground font-bold uppercase tracking-widest opacity-40 italic">Sem registros de atividade detectados.</td></tr>
                        ) : auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-secondary/5 transition-all group">
                            <td className="px-6 sm:px-8 py-5">
                              <p className="font-mono text-[11px] text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                                {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </td>
                            <td className="px-6 sm:px-8 py-5 hidden sm:table-cell">
                              <p className="font-black text-[13px] text-foreground tracking-tight truncate max-w-[120px]">{log.profiles?.full_name?.split(' ')[0] || 'Sistema'}</p>
                            </td>
                            <td className="px-6 sm:px-8 py-5 hidden md:table-cell">
                              <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 bg-secondary/30 border-border/40 text-muted-foreground/80">
                                {log.table_name === 'transactions' ? 'Financeiro' :
                                  log.table_name === 'members' ? 'Secretaria' :
                                    log.table_name === 'documents' ? 'Arquivos' :
                                      log.table_name === 'profiles' ? 'Acessos' :
                                        log.table_name === 'organizations' ? 'Institucional' : log.table_name}
                              </Badge>
                            </td>
                            <td className="px-6 sm:px-8 py-5">
                              <div className="flex items-center gap-2">
                                {log.action === 'INSERT' && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">Inclusão</Badge>}
                                {log.action === 'UPDATE' && <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[9px] font-black uppercase tracking-widest">Refatoração</Badge>}
                                {log.action === 'DELETE' && <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-[9px] font-black uppercase tracking-widest">Exclusão</Badge>}
                              </div>
                            </td>
                            <td className="px-6 sm:px-8 py-5 text-right">
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-primary hover:bg-primary/10 rounded-xl" onClick={() => setSelectedLog(log)}>
                                <Eye className="h-5 w-5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {hasMoreLogs && (
                    <div className="p-8 border-t border-border/40 flex justify-center bg-secondary/5">
                      <Button
                        variant="outline"
                        onClick={() => fetchAuditLogs(true)}
                        disabled={loadingLogs}
                        className="premium-button border-primary/20 text-primary h-12 px-10 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/5 hover:shadow-primary/10 active:scale-95 transition-all"
                      >
                        {loadingLogs ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : <ChevronRight className="h-4 w-4 mr-3 rotate-90" />}
                        Carregar Mais Registros
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
                  <Card className="stat-card border-none w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300">
                    <CardHeader className="bg-secondary/10 border-b border-border/40 p-8 flex flex-row items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Análise de Dados Retroativos</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">Log de intervenção realizado em {new Date(selectedLog.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedLog(null)} className="h-12 w-12 rounded-2xl hover:bg-muted"><ArrowRight className="h-6 w-6 opacity-40 rotate-180" /></Button>
                    </CardHeader>
                    <CardContent className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
                      {selectedLog.action === 'UPDATE' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block opacity-20"><ArrowRight className="h-12 w-12 text-muted-foreground" /></div>
                          <div className="space-y-4">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-40 ml-1">Estado Original</h4>
                            <div className="bg-secondary/10 p-6 rounded-3xl border border-dashed border-border flex flex-col gap-4">
                              {Object.entries(selectedLog.old_data || {}).map(([key, value]: [string, any]) => {
                                if (['id', 'organization_id', 'created_at', 'category_id', 'department_id', 'event_id'].includes(key)) return null;
                                if (JSON.stringify(value) === JSON.stringify(selectedLog.new_data?.[key])) return null;
                                return (
                                  <div key={key} className="flex flex-col">
                                    <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-sm font-medium text-rose-600/60 line-through tracking-tight italic break-all">{String(value)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-600/60 ml-1">Novo Estado Aplicado</h4>
                            <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/20 flex flex-col gap-4 shadow-[0_12px_32px_-12px_rgba(16,185,129,0.1)]">
                              {Object.entries(selectedLog.new_data || {}).map(([key, value]: [string, any]) => {
                                if (['id', 'organization_id', 'created_at', 'category_id', 'department_id', 'event_id'].includes(key)) return null;
                                if (JSON.stringify(value) === JSON.stringify(selectedLog.old_data?.[key])) return null;
                                return (
                                  <div key={key} className="flex flex-col">
                                    <span className="text-[9px] font-black text-emerald-800/60 uppercase">{key.replace(/_/g, ' ')}</span>
                                    <span className="text-sm font-black text-emerald-950 tracking-tight break-all">{String(value)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-secondary/10 p-8 rounded-[2.5rem] border border-border/40 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                          {Object.entries(selectedLog.action === 'INSERT' ? selectedLog.new_data : (selectedLog.old_data || {})).map(([key, value]: [string, any]) => {
                            if (['id', 'organization_id', 'created_at', 'category_id', 'department_id', 'event_id'].includes(key)) return null;
                            return (
                              <div key={key} className="flex flex-col gap-1">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{key.replace(/_/g, ' ')}</span>
                                <span className="text-[14px] font-black text-foreground tracking-tight">
                                  {key === 'amount' ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)) : String(value)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                    <div className="p-8 bg-secondary/10 border-t border-border/40 flex justify-end">
                      <Button onClick={() => setSelectedLog(null)} className="premium-button bg-foreground text-background h-14 px-12 text-sm font-black uppercase tracking-widest shadow-2xl">Confirmar Leitura</Button>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="avancado" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="max-w-2xl space-y-6">
              <Card className="stat-card border-none overflow-hidden bg-rose-500/5 ring-1 ring-rose-500/20">
                <CardHeader className="bg-rose-500/10 border-b border-rose-500/20 py-6 px-10">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-rose-600">
                      <ShieldCheck className="h-5 w-5" />
                      Zona de Manutenção Crítica
                    </h3>
                    <p className="text-[10px] text-rose-700 font-bold mt-1 uppercase tracking-widest opacity-60">Ações irreversíveis que impactam toda a organização</p>
                  </div>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-rose-950 tracking-tight">Zerar Banco de Dados</h3>
                    <p className="text-sm text-rose-900/60 leading-relaxed font-medium">
                      Esta ação irá apagar permanentemente **todos os registros** vinculados a esta organização, incluindo lançamentos financeiros, membros, parcelamentos e trilhas de auditoria.
                    </p>
                    <div className="bg-rose-500/10 p-6 rounded-[2rem] border border-rose-500/20 shadow-inner">
                      <p className="text-[11px] font-black uppercase tracking-widest text-rose-700 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> Protocolo de Segurança Ativo
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    onClick={() => setIsResetModalOpen(true)}
                    className="w-full h-16 font-black uppercase tracking-[0.2em] text-[11px] bg-rose-600 hover:bg-rose-700 shadow-2xl shadow-rose-500/20 rounded-3xl"
                  >
                    Confirmar Destruição de Dados
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
              <DialogContent className="sm:max-w-[450px] bg-card border-none rounded-[3rem] shadow-3xl p-0 overflow-hidden ring-1 ring-border/20">
                <div className="p-10 text-center space-y-8">
                  <div className="h-20 w-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center mx-auto ring-1 ring-rose-500/20 animate-bounce">
                    <Trash2 className="h-10 w-10 text-rose-600" />
                  </div>

                  <div className="space-y-2">
                    <DialogTitle className="text-2xl font-black tracking-tighter text-foreground uppercase">Extrema Cautela</DialogTitle>
                    <p className="text-sm text-muted-foreground font-medium px-6 leading-relaxed">
                      Esta ação limpará sua organização <span className="text-foreground font-black tracking-tight">{organization?.name}</span> completamente.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Digite a frase abaixo para autorizar</p>
                    <div className="bg-secondary/20 py-4 px-6 rounded-2xl border border-border/40">
                      <span className="font-mono text-lg font-black text-rose-600 tracking-[0.3em]">ZERAR TUDO</span>
                    </div>
                    <Input
                      value={resetConfirmCode}
                      onChange={(e) => setResetConfirmCode(e.target.value)}
                      placeholder="Autenticação Humana..."
                      className="h-14 text-center font-black uppercase tracking-widest text-sm bg-background border-border/40 rounded-2xl"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="ghost"
                      className="flex-1 h-16 font-black uppercase tracking-widest text-[11px] rounded-3xl"
                      onClick={() => setIsResetModalOpen(false)}
                      disabled={isResetting}
                    >
                      Abortar
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 h-16 font-black uppercase tracking-widest text-[11px] bg-rose-600 rounded-3xl shadow-xl shadow-rose-500/20"
                      disabled={resetConfirmCode !== "ZERAR TUDO" || isResetting}
                      onClick={handleResetData}
                    >
                      {isResetting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Executar Reset"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
