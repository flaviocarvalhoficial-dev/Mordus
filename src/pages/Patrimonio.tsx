import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, Search, Settings2, Columns, X, FileCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import type { Database } from "@/types/database.types";

type Asset = Database["public"]["Tables"]["assets"]["Row"] & { image_url?: string | null };

const typeLabels: Record<string, string> = {
  imovel: "Imóvel", movel: "Móvel", instrumento: "Instrumento Musical", equipamento_som: "Equipamento de Som", transporte: "Transporte",
};

const emptyForm = { name: "", type: "", value: "", description: "", image_url: "" };

function formatCurrency(v: number) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }

export default function Patrimonio() {
  const { organization } = useChurch();
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["name", "type", "description", "value", "image_url"]);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => {
      if (prev.includes(col)) {
        if (prev.length <= 2) {
          toast.error("Mínimo de 2 colunas.");
          return prev;
        }
        return prev.filter(c => c !== col);
      }
      return [...prev, col];
    });
  };

  useEffect(() => {
    if (organization?.id) fetchAssets();
  }, [organization?.id]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("name");
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      toast.error("Erro ao carregar patrimônio");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item: Asset) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      type: item.type || "",
      value: String(item.value || ""),
      description: item.description || "",
      image_url: item.image_url || ""
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !organization?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        value: parseFloat(form.value) || 0,
        description: form.description,
        organization_id: organization.id,
        image_url: form.image_url,
      };

      if (editingId) {
        const { error } = await supabase.from("assets").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Bem atualizado");
      } else {
        const { error } = await supabase.from("assets").insert([payload]);
        if (error) throw error;
        toast.success("Bem cadastrado");
      }
      setDialogOpen(false);
      fetchAssets();
    } catch (err) {
      toast.error("Erro ao salvar bem");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este bem?")) return;
    try {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw error;
      toast.success("Bem removido");
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      toast.error("Erro ao remover bem");
    }
  };

  const filtered = items.filter((p) => {
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalValue = filtered.reduce((s, p) => s + (p.value || 0), 0);

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-end">
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs rounded-full px-6" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Novo Bem
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{editingId ? "Editar Bem" : "Cadastrar Bem"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Nome do bem *</Label>
              <Input placeholder="Ex: Templo principal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{Object.entries(typeLabels).map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Valor estimado (R$)</Label>
                <Input type="number" step="0.01" placeholder="0,00" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Descrição</Label>
              <Input placeholder="Descrição detalhada" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">URL do Documento / Foto</Label>
              <Input placeholder="https://..." value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border overflow-hidden shadow-sm">
        <CardHeader className="pb-3 bg-secondary/10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome..." className="pl-9 h-9 text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <Badge variant="outline" className="h-9 px-4 flex items-center text-[11px] font-mono font-black tabular-nums border-border/50 bg-background/50 shadow-sm">
                Total: {formatCurrency(totalValue)}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-52 h-8 text-xs"><SelectValue placeholder="Todos os tipos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(typeLabels).map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 bg-background p-0.5 rounded-md border border-border ml-auto">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualização de Colunas">
                      <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4 bg-card border-border shadow-xl">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Columns className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-black uppercase tracking-wider">Colunas da Tabela</h4>
                      </div>
                      <div className="grid gap-3">
                        {[
                          { id: 'name', label: 'Nome do Bem' },
                          { id: 'type', label: 'Tipo' },
                          { id: 'description', label: 'Descrição' },
                          { id: 'value', label: 'Valor Estimado' },
                          { id: 'acquisition_date', label: 'Aquisição' },
                          { id: 'location', label: 'Localização' },
                          { id: 'condition', label: 'Estado' },
                          { id: 'image_url', label: 'Documento' },
                        ].map((col) => (
                          <div key={col.id} className="flex items-center justify-between gap-4">
                            <span className="text-[11px] font-medium text-muted-foreground">{col.label}</span>
                            <Switch
                              checked={visibleColumns.includes(col.id)}
                              onCheckedChange={() => toggleColumn(col.id)}
                              className="scale-75"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-340px)] w-full">
            <Table className="border-collapse border border-border/50">
              <TableHeader className="sticky top-0 bg-secondary/20 backdrop-blur-sm z-10 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  {visibleColumns.includes("name") && <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50 whitespace-nowrap">Bem</TableHead>}
                  {visibleColumns.includes("type") && <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50 whitespace-nowrap">Tipo</TableHead>}
                  {visibleColumns.includes("acquisition_date") && <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50 whitespace-nowrap">Aq.</TableHead>}
                  {visibleColumns.includes("location") && <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50 whitespace-nowrap">Local</TableHead>}
                  {visibleColumns.includes("condition") && <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50 whitespace-nowrap">Estado</TableHead>}
                  {visibleColumns.includes("image_url") && <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50 whitespace-nowrap">Doc</TableHead>}
                  {visibleColumns.includes("description") && <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50 whitespace-nowrap">Descrição</TableHead>}
                  {visibleColumns.includes("value") && <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50 whitespace-nowrap">Valor</TableHead>}
                  <TableHead className="w-[6%] text-[11px] font-black text-muted-foreground text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={visibleColumns.length + 1}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                  ))
                ) : (
                  <>
                    {filtered.map((item) => (
                      <TableRow
                        key={item.id}
                        className="group transition-colors odd:bg-transparent even:bg-secondary/10 hover:bg-secondary/20 border-b border-border/50"
                      >
                        {visibleColumns.includes("name") && <TableCell className="font-bold text-[14px] border-r border-border/50 py-2 text-center">{item.name}</TableCell>}
                        {visibleColumns.includes("type") && (
                          <TableCell className="border-r border-border/50 py-2 text-center">
                            <Badge variant="outline" className="text-[11px] font-medium px-2 py-0 h-5 border-border/50 text-foreground/70">
                              {typeLabels[item.type || ""] || item.type}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.includes("acquisition_date") && <TableCell className="text-[14px] font-mono border-r border-border/50 py-2 text-center tabular-nums">{item.acquisition_date ? new Date(item.acquisition_date + 'T12:00:00').toLocaleDateString('pt-BR') : "-"}</TableCell>}
                        {visibleColumns.includes("location") && <TableCell className="text-[14px] border-r border-border/50 py-2 text-center">{item.location || "-"}</TableCell>}
                        {visibleColumns.includes("condition") && (
                          <TableCell className="border-r border-border/50 py-2 text-center">
                            <Badge variant="outline" className="text-[10px] h-5 px-2 border-border/50 text-foreground/70">
                              {item.condition || "Novo"}
                            </Badge>
                          </TableCell>
                        )}
                        {visibleColumns.includes("image_url") && (
                          <TableCell className="border-r border-border/50 py-2 text-center">
                            {item.image_url && (
                              <button
                                onClick={(e) => { e.stopPropagation(); window.open(item.image_url!, '_blank'); }}
                                className="inline-flex items-center justify-center w-6 h-5 rounded-full border border-border/50 bg-transparent text-muted-foreground hover:bg-secondary/20 transition-all"
                                title="Ver Documento"
                              >
                                <FileCheck className="h-3 w-3" />
                              </button>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.includes("description") && (
                          <TableCell className="text-[14px] text-muted-foreground max-w-[200px] truncate border-r border-border/50 py-2 text-center">
                            {item.description}
                          </TableCell>
                        )}
                        {visibleColumns.includes("value") && (
                          <TableCell className="text-center font-mono tabular-nums text-[14px] font-bold border-r border-border/50 py-2 text-success">
                            {formatCurrency(item.value || 0)}
                          </TableCell>
                        )}
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
                            <button onClick={() => openEdit(item)} className="p-1 px-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><Pencil className="h-3 w-3" /></button>
                            <button onClick={() => handleDelete(item.id)} className="p-1 px-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && filtered.length === 0 && (
                      <TableRow><TableCell colSpan={visibleColumns.length + 1} className="text-center py-20 text-muted-foreground italic border-b border-border/50">Nenhum bem registrado</TableCell></TableRow>
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
