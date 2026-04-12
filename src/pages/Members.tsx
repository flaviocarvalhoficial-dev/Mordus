import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Plus, Search, Pencil, Trash2, Loader2, Camera, User, Users, ShieldCheck, Landmark, FileText, MapPinned, UserPlus, CalendarDays, Heart, Handshake, Home, Lock, ChevronRight, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { PermissionGuard } from "@/components/PermissionGuard";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { parseISO, format as formatDateFns } from "date-fns";
import type { Database } from "@/types/database.types";

import Lideranca from "./Lideranca";
import Departamentos from "./Departamentos";
import Patrimonio from "./Patrimonio";
import Documentos from "./Documentos";
import Congregacoes from "./Congregacoes";
import Calendario from "./Calendario";
import ServicoSocial from "./ServicoSocial";
import Parceiros from "./Parceiros";
import Summary from "./SecretariaDashboard";

type Member = Database["public"]["Tables"]["members"]["Row"];

const emptyMember = {
  full_name: "", phone: "", email: "", gender: "Masculino", birth_date: "", status: "active",
  mother_name: "", father_name: "", is_baptized: false, previous_church: "", address: "",
  avatar_url: "", congregation_id: null as string | null
};

function calculateAge(birthDate: string) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

import { useQuery, useQueryClient } from "@tanstack/react-query";

