import { useState, useEffect } from "react";
import { Plus, Tag, Pencil, Trash2, Loader2, Type, History } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { Badge } from "@/components/ui/badge";
import { TableToolbar } from "@/components/TableToolbar";
import type { Database } from "@/types/database.types";

type Category = Database["public"]["Tables"]["categories"]["Row"];

const emptyForm = { name: "", type: "income" };

const typeMap = {
  income: { label: "Entrada", color: "bg-success/15", text: "text-foreground/70", dot: "bg-success/40" },
  expense: { label: "Saída", color: "bg-destructive/15", text: "text-foreground/70", dot: "bg-destructive/40" },
  method: { label: "Meio de Pagamento", color: "bg-primary/15", text: "text-foreground/70", dot: "bg-primary/40" },
  occasion: { label: "Ocasião / Evento", color: "bg-amber-500/15", text: "text-amber-700 font-medium", dot: "bg-amber-500/40" },
};

export default function Categories() {
  const { organization } = useChurch();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [sortField, setSortField] = useState("type");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("asc");

  useEffect(() => {
    if (organization?.id) fetchCategories();
  }, [organization?.id, sortField, sortOrder]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("organization_id", organization!.id)
        .neq("type", "church_role")
        .order(sortField, { ascending: sortOrder === 'asc' })
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

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando dados da igreja...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-end flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-36 h-9 text-xs font-medium bg-secondary/20 border-border/50">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="income">Entradas</SelectItem>
              <SelectItem value="expense">Saídas</SelectItem>
              <SelectItem value="method">Meios</SelectItem>
              <SelectItem value="occasion">Ocasiões</SelectItem>
            </SelectContent>
          </Select>

          <TableToolbar
            sortField={sortField}
            onSortFieldChange={setSortField}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            sortOptions={[
              { field: 'name', label: 'Nome', icon: <Type /> },
              { field: 'type', label: 'Tipo', icon: <History /> },
            ]}
          />

          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 font-medium px-6 rounded-full shadow-sm" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Novo Registro
          </Button>
        </div>
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
                  <SelectItem value="occasion">Ocasião (Culto, Reunião, Evento)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-center pt-2">
              <Button className="w-full sm:w-[140px] font-medium" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
      ) : (
        <Card className="bg-card border-border shadow-sm overflow-hidden w-full">
          <ScrollArea className="h-[calc(100vh-340px)] w-full">
            <Table className="border-collapse border border-border/50">
              <TableHeader className="sticky top-0 bg-secondary/20 backdrop-blur-sm z-10 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[45%] text-[11px] font-semibold text-muted-foreground border-r border-border/50 px-4 text-center">Classificação / Nome</TableHead>
                  <TableHead className="w-[35%] text-[11px] font-semibold text-muted-foreground border-r border-border/50 px-4 text-center">Tipo de Registro</TableHead>
                  <TableHead className="w-[20%] text-[11px] font-semibold text-muted-foreground px-4 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.filter(c => activeFilter === "all" || c.type === activeFilter).map((cat) => {
                  const info = typeMap[cat.type as keyof typeof typeMap] || typeMap.income;
                  return (
                    <TableRow
                      key={cat.id}
                      className="group transition-colors odd:bg-transparent even:bg-secondary/10 hover:bg-secondary/20 border-b border-border/50"
                    >
                      <TableCell className="border-r border-border/50 px-4 py-2 text-center">
                        <div className="flex items-center gap-3 justify-center">
                          <div className={`h-2 w-2 rounded-full ${info.dot}`} />
                          <span className="text-[14px] font-medium text-foreground">{cat.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 px-4 py-2 text-center">
                        <Badge variant="outline" className={`${info.color} ${info.text} border-border/50 text-[10px] font-semibold h-5 px-3`}>
                          {info.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(cat)} className="p-1 px-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><Pencil className="h-3 w-3" /></button>
                          <button onClick={() => handleDelete(cat.id)} className="p-1 px-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-20 text-muted-foreground italic border-b border-border/50">
                      Nenhuma classificação configurada ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
}
