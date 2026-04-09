import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Calendar, FileText, Banknote, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Upload, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { toast } from "sonner";
import { format as formatDateFns } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import type { ReactNode } from "react";

const OCCASIONS = [
    "Culto de Domingo (Manhã)",
    "Culto de Domingo (Noite)",
    "Culto de Ensino",
    "Escola Dominical",
    "Reunião de Oração",
    "Círculo de Oração",
    "Santa Ceia",
    "Conferência",
    "Evento Especial",
    "Outros"
];

const emptyItem = { category_id: "", amount: "", payment_method: "Dinheiro", payment_method_id: "", type: "income" as "income" | "expense", receipt_url: "" };
const emptyForm = { date: new Date().toLocaleDateString('en-CA'), description: "", event_id: "", occasion: "", items: [{ ...emptyItem }] };

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
    const [currentStep, setCurrentStep] = useState(1);
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
                    occasion: editingTransaction.occasion || "",
                    items: [{
                        type: editingTransaction.type,
                        category_id: editingTransaction.category_id || "",
                        amount: String(editingTransaction.amount),
                        payment_method: editingTransaction.payment_method || "Dinheiro",
                        payment_method_id: editingTransaction.payment_method_id || "",
                        receipt_url: editingTransaction.receipt_url || ""
                    }]
                });
                setCurrentStep(1);
            } else {
                setForm(emptyForm);
                setCurrentStep(1);
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
        if (field === "payment_method" && value !== "") {
            const selectedMethod = categories.find(c => c.id === value && c.type === 'method');
            if (selectedMethod) {
                newItems[index] = { ...newItems[index], payment_method: selectedMethod.name, payment_method_id: selectedMethod.id } as any;
            } else {
                newItems[index] = { ...newItems[index], payment_method: value, payment_method_id: "" } as any;
            }
        } else {
            newItems[index] = { ...newItems[index], [field]: value } as any;
        }
        setForm({ ...form, items: newItems });
    };

    const handleUpload = async (index: number, file: File) => {
        try {
            setIsSaving(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const filePath = `${organization!.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(filePath);

            updateItem(index, "receipt_url", publicUrl);
            toast.success("Comprovante enviado!");
        } catch (error: any) {
            toast.error("Erro no upload: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const validateStep = (step: number) => {
        if (step === 1) {
            if (!form.description || !form.date) {
                toast.error("Preencha a data e a descrição principal");
                return false;
            }
        }
        if (step === 2) {
            const validItems = form.items.filter(item => item.amount && parseFloat(item.amount) > 0 && item.category_id);
            if (validItems.length === 0) {
                toast.error("Adicione pelo menos um item com categoria e valor válido");
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleSave = async () => {
        if (!validateStep(2)) return;

        const validItems = form.items.filter(item => item.amount && parseFloat(item.amount) > 0);
        const eventId = (form.event_id && form.event_id !== "none") ? form.event_id : null;

        setIsSaving(true);
        try {
            if (editingTransaction?.id) {
                const item = form.items[0];
                const payload = {
                    organization_id: organization!.id,
                    type: item.type,
                    category_id: item.category_id || null,
                    amount: parseFloat(item.amount),
                    date: form.date,
                    description: form.description,
                    payment_method: item.payment_method,
                    payment_method_id: item.payment_method_id || null,
                    event_id: eventId,
                    occasion: form.occasion || null,
                    receipt_url: item.receipt_url || null
                };
                const { error } = await supabase.from("transactions").update(payload).eq("id", editingTransaction.id);
                if (error) throw error;
                toast.success("Lançamento atualizado");
            } else {
                const payloads = validItems.map(item => ({
                    organization_id: organization!.id,
                    type: item.type,
                    category_id: item.category_id || null,
                    amount: parseFloat(item.amount),
                    date: form.date,
                    description: form.description,
                    payment_method: item.payment_method,
                    payment_method_id: item.payment_method_id || null,
                    event_id: eventId as any,
                    occasion: form.occasion || null,
                    receipt_url: item.receipt_url || null
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

    const totals = form.items.reduce((acc, item) => {
        const val = parseFloat(item.amount) || 0;
        if (item.type === 'income') acc.income += val;
        else acc.expense += val;
        return acc;
    }, { income: 0, expense: 0 });

    return (
        <Dialog open={open} onOpenChange={(o) => {
            setOpen(o);
            if (!o) setCurrentStep(1);
        }}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-xl bg-card border-border p-0 overflow-hidden shadow-2xl ring-1 ring-primary/10">
                <div className="bg-gradient-to-r from-primary/10 via-background to-primary/5 p-6 border-b border-border/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                            <Banknote className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">
                                {editingTransaction ? "Editar Lançamento" : "Assistente de Lançamento"}
                            </DialogTitle>
                            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-widest mt-0.5">
                                Passo {currentStep} de 3
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex-1 flex items-center gap-2">
                                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${currentStep >= s ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" : "bg-secondary"}`} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <Calendar className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">Contexto do Lançamento</span>
                            </div>

                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[13px] font-semibold">Data do Lançamento</Label>
                                    <DatePicker
                                        date={form.date ? new Date(form.date + 'T12:00:00') : undefined}
                                        onChange={(date) => setForm({
                                            ...form,
                                            date: date ? formatDateFns(date, "yyyy-MM-dd") : ""
                                        })}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Escolha o dia em que a movimentação ocorreu na conta ou caixa.</p>
                                </div>

                                <Separator className="opacity-50" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[13px] font-semibold">Ocasião Principal</Label>
                                        <Select
                                            value={form.occasion}
                                            onValueChange={(v) => {
                                                setForm({
                                                    ...form,
                                                    occasion: v,
                                                    description: v !== "Outros" ? v : form.description
                                                });
                                            }}
                                        >
                                            <SelectTrigger className="h-10 bg-secondary/20"><SelectValue placeholder="Selecione o culto/evento" /></SelectTrigger>
                                            <SelectContent>
                                                {OCCASIONS.map(oc => <SelectItem key={oc} value={oc}>{oc}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[13px] font-semibold">Vínculo (Agenda - Opcional)</Label>
                                        <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
                                            <SelectTrigger className="h-10 bg-secondary/20"><SelectValue placeholder="Vincular evento" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Sem vínculo</SelectItem>
                                                {events.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[13px] font-semibold">Descrição / Título do Lote</Label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                        <Input
                                            placeholder="Ex: Ofertas do Culto de Santa Ceia"
                                            className="h-10 pl-10 bg-secondary/10 focus:bg-background transition-colors"
                                            value={form.description}
                                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-primary">
                                    <Banknote className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Movimentações Financeiras</span>
                                </div>
                                {!editingTransaction && (
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase border-dashed hover:bg-primary/5" onClick={addItem}>
                                        <Plus className="h-3 w-3 mr-1" /> Adicionar Outro
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {form.items.map((item, index) => (
                                    <div key={index} className="relative bg-secondary/5 rounded-2xl border border-border/50 p-4 pt-10 md:pt-4 transition-all hover:bg-secondary/10">
                                        {!editingTransaction && form.items.length > 1 && (
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="absolute top-2 right-2 md:top-2 md:-right-2 p-1.5 rounded-full bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 md:group-hover:translate-x-full transition-all"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-tighter">Tipo</Label>
                                                <Select value={item.type} onValueChange={(v) => updateItem(index, "type", v)}>
                                                    <SelectTrigger className={`h-9 text-xs font-bold ${item.type === 'income' ? 'text-success bg-success/5 border-success/20' : 'text-destructive bg-destructive/5 border-destructive/20'}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="income" className="text-success font-medium">Entrada (+)</SelectItem>
                                                        <SelectItem value="expense" className="text-destructive font-medium">Saída (-)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-tighter">Categoria *</Label>
                                                <Select value={item.category_id} onValueChange={(v) => updateItem(index, "category_id", v)}>
                                                    <SelectTrigger className="h-9 text-xs bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                    <SelectContent>
                                                        {categories.filter(c => c.type === item.type).map((c) => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-tighter">Meio de Pagamento</Label>
                                                <Select
                                                    value={item.payment_method_id || item.payment_method}
                                                    onValueChange={(v) => updateItem(index, "payment_method", v)}
                                                >
                                                    <SelectTrigger className="h-9 text-xs bg-background"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {categories.filter(c => c.type === 'method').map((m) => (
                                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                        ))}
                                                        {categories.filter(c => c.type === 'method').length === 0 && (
                                                            <>
                                                                <SelectItem value="Pix">Pix</SelectItem>
                                                                <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                                                                <SelectItem value="Cartão">Cartão</SelectItem>
                                                            </>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[11px] text-muted-foreground uppercase font-bold tracking-tighter">Valor (R$) *</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0,00"
                                                    value={item.amount}
                                                    className="h-9 text-xs font-mono font-bold bg-background text-primary"
                                                    onChange={(e) => updateItem(index, "amount", e.target.value)}
                                                />
                                            </div>

                                            <div className="md:col-span-2 space-y-2">
                                                <Label className="text-[11px] text-foreground uppercase font-black tracking-tighter">Comprovante</Label>
                                                <div className="flex items-center gap-2">
                                                    {item.receipt_url ? (
                                                        <div className="flex-1 flex items-center justify-between p-2 bg-success/10 border border-success/30 rounded-xl">
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 className="h-4 w-4 text-success" />
                                                                <span className="text-[11px] font-bold text-success/90">Arquivo anexado</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-success hover:bg-success/20"
                                                                    onClick={() => window.open(item.receipt_url, '_blank')}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:bg-destructive/20"
                                                                    onClick={() => updateItem(index, "receipt_url", "")}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="relative flex-1">
                                                            <input
                                                                type="file"
                                                                id={`receipt-${index}`}
                                                                className="hidden"
                                                                accept="image/*,application/pdf"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleUpload(index, file);
                                                                }}
                                                            />
                                                            <Button
                                                                variant="outline"
                                                                className="w-full h-12 border-dashed border-2 bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/50 transition-all rounded-2xl gap-2 text-xs font-black text-primary group"
                                                                asChild
                                                            >
                                                                <label htmlFor={`receipt-${index}`} className="cursor-pointer">
                                                                    <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                                                                    Clique para Upload
                                                                </label>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="flex flex-col items-center text-center space-y-2 py-4">
                                <div className="h-16 w-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mb-2 shadow-inner">
                                    <CheckCircle2 className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-lg font-bold">Quase lá!</h3>
                                <p className="text-muted-foreground text-sm">Revise os dados antes de finalizar o lançamento.</p>
                            </div>

                            <Card className="bg-secondary/10 border-border/50 overflow-hidden rounded-2xl shadow-sm">
                                <div className="bg-secondary/20 p-4 border-b border-border/50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Descrição do Lote</p>
                                            <p className="text-sm font-bold text-foreground mt-1">{form.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Data</p>
                                            <p className="text-sm font-bold text-foreground mt-1 font-mono">{new Date(form.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-success/5 rounded-xl border border-success/10 text-center">
                                            <p className="text-[9px] text-success font-black uppercase tracking-widest mb-1">Entradas</p>
                                            <p className="text-lg font-black text-success tabular-nums">{formatCurrency(totals.income)}</p>
                                        </div>
                                        <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/10 text-center">
                                            <p className="text-[9px] text-destructive font-black uppercase tracking-widest mb-1">Saídas</p>
                                            <p className="text-lg font-black text-destructive tabular-nums">{formatCurrency(totals.expense)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-border/30">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Saldo do Lote</p>
                                        <p className={`text-sm font-black tabular-nums ${totals.income - totals.expense >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                            {formatCurrency(totals.income - totals.expense)}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <div className="flex items-start gap-3 p-4 bg-orange-500/5 rounded-2xl border border-orange-500/20 text-orange-500">
                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-tight">Dica de Lançamento</p>
                                    <p className="text-[11px] leading-relaxed opacity-90">Verifique se os valores batem com o comprovante físico ou extrato bancário. Lançamentos confirmados afetam o saldo imediatamente.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-secondary/10 border-t border-border/50 flex flex-row items-center gap-3">
                    {currentStep > 1 && (
                        <Button
                            variant="outline"
                            className="flex-1 h-11 font-bold group border-border/50 bg-background"
                            onClick={prevStep}
                            disabled={isSaving}
                        >
                            <ChevronLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Voltar
                        </Button>
                    )}

                    {currentStep < 3 ? (
                        <Button
                            className="flex-[2] h-11 font-bold group shadow-lg shadow-primary/10"
                            onClick={nextStep}
                        >
                            Continuar
                            <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    ) : (
                        <Button
                            className="flex-[2] h-11 font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all bg-gradient-to-r from-primary to-primary/80"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>Confirmar Lançamento</>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
