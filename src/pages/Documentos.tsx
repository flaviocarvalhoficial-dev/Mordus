import { useState, useEffect } from "react";
import { Plus, FileText, Link2, ExternalLink, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
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

      // Extract unique categories
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
        ...form,
        category: finalCategory,
        organization_id: organization.id,
        date: form.date || null
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
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Documentos & Arquivos</h1>
            <p className="text-muted-foreground text-[13px] mt-1">Repositório digital da {organization.name}</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Novo Registro
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{editingId ? "Editar Documento" : "Anexar Documento"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Título do Documento *</Label>
                <Input placeholder="Ex: Ata de Assembleia Geral" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px]">Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="arquivo">Arquivo Local</SelectItem>
                      <SelectItem value="link">Link Externo / Drive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      <SelectItem value="Outro">Outro...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {selectedCategory === "Outro" && (
                <div className="space-y-2">
                  <Label className="text-[13px]">Nova Categoria</Label>
                  <Input placeholder="Digite o nome" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} autoFocus />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px]">Data de Referência</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Caminho / URL</Label>
                  <Input placeholder="https://drive.google.com/..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
                </div>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Atualizar" : "Salvar Documento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por título..." className="pl-9 h-10 border-border/60" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44 h-10 text-xs bg-secondary/20"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : (
          <Card className="bg-card border-border shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-secondary/40">
                  <TableRow>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider">Documento</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider">Tipo</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider">Categoria</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider">Data</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-secondary/20 transition-colors">
                      <TableCell className="font-bold text-[13px] text-foreground">{doc.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {doc.type === "link" ? (
                            <Badge variant="secondary" className="bg-chart-blue/10 text-chart-blue border-0 px-2 h-5 text-[9px] uppercase"><Link2 className="h-2.5 w-2.5 mr-1" />Link</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 px-2 h-5 text-[9px] uppercase"><FileText className="h-2.5 w-2.5 mr-1" />Arquivo</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] font-mono border-border/50">{doc.category}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {doc.date ? new Date(doc.date + "T12:00:00").toLocaleDateString("pt-BR") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.link && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10" asChild>
                              <a href={doc.link} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" onClick={() => openEdit(doc)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic text-sm">
                        Nenhum documento encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
