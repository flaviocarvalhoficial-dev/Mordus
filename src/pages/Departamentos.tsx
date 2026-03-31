import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Music, Trash2, Pencil, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
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
  const { organization } = useChurch();
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
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("name");
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
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Novo Departamento
        </Button>
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
            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((dep) => (
            <Card key={dep.id} className="bg-card border-border border-l-4 border-l-primary/40">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-foreground">{dep.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`${dep.color || colorOptions[0].value} border-0 text-[10px] h-4 px-2`}>{(dep.member_count || 0)} membros</Badge>
                    <button onClick={() => openEdit(dep)} className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(dep.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
                  <Users className="h-3 w-3" />Líder: <span className="text-foreground font-medium">{dep.leader_name || "Não informado"}</span>
                </div>

                {Array.isArray(dep.subgroups) && dep.subgroups.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-border pt-3">
                    {dep.subgroups.map((sg: any) => (
                      <div key={sg.id} className="flex items-center justify-between text-[11px] text-foreground pl-2 border-l-2 border-primary/40">
                        <div className="flex items-center gap-2">
                          <Music className="h-3 w-3 text-primary opacity-70" />
                          <span>{sg.name}</span>
                          <span className="text-muted-foreground text-[10px] uppercase font-mono italic">— {sg.role}</span>
                        </div>
                        <button onClick={() => handleDeleteSubGroup(dep, sg.id)} className="text-muted-foreground hover:text-destructive transition-all"><Trash2 className="h-2.5 w-2.5" /></button>
                      </div>
                    ))}
                  </div>
                )}

                <Dialog open={subGroupDialog === dep.id} onOpenChange={(v) => setSubGroupDialog(v ? dep.id : null)}>
                  <Button variant="ghost" size="sm" className="mt-4 h-7 text-[10px] w-full border border-dashed border-border hover:bg-secondary/50 group" onClick={() => setSubGroupDialog(dep.id)}>
                    <Plus className="h-3 w-3 mr-1 transition-transform group-hover:rotate-90" />Adicionar Sub-grupo
                  </Button>
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
                      <Button className="w-full" onClick={() => handleAddSubGroup(dep)}>Adicionar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
              Nenhum departamento registrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
