import { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Loader2, Camera, User } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
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
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import type { Database } from "@/types/database.types";

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

export default function Members() {
  const { organization } = useChurch();
  const [members, setMembers] = useState<(Member & { congregations?: { name: string } | null })[]>([]);
  const [congregations, setCongregations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState("all");
  const [baptizedFilter, setBaptizedFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyMember);

  useEffect(() => {
    if (organization?.id) {
      fetchMembers();
      fetchCongregations();
    }
  }, [organization?.id]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("members")
        .select("*, congregations(name)")
        .eq("organization_id", organization!.id)
        .order("full_name");
      if (error) throw error;
      setMembers(data as any || []);
    } catch (err) {
      toast.error("Erro ao carregar membros");
    } finally {
      setLoading(false);
    }
  };

  const fetchCongregations = async () => {
    try {
      const { data, error } = await supabase
        .from("congregations")
        .select("id, name")
        .eq("organization_id", organization!.id)
        .order("name");
      if (error) throw error;
      setCongregations(data || []);
    } catch (err) {
      console.error("Erro ao carregar congregações:", err);
    }
  };

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

  const handleSave = async () => {
    if (!form.full_name || !organization?.id) return;
    setIsSaving(true);
    try {
      const payload: any = {
        ...form,
        organization_id: organization.id,
        // Ensure boolean fields are correctly typed
        is_baptized: !!form.is_baptized
      };

      if (editingId) {
        const { error } = await supabase.from("members").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("members").insert([payload]);
        if (error) throw error;
      }
      setDialogOpen(false);
      fetchMembers();
      toast.success(editingId ? "Membro atualizado" : "Membro cadastrado");
    } catch (err: any) {
      toast.error("Erro ao salvar membro: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = members.filter((m) => {
    if (searchQuery && !m.full_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (genderFilter !== "all" && m.gender !== genderFilter) return false;
    if (ageGroupFilter !== "all" && m.age_group !== ageGroupFilter) return false;
    if (baptizedFilter !== "all") {
      if (baptizedFilter === "sim" && !m.is_baptized) return false;
      if (baptizedFilter === "nao" && m.is_baptized) return false;
    }
    return true;
  });

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Membros</h1>
            <p className="text-muted-foreground text-[13px] mt-1">Gestão de membros — {organization?.name}</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { setEditingId(null); setForm(emptyMember); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />Novo Membro
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Editar Membro" : "Novo Membro"}</DialogTitle></DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="flex flex-col items-center gap-4 border-b border-border pb-6">
                <div className="relative h-24 w-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-border group">
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
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Foto de Perfil</p>
              </div>

              {/* Dados Pessoais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px]">Nome completo *</Label>
                  <Input value={form.full_name} placeholder="Nome do Membro" onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Email</Label>
                  <Input type="email" value={form.email || ""} placeholder="exemplo@igreja.com" onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Sexo</Label>
                  <Select value={form.gender || ""} onValueChange={(v) => setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Feminino">Feminino</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Telefone</Label>
                  <Input value={form.phone || ""} placeholder="(00) 00000-0000" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[13px]">Data de Nascimento</Label>
                    {form.birth_date && (
                      <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {calculateAge(form.birth_date)} anos
                      </span>
                    )}
                  </div>
                  <Input type="date" value={form.birth_date || ""} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Status</Label>
                  <Select value={form.status || "active"} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Congregação</Label>
                  <Select
                    value={form.congregation_id || "none"}
                    onValueChange={(v) => setForm({ ...form, congregation_id: v === "none" ? null : v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione a congregação" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sede (Matriz)</SelectItem>
                      {congregations.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* filiação */}
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px]">Nome do Pai</Label>
                  <Input value={form.father_name || ""} placeholder="Nome Completo do Pai" onChange={(e) => setForm({ ...form, father_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Nome da Mãe</Label>
                  <Input value={form.mother_name || ""} placeholder="Nome Completo da Mãe" onChange={(e) => setForm({ ...form, mother_name: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[13px]">Endereço Completo</Label>
                <Input value={form.address || ""} placeholder="Rua, Número, Bairro, Cidade..." onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              <Separator />
              {/* Eclesiástico */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-[13px]">Igreja de Procedência</Label>
                  <Input value={form.previous_church || ""} placeholder="Se veio de outra igreja, qual?" onChange={(e) => setForm({ ...form, previous_church: e.target.value })} />
                </div>
                <div className="flex items-center space-x-2 h-10 px-2">
                  <Checkbox
                    id="is_baptized"
                    checked={form.is_baptized}
                    onCheckedChange={(checked) => setForm({ ...form, is_baptized: !!checked })}
                  />
                  <Label htmlFor="is_baptized" className="text-sm font-medium leading-none cursor-pointer">Já foi batizado(a)?</Label>
                </div>
              </div>

              <Button className="w-full mt-2" onClick={handleSave} disabled={isSaving || uploading}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Atualizar Dados" : "Cadastrar Membro"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="bg-card border-border">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Congregação</TableHead>
                  <TableHead>Sexo</TableHead>
                  <TableHead>Batizado</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
                          {m.avatar_url ? <img src={m.avatar_url} className="h-full w-full object-cover" /> : <User className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-foreground">{m.full_name}</p>
                          <p className="text-[11px] text-muted-foreground">{m.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[13px] text-muted-foreground">
                        {m.congregations?.name || "Sede (Matriz)"}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{m.gender}</TableCell>
                    <TableCell><Badge variant="secondary" className={m.is_baptized ? "bg-success/15 text-success border-0" : "bg-muted text-muted-foreground border-0"}>{m.is_baptized ? "Sim" : "Não"}</Badge></TableCell>
                    <TableCell><Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status === "active" ? "Ativo" : "Inativo"}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditingId(m.id); setForm({ ...m, avatar_url: m.avatar_url || "", status: m.status || "active", phone: m.phone || "", email: m.email || "", gender: m.gender || "", birth_date: m.birth_date || "", mother_name: m.mother_name || "", father_name: m.father_name || "", is_baptized: m.is_baptized || false, previous_church: m.previous_church || "", address: m.address || "", congregation_id: m.congregation_id || null }); setDialogOpen(true); }} className="p-2 hover:bg-secondary rounded-lg transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
