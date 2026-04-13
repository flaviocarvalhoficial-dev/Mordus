import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

const emptyForm = { name: "", type: "income" };

const typeMap = {
  income: { label: "Entrada", color: "bg-emerald-500", text: "text-emerald-600", dot: "bg-emerald-500" },
  expense: { label: "Saída", color: "bg-rose-500", text: "text-rose-600", dot: "bg-rose-500" },
  method: { label: "Meio de Pagamento", color: "bg-sky-500", text: "text-sky-600", dot: "bg-sky-500" },
  occasion: { label: "Ocasião / Evento", color: "bg-amber-500", text: "text-amber-600", dot: "bg-amber-500" },
};

export default function Categories() {
  const { organization } = useChurch();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
        .neq("type", "church_role")
        .order("name");
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      toast.error("Erro ao carregar classificações");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = (type?: string) => {
    setEditingId(null);
    setForm({ ...emptyForm, type: (type as any) || "income" });
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditingId(c.id);
    setForm({ name: c.name, type: (c.type as any) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !organization?.id) {
      toast.error("Preencha o nome da classificação");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        organization_id: organization.id,
      };

      if (editingId) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Classificação atualizada");
      } else {
        const { error } = await supabase.from("categories").insert([payload]);
        if (error) throw error;
        toast.success("Classificação criada");
      }

      setDialogOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error("Erro ao salvar classificação");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta classificação?")) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Classificação removida");
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível excluir. Verifique se existem lançamentos vinculados.");
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categoriesByType = {
    income: filteredCategories.filter(c => c.type === "income"),
    expense: filteredCategories.filter(c => c.type === "expense"),
    method: filteredCategories.filter(c => c.type === "method"),
    occasion: filteredCategories.filter(c => c.type === "occasion"),
  };

  if (!organization) return null;

  return (
    <div className="animate-fade-in max-w-[1600px] mx-auto space-y-6 pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Classificações</h1>
          <p className="text-muted-foreground text-sm">Organize suas entradas, saídas e eventos em colunas.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar classificação..."
              className="pl-9 h-10 bg-background/50 border-border/50 focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => openCreate()} size="sm" className="h-10 px-4 gap-2">
            <Plus className="h-4 w-4" />
            Novo Registro
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
          <p className="text-sm text-muted-foreground">Carregando classificações...</p>
        </div>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap pb-6">
          <div className="flex gap-4 min-w-full lg:min-w-0">
            {Object.entries(categoriesByType).map(([type, items]) => {
              const info = typeMap[type as keyof typeof typeMap];
              return (
                <div key={type} className="flex-1 min-w-[300px] max-w-[400px] flex flex-col gap-3">
                  {/* Column Header */}
                  <div className="flex items-center justify-between bg-card/40 border border-border/50 p-3 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${info.dot}`} />
                      <h2 className="text-sm font-bold uppercase tracking-wide text-foreground/80">{info.label}s</h2>
                    </div>
                    <Badge variant="secondary" className="bg-secondary/50 text-[10px] h-4.5 font-bold">
                      {items.length}
                    </Badge>
                  </div>

                  {/* Column Content */}
                  <div className="flex flex-col gap-2 min-h-[500px] bg-secondary/5 border border-border/40 rounded-2xl p-2">
                    {items.map((cat) => (
                      <Card key={cat.id} className="group hover:shadow-md hover:border-primary/20 transition-all border-border/50 bg-card relative overflow-hidden shrink-0">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${info.dot} opacity-40`} />
                        <CardContent className="p-3 py-4 flex items-center justify-between">
                          <span className="font-medium text-[14px] truncate flex-1 pr-2">{cat.name}</span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEdit(cat)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(cat.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Button
                      variant="ghost"
                      className="w-full h-12 border border-dashed border-border/40 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all rounded-xl gap-2 mt-auto"
                      onClick={() => openCreate(type)}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar item
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingId ? "Editar Classificação" : "Nova Classificação"}</DialogTitle>
            <p className="text-sm text-muted-foreground">Defina o nome e o tipo desta classificação.</p>
          </DialogHeader>

          <div className="space-y-5 py-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Nome</Label>
              <Input
                placeholder="Ex: Oferta de Missões, Aluguel..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-12 text-base"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any })}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Entrada (Receita)</SelectItem>
                  <SelectItem value="expense">Saída (Despesa)</SelectItem>
                  <SelectItem value="method">Meio de Pagamento</SelectItem>
                  <SelectItem value="occasion">Ocasião (Evento, Reunião)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1 sm:flex-none">Cancelar</Button>
            <Button disabled={isSaving} onClick={handleSave} className="flex-1 sm:flex-none">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : editingId ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
