import { useState, useEffect } from "react";
import { Plus, FileText, Link2, ExternalLink, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { parseISO, format as formatDateFns } from "date-fns";
import type { Database } from "@/types/database.types";

type DocItem = Database["public"]["Tables"]["documents"]["Row"];

const defaultCategories = ["Legal", "Atas", "Fotos", "Financeiro", "Outros"];
const emptyForm = { name: "", type: "link", category: "Legal", date: "", link: "" };

export default function Documentos() {
  const { organization } = useChurch();
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState(defaultCategories);
  const [selectedCategory, setSelectedCategory] = useState("Legal");
  const [customCategory, setCustomCategory] = useState("");

  useEffect(() => {
    if (organization?.id) fetchDocs();
  }, [organization?.id]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDocs(data || []);

      const uniqueCats = Array.from(new Set([...defaultCategories, ...(data?.map(d => d.category!).filter(Boolean) || [])]));
      setCategories(uniqueCats);
    } catch (err) {
      toast.error("Erro ao carregar documentos");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setSelectedCategory("Legal"); setCustomCategory(""); setDialogOpen(true); };
  const openEdit = (doc: DocItem) => {
    setEditingId(doc.id);
    setForm({
      name: doc.name,
      type: doc.type || "link",
      category: doc.category || "Legal",
      date: doc.date || "",
      link: doc.link || ""
    });
    setSelectedCategory(doc.category || "Legal");
    setCustomCategory("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !organization?.id) return;
    setIsSaving(true);
    try {
      let finalCategory = selectedCategory;
      if (selectedCategory === "Outro" && customCategory.trim()) {
        finalCategory = customCategory.trim();
      }

      const payload = {
        name: form.name,
        type: form.type,
        category: finalCategory,
        organization_id: organization.id,
        date: form.date || null,
        link: form.link
      };

      if (editingId) {
        const { error } = await supabase.from("documents").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("documents").insert([payload]);
        if (error) throw error;
      }

      setDialogOpen(false);
      fetchDocs();
      toast.success(editingId ? "Documento atualizado" : "Documento anexado");
    } catch (err) {
      toast.error("Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este documento?")) return;
    try {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      setDocs(prev => prev.filter(d => d.id !== id));
      toast.success("Documento removido");
    } catch (err) {
      toast.error("Erro ao remover");
    }
  };

  const filtered = docs.filter((d) => {
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== "all" && d.category !== categoryFilter) return false;
    return true;
  });

  if (!organization) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Documentos & Arquivos</h2>
          <p className="text-muted-foreground text-[12px] mt-1">Repositório digital da {organization.name}</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Novo Registro
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{editingId ? "Editar Documento" : "Anexar Documento"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Nome do arquivo/documento *</Label>
              <Input placeholder="Ex: Estatuto Social - 2024" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Categoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    <SelectItem value="Outro">+ Nova Categoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Data de referência</Label>
                <DatePicker
                  date={form.date ? parseISO(form.date) : undefined}
                  onChange={(date) => setForm({
                    ...form,
                    date: date ? formatDateFns(date, "yyyy-MM-dd") : ""
                  })}
                />
              </div>
            </div>
            {selectedCategory === "Outro" && (
              <div className="space-y-2 animate-in slide-in-from-top-1">
                <Label className="text-[13px]">Nome da nova categoria</Label>
                <Input placeholder="Ex: Ministerial" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-[13px]">Link / URL (Google Drive, Dropbox, etc)</Label>
              <Input placeholder="https://..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap gap-2 items-center bg-secondary/10 p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." className="pl-9 h-9 text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 h-9 text-xs"><SelectValue placeholder="Categorias" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border overflow-hidden shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-bold uppercase">Documento</TableHead>
                <TableHead className="text-[11px] font-bold uppercase">Categoria</TableHead>
                <TableHead className="text-[11px] font-bold uppercase">Referência</TableHead>
                <TableHead className="text-[11px] font-bold uppercase text-center w-24">Acesso</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5} className="py-8"><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                ))
              ) : filtered.map((doc) => (
                <TableRow key={doc.id} className="group transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-[13px]">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] font-medium px-2 py-0 h-4 border-border/50 uppercase tracking-wide">{doc.category || "Legal"}</Badge></TableCell>
                  <TableCell className="text-[11px] text-muted-foreground font-mono">
                    {doc.date ? new Date(doc.date + 'T12:00:00').toLocaleDateString('pt-BR') : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {doc.link && (
                      <a href={doc.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-1.5 rounded-md bg-secondary/50 text-primary hover:bg-primary/10 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => openEdit(doc)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(doc.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">Nenhum documento anexado</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
