import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Crown, Pencil, Loader2, Phone, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { parseISO, format as formatDateFns } from "date-fns";
import type { Database } from "@/types/database.types";

type Leader = Database["public"]["Tables"]["leaders"]["Row"];

const roleLabels: Record<string, { label: string; color: string }> = {
  pastor_presidente: { label: "Pastor Presidente", color: "bg-primary/15 text-primary" },
  pastor_auxiliar: { label: "Pastor Auxiliar", color: "bg-chart-blue/15 text-chart-blue" },
  pastor_interino: { label: "Pastor Interino", color: "bg-chart-blue/15 text-chart-blue" },
  presbitero: { label: "Presbítero", color: "bg-success/15 text-success" },
  diacono: { label: "Diácono", color: "bg-chart-pink/15 text-chart-pink" },
  auxiliar: { label: "Auxiliar", color: "bg-muted text-muted-foreground" },
};

const emptyForm = { name: "", role: "auxiliar", phone: "", appointment_date: "" };

export default function Lideranca() {
  const { organization } = useChurch();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (organization?.id) fetchLeaders();
  }, [organization?.id]);

  const fetchLeaders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("leaders")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("name");
      if (error) throw error;
      setLeaders(data || []);
    } catch (err) {
      toast.error("Erro ao carregar liderança");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (l: Leader) => {
    setEditingId(l.id);
    setForm({
      name: l.name,
      role: l.role || "auxiliar",
      phone: l.phone || "",
      appointment_date: l.appointment_date || ""
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !organization?.id) return;
    setIsSaving(true);
    try {
      const payload = { ...form, organization_id: organization.id };
      if (editingId) {
        const { error } = await supabase.from("leaders").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("leaders").insert([payload]);
        if (error) throw error;
      }
      setDialogOpen(false);
      fetchLeaders();
      toast.success(editingId ? "Líder atualizado" : "Líder cadastrado");
    } catch (err) {
      toast.error("Erro ao salvar líder");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este líder?")) return;
    try {
      const { error } = await supabase.from("leaders").delete().eq("id", id);
      if (error) throw error;
      setLeaders(prev => prev.filter(l => l.id !== id));
      toast.success("Líder removido");
    } catch (err) {
      toast.error("Erro ao remover");
    }
  };

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  const roleOrder = Object.keys(roleLabels);
  const sorted = [...leaders].sort((a, b) => roleOrder.indexOf(a.role || "auxiliar") - roleOrder.indexOf(b.role || "auxiliar"));

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Liderança Ministerial</h2>
          <p className="text-muted-foreground text-[12px] mt-1">Quadro de ministros da {organization.name}</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Novo Líder
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{editingId ? "Editar Líder" : "Cadastrar Líder"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-[13px]">Nome Completo *</Label>
              <Input placeholder="Ex: Pr. João da Silva" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Cargo</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([val, { label }]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Telefone</Label>
                <Input placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Data de Posse (Opcional)</Label>
              <DatePicker
                date={form.appointment_date ? parseISO(form.appointment_date) : undefined}
                onChange={(date) => setForm({
                  ...form,
                  appointment_date: date ? formatDateFns(date, "yyyy-MM-dd") : ""
                })}
              />
            </div>
            <div className="flex justify-center pt-2">
              <Button className="w-full sm:w-[140px]" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card border-border"><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {sorted.map((leader) => {
            const roleInfo = roleLabels[leader.role || "auxiliar"] || roleLabels.auxiliar;
            return (
              <Card key={leader.id} className="bg-card border-border hover:bg-secondary/20 transition-all border-l-4 border-l-primary/40">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <Crown className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-foreground leading-tight">{leader.name}</p>
                        <Badge className={`${roleInfo.color} border-0 text-[10px] mt-1.5 uppercase tracking-wide px-2 py-0 h-4`}>{roleInfo.label}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(leader)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-primary">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(leader.id)} className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    {leader.phone && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        <Phone className="h-3 w-3 text-primary opacity-50" /> {leader.phone}
                      </div>
                    )}
                    {leader.appointment_date && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3 text-primary opacity-50" />
                        Posse: {new Date(leader.appointment_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!loading && sorted.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground italic">Nenhum líder cadastrado</div>
          )}
        </div>
      )}
    </div>
  );
}
