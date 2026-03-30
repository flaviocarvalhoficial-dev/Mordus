import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, Loader2, Calendar as CalIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import type { Database } from "@/types/database.types";

type CalEvent = Database["public"]["Tables"]["events"]["Row"];

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const eventTypes = ["Espiritual", "Evento", "Missões", "Departamento", "Institucional", "Educação"];
const emptyForm = { name: "", date: "", type: "Evento" };

export default function Calendario() {
  const { organization } = useChurch();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (organization?.id) fetchEvents();
  }, [organization?.id]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("date");
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      toast.error("Erro ao carregar calendário");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (ev: CalEvent) => { setEditingId(ev.id); setForm({ name: ev.name, date: ev.date, type: ev.type || "Evento" }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.date || !organization?.id) return;
    setIsSaving(true);
    try {
      const payload = { ...form, organization_id: organization.id };
      if (editingId) {
        const { error } = await supabase.from("events").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Evento atualizado");
      } else {
        const { error } = await supabase.from("events").insert([payload]);
        if (error) throw error;
        toast.success("Evento adicionado");
      }
      setDialogOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error("Erro ao salvar evento");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este evento?")) return;
    try {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
      toast.success("Evento removido");
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      toast.error("Erro ao remover evento");
    }
  };

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Calendário Anual</h1>
            <p className="text-muted-foreground text-[13px] mt-1">Gestão de eventos — {organization.name}</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Novo Evento
          </Button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{editingId ? "Editar Evento" : "Novo Evento"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Nome do Evento *</Label>
                <Input placeholder="Ex: Vigília mensal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[13px]">Data *</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{eventTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
        ) : (
          <div className="grid gap-3">
            {events.map((event) => {
              const d = new Date(event.date + "T12:00:00"); // Fix UTC shift
              return (
                <Card key={event.id} className="bg-card border-border hover:bg-secondary/20 transition-all border-l-4 border-l-primary/40">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0 border border-primary/20">
                      <span className="text-[9px] text-primary font-bold uppercase">{monthNames[d.getMonth()]}</span>
                      <span className="text-lg font-bold text-primary leading-none">{d.getDate()}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-semibold text-foreground">{event.name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{d.toLocaleDateString("pt-BR", { weekday: "long" })}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-secondary/30">{event.type}</Badge>
                    <div className="flex gap-1 ml-4">
                      <button onClick={() => openEdit(event)} className="p-2 hover:bg-secondary rounded-lg transition-all text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(event.id)} className="p-2 hover:bg-secondary rounded-lg transition-all text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {events.length === 0 && (
              <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-xl">
                <CalIcon className="h-10 w-10 opacity-20" />
                Nenhum evento registrado no calendário
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
