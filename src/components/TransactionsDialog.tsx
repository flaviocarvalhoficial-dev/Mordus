import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { toast } from "sonner";
import { parseISO, format as formatDateFns } from "date-fns";
import type { ReactNode } from "react";

const paymentMethods = ["Pix", "Dinheiro", "Cartão de Débito", "Cartão de Crédito", "TED", "DOC", "Depósito"];
const emptyItem = { category_id: "", amount: "", payment_method: "Pix", type: "income" as "income" | "expense" };
const emptyForm = { date: new Date().toISOString().split('T')[0], description: "", event_id: "", items: [{ ...emptyItem }] };

interface TransactionsDialogProps {
    onSuccess?: () => void;
    trigger?: ReactNode;
    editingTransaction?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TransactionsDialog({ onSuccess, trigger, editingTransaction, open: externalOpen, onOpenChange }: TransactionsDialogProps) {
    const { organization } = useChurch();
    const [internalOpen, setInternalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);
    const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
    const [form, setForm] = useState(emptyForm);

    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;

    useEffect(() => {
        if (open && organization?.id) {
            fetchCategories();
            fetchEvents();
            if (editingTransaction) {
                setForm({
                    date: editingTransaction.date,
                    description: editingTransaction.description,
                    event_id: editingTransaction.event_id || "",
                    items: [{
                        type: editingTransaction.type,
                        category_id: editingTransaction.category_id || "",
                        amount: String(editingTransaction.amount),
                        payment_method: editingTransaction.payment_method || "Pix"
                    }]
                });
            } else {
                setForm(emptyForm);
            }
        }
    }, [open, organization?.id, editingTransaction]);

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

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...form.items];
        newItems[index] = { ...newItems[index], [field]: value } as any;
        setForm({ ...form, items: newItems });
    };

    const handleSave = async () => {
        if (!form.description || !organization?.id || form.items.length === 0) {
            toast.error("Preencha a descrição e pelo menos um item");
            return;
        }

        const validItems = form.items.filter(item => item.amount && parseFloat(item.amount) > 0);
        if (validItems.length === 0) {
            toast.error("Adicione pelo menos um item com valor válido");
            return;
        }

        const eventId = (form.event_id && form.event_id !== "none") ? form.event_id : null;

        setIsSaving(true);
        try {
            if (editingTransaction?.id) {
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
                const { error } = await supabase.from("transactions").update(payload).eq("id", editingTransaction.id);
                if (error) throw error;
                toast.success("Lançamento atualizado");
            } else {
                const payloads = validItems.map(item => ({
                    organization_id: organization.id,
                    type: item.type,
                    category_id: item.category_id || null,
                    amount: parseFloat(item.amount),
                    date: form.date,
                    description: form.description,
                    payment_method: item.payment_method,
                    event_id: eventId as any
                }));

                const { error } = await supabase.from("transactions").insert(payloads as any);
                if (error) throw error;
                toast.success(`${payloads.length} lançamentos criados com sucesso!`);
            }

            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error("Erro ao salvar lançamento");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-semibold">
                        {editingTransaction ? "Editar Lançamento" : "Novo Lançamento por Evento"}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
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
                            <DatePicker
                                date={form.date ? parseISO(form.date) : undefined}
                                onChange={(date) => setForm({
                                    ...form,
                                    date: date ? formatDateFns(date, "yyyy-MM-dd") : ""
                                })}
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <Label className="text-[13px]">Descrição Principal / Título do Evento</Label>
                            <Input placeholder="Ex: Ofertas Culto de Domingo Noturno" className="bg-background" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Itens do Lançamento</Label>
                            {!editingTransaction && (
                                <Button variant="outline" size="sm" className="h-7 text-[11px] border-dashed" onClick={addItem}>
                                    <Plus className="h-3 w-3 mr-1" /> Adicionar Entrada/Saída
                                </Button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {form.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2 pb-3 border-b border-border/30 last:border-0 relative group">
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

                                    <div className="md:col-span-3 space-y-1">
                                        <Label className="text-[10px] text-muted-foreground uppercase">Valor</Label>
                                        <Input type="number" step="0.01" placeholder="0,00" value={item.amount} className="h-9 text-xs" onChange={(e) => updateItem(index, "amount", e.target.value)} />
                                    </div>

                                    <div className="md:col-span-1 flex items-end justify-center pb-1">
                                        {!editingTransaction && form.items.length > 1 && (
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
                            {editingTransaction ? "Atualizar Lançamento" : `Salvar ${form.items.length} Lançamentos`}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
