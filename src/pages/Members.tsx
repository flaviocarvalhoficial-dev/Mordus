import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Plus, Search, Pencil, Trash2, Loader2, Camera, User, Users, ShieldCheck, Landmark, FileText, MapPinned, UserPlus, CalendarDays, Heart, Handshake, Home, Lock, ChevronRight, ChevronLeft, History, Type } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  PlusCircle,
  Save,
  Smartphone,
  Mail,
  MapPin,
  Baby,
  Users2,
  Building2
} from "lucide-react";
import { PermissionGuard } from "@/components/PermissionGuard";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { TableToolbar } from "@/components/TableToolbar";
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

const emptyMember: Partial<Member> & { role_in_church: string } = {
  full_name: "", phone: "", email: "", gender: "Masculino", birth_date: "", status: "active",
  mother_name: "", father_name: "", is_baptized: false, previous_church: "", address: "",
  avatar_url: "", congregation_id: null, role_in_church: "", department_id: null
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

function MemberStats({ members, loading }: { members: Member[], loading: boolean }) {
  const stats = useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.status === 'active').length;
    const baptized = members.filter(m => m.is_baptized).length;

    // Novos no mês atual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const recent = members.filter(m => {
      if (!m.created_at) return false;
      const created = new Date(m.created_at);
      return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
    }).length;

    return [
      { label: 'Total de Membros', value: total, icon: Users, color: 'text-primary' },
      { label: 'Membros Ativos', value: active, icon: ShieldCheck, color: 'text-emerald-500', total },
      { label: 'Batizados', value: baptized, icon: Landmark, color: 'text-blue-500', total },
      { label: 'Novos no Mês', value: recent, icon: UserPlus, color: 'text-orange-500' },
    ];
  }, [members]);

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 w-full mb-8">
      {stats.map((s) => (
        <Card key={s.label} className="stat-card border-none">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center bg-secondary/50 border border-border/20 transition-transform group-hover:scale-110", s.color)}>
                <s.icon className="h-6 w-6 opacity-80" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1.5">{s.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black tabular-nums tracking-tight">
                    {loading ? <Skeleton className="h-8 w-12" /> : s.value}
                  </h3>
                  {(s.label === 'Membros Ativos' || s.label === 'Batizados') && !loading && (s as any).total > 0 && (
                    <span className="text-[10px] text-muted-foreground font-bold bg-secondary/50 px-2 py-0.5 rounded-full border border-border/20">
                      {Math.round((s.value / (s as any).total) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MemberDrawer({ member, open, onOpenChange, departments, congregations }: { member: any, open: boolean, onOpenChange: (open: boolean) => void, departments: any[], congregations: any[] }) {
  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md p-0 overflow-y-auto scrollbar-hide border-l-border/50 bg-background/95 backdrop-blur-md">
        <div className="relative h-32 bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border/10">
          <div className="absolute -bottom-8 left-8">
            <div className="h-20 w-20 rounded-full bg-secondary border-4 border-background flex items-center justify-center overflow-hidden shadow-lg ring-1 ring-primary/10">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.full_name} className="h-full w-full object-cover" />
              ) : (
                <Users className="h-8 w-8 text-muted-foreground opacity-30" />
              )}
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <Badge variant="outline" className={cn(
              "font-black uppercase tracking-widest text-[10px] px-3 py-1 border-border/50",
              member.status === 'active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground"
            )}>
              {member.status === 'active' ? 'ATIVO' : 'INATIVO'}
            </Badge>
          </div>
        </div>

        <div className="px-8 pt-12 pb-8 space-y-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">{member.full_name}</h2>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {congregations.find(c => c.id === member.congregation_id)?.name || "Sede Principal"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2 text-primary opacity-70">
                <Smartphone className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">Whatsapp</span>
              </div>
              <p className="text-xs font-bold">{member.phone || "Não informado"}</p>
            </div>
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
              <div className="flex items-center gap-2 mb-2 text-primary opacity-70">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">E-mail</span>
              </div>
              <p className="hidden md:block text-xs font-bold truncate max-w-full">{member.email || "Não informado"}</p>
              <p className="md:hidden text-xs font-bold truncate max-w-full">{member.email || "Não"}</p>
            </div>
          </div>

          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border/50 pb-2">Dados Gerais</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-xs font-medium">Data de Nascimento</span>
                  </div>
                  <span className="text-xs font-bold">{member.birth_date ? new Date(member.birth_date + 'T12:00:00').toLocaleDateString('pt-BR') : "-"}</span>
                </div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Baby className="h-4 w-4" />
                    <span className="text-xs font-medium">Batizado</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] font-black", member.is_baptized ? "text-success border-success/20 bg-success/5" : "text-muted-foreground")}>
                    {member.is_baptized ? "SIM" : "NÃO"}
                  </Badge>
                </div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users2 className="h-4 w-4" />
                    <span className="text-xs font-medium">Departamento</span>
                  </div>
                  <span className="text-xs font-bold">{departments.find(d => d.id === member.department_id)?.name || "Geral"}</span>
                </div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <History className="h-4 w-4" />
                    <span className="text-xs font-medium">Procedência</span>
                  </div>
                  <span className="text-xs font-bold text-right max-w-[150px]">{member.previous_church || "Primeiro Membro"}</span>
                </div>
              </div>
            </section>

            <section className="space-y-4 pt-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border/50 pb-2">Endereço</h3>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-foreground leading-relaxed">
                  {member.address || "Endereço não cadastrado"}
                </p>
              </div>
            </section>
          </div>

          <div className="pt-8 border-t border-border/50">
            <Button
              variant="outline"
              className="w-full rounded-xl border-border/50 font-bold hover:bg-secondary transition-all"
              onClick={() => onOpenChange(false)}
            >
              Fechar Visualização
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MembersList() {


  const { organization, profile } = useChurch();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [congregationFilter, setCongregationFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sortField, setSortField] = useState("full_name");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("asc");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["name", "congregation", "baptized", "status"]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyMember);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCreatingCongregation, setIsCreatingCongregation] = useState(false);
  const [newCongregationName, setNewCongregationName] = useState("");

  const handleQuickCongregationCreate = async () => {
    if (!newCongregationName || !organization?.id) return;
    try {
      const { data, error } = await supabase
        .from("congregations")
        .insert([{
          name: newCongregationName,
          organization_id: organization.id
        }])
        .select()
        .single();

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["congregations"] });
      setForm({ ...form, congregation_id: data.id });
      setNewCongregationName("");
      setIsCreatingCongregation(false);
      toast.success("Congregação registrada e selecionada!");
    } catch (err: any) {
      toast.error("Erro ao criar congregação: " + err.message);
    }
  };

  // Members Query
  const { data: members = [], isLoading: loading } = useQuery({
    queryKey: ["members", organization?.id, profile?.role, profile?.department_id, sortField, sortOrder, statusFilter, searchQuery],
    queryFn: async () => {
      if (!organization?.id) return [];
      let query = supabase
        .from("members")
        .select("*, congregations(name)")
        .eq("organization_id", organization.id);

      if (profile?.role === 'leader' && profile.department_id) {
        query = query.eq("department_id", profile.department_id);
      }

      const { data, error } = await query.order(sortField, { ascending: sortOrder === 'asc' });
      if (error) throw error;
      return data as (Member & { congregations?: { name: string } | null })[];
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const [isCreatingDept, setIsCreatingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  const handleQuickRoleCreate = async () => {
    if (!newRoleName || !organization?.id) return;
    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([{
          name: newRoleName,
          type: "church_role",
          organization_id: organization.id,
          department_id: form.department_id // Link role to department
        }])
        .select()
        .single();

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["church-roles"] });
      setForm({ ...form, role_in_church: data.name });
      setNewRoleName("");
      setIsCreatingRole(false);
      toast.success("Cargo registrado e selecionado!");
    } catch (err: any) {
      toast.error("Erro ao criar cargo: " + err.message);
    }
  };

  const handleQuickDeptCreate = async () => {
    if (!newDeptName || !organization?.id) return;
    try {
      const { data, error } = await supabase
        .from("departments")
        .insert([{
          name: newDeptName,
          organization_id: organization.id
        }])
        .select()
        .single();

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      setForm({ ...form, department_id: data.id });
      setNewDeptName("");
      setIsCreatingDept(false);
      toast.success("Departamento criado e selecionado!");
    } catch (err: any) {
      toast.error("Erro ao criar departamento: " + err.message);
    }
  };

  // Roles Query
  const { data: churchRoles = [] } = useQuery({
    queryKey: ["church-roles", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, department_id")
        .eq("organization_id", organization.id)
        .eq("type", "church_role")
        .order("name");
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!organization?.id,
  });

  // Departments Query
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .eq("organization_id", organization.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
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
      const { congregations, created_at, updated_at, ...formData } = form as any;
      const payload: any = {
        ...formData,
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
      const matchesCongregation = congregationFilter === "all" || m.congregation_id === congregationFilter;
      return matchesSearch && matchesStatus && matchesCongregation;
    });
  }, [members, searchQuery, statusFilter, congregationFilter]);

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <MemberStats members={members} loading={loading} />
      </div>

      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestão de Membros</h2>
          <p className="section-header !mb-0 mt-1 opacity-60">Total de {filtered.length} membros filtrados</p>
        </div>
        <PermissionGuard requireWrite>
          <Button
            className="premium-button bg-primary text-primary-foreground h-11 px-8 text-xs font-bold gap-2"
            onClick={() => { setEditingId(null); setForm(emptyMember); setDialogOpen(true); setCurrentStep(1); }}
          >
            <UserPlus className="h-5 w-5" />Novo Membro
          </Button>
        </PermissionGuard>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Buscar por nome ou email..."
              className="pl-10 h-11 text-xs border-border/40 bg-background/50 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary/40 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <TableToolbar
            sortField={"full_name" as any}
            onSortFieldChange={() => { }} // TODO: Implement sort for members
            sortOrder={"asc"}
            onSortOrderChange={() => { }}
            sortOptions={[
              { field: 'full_name', label: 'Nome', icon: <Type /> },
              { field: 'created_at', label: 'Cadastro', icon: <History /> },
            ]}
            visibleColumns={visibleColumns}
            onToggleColumn={toggleColumn}
            columnOptions={[
              { id: 'full_name', label: 'Nome' },
              { id: 'contact', label: 'Contato' },
              { id: 'congregation', label: 'Congregação' },
              { id: 'age', label: 'Idade' },
              { id: 'status', label: 'Status' },
              { id: 'dept_role', label: 'Dept/Cargos' },
            ]}
            className="bg-background/80"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 bg-background/40 p-1 rounded-xl border border-border/40">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-8 text-[10px] font-bold uppercase tracking-wider border-none bg-transparent focus:ring-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3 opacity-40" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40">
                <SelectItem value="all" className="text-[11px] font-bold uppercase">Todos Status</SelectItem>
                <SelectItem value="active" className="text-[11px] font-bold uppercase text-emerald-600">Ativos</SelectItem>
                <SelectItem value="inactive" className="text-[11px] font-bold uppercase text-muted-foreground">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 bg-background/40 p-1 rounded-xl border border-border/40">
            <Select value={congregationFilter} onValueChange={setCongregationFilter}>
              <SelectTrigger className="w-52 h-8 text-[10px] font-bold uppercase tracking-wider border-none bg-transparent focus:ring-0">
                <div className="flex items-center gap-2">
                  <Landmark className="h-3 w-3 opacity-40" />
                  <SelectValue placeholder="Congregação" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40">
                <SelectItem value="all" className="text-[11px] font-bold uppercase">Todas Congregações</SelectItem>
                {congregations.map((c: any) => (
                  <SelectItem key={c.id} value={c.id} className="text-[11px] font-bold uppercase">{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
                <DialogTitle className="text-xl font-semibold tracking-tight">
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
                      <SelectTrigger className="h-10 bg-secondary/10 border-border/50 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="active">Ativo (No Rol)</SelectItem><SelectItem value="inactive">Inativo / Afastado</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[13px] font-semibold">Departamento (Setor)</Label>
                      <Popover open={isCreatingDept} onOpenChange={setIsCreatingDept}>
                        <PopoverTrigger asChild>
                          <button className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold">
                            <PlusCircle className="h-3 w-3" /> Criar novo
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 bg-card border-primary/20 shadow-xl" align="end">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-primary">Novo Departamento</p>
                            <Input
                              placeholder="Ex: Louvor, Infantil, Missões..."
                              className="h-8 text-xs"
                              value={newDeptName}
                              onChange={(e) => setNewDeptName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleQuickDeptCreate()}
                              autoFocus
                            />
                            <Button className="w-full h-8 text-[10px] font-bold gap-2" size="sm" onClick={handleQuickDeptCreate}>
                              <Save className="h-3 w-3" /> Salvar Departamento
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Select value={form.department_id || "none"} onValueChange={(v) => setForm({ ...form, department_id: v === "none" ? null : v })}>
                      <SelectTrigger className="h-10 bg-secondary/10 border-border/50 rounded-xl"><SelectValue placeholder="Selecione o departamento" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sede / Geral</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[13px] font-semibold">Cargo/Função</Label>
                      <Popover open={isCreatingRole} onOpenChange={setIsCreatingRole}>
                        <PopoverTrigger asChild>
                          <button className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold">
                            <PlusCircle className="h-3 w-3" /> Criar nova
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 bg-card border-primary/20 shadow-xl" align="end">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-primary">Novo Cargo {form.department_id ? `em ${departments.find(d => d.id === form.department_id)?.name}` : ""}</p>
                            <Input
                              placeholder="Ex: Pastor, Diácono, Músico..."
                              className="h-8 text-xs"
                              value={newRoleName}
                              onChange={(e) => setNewRoleName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleQuickRoleCreate()}
                              autoFocus
                            />
                            <Button className="w-full h-8 text-[10px] font-bold gap-2" size="sm" onClick={handleQuickRoleCreate}>
                              <Save className="h-3 w-3" /> Salvar Cargo
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Select
                      value={form.role_in_church || "none"}
                      onValueChange={(v) => setForm({ ...form, role_in_church: v === "none" ? "" : v })}
                    >
                      <SelectTrigger className="h-10 bg-secondary/10 border-border/50 rounded-xl"><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Membro Comum</SelectItem>
                        {churchRoles.filter(r => !r.department_id || r.department_id === form.department_id).map((r) => (
                          <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
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
                    <div className="flex items-center justify-between">
                      <Label className="text-[13px] font-semibold">Congregação</Label>
                      <Popover open={isCreatingCongregation} onOpenChange={setIsCreatingCongregation}>
                        <PopoverTrigger asChild>
                          <button className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold">
                            <PlusCircle className="h-3 w-3" /> Criar nova
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 bg-card border-primary/20 shadow-xl" align="end">
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase text-primary">Nova Congregação</p>
                            <Input
                              placeholder="Nome da congregação..."
                              className="h-8 text-xs"
                              value={newCongregationName}
                              onChange={(e) => setNewCongregationName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleQuickCongregationCreate()}
                              autoFocus
                            />
                            <Button
                              className="w-full h-8 text-[10px] font-bold gap-2"
                              size="sm"
                              onClick={handleQuickCongregationCreate}
                            >
                              <Save className="h-3 w-3" /> Salvar Congregação
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Select
                      value={form.congregation_id || "none"}
                      onValueChange={(v) => setForm({ ...form, congregation_id: v === "none" ? null : v })}
                    >
                      <SelectTrigger className="h-10 bg-secondary/10 border-border/50 rounded-xl"><SelectValue placeholder="Selecione a congregação" /></SelectTrigger>
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
                      <Badge variant="secondary" className="text-[10px]">{form.status === 'active' ? 'ATIVO' : 'INATIVO'}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Departamento:</span>
                      <span className="font-bold">{departments.find(d => d.id === form.department_id)?.name || "Geral / Sede"}</span>
                    </div>
                    {form.role_in_church && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cargo:</span>
                        <span className="font-bold text-primary">{form.role_in_church}</span>
                      </div>
                    )}
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

      <MemberDrawer
        member={selectedMember}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        departments={departments}
        congregations={congregations}
      />

      <Card className="stat-card border-none overflow-hidden mt-6">
        <ScrollArea className="h-[calc(100vh-420px)] w-full">
          <Table>
            <TableHeader className="bg-secondary/10 border-b border-border/40 sticky top-0 z-10">
              <TableRow className="hover:bg-transparent border-0 h-14">
                {visibleColumns.includes("full_name") && <TableHead className="text-[10px] font-black uppercase tracking-widest pl-8 text-left">Membro / Perfil</TableHead>}
                {visibleColumns.includes("contact") && <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Contato</TableHead>}
                {visibleColumns.includes("congregation") && <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Congregação</TableHead>}
                {visibleColumns.includes("age") && <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Idade</TableHead>}
                {visibleColumns.includes("status") && <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>}
                {visibleColumns.includes("dept_role") && <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Dept/Cargo</TableHead>}
                <TableHead className="w-20 text-[10px] font-black uppercase tracking-widest text-right pr-8">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="h-16">
                    <TableCell className="pl-8 text-left"><Skeleton className="h-10 w-48 rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-32 mx-auto rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-32 mx-auto rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-12 mx-auto rounded-lg" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32 mx-auto rounded-full" /></TableCell>
                    <TableCell className="pr-8"><Skeleton className="h-8 w-8 ml-auto rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.map((m) => {
                const isHighlighted = searchParams.get("highlight") === m.id;
                const age = calculateAge(m.birth_date);
                return (
                  <TableRow
                    key={m.id}
                    className={cn(
                      "group transition-colors odd:bg-transparent even:bg-secondary/5 hover:bg-secondary/10 border-b border-border/40 h-20",
                      isHighlighted && "animate-highlight-orange z-10"
                    )}
                  >
                    {visibleColumns.includes("full_name") && (
                      <TableCell className="pl-8 text-left">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => { setSelectedMember(m); setIsDrawerOpen(true); }}
                            className="h-11 w-11 rounded-2xl bg-secondary/50 flex items-center justify-center overflow-hidden border border-border/40 shadow-sm ring-2 ring-transparent group-hover:ring-primary/20 transition-all shrink-0"
                          >
                            {m.avatar_url ? <img src={m.avatar_url} className="h-full w-full object-cover" /> : <User className="h-5 w-5 text-muted-foreground/40" />}
                          </button>
                          <div className="text-left">
                            <button
                              onClick={() => { setSelectedMember(m); setIsDrawerOpen(true); }}
                              className="text-[14px] font-bold block leading-tight hover:text-primary transition-colors text-left tracking-tight"
                            >
                              {m.full_name}
                            </button>
                            <p className="text-[10px] text-muted-foreground mt-1 font-medium italic">{m.email || 'Sem e-mail cadastrado'}</p>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.includes("contact") && (
                      <TableCell className="text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="text-[12px] font-bold text-foreground/80">{m.phone || "-"}</span>
                          {m.phone && <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest opacity-60">WhatsApp</span>}
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.includes("congregation") && (
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-secondary/30 border-border/40 text-muted-foreground/70">
                          {congregations.find(c => c.id === m.congregation_id)?.name || "SEDE"}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.includes("age") && (
                      <TableCell className="text-center">
                        <span className="text-[13px] font-bold text-foreground/80">{age || "-"}</span>
                        {age && <span className="text-[9px] font-bold text-muted-foreground/40 ml-1">anos</span>}
                      </TableCell>
                    )}
                    {visibleColumns.includes("status") && (
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-black uppercase px-3 py-1 rounded-full border-border/40",
                            m.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {m.status === "active" ? "ATIVO" : "INATIVO"}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.includes("dept_role") && (
                      <TableCell className="text-center">
                        <div className="flex flex-wrap items-center gap-1.5 justify-center">
                          {m.department_id && (
                            <Badge variant="outline" className="text-[9px] font-black uppercase px-2 py-0.5 border-primary/20 text-primary bg-primary/5">
                              {departments.find(d => d.id === m.department_id)?.name}
                            </Badge>
                          )}
                          {m.role_in_church && (
                            <Badge variant="outline" className="text-[9px] font-black uppercase px-2 py-0.5 border-orange-500/20 text-orange-600 bg-orange-500/5">
                              {m.role_in_church}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-right pr-8">
                      <PermissionGuard requireWrite>
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setEditingId(m.id); setForm({ ...m as any, avatar_url: m.avatar_url || "", status: m.status || "active", role_in_church: (m as any).role_in_church || "", phone: m.phone || "", email: m.email || "", gender: m.gender || "", birth_date: m.birth_date || "", mother_name: m.mother_name || "", father_name: m.father_name || "", is_baptized: !!m.is_baptized, previous_church: m.previous_church || "", address: m.address || "", congregation_id: m.congregation_id || null }); setDialogOpen(true); }}
                            className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </PermissionGuard>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-24">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground/30" />
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40">Nenhum membro encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
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
  const activeTab = searchParams.get("tab") || "membros";

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
                <h1 className="text-xl font-semibold text-foreground tracking-tight capitalize mt-0.5">
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
