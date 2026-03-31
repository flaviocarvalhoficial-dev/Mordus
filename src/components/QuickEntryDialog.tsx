import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { toast } from "sonner";
import { parseISO, format as formatDateFns } from "date-fns";

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

export function QuickEntryDialog({ onSuccess }: { onSuccess?: () => void }) {
    const { organization } = useChurch();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        description: "",
        amount: "",
        category_id: "",
        type: "income" as "income" | "expense",
        payment_method: "Dinheiro",
        occasion: ""
    });

    useEffect(() => {
        if (open && organization?.id) {
            fetchCategories();
        }
    }, [open, organization?.id]);

    const fetchCategories = async () => {
        const { data } = await supabase
            .from("categories")
            .select("id, name, type")
            .eq("organization_id", organization!.id);
        setCategories(data || []);
    };

    const handleSave = async () => {
        if (!form.description || !form.amount || !organization?.id) {
            toast.error("Preencha os campos obrigatórios");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from("transactions").insert([{
                organization_id: organization.id,
                type: form.type,
                category_id: form.category_id || null,
                amount: parseFloat(form.amount),
                date: form.date,
                description: form.description,
                payment_method: form.payment_method,
                occasion: form.occasion || null
            }]);

            if (error) throw error;

            toast.success("Lançamento rápido realizado!");
            setOpen(false);
            setForm({
                date: new Date().toISOString().split('T')[0],
                description: "",
                amount: "",
                category_id: "",
                type: "income",
                payment_method: "Dinheiro",
                occasion: ""
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            toast.error("Erro ao salvar lançamento");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-9 px-4 text-xs font-semibold gap-2 border-primary/20 hover:bg-primary/5 shadow-sm">
                    <Plus className="h-4 w-4 text-primary" />
                    Lançamento Rápido
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Lançamento Rápido</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex bg-secondary/30 p-1 rounded-lg">
                        <button
                            onClick={() => setForm({ ...form, type: 'income' })}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${form.type === 'income' ? 'bg-background text-success shadow-sm' : 'text-muted-foreground'}`}
                        >
                            Entrada
                        </button>
                        <button
                            onClick={() => setForm({ ...form, type: 'expense' })}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${form.type === 'expense' ? 'bg-background text-destructive shadow-sm' : 'text-muted-foreground'}`}
                        >
                            Saída
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[12px]">Data</Label>
                        <DatePicker
                            date={form.date ? parseISO(form.date) : undefined}
                            onChange={(date) => setForm({
                                ...form,
                                date: date ? formatDateFns(date, "yyyy-MM-dd") : ""
                            })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-[12px]">Valor (R$)</Label>
                            <Input type="number" step="0.01" placeholder="0,00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[12px]">Categoria</Label>
                            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                    {categories.filter(c => c.type === form.type).map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[12px]">Ocasião / Evento</Label>
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
                            <SelectTrigger className="h-10"><SelectValue placeholder="Selecione a ocasião" /></SelectTrigger>
                            <SelectContent>
                                {OCCASIONS.map(oc => (
                                    <SelectItem key={oc} value={oc}>{oc}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[12px]">Descrição</Label>
                        <Input placeholder="Ex: Oferta de Culto" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>

                    <Button className="w-full mt-2 font-bold" onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Lançamento
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
