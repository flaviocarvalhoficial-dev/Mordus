import { useState, useEffect } from "react";
import { Plus, Tag, Pencil, Trash2, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import type { Database } from "@/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

const emptyForm = { name: "", type: "income" };

export default function Categories() {
  const { organization } = useChurch();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (organization?.id) fetchCategories();
  }, [organization?.id]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("name");
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Category) => { setEditingId(c.id); setForm({ name: c.name, type: (c.type as any) }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !organization?.id) return;

    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        organization_id: organization.id,
      };

      if (editingId) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Categoria atualizada");
      } else {
        const { error } = await supabase.from("categories").insert([payload]);
        if (error) throw error;
        toast.success("Categoria criada");
      }

      setDialogOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error("Erro ao salvar categoria");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta categoria?")) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Categoria removida");
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      toast.error("Erro ao remover categoria (verifique se há lançamentos vinculados)");
    }
  };

  const entradas = categories.filter((c) => c.type === "income");
  const saidas = categories.filter((c) => c.type === "expense");

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando dados da igreja...</div>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Categorias</h1>
            <p className="text-muted-foreground text-[13px] mt-1">Categorias financeiras para lançamentos — {organization.name}</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Nova Categoria
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-semibold">{editingId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Nome</Label>
                <Input placeholder="Nome da categoria" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Entrada</SelectItem>
                    <SelectItem value="expense">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Atualizar" : "Salvar"} Categoria
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-card border-border border-l-2 border-l-success">
              <CardHeader><CardTitle className="text-sm font-semibold">Entradas</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {entradas.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-success" />
                      <span className="text-[13px] font-medium text-foreground">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(cat)} className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(cat.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
                {entradas.length === 0 && <p className="text-xs text-muted-foreground p-3">Nenhuma categoria de entrada</p>}
              </CardContent>
            </Card>

            <Card className="bg-card border-border border-l-2 border-l-destructive">
              <CardHeader><CardTitle className="text-sm font-semibold">Saídas</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {saidas.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Tag className="h-4 w-4 text-destructive" />
                      <span className="text-[13px] font-medium text-foreground">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(cat)} className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(cat.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
                {saidas.length === 0 && <p className="text-xs text-muted-foreground p-3">Nenhuma categoria de saída</p>}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
