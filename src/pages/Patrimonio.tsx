import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import type { Database } from "@/types/database.types";

type Asset = Database["public"]["Tables"]["assets"]["Row"];

const typeLabels: Record<string, string> = {
  imovel: "Imóvel", movel: "Móvel", instrumento: "Instrumento Musical", equipamento_som: "Equipamento de Som", transporte: "Transporte",
};

const emptyForm = { name: "", type: "", value: "", description: "" };

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
      description: item.description || ""
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Patrimônio</h2>
          <p className="text-muted-foreground text-[12px] mt-1">Controle de ativos fixos — {organization.name}</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs" onClick={openCreate}>
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48 h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(typeLabels).map(([val, label]) => <SelectItem key={val} value={val}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="h-9 px-3 flex items-center text-xs font-mono tabular-nums border border-border">Total: {formatCurrency(totalValue)}</Badge>
      </div>

      <Card className="bg-card border-border overflow-hidden shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-bold uppercase">Bem</TableHead>
                <TableHead className="text-[11px] font-bold uppercase">Tipo</TableHead>
                <TableHead className="text-[11px] font-bold uppercase">Descrição</TableHead>
                <TableHead className="text-right text-[11px] font-bold uppercase">Valor Estimado</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5} className="py-8"><div className="h-6 w-full bg-secondary/20 animate-pulse rounded" /></TableCell></TableRow>
                ))
              ) : filtered.map((item) => (
                <TableRow key={item.id} className="group transition-colors">
                  <TableCell className="font-medium text-[13px]">{item.name}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] font-medium px-2 py-0 h-4 border-border/50">{typeLabels[item.type || ""] || item.type}</Badge></TableCell>
                  <TableCell className="text-[11px] text-muted-foreground max-w-[200px] truncate">{item.description}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-[13px] font-bold">{formatCurrency(item.value || 0)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">Nenhum bem registrado</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
