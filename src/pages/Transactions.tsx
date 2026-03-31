import { useState, useEffect } from "react";
import { Plus, Search, Paperclip, Trash2, Pencil, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import type { Database } from "@/types/database.types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  categories?: { name: string; color: string | null } | null;
};

const paymentMethods = ["Pix", "Dinheiro", "Cartão de Débito", "Cartão de Crédito", "TED", "DOC", "Depósito"];
const months = [
  { value: "all", label: "Todos os meses" },
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" }, { value: "03", label: "Março" },
  { value: "04", label: "Abril" }, { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" }, { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" }, { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

const emptyItem = { category_id: "", amount: "", payment_method: "Pix", type: "income" };
const emptyForm = { date: new Date().toISOString().split('T')[0], description: "", event_id: "", items: [{ ...emptyItem }] };

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function Transactions() {
  const { organization } = useChurch();
  const [data, setData] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);

  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchData();
      fetchCategories();
      fetchEvents();
    }
  }, [organization?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: txs, error } = await supabase
        .from("transactions")
        .select(`*, categories(name, color)`)
        .eq("organization_id", organization!.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setData(txs || []);
    } catch (err) {
      toast.error("Erro ao carregar lançamentos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name, type")
      .eq("organization_id", organization!.id);
    setCategories(cats || []);
  };

  const fetchEvents = async () => {
    const { data: evts } = await supabase
      .from("events")
      .select("id, name")
      .eq("organization_id", organization!.id)
      .gte("date", new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())
      .order("date", { ascending: false });
    setEvents(evts || []);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setForm({
      date: tx.date,
      description: tx.description,
      event_id: (tx as any).event_id || "",
      items: [{
        type: tx.type,
        category_id: tx.category_id || "",
        amount: String(tx.amount),
        payment_method: (tx as any).payment_method || "Pix"
      }]
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.description || !organization?.id || form.items.length === 0) return;

    // Validate items
    const validItems = form.items.filter(item => item.amount && parseFloat(item.amount) > 0);
    if (validItems.length === 0) {
      toast.error("Adicione pelo menos um item com valor válido");
      return;
    }

    const eventId = (form.event_id && form.event_id !== "none") ? form.event_id : null;

    setIsSaving(true);
    try {
      if (editingId) {
        // Single update (for backward compatibility or editing one from list)
        const item = form.items[0];
        const payload = {
          organization_id: organization.id,
          type: item.type,
          category_id: item.category_id || null,
          amount: parseFloat(item.amount),
          date: form.date,
          description: form.description,
          payment_method: item.payment_method,
          event_id: eventId
        };
        const { error } = await supabase.from("transactions").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Lançamento atualizado");
      } else {
        // Multi-insert
        const payloads = validItems.map(item => ({
          organization_id: organization.id,
          type: item.type,
          category_id: item.category_id || null,
          amount: parseFloat(item.amount),
          date: form.date,
          description: form.description,
          payment_method: item.payment_method,
          event_id: eventId as any // Cast only where strictly needed for UUID vs string compatibility
        }));

        const { error } = await supabase.from("transactions").insert(payloads as any);
        if (error) throw error;
        toast.success(`${payloads.length} lançamentos criados com sucesso!`);
      }

      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Erro ao salvar lançamento");
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }]
    }));
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof typeof emptyItem, value: string) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este lançamento?")) return;

    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Lançamento removido");
      setData(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      toast.error("Erro ao excluir lançamento");
    }
  };

  const filtered = data.filter((tx) => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (categoryFilter !== "all" && tx.category_id !== categoryFilter) return false;
    if (monthFilter !== "all" && tx.date.split("-")[1] !== monthFilter) return false;
    if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando dados da igreja...</div>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Lançamentos</h1>
            <p className="text-muted-foreground text-[13px] mt-1">Gestão financeira — {organization.name}</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Novo Lançamento
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-semibold">{editingId ? "Editar Lançamento" : "Novo Lançamento por Evento"}</DialogTitle></DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/20 p-4 rounded-xl border border-border/50">
                <div className="space-y-2">
                  <Label className="text-[13px]">Vincular a Evento (Opcional)</Label>
                  <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione um evento" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum evento</SelectItem>
                      {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Data do Lançamento</Label>
                  <Input type="date" value={form.date} className="bg-background" onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[13px]">Descrição Principal / Título do Evento</Label>
                  <Input placeholder="Ex: Ofertas Culto de Domingo Noturno" className="bg-background" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Itens do Lançamento</Label>
                  {!editingId && (
                    <Button variant="outline" size="sm" className="h-7 text-[11px] border-dashed" onClick={addItem}>
                      <Plus className="h-3 w-3 mr-1" /> Adicionar Entrada/Saída
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {form.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 pb-3 border-b border-border/30 last:border-0 relative group">
                      {/* Type Column */}
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Tipo</Label>
                        <Select value={item.type} onValueChange={(v) => updateItem(index, "type", v)}>
                          <SelectTrigger className="h-9 px-2 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Entrada</SelectItem>
                            <SelectItem value="expense">Saída</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Category Column */}
                      <div className="md:col-span-3 space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Categoria</Label>
                        <Select value={item.category_id} onValueChange={(v) => updateItem(index, "category_id", v)}>
                          <SelectTrigger className="h-9 px-2 text-xs truncate"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {categories.filter(c => c.type === item.type).map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Payment Method */}
                      <div className="md:col-span-3 space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Meio</Label>
                        <Select value={item.payment_method} onValueChange={(v) => updateItem(index, "payment_method", v)}>
                          <SelectTrigger className="h-9 px-2 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Value Column */}
                      <div className="md:col-span-3 space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Valor</Label>
                        <Input type="number" step="0.01" placeholder="0,00" value={item.amount} className="h-9 text-xs" onChange={(e) => updateItem(index, "amount", e.target.value)} />
                      </div>

                      {/* Action */}
                      <div className="md:col-span-1 flex items-end justify-center pb-1">
                        {!editingId && form.items.length > 1 && (
                          <button onClick={() => removeItem(index)} className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Separator className="opacity-50" />
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs text-muted-foreground">Total do Lote:</span>
                  <span className="text-sm font-bold text-primary font-mono">
                    {formatCurrency(form.items.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0))}
                  </span>
                </div>
                <Button className="w-full font-semibold shadow-lg shadow-primary/10" onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Atualizar Lançamento" : `Salvar ${form.items.length} Lançamentos`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar lançamentos..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="income">Entradas</SelectItem>
                    <SelectItem value="expense">Saídas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas categorias</SelectItem>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Mês" /></SelectTrigger>
                  <SelectContent>{months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Meio</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : filtered.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-xs tabular-nums">{formatDate(tx.date)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={tx.type === "income" ? "bg-success/15 text-success border-0" : "bg-destructive/15 text-destructive border-0"}>
                          {tx.type === "income" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{tx.description}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{tx.categories?.name || "Sem categoria"}</Badge></TableCell>
                      <TableCell><span className="text-[11px] text-muted-foreground">{(tx as any).payment_method || "-"}</span></TableCell>
                      <TableCell className={`text-right font-semibold font-mono tabular-nums ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(tx)} className="text-muted-foreground hover:text-primary transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDelete(tx.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && filtered.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum lançamento encontrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
