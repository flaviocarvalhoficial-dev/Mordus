import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, Loader2, Calendar as CalIcon, Clock, Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { parseISO, format as formatDateFns } from "date-fns";
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
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Calendário Geral</h2>
          <p className="text-muted-foreground text-[12px] mt-1">Agenda de atividades e eventos oficiais</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs" onClick={openCreate}>
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
                <DatePicker
                  date={form.date ? parseISO(form.date) : undefined}
                  onChange={(date) => setForm({
                    ...form,
                    date: date ? formatDateFns(date, "yyyy-MM-dd") : ""
                  })}
                />
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
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-card border-border shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {events.map((ev) => {
            const dateObj = new Date(ev.date + 'T12:00:00');
            const day = dateObj.getDate();
            const month = monthNames[dateObj.getMonth()];

            return (
              <Card key={ev.id} className="bg-card border-border hover:bg-secondary/20 transition-all group overflow-hidden border-l-4 border-l-primary/40 shadow-sm">
                <CardContent className="p-4 flex items-center gap-5">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0 border border-primary/20 shadow-inner">
                    <span className="text-[10px] font-bold text-primary uppercase leading-tight">{month}</span>
                    <span className="text-[18px] font-black text-primary leading-tight">{day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-foreground leading-snug truncate group-hover:text-primary transition-colors">{ev.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                        <Tag className="h-3 w-3 text-primary/50" />
                        {ev.type || "Evento"}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                        <Clock className="h-3 w-3 text-primary/50" />
                        Confirmado
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(ev)} className="p-2 hover:bg-background rounded-lg text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-border">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(ev.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors border border-transparent hover:border-border">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {events.length === 0 && (
            <div className="py-20 text-center text-muted-foreground italic bg-secondary/10 rounded-2xl border-2 border-dashed border-border">
              Nenhum evento agendado para o período
            </div>
          )}
        </div>
      )}
    </div>
  );
}
