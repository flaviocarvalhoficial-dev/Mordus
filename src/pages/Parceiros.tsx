import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, User, Pencil, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import type { Database } from "@/types/database.types";

type Partner = Database["public"]["Tables"]["partners"]["Row"];

const emptyForm = { name: "", field: "", status: "Ativo", support: "" };

export default function Parceiros() {
  const { organization } = useChurch();
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (organization?.id) fetchPartners();
  }, [organization?.id]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("name");
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      toast.error("Erro ao carregar parceiros");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: Partner) => { setEditingId(p.id); setForm({ name: p.name, field: p.field || "", status: p.status || "Ativo", support: p.support || "" }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !organization?.id) return;
    setIsSaving(true);
    try {
      const payload = { ...form, organization_id: organization.id };
      if (editingId) {
        const { error } = await supabase.from("partners").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("partners").insert([payload]);
        if (error) throw error;
      }
      setDialogOpen(false);
      fetchPartners();
      toast.success(editingId ? "Parceiro atualizado" : "Parceiro adicionado");
    } catch (err) {
      toast.error("Erro ao salvar parceiro");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este parceiro?")) return;
    try {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
      toast.success("Parceiro removido");
      setItems(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error("Erro ao remover parceiro");
    }
  };

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Parceiros Missionários</h1>
            <p className="text-muted-foreground text-[13px] mt-1">Gestão de parcerias e missões — {organization.name}</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Novo Parceiro
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{editingId ? "Editar Parceiro" : "Novo Parceiro"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label className="text-[13px]">Nome *</Label><Input placeholder="Ex: Missionário João" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-[13px]">Campo / Localidade</Label><Input placeholder="Ex: Sertão, África" value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} /></div>
                <div className="space-y-2"><Label className="text-[13px]">Apoio Mensal</Label><Input placeholder="Ex: R$ 500,00" value={form.support} onChange={(e) => setForm({ ...form, support: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Atualizar Parceiro" : "Salvar Parceiro"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <Card key={p.id} className="bg-card border-border hover:bg-secondary/20 transition-all border-l-4 border-l-primary/40">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">{p.name}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-tight">
                          <Globe className="h-3 w-3" /> {p.field || "Campo não informado"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-primary transition-all"><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-destructive transition-all"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Badge variant="secondary" className={p.status === "Ativo" ? "bg-success/15 text-success border-0 text-[10px]" : "bg-muted text-muted-foreground border-0 text-[10px]"}>{p.status}</Badge>
                    <span className="text-[13px] font-bold font-mono tabular-nums text-foreground bg-secondary/30 px-2 rounded-md">{p.support || "Sob demanda"}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {items.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                Nenhum parceiro missionário registrado
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
