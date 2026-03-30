import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Church, Shield, Bell, Share2, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useChurch } from "@/contexts/ChurchContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Settings() {
  const { organization, profile, user } = useChurch();
  const [isSavingOrg, setIsSavingOrg] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);

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

  const handleSaveOrg = async () => {
    if (!organization?.id) return;
    setIsSavingOrg(true);
    try {
      const { error } = await supabase.from("organizations").update(orgForm).eq("id", organization.id);
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
      const { error } = await supabase.from("profiles").update(profileForm).eq("id", user.id);
      if (error) throw error;
      toast.success("Perfil atualizado");
    } catch (err) {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsSavingUser(false);
    }
  };

  if (!organization || !profile) return <div className="p-8 text-center text-muted-foreground font-mono">Carregando configurações...</div>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6 max-w-3xl">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Configurações</h1>
          <p className="text-muted-foreground text-[13px] mt-1">Gerencie seu perfil e dados institucionais</p>
        </div>

        {/* Profile */}
        <Card className="bg-card border-border border-l-4 border-l-primary/40">
          <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><User className="h-4 w-4" />Perfil do Usuário</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center border-2 border-border">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-foreground">{profile.full_name || "Membro"}</p>
                <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                <Badge className="mt-1.5 bg-primary/15 text-primary border-0 text-[9px] uppercase tracking-wider">{profile.role}</Badge>
              </div>
            </div>
            <Separator className="opacity-50" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[12px]">Nome Completo</Label><Input value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[12px]">Telefone</Label><Input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="(11) 99999-0000" /></div>
            </div>
            <Button onClick={handleSaveProfile} disabled={isSavingUser} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 text-xs">
              {isSavingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Alterações
            </Button>
          </CardContent>
        </Card>

        {/* Church Info */}
        <Card className="bg-card border-border border-l-4 border-l-chart-blue/40">
          <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Church className="h-4 w-4" />Dados da Instituição</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[12px]">Nome da Igreja</Label><Input value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[12px]">CNPJ</Label><Input value={orgForm.cnpj} onChange={e => setOrgForm({ ...orgForm, cnpj: e.target.value })} placeholder="00.000.000/0001-00" /></div>
            </div>
            <div className="space-y-2"><Label className="text-[12px]">Endereço Completo</Label><Input value={orgForm.address} onChange={e => setOrgForm({ ...orgForm, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[12px]">Pastor / Líder</Label><Input value={orgForm.pastor_name} onChange={e => setOrgForm({ ...orgForm, pastor_name: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[12px]">Telefone Comercial</Label><Input value={orgForm.phone} onChange={e => setOrgForm({ ...orgForm, phone: e.target.value })} /></div>
            </div>

            <Separator className="my-4 opacity-50" />
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Shield className="h-3 w-3" /> Dados Financeiros & PIX
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label className="text-[12px]">Banco</Label><Input value={orgForm.bank_name} onChange={e => setOrgForm({ ...orgForm, bank_name: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[12px]">Agência</Label><Input value={orgForm.bank_agency} onChange={e => setOrgForm({ ...orgForm, bank_agency: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[12px]">Conta</Label><Input value={orgForm.bank_account} onChange={e => setOrgForm({ ...orgForm, bank_account: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[12px]">Chave PIX (Tipo)</Label>
                <Select value={orgForm.pix_key_type} onValueChange={v => setOrgForm({ ...orgForm, pix_key_type: v })}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CNPJ">CNPJ</SelectItem>
                    <SelectItem value="E-mail">E-mail</SelectItem>
                    <SelectItem value="Telefone">Telefone</SelectItem>
                    <SelectItem value="Aleatória">Chave Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-[12px]">Valor da Chave</Label><Input value={orgForm.pix_key} onChange={e => setOrgForm({ ...orgForm, pix_key: e.target.value })} /></div>
            </div>

            <Separator className="my-4 opacity-50" />
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Share2 className="h-3 w-3" /> Presença Digital
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[12px]">Instagram</Label><Input value={orgForm.instagram} onChange={e => setOrgForm({ ...orgForm, instagram: e.target.value })} placeholder="@igreja" /></div>
              <div className="space-y-2"><Label className="text-[12px]">WhatsApp</Label><Input value={orgForm.whatsapp} onChange={e => setOrgForm({ ...orgForm, whatsapp: e.target.value })} placeholder="5511999990000" /></div>
            </div>

            <Button onClick={handleSaveOrg} disabled={isSavingOrg} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 text-xs w-full">
              {isSavingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Atualizar Dados da Igreja
            </Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="bg-card border-border">
          <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><Bell className="h-4 w-4" />Preferências do Sistema</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-[13px] font-medium">Lançamentos sem comprovante</p><p className="text-[10px] text-muted-foreground">Alertar quando houver pendências</p></div>
              <Switch defaultChecked />
            </div>
            <Separator className="opacity-50" />
            <div className="flex items-center justify-between">
              <div><p className="text-[13px] font-medium">Fechamento Mensal</p><p className="text-[10px] text-muted-foreground">Lembrar de fechar o caixa no dia 30</p></div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
