import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, MapPin, Pencil, Trash2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import type { Database } from "@/types/database.types";

type Congregation = Database["public"]["Tables"]["congregations"]["Row"];

const emptyForm = { name: "", address: "", leader_name: "", member_count: "" };

export default function Congregacoes() {
  const { organization } = useChurch();
  const [items, setItems] = useState<Congregation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (organization?.id) fetchCongregations();
  }, [organization?.id]);

  const fetchCongregations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("congregations")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("name");
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      toast.error("Erro ao carregar congregações");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Congregation) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      address: c.address || "",
      leader_name: c.leader_name || "",
      member_count: String(c.member_count || 0)
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !organization?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        leader_name: form.leader_name,
        member_count: parseInt(form.member_count) || 0,
        organization_id: organization.id,
      };

      if (editingId) {
        const { error } = await supabase.from("congregations").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Congregação atualizada");
      } else {
        const { error } = await supabase.from("congregations").insert([payload]);
        if (error) throw error;
        toast.success("Congregação criada");
      }
      setDialogOpen(false);
      fetchCongregations();
    } catch (err) {
      toast.error("Erro ao salvar congregação");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover esta congregação?")) return;
    try {
      const { error } = await supabase.from("congregations").delete().eq("id", id);
      if (error) throw error;
      toast.success("Congregação removida");
      setItems(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      toast.error("Erro ao remover congregação");
    }
  };

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Congregações</h1>
            <p className="text-muted-foreground text-[13px] mt-1">Gestão de filiais — {organization.name}</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Nova Congregação
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{editingId ? "Editar Congregação" : "Nova Congregação"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label className="text-[13px]">Nome *</Label><Input placeholder="Nome da congregação" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[13px]">Endereço</Label><Input placeholder="Endereço completo" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-[13px]">Líder responsável</Label><Input placeholder="Nome do líder" value={form.leader_name} onChange={(e) => setForm({ ...form, leader_name: e.target.value })} /></div>
                <div className="space-y-2"><Label className="text-[13px]">Membros</Label><Input type="number" placeholder="0" value={form.member_count} onChange={(e) => setForm({ ...form, member_count: e.target.value })} /></div>
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
            {items.map((c) => (
              <Card key={c.id} className="bg-card border-border">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <h3 className="text-[15px] font-semibold text-foreground">{c.name}</h3>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" />{c.address}</div>
                  <div className="mt-4 flex justify-between text-[12px]">
                    <span className="text-muted-foreground">Líder: <span className="text-foreground font-medium">{c.leader_name || "Não informado"}</span></span>
                    <span className="font-mono tabular-nums text-foreground bg-secondary/50 px-2 rounded-md">{(c.member_count || 0)} membros</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {items.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                Nenhuma congregação registrada
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
