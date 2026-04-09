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
  const meios = categories.filter((c) => c.type === "method");

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando dados da igreja...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Categorias & Meios</h2>
          <p className="text-muted-foreground text-[12px] mt-1">Gestão de categorias financeiras e meios de pagamento — {organization.name}</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Novo Registro
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-semibold">{editingId ? "Editar Registro" : "Novo Registro"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Nome</Label>
              <Input placeholder="Ex: Oferta, Aluguel, PIX, Dinheiro..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Tipo do Registro</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entrada (Receita)</SelectItem>
                  <SelectItem value="expense">Saída (Despesa)</SelectItem>
                  <SelectItem value="method">Meio de Pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full font-bold" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Atualizar" : "Salvar"} Registro
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 max-w-6xl">
          <Card className="bg-card border-border border-l-4 border-l-success shadow-sm">
            <CardHeader className="pb-2 border-b border-border/50 bg-secondary/5"><CardTitle className="text-[11px] font-bold uppercase tracking-wider text-success">Entradas</CardTitle></CardHeader>
            <CardContent className="space-y-1 p-2">
              {entradas.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-1.5 px-2 rounded-md border border-border/50 hover:bg-secondary/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-success/60" />
                    <span className="text-[12px] font-semibold text-foreground">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)} className="p-1 px-1.5 rounded hover:bg-background text-muted-foreground hover:text-primary transition-colors"><Pencil className="h-3 w-3" /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1 px-1.5 rounded hover:bg-background text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
              {entradas.length === 0 && <p className="text-[11px] text-muted-foreground p-3 italic">Nenhuma configurada</p>}
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-l-4 border-l-destructive shadow-sm">
            <CardHeader className="pb-2 border-b border-border/50 bg-secondary/5"><CardTitle className="text-[11px] font-bold uppercase tracking-wider text-destructive">Saídas</CardTitle></CardHeader>
            <CardContent className="space-y-1 p-2">
              {saidas.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-1.5 px-2 rounded-md border border-border/50 hover:bg-secondary/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-destructive/60" />
                    <span className="text-[12px] font-semibold text-foreground">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)} className="p-1 px-1.5 rounded hover:bg-background text-muted-foreground hover:text-primary transition-colors"><Pencil className="h-3 w-3" /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1 px-1.5 rounded hover:bg-background text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
              {saidas.length === 0 && <p className="text-[11px] text-muted-foreground p-3 italic">Nenhuma configurada</p>}
            </CardContent>
          </Card>

          <Card className="bg-card border-border border-l-4 border-l-primary shadow-sm">
            <CardHeader className="pb-2 border-b border-border/50 bg-secondary/5"><CardTitle className="text-[11px] font-bold uppercase tracking-wider text-primary">Meios de Pagamento</CardTitle></CardHeader>
            <CardContent className="space-y-1 p-2">
              {meios.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between py-1.5 px-2 rounded-md border border-border/50 hover:bg-secondary/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary/60" />
                    <span className="text-[12px] font-semibold text-foreground">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(cat)} className="p-1 px-1.5 rounded hover:bg-background text-muted-foreground hover:text-primary transition-colors"><Pencil className="h-3 w-3" /></button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1 px-1.5 rounded hover:bg-background text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
              {meios.length === 0 && <p className="text-[11px] text-muted-foreground p-3 italic">Defina meios como PIX, Dinheiro, etc.</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