function MembersList() {
  const { organization, profile } = useChurch();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyMember);
  const [currentStep, setCurrentStep] = useState(1);

  // Members Query
  const { data: members = [], isLoading: loading } = useQuery({
    queryKey: ["members", organization?.id, profile?.role, profile?.department_id],
    queryFn: async () => {
      if (!organization?.id) return [];
      let query = supabase
        .from("members")
        .select("*, congregations(name)")
        .eq("organization_id", organization.id);

      if (profile?.role === 'leader' && profile.department_id) {
        query = query.eq("department_id", profile.department_id);
      }

      const { data, error } = await query.order("full_name");
      if (error) throw error;
      return data as (Member & { congregations?: { name: string } | null })[];
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Congregations Query
  const { data: congregations = [] } = useQuery({
    queryKey: ["congregations", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from("congregations")
        .select("id, name")
        .eq("organization_id", organization.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setForm({ ...form, avatar_url: publicUrl });
      toast.success("Foto carregada!");
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!form.full_name) {
        toast.error("O nome completo é obrigatório");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSave = async () => {
    if (!form.full_name || !organization?.id) return;
    setIsSaving(true);
    try {
      const payload: any = {
        ...form,
        organization_id: organization.id,
        is_baptized: !!form.is_baptized
      };

      if (editingId) {
        const { error } = await supabase.from("members").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("members").insert([payload]);
        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: ["members"] });
      setDialogOpen(false);
      setCurrentStep(1);
      toast.success(editingId ? "Membro atualizado" : "Membro cadastrado");
    } catch (err: any) {
      toast.error("Erro ao salvar membro: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch = !searchQuery || m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [members, searchQuery, statusFilter]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <PermissionGuard requireWrite>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs rounded-full px-6" onClick={() => { setEditingId(null); setForm(emptyMember); setDialogOpen(true); setCurrentStep(1); }}>
            <Plus className="h-4 w-4 mr-2" />Novo Membro
          </Button>
        </PermissionGuard>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => {
        setDialogOpen(o);
        if (!o) setCurrentStep(1);
      }}>
        <DialogContent className="sm:max-w-xl bg-card border-border p-0 overflow-hidden shadow-2xl ring-1 ring-primary/10">
          <div className="bg-gradient-to-r from-primary/10 via-background to-primary/5 p-6 border-b border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {editingId ? "Editar Membro" : "Novo Membro"}
                </DialogTitle>
                <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-widest mt-0.5">
                  Passo {currentStep} de 3
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${currentStep >= s ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" : "bg-secondary"}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-24 w-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-primary/20 group shadow-md">
                    {form.avatar_url ? (
                      <img src={form.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground" />
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={uploadAvatar} disabled={uploading} />
                    </label>
                    {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Foto de Perfil</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[13px] font-semibold">Nome completo *</Label>
                    <Input value={form.full_name} placeholder="Nome do Membro" className="h-10 bg-secondary/10" onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold">Sexo</Label>
                    <Select value={form.gender || ""} onValueChange={(v) => setForm({ ...form, gender: v })}>
                      <SelectTrigger className="h-10 bg-secondary/10"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Feminino">Feminino</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[13px] font-semibold">Data de Nascimento</Label>
                      {form.birth_date && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                          {calculateAge(form.birth_date)} anos
                        </span>
                      )}
                    </div>
                    <DatePicker
                      date={form.birth_date ? new Date(form.birth_date + 'T12:00:00') : undefined}
                      onChange={(date) => setForm({
                        ...form,
                        birth_date: date ? formatDateFns(date, "yyyy-MM-dd") : ""
                      })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[13px] font-semibold">Status de Cadastro</Label>
                    <Select value={form.status || "active"} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger className="h-10 bg-secondary/10"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="active">Ativo (No Rol)</SelectItem><SelectItem value="inactive">Inativo / Afastado</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold">Email</Label>
                    <Input type="email" value={form.email || ""} placeholder="exemplo@igreja.com" className="h-10 bg-secondary/10" onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold">Telefone / WhatsApp</Label>
                    <Input value={form.phone || ""} placeholder="(00) 00000-0000" className="h-10 bg-secondary/10" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[13px] font-semibold">Endereço Residencial</Label>
                    <Input value={form.address || ""} placeholder="Rua, Número, Bairro, Cidade..." className="h-10 bg-secondary/10" onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold">Filiação: Pai</Label>
                    <Input value={form.father_name || ""} placeholder="Nome do Pai" className="h-10 bg-secondary/10" onChange={(e) => setForm({ ...form, father_name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold">Filiação: Mãe</Label>
                    <Input value={form.mother_name || ""} placeholder="Nome da Mãe" className="h-10 bg-secondary/10" onChange={(e) => setForm({ ...form, mother_name: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold">Congregação</Label>
                    <Select
                      value={form.congregation_id || "none"}
                      onValueChange={(v) => setForm({ ...form, congregation_id: v === "none" ? null : v })}
                    >
                      <SelectTrigger className="h-10 bg-secondary/10"><SelectValue placeholder="Selecione a congregação" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sede (Matriz)</SelectItem>
                        {congregations.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-semibold">Igreja de Procedência</Label>
                    <Input value={form.previous_church || ""} placeholder="Qual igreja frequentava?" className="h-10 bg-secondary/10" onChange={(e) => setForm({ ...form, previous_church: e.target.value })} />
                  </div>
                  <div className="md:col-span-2 flex items-center space-x-3 h-12 px-4 bg-primary/5 rounded-full border border-primary/20 transition-all hover:bg-primary/10">
                    <Checkbox
                      id="is_baptized"
                      checked={form.is_baptized}
                      onCheckedChange={(checked) => setForm({ ...form, is_baptized: !!checked })}
                      className="h-5 w-5"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="is_baptized" className="text-[13px] font-bold leading-none cursor-pointer">Batizado nas Águas</Label>
                      <p className="text-[10px] text-muted-foreground">Marque se o membro já passou pelo batismo bíblico.</p>
                    </div>
                  </div>
                </div>

                <Card className="bg-secondary/10 border-border/50 overflow-hidden rounded-xl mt-8">
                  <div className="bg-secondary/20 p-4 border-b border-border/50">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Resumo do cadastro</p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Membro:</span>
                      <span className="font-bold">{form.full_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="secondary" className="text-[10px]">{form.status === 'active' ? 'ATVO' : 'INATIVO'}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Congregação:</span>
                      <span className="font-bold">{congregations.find(c => c.id === form.congregation_id)?.name || "Sede"}</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          <div className="p-6 bg-secondary/10 border-t border-border/50 flex items-center gap-3">
            {currentStep > 1 && (
              <Button
                variant="outline"
                className="flex-1 h-11 font-bold group border-border/50 bg-background"
                onClick={prevStep}
                disabled={isSaving}
              >
                <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Voltar
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                className="flex-[2] h-11 font-bold group shadow-lg shadow-primary/10"
                onClick={nextStep}
              >
                Continuar
                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button
                className="flex-[2] h-11 font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all bg-gradient-to-r from-primary to-primary/80"
                onClick={handleSave}
                disabled={isSaving || uploading}
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>{editingId ? "Salvar Alterações" : "Concluir Cadastro"}</>
                )}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border shadow-sm overflow-hidden border-primary/5">
        <CardHeader className="p-4 bg-secondary/10 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou email..." className="pl-9 h-9 text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardHeader>
        <ScrollArea className="h-[calc(100vh-440px)] w-full">
          <Table className="border-collapse border border-border/50">
            <TableHeader className="sticky top-0 bg-secondary/20 backdrop-blur-sm z-10 border-b border-border">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50 pl-6">Perfil</TableHead>
                <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Congregação</TableHead>
                <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Batizado</TableHead>
                <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Status</TableHead>
                <TableHead className="w-16 text-[11px] font-black text-muted-foreground text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6 border-r border-border/50"><Skeleton className="h-10 w-full" /></TableCell>
                    <TableCell className="border-r border-border/50"><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell className="border-r border-border/50"><Skeleton className="h-4 w-[60px]" /></TableCell>
                    <TableCell className="border-r border-border/50"><Skeleton className="h-4 w-[60px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-lg" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.map((m) => {
                const isHighlighted = searchParams.get("highlight") === m.id;
                return (
                  <TableRow
                    key={m.id}
                    className={cn(
                      "group transition-colors odd:bg-transparent even:bg-secondary/10 hover:bg-secondary/20 border-b border-border/50",
                      isHighlighted && "animate-highlight-orange z-10"
                    )}
                  >
                    <TableCell className="pl-6 py-2 border-r border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border shadow-sm ring-2 ring-transparent group-hover:ring-primary/10 transition-all">
                          {m.avatar_url ? <img src={m.avatar_url} className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="text-left">
                          <p className="text-[14px] font-bold text-foreground leading-tight">{m.full_name}</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{m.email || 'Sem e-mail'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-r border-border/50 py-2">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary/40" />
                        <span className="text-[14px] font-medium text-muted-foreground">
                          {m.congregations?.name || "Sede (Matriz)"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center border-r border-border/50 py-2">
                      <Badge variant="outline" className={`text-[12px] font-medium px-2 py-0 h-6 leading-none border-border/50 ${m.is_baptized ? "text-success bg-success/5" : "text-muted-foreground bg-muted/5"}`}>
                        {m.is_baptized ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center border-r border-border/50 py-2">
                      <Badge variant="outline" className={`text-[12px] font-medium px-2 py-0 h-6 leading-none border-border/50 ${m.status === "active" ? "text-primary bg-primary/5" : "text-muted-foreground bg-muted/5"}`}>
                        {m.status === "active" ? "ATIVO" : "INATIVO"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <PermissionGuard requireWrite>
                        <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingId(m.id); setForm({ ...m, avatar_url: m.avatar_url || "", status: m.status || "active", phone: m.phone || "", email: m.email || "", gender: m.gender || "", birth_date: m.birth_date || "", mother_name: m.mother_name || "", father_name: m.father_name || "", is_baptized: !!m.is_baptized, previous_church: m.previous_church || "", address: m.address || "", congregation_id: m.congregation_id || null }); setDialogOpen(true); }} className="p-1 px-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><Pencil className="h-3 w-3" /></button>
                        </div>
                      </PermissionGuard>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic border-b border-border/50">Nenhum membro encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </div>
  );
}

export default function Members() {
  const { organization } = useChurch();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "resumo";

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  if (!organization) return <div className="p-8 text-center text-muted-foreground font-mono">Carregando...</div>;

  return (
    <>
      <PermissionGuard
        requireAccessSecretariat
        fallback={
          <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-mono tracking-tight text-foreground uppercase">Acesso Restrito</h2>
              <p className="text-muted-foreground text-sm max-w-xs mt-2">Você não tem permissão para acessar a Secretaria. Solicite acesso ao seu administrador.</p>
            </div>
          </div>
        }
      >
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-4 text-left">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col text-left items-start">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">
                  <Home className="h-2.5 w-2.5" />
                  <ChevronRight className="h-2.5 w-2.5 opacity-30" />
                  Secretaria Geral
                  <ChevronRight className="h-2.5 w-2.5 opacity-30" />
                  {organization.name}
                </div>
                <h1 className="text-xl font-black text-foreground tracking-tight capitalize mt-0.5">
                  {activeTab === 'resumo' ? 'Painel Principal' : activeTab.replace(/-/g, ' ')}
                </h1>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

            <TabsContent value="resumo" className="mt-0 focus-visible:ring-0">
              <Summary onNavigate={setActiveTab} />
            </TabsContent>
            <TabsContent value="membros" className="mt-0 focus-visible:ring-0">
              <MembersList />
            </TabsContent>
            <TabsContent value="lideranca" className="mt-0 focus-visible:ring-0">
              <Lideranca />
            </TabsContent>
            <TabsContent value="departamentos" className="mt-0 focus-visible:ring-0">
              <Departamentos />
            </TabsContent>
            <TabsContent value="patrimonio" className="mt-0 focus-visible:ring-0">
              <Patrimonio />
            </TabsContent>
            <TabsContent value="documentos" className="mt-0 focus-visible:ring-0">
              <Documentos />
            </TabsContent>
            <TabsContent value="congregacoes" className="mt-0 focus-visible:ring-0">
              <Congregacoes />
            </TabsContent>
            <TabsContent value="calendario" className="mt-0 focus-visible:ring-0">
              <Calendario />
            </TabsContent>
            <TabsContent value="social" className="mt-0 focus-visible:ring-0">
              <ServicoSocial />
            </TabsContent>
            <TabsContent value="parceiros" className="mt-0 focus-visible:ring-0">
              <Parceiros />
            </TabsContent>
          </Tabs>
        </div>
      </PermissionGuard>
    </>
  );
}
