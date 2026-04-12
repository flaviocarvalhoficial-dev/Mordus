import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Music, Trash2, Pencil, Loader2, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { PermissionGuard } from "@/components/PermissionGuard";
import type { Database } from "@/types/database.types";

type Department = Database["public"]["Tables"]["departments"]["Row"];

const colorOptions = [
  { value: "bg-chart-pink/15 text-chart-pink", label: "Rosa" },
  { value: "bg-chart-blue/15 text-chart-blue", label: "Azul" },
  { value: "bg-primary/15 text-primary", label: "Âmbar" },
  { value: "bg-success/15 text-success", label: "Verde" },
];

const emptyDep = { name: "", leader_name: "", member_count: "", color: colorOptions[0].value };

export default function Departamentos() {
  const { organization, profile, isAdmin, canManageSecretariat } = useChurch();
  const [items, setItems] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyDep);
  const [subGroupDialog, setSubGroupDialog] = useState<string | null>(null);
  const [newSubGroup, setNewSubGroup] = useState({ name: "", role: "" });

  useEffect(() => {
    if (organization?.id) fetchDepartments();
  }, [organization?.id]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("departments")
        .select("*")
        .eq("organization_id", organization!.id);

      if (profile?.role === 'leader' && profile.department_id) {
        query = query.eq("id", profile.department_id);
      }

      const { data, error } = await query.order("name");
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      toast.error("Erro ao carregar departamentos");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyDep); setDialogOpen(true); };
  const openEdit = (d: Department) => {
    setEditingId(d.id);
    setForm({
      name: d.name,
      leader_name: d.leader_name || "",
      member_count: String(d.member_count || 0),
      color: d.color || colorOptions[0].value
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !organization?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        leader_name: form.leader_name,
        member_count: parseInt(form.member_count) || 0,
        color: form.color,
        organization_id: organization.id,
      };

      if (editingId) {
        const { error } = await supabase.from("departments").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("departments").insert([payload]);
        if (error) throw error;
      }
      setDialogOpen(false);
      fetchDepartments();
      toast.success(editingId ? "Departamento atualizado" : "Departamento criado");
    } catch (err) {
      console.error("Error saving department:", err);
      toast.error("Erro ao salvar departamento");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este departamento?")) return;
    try {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
      toast.success("Departamento removido");
      setItems(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      toast.error("Erro ao remover departamento");
    }
  };

  const handleAddSubGroup = async (dep: Department) => {
    if (!newSubGroup.name) return;
    const currentSubGroups = Array.isArray(dep.subgroups) ? dep.subgroups : [];
    const updated = [...currentSubGroups, { id: Date.now(), name: newSubGroup.name, role: newSubGroup.role }];

    try {
      const { error } = await supabase.from("departments").update({ subgroups: updated }).eq("id", dep.id);
      if (error) throw error;
      setNewSubGroup({ name: "", role: "" });
      setSubGroupDialog(null);
      fetchDepartments();
      toast.success("Sub-grupo adicionado");
    } catch (err) { toast.error("Erro ao adicionar sub-grupo"); }
  };

  const handleDeleteSubGroup = async (dep: Department, sgId: number) => {
    const currentSubGroups = Array.isArray(dep.subgroups) ? dep.subgroups : [];
    const updated = currentSubGroups.filter((sg: any) => sg.id !== sgId);
    try {
      const { error } = await supabase.from("departments").update({ subgroups: updated }).eq("id", dep.id);
      if (error) throw error;
      fetchDepartments();
      toast.success("Sub-grupo removido");
    } catch (err) { toast.error("Erro ao remover sub-grupo"); }
  };

  if (!organization) return <div className="p-8 text-center text-muted-foreground font-mono">Carregando...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Departamentos</h2>
          <p className="text-muted-foreground text-[12px] mt-1">Gestão de ministérios — {organization.name}</p>
        </div>
        <PermissionGuard requireSecretariat>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs rounded-full px-6" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Novo departamento
          </Button>
        </PermissionGuard>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{editingId ? "Editar Departamento" : "Novo Departamento"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label className="text-[13px]">Nome *</Label><Input placeholder="Ex: Mulheres" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[13px]">Líder</Label><Input placeholder="Nome do líder" value={form.leader_name} onChange={(e) => setForm({ ...form, leader_name: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[13px]">Membros</Label><Input type="number" placeholder="0" value={form.member_count} onChange={(e) => setForm({ ...form, member_count: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Cor de Destaque</Label>
              <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{colorOptions.map((c) => <SelectItem key={c.label} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-center pt-2">
              <Button className="w-full sm:w-[140px] rounded-full" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-secondary/10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar departamentos..." className="pl-9 h-9 text-xs" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-340px)] w-full">
            <Table className="border-collapse border border-border/50">
              <TableHeader className="sticky top-0 bg-secondary/20 backdrop-blur-sm z-10 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50 pl-6">Nome</TableHead>
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Líder Principal</TableHead>
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Membros</TableHead>
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Sub-grupos</TableHead>
                  <TableHead className="w-[6%] text-[11px] font-black text-muted-foreground text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6 border-r border-border/50"><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell className="border-r border-border/50"><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell className="border-r border-border/50"><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell className="border-r border-border/50"><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {items.map((dep) => (
                      <TableRow
                        key={dep.id}
                        className="group transition-colors odd:bg-transparent even:bg-secondary/10 hover:bg-secondary/20 border-b border-border/50"
                      >
                        <TableCell className="pl-6 py-2 border-r border-border/50 text-center">
                          <Badge variant="outline" className={`${dep.color || colorOptions[0].value} border-border/50 text-[12px] font-bold h-6 px-3`}>
                            {dep.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center border-r border-border/50 py-2 font-medium text-[14px]">
                          {dep.leader_name || "NÃO INFORMADO"}
                        </TableCell>
                        <TableCell className="text-center border-r border-border/50 py-2 font-mono text-[13px] font-bold text-primary">
                          {dep.member_count || 0}
                        </TableCell>
                        <TableCell className="text-center border-r border-border/50 py-2">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {Array.isArray(dep.subgroups) && dep.subgroups.length > 0 ? (
                              dep.subgroups.map((sg: any) => (
                                <Badge key={sg.id} variant="secondary" className="text-[9px] h-4 px-1.5 bg-secondary/30 border-0 flex items-center gap-1 group/sg">
                                  {sg.name}
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSubGroup(dep, sg.id); }} className="hover:text-destructive"><X className="h-2 w-2" /></button>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">Nenhum</span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setSubGroupDialog(dep.id); }}
                              className="ml-1 h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </div>

                          <Dialog open={subGroupDialog === dep.id} onOpenChange={(v) => setSubGroupDialog(v ? dep.id : null)}>
                            <DialogContent className="bg-card border-border">
                              <DialogHeader><DialogTitle className="text-sm">Novo Sub-grupo — {dep.name}</DialogTitle></DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="space-y-2"><Label className="text-[13px]">Nome</Label><Input placeholder="Ex: Cantores" value={newSubGroup.name} onChange={(e) => setNewSubGroup({ ...newSubGroup, name: e.target.value })} /></div>
                                <div className="space-y-2">
                                  <Label className="text-[13px]">Função</Label>
                                  <Select value={newSubGroup.role} onValueChange={(v) => setNewSubGroup({ ...newSubGroup, role: v })}>
                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Cantores">Cantores</SelectItem>
                                      <SelectItem value="Músicos">Músicos</SelectItem>
                                      <SelectItem value="Mídia / Projeção">Mídia / Projeção</SelectItem>
                                      <SelectItem value="Técnico de Som">Técnico de Som</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex justify-center pt-2">
                                  <Button className="w-full sm:w-[140px] rounded-full" onClick={() => handleAddSubGroup(dep)}>Adicionar</Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
                            <button onClick={() => openEdit(dep)} className="p-1 px-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><Pencil className="h-3 w-3" /></button>
                            <button onClick={() => handleDelete(dep.id)} className="p-1 px-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && items.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic border-b border-border/50">Nenhum departamento cadastrado</TableCell></TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
