import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Calendar, FileText, Banknote, ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Upload, Eye, X, Repeat, PlusCircle, Save, ShoppingBag, Landmark, Briefcase } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { format as formatDateFns, addMonths } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { ReactNode } from "react";

const DEFAULT_OCCASIONS = [
    "Culto de Domingo (Manhã)",
    "Culto de Domingo (Noite)",
    "Culto de Ensino",
    "Escola Dominical",
    "Reunião de Oração",
    "Santa Ceia",
    "Evento Especial",
    "Outros"
];

const emptyItem = { category_id: "", amount: "", payment_method: "Dinheiro", payment_method_id: "", type: "income" as "income" | "expense", receipt_url: "", status: "" };
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
    const [isInstallmentMode, setIsInstallmentMode] = useState(false);
    const [installmentCount, setInstallmentCount] = useState(2);
    const [selectedIntent, setSelectedIntent] = useState<'income' | 'expense' | 'sale' | 'asset' | null>(null);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryType, setNewCategoryType] = useState<"income" | "expense" | "method" | "occasion" | "event">("income");
    const [closures, setClosures] = useState<{ end_date: string }[]>([]);

    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;

    useEffect(() => {
        if (open && organization?.id) {
            fetchCategories();
            fetchEvents();
            fetchClosures();
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
                        receipt_url: editingTransaction.receipt_url || "",
                        status: editingTransaction.status || ""
                    }]
                });
                setSelectedIntent(editingTransaction.type);
                setCurrentStep(2);
            } else {
                setForm(emptyForm);
                setSelectedIntent(null);
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

    const fetchClosures = async () => {
        if (!organization?.id) return;
        const { data } = await supabase
            .from("monthly_closures")
            .select("end_date")
            .eq("organization_id", organization.id)
            .eq("status", "closed");
        setClosures(data || []);
    };

    const isMonthClosed = (dateStr: string) => {
        if (!dateStr) return false;
        return closures.some(c => dateStr <= c.end_date);
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

    const updateItem = (index: number, field: string | any, value?: string) => {
        const newItems = [...form.items];

        if (typeof field === 'object') {
            newItems[index] = { ...newItems[index], ...field };
        } else if (field === "payment_method" && value !== "") {
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

    const applyPreset = (index: number, type: 'income' | 'expense', categoryName: string) => {
        const category = categories.find(c => c.type === type && c.name.toLowerCase().includes(categoryName.toLowerCase()));
        const method = categories.find(c => c.type === 'method' && c.name.toLowerCase().includes('dinheiro')) || { id: "", name: "Dinheiro" };

        updateItem(index, {
            type,
            category_id: category?.id || "",
            payment_method: method.name,
            payment_method_id: method.id
        });
        toast.success(`Preset "${categoryName}" aplicado!`);
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
            if (!selectedIntent) {
                toast.error("Selecione uma intenção para continuar");
                return false;
            }
        }
        if (step === 2) {
            if (!form.description || !form.date) {
                toast.error("Preencha a data e a descrição principal");
                return false;
            }
        }
        if (step === 3) {
            const validItems = form.items.filter(item => item.amount && parseFloat(item.amount) > 0 && item.category_id);
            if (validItems.length === 0) {
                toast.error("Adicione pelo menos um item com categoria e valor válido");
                return false;
            }
        }
        return true;
    };

    const handleQuickCategoryCreate = async (index: number, specificType?: string) => {
        const typeToUse = specificType || newCategoryType;
        if (!newCategoryName || !organization?.id) return;
        try {
            if (typeToUse === 'event') {
                const { data, error } = await supabase
                    .from("events")
                    .insert([{
                        name: newCategoryName,
                        organization_id: organization.id,
                        date: form.date || new Date().toISOString().split('T')[0],
                        type: 'Evento'
                    }])
                    .select()
                    .single();
                if (error) throw error;
                setEvents(prev => [...prev, data]);
                setForm({ ...form, event_id: data.id });
            } else {
                const { data, error } = await supabase
                    .from("categories")
                    .insert([{
                        name: newCategoryName,
                        type: typeToUse,
                        organization_id: organization.id
                    }])
                    .select()
                    .single();
                if (error) throw error;

                if (typeToUse === 'occasion') {
                    setCategories(prev => [...prev, data]);
                    setForm({ ...form, occasion: data.name });
                } else if (typeToUse === 'method') {
                    setCategories(prev => [...prev, data]);
                    updateItem(index, { payment_method: data.name, payment_method_id: data.id });
                } else {
                    setCategories(prev => [...prev, data]);
                    updateItem(index, "category_id", data.id);
                }
            }

            setNewCategoryName("");
            setIsCreatingCategory(false);
            toast.success("Registrado com sucesso!");
        } catch (err: any) {
            console.error(err);
            toast.error(`Erro ao registrar: ${err.message || 'Erro desconhecido'}`);
        }
    };

    const nextStep = () => {
        if (currentStep === 1 && !selectedIntent) {
            toast.error("Selecione uma intenção para continuar");
            return;
        }
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
                    receipt_url: item.receipt_url || null,
                    status: item.status || (new Date(form.date + 'T12:00:00') <= new Date() ? 'completed' : 'pending'),
                    competence_date: form.date // Em edições simples, a competência é a data do lançamento
                };
                const { error } = await supabase.from("transactions").update(payload).eq("id", editingTransaction.id);
                if (error) throw error;
                toast.success("Lançamento atualizado");
            } else if (isInstallmentMode) {
                // NOVO SISTEMA DE PARCELAMENTO (ROBUSTO)
                const occurrences = installmentCount;
                const totalAmount = validItems.reduce((acc, item) => acc + parseFloat(item.amount), 0);

                // 1. Criar a Compra Parcelada (Pai)
                const { data: purchase, error: purchaseError } = await supabase
                    .from("installment_purchases")
                    .insert([{
                        organization_id: organization!.id,
                        description: form.description,
                        total_amount: totalAmount,
                        category_id: validItems[0].category_id || null,
                        payment_method_id: validItems[0].payment_method_id || null
                    }])
                    .select()
                    .single();

                if (purchaseError) throw purchaseError;

                const installmentPayloads: any[] = [];
                const transactionPayloads: any[] = [];

                for (let i = 0; i < occurrences; i++) {
                    const competenceMonth = addMonths(new Date(form.date + 'T12:00:00'), i);
                    const competenceDateStr = formatDateFns(competenceMonth, "yyyy-MM-01");
                    const dueDateStr = formatDateFns(competenceMonth, "yyyy-MM-dd");
                    const amountPerInstallment = totalAmount / occurrences;

                    // Status automático baseado na data
                    const isTodayOrPast = new Date(dueDateStr + 'T12:00:00') <= new Date();
                    const status = isTodayOrPast ? 'PAGA' : 'PENDENTE';

                    const instPayload = {
                        purchase_id: purchase.id,
                        organization_id: organization!.id,
                        competence_date: competenceDateStr,
                        due_date: dueDateStr,
                        status: status,
                        amount: amountPerInstallment,
                        payment_date: isTodayOrPast ? new Date().toISOString() : null,
                        installment_number: i + 1,
                        total_installments: occurrences
                    };

                    installmentPayloads.push(instPayload);
                }

                const { data: createdInstallments, error: instError } = await supabase
                    .from("installments")
                    .insert(installmentPayloads)
                    .select();

                if (instError) throw instError;

                // 2. Se a parcela for marcada como PAGA, criamos o lançamento no caixa (transactions)
                for (const inst of createdInstallments) {
                    if (inst.status === 'PAGA') {
                        transactionPayloads.push({
                            organization_id: organization!.id,
                            type: validItems[0].type,
                            category_id: validItems[0].category_id || null,
                            amount: inst.amount,
                            date: inst.due_date, // Data em que o dinheiro saiu/entrou (neste caso, simplificado para o vencimento se já passou)
                            description: `[P ${String(installmentPayloads.findIndex(p => p.due_date === inst.due_date) + 1).padStart(2, '0')}/${String(occurrences).padStart(2, '0')}] ${form.description}`,
                            payment_method: validItems[0].payment_method,
                            payment_method_id: validItems[0].payment_method_id || null,
                            installment_id: inst.id,
                            competence_date: inst.competence_date,
                            status: 'completed'
                        });
                    }
                }

                if (transactionPayloads.length > 0) {
                    const { error: txError } = await supabase.from("transactions").insert(transactionPayloads);
                    if (txError) throw txError;
                }

                toast.success(`${occurrences} parcelas geradas no sistema robusto!`);
            } else {
                // LANÇAMENTO SIMPLES (NÃO PARCELADO)
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
                    receipt_url: item.receipt_url || null,
                    status: new Date(form.date + 'T12:00:00') <= new Date() ? 'completed' : 'pending',
                    competence_date: form.date // Por padrão, a competência é a data do lançamento
                }));

                const { error } = await supabase.from("transactions").insert(payloads as any);
                if (error) throw error;

                // Integração Automática com Patrimônio
                if (selectedIntent === 'asset') {
                    const totalValue = validItems.reduce((acc, item) => acc + parseFloat(item.amount), 0);
                    const { error: assetError } = await supabase.from("assets").insert([{
                        organization_id: organization!.id,
                        name: form.description,
                        description: `Adquirido via lançamento financeiro: ${form.description}`,
                        value: totalValue,
                        acquisition_date: form.date,
                        condition: 'Novo',
                        type: 'Equipamento/Móvel'
                    }]);
                    if (assetError) console.error("Erro ao registrar no patrimônio:", assetError);
                }

                toast.success(`${payloads.length} lançamentos criados com sucesso!`);
            }

            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
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

                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center space-y-1 mb-8">
                                <h3 className="text-lg font-bold tracking-tight">O que vamos registrar agora?</h3>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold opacity-70">Selecione o tipo de movimentação</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { id: 'income', label: 'Entrada', icon: Landmark, color: 'text-success bg-success/10 border-success/20', desc: 'Dízimos e Ofertas' },
                                    { id: 'expense', label: 'Saída', icon: ShoppingBag, color: 'text-destructive bg-destructive/10 border-destructive/20', desc: 'Contas e Pagamentos' },
                                    { id: 'sale', label: 'Venda / Evento', icon: Banknote, color: 'text-primary bg-primary/10 border-primary/20', desc: 'Cantina e Inscrições' },
                                    { id: 'asset', label: 'Patrimônio', icon: Briefcase, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20', desc: 'Compras e Benfeitorias' }
                                ].map((intent) => (
                                    <button
                                        key={intent.id}
                                        onClick={() => {
                                            setSelectedIntent(intent.id as any);
                                            const type = (intent.id === 'income' || intent.id === 'sale') ? 'income' : 'expense';
                                            updateItem(0, "type", type);
                                            setCurrentStep(2);
                                        }}
                                        className={`group relative flex flex-col items-center p-6 rounded-[2.5rem] border-2 transition-all duration-300 hover:scale-[1.03] active:scale-95 ${selectedIntent === intent.id ? 'border-primary bg-primary/5 ring-4 ring-primary/5' : 'border-transparent bg-secondary/5 hover:bg-secondary/10'}`}
                                    >
                                        <div className={`h-14 w-14 rounded-3xl ${intent.color} flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-all`}>
                                            <intent.icon className="h-7 w-7" />
                                        </div>
                                        <span className="font-bold text-sm mb-1">{intent.label}</span>
                                        <span className="text-[10px] text-muted-foreground opacity-60 font-medium">{intent.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
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
                                    {isMonthClosed(form.date) && (
                                        <div className="flex items-center gap-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg animate-in fade-in duration-300">
                                            <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
                                            <p className="text-[10px] text-orange-700 font-medium">Este mês já está fechado. Alterações podem afetar o saldo inicial dos meses seguintes.</p>
                                        </div>
                                    )}
                                </div>

                                <Separator className="opacity-50" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[11px] text-muted-foreground uppercase font-black tracking-tighter">Ocasião Principal</Label>
                                            <Popover open={isCreatingCategory && newCategoryType === 'occasion'} onOpenChange={(o) => {
                                                setIsCreatingCategory(o);
                                                setNewCategoryType('occasion');
                                            }}>
                                                <PopoverTrigger asChild>
                                                    <button className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold">
                                                        <PlusCircle className="h-3 w-3" /> Criar nova
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64 p-3 bg-card border-primary/20 shadow-xl" align="end">
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-black uppercase text-primary">Nova Ocasião (Tipo de Culto)</p>
                                                        <Input
                                                            placeholder="Ex: Culto de Jovens"
                                                            className="h-8 text-xs"
                                                            value={newCategoryName}
                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleQuickCategoryCreate(0, 'occasion')}
                                                            autoFocus
                                                        />
                                                        <Button
                                                            className="w-full h-8 text-[10px] font-bold gap-2"
                                                            size="sm"
                                                            onClick={() => handleQuickCategoryCreate(0, 'occasion')}
                                                        >
                                                            <Save className="h-3 w-3" /> Salvar Ocasião
                                                        </Button>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <Select
                                            value={form.occasion}
                                            onValueChange={(v) => {
                                                setForm({
                                                    ...form,
                                                    occasion: v,
                                                    description: (v !== "Outros" && v !== "none") ? v : form.description
                                                });
                                            }}
                                        >
                                            <SelectTrigger className="h-10 bg-secondary/10 border-border/50 rounded-xl"><SelectValue placeholder="Selecione o culto/evento" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Selecione...</SelectItem>
                                                {categories.filter(c => c.type === 'occasion').length > 0 ? (
                                                    categories.filter(c => c.type === 'occasion').map(oc => (
                                                        <SelectItem key={oc.id} value={oc.name}>{oc.name}</SelectItem>
                                                    ))
                                                ) : (
                                                    DEFAULT_OCCASIONS.map(oc => <SelectItem key={oc} value={oc}>{oc}</SelectItem>)
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[11px] text-muted-foreground uppercase font-black tracking-tighter">Vínculo (Agenda)</Label>
                                            <Popover open={isCreatingCategory && newCategoryType === 'event'} onOpenChange={(o) => {
                                                setIsCreatingCategory(o);
                                                setNewCategoryType('event');
                                            }}>
                                                <PopoverTrigger asChild>
                                                    <button className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold">
                                                        <PlusCircle className="h-3 w-3" /> Criar novo
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-64 p-3 bg-card border-primary/20 shadow-xl" align="end">
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] font-black uppercase text-primary">Novo Evento na Agenda</p>
                                                        <Input
                                                            placeholder="Nome do Evento"
                                                            className="h-8 text-xs"
                                                            value={newCategoryName}
                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleQuickCategoryCreate(0, 'event')}
                                                            autoFocus
                                                        />
                                                        <Button
                                                            className="w-full h-8 text-[10px] font-bold gap-2"
                                                            size="sm"
                                                            onClick={() => handleQuickCategoryCreate(0, 'event')}
                                                        >
                                                            <Save className="h-3 w-3" /> Salvar Evento
                                                        </Button>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <Select value={form.event_id} onValueChange={(v) => setForm({ ...form, event_id: v })}>
                                            <SelectTrigger className="h-10 bg-secondary/10 border-border/50 rounded-xl"><SelectValue placeholder="Vincular evento" /></SelectTrigger>
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

                                {!editingTransaction && (
                                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Repeat className="h-4 w-4 text-primary" />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold uppercase tracking-wider">Lançamento Parcelado</span>
                                                    <span className="text-[10px] text-muted-foreground italic">Gerar múltiplas parcelas mensais automaticamente</span>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={isInstallmentMode}
                                                onCheckedChange={setIsInstallmentMode}
                                                className="scale-90"
                                            />
                                        </div>

                                        {isInstallmentMode && (
                                            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="space-y-1.5 flex-1">
                                                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Número de Parcelas</Label>
                                                    <Input
                                                        type="number"
                                                        min="2"
                                                        max="60"
                                                        value={installmentCount}
                                                        onChange={(e) => setInstallmentCount(Number(e.target.value))}
                                                        className="h-9 text-xs bg-background border-primary/20"
                                                    />
                                                </div>
                                                <div className="self-end pb-2">
                                                    <p className="text-[10px] text-muted-foreground leading-tight">
                                                        Serão gerados <strong>{installmentCount}</strong> lançamentos com intervalos de 1 mês.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-primary">
                                    <Banknote className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Detalhamento Financeiro</span>
                                </div>
                                {!editingTransaction && (
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase border-dashed hover:bg-primary/5 px-4" onClick={addItem}>
                                        <Plus className="h-3 w-3 mr-1" /> Item Adicional
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {form.items.map((item, index) => (
                                    <div key={index} className="relative bg-secondary/5 rounded-[2rem] border border-border/50 p-6 pt-10 md:pt-6 transition-all hover:bg-secondary/10 shadow-sm group">
                                        {!editingTransaction && form.items.length > 1 && (
                                            <button
                                                onClick={() => removeItem(index)}
                                                className="absolute top-4 right-4 p-1.5 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[11px] text-muted-foreground uppercase font-black tracking-tighter">Categoria *</Label>
                                                    <Popover open={isCreatingCategory && newCategoryType === item.type} onOpenChange={(o) => {
                                                        setIsCreatingCategory(o);
                                                        setNewCategoryType(item.type);
                                                    }}>
                                                        <PopoverTrigger asChild>
                                                            <button className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold">
                                                                <PlusCircle className="h-3 w-3" /> Criar nova
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-64 p-3 bg-card border-primary/20 shadow-xl" align="end">
                                                            <div className="space-y-2">
                                                                <p className="text-[10px] font-black uppercase text-primary">Nova Categoria de {item.type === 'income' ? 'Entrada' : 'Saída'}</p>
                                                                <Input
                                                                    placeholder="Nome da categoria"
                                                                    className="h-8 text-xs"
                                                                    value={newCategoryName}
                                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                                    onKeyDown={(e) => e.key === 'Enter' && handleQuickCategoryCreate(index)}
                                                                    autoFocus
                                                                />
                                                                <Button
                                                                    className="w-full h-8 text-[10px] font-bold gap-2"
                                                                    size="sm"
                                                                    onClick={() => handleQuickCategoryCreate(index)}
                                                                >
                                                                    <Save className="h-3 w-3" /> Salvar Categoria
                                                                </Button>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                                <Select value={item.category_id} onValueChange={(v) => updateItem(index, "category_id", v)}>
                                                    <SelectTrigger className="h-10 text-xs bg-background/50 border-border/50 rounded-xl"><SelectValue placeholder="Selecione ou clique [+] para criar" /></SelectTrigger>
                                                    <SelectContent>
                                                        {categories.filter(c => c.type === item.type).map((c) => (
                                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[11px] text-muted-foreground uppercase font-black tracking-tighter">Meio de Pagamento</Label>
                                                    <Popover open={isCreatingCategory && newCategoryType === 'method'} onOpenChange={(o) => {
                                                        setIsCreatingCategory(o);
                                                        setNewCategoryType('method');
                                                    }}>
                                                        <PopoverTrigger asChild>
                                                            <button className="text-[10px] text-primary hover:underline flex items-center gap-1 font-bold">
                                                                <PlusCircle className="h-3 w-3" /> Criar novo
                                                            </button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-64 p-3 bg-card border-primary/20 shadow-xl" align="end">
                                                            <div className="space-y-2">
                                                                <p className="text-[10px] font-black uppercase text-primary">Novo Meio de Pagamento</p>
                                                                <Input
                                                                    placeholder="Ex: Cartão Mercado Pago"
                                                                    className="h-8 text-xs"
                                                                    value={newCategoryName}
                                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                                    onKeyDown={(e) => e.key === 'Enter' && handleQuickCategoryCreate(index, 'method')}
                                                                    autoFocus
                                                                />
                                                                <Button
                                                                    className="w-full h-8 text-[10px] font-bold gap-2"
                                                                    size="sm"
                                                                    onClick={() => handleQuickCategoryCreate(index)}
                                                                >
                                                                    <Save className="h-3 w-3" /> Salvar Meio
                                                                </Button>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                                <Select
                                                    value={item.payment_method_id || item.payment_method}
                                                    onValueChange={(v) => updateItem(index, "payment_method", v)}
                                                >
                                                    <SelectTrigger className="h-10 text-xs bg-background/50 border-border/50 rounded-xl"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {categories.filter(c => c.type === 'method').map((m) => (
                                                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-[11px] text-muted-foreground uppercase font-black tracking-tighter">Valor (R$) *</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0,00"
                                                    value={item.amount}
                                                    className="h-12 text-lg font-mono font-bold bg-background text-primary border-primary/20 focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl"
                                                    onChange={(e) => updateItem(index, "amount", e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1.5 flex flex-col justify-end">
                                                <Label className="text-[11px] text-muted-foreground uppercase font-black tracking-tighter">Comprovante / Anexo</Label>
                                                {item.receipt_url ? (
                                                    <div className="flex items-center justify-between p-2.5 bg-success/10 border border-success/30 rounded-2xl">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="h-4 w-4 text-success" />
                                                            <span className="text-[11px] font-bold text-success/90">Anexado</span>
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
                                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                                onClick={() => updateItem(index, "receipt_url", "")}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
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
                                                            className="w-full h-12 border-dashed border-2 bg-primary/5 border-primary/20 hover:bg-primary/10 transition-all rounded-2xl gap-2 text-xs font-black text-primary group"
                                                            asChild
                                                        >
                                                            <label htmlFor={`receipt-${index}`} className="cursor-pointer">
                                                                <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                                                                Upload
                                                            </label>
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="flex flex-col items-center text-center space-y-2 py-4">
                                <div className="h-16 w-16 rounded-[2rem] bg-success/10 border border-success/20 flex items-center justify-center mb-2 shadow-inner">
                                    <CheckCircle2 className="h-8 w-8 text-success" />
                                </div>
                                <h3 className="text-xl font-bold">Resumo Fiscal</h3>
                                <p className="text-muted-foreground text-xs uppercase font-black tracking-widest opacity-60">Confirme os valores do lote</p>
                            </div>

                            <Card className="bg-secondary/10 border-border/50 overflow-hidden rounded-[2.5rem] shadow-sm">
                                <div className="bg-secondary/20 p-6 border-b border-border/50">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Identificação</p>
                                            <p className="text-base font-bold text-foreground leading-tight">{form.description}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Competência</p>
                                            <p className="text-base font-bold text-foreground tabular-nums">{new Date(form.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-success/5 rounded-3xl border border-success/10 shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-1 text-success">
                                                <Plus className="h-3 w-3" />
                                                <p className="text-[9px] font-black uppercase tracking-widest">Entradas</p>
                                            </div>
                                            <p className="text-2xl font-black text-success tabular-nums tracking-tighter">{formatCurrency(totals.income)}</p>
                                        </div>
                                        <div className="p-4 bg-destructive/5 rounded-3xl border border-destructive/10 shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-1 text-destructive">
                                                <Trash2 className="h-3 w-3" />
                                                <p className="text-[9px] font-black uppercase tracking-widest">Saídas</p>
                                            </div>
                                            <p className="text-2xl font-black text-destructive tabular-nums tracking-tighter">{formatCurrency(totals.expense)}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-background/50 rounded-2xl border border-border/30">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground">Saldo Líquido</p>
                                            <p className="text-[9px] text-muted-foreground font-medium italic">Resultado deste lançamento</p>
                                        </div>
                                        <p className={`text-xl font-black tabular-nums tracking-tighter ${totals.income - totals.expense >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                            {formatCurrency(totals.income - totals.expense)}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            <div className="flex items-start gap-4 p-4 bg-orange-500/5 rounded-3xl border border-orange-500/20 text-orange-500">
                                <div className="h-10 w-10 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-tight">Verificação Final</p>
                                    <p className="text-[11px] leading-relaxed opacity-90 line-clamp-2">Os lançamentos confirmados impactam o saldo das contas imediatamente após o salvamento.</p>
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

                    {currentStep < 4 ? (
                        <Button
                            className={`flex-[2] h-11 font-bold group shadow-lg shadow-primary/10 ${currentStep === 1 ? 'hidden' : ''}`}
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
