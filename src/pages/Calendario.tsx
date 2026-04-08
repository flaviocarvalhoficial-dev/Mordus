import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, Loader2, Calendar as CalIcon, Clock, Tag, LayoutDashboard, List, LayoutGrid, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { parseISO, format as formatDateFns, isSameDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
  const [view, setView] = useState<"list" | "calendar" | "board">("board");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const eventsOnSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(ev => isSameDay(parseISO(ev.date), selectedDate));
  }, [events, selectedDate]);

  const eventDates = useMemo(() => {
    return events.map(ev => parseISO(ev.date));
  }, [events]);

  // Logic for the full gridboard
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Agenda Geral</h2>
          <p className="text-muted-foreground text-[12px] mt-1">Gestão de atividades institucionais</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as any)} className="bg-secondary/20 p-1 rounded-xl border border-border/50">
            <TabsList className="bg-transparent h-8 p-0 gap-1">
              <TabsTrigger value="board" className="h-7 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
                Mural
              </TabsTrigger>
              <TabsTrigger value="calendar" className="h-7 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                Mapa
              </TabsTrigger>
              <TabsTrigger value="list" className="h-7 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                <List className="h-3.5 w-3.5 mr-1.5" />
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs font-bold rounded-xl shadow-sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Novo Evento
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border rounded-2xl">
          <DialogHeader><DialogTitle className="text-base font-bold">{editingId ? "Editar Evento" : "Novo Evento"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold">Nome do Evento</Label>
              <Input placeholder="Ex: Vigília mensal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">Data</Label>
                <DatePicker
                  date={form.date ? new Date(form.date + 'T12:00:00') : undefined}
                  onChange={(date) => setForm({
                    ...form,
                    date: date ? formatDateFns(date, "yyyy-MM-dd") : ""
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-semibold">Tipo de Evento</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">{eventTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full h-10 font-bold rounded-xl mt-2" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Atualizar Evento" : "Salvar Evento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {view === "board" ? (
        <Card className="bg-card border-border shadow-md rounded-2xl overflow-hidden border-t-2 border-t-primary/10 h-full min-h-[700px] flex flex-col">
          <CardHeader className="bg-secondary/5 border-b border-border/50 py-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-base font-bold capitalize">
                {formatDateFns(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </CardTitle>
              <div className="flex items-center gap-1 bg-background/50 p-1 rounded-lg border border-border/50">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase" onClick={() => setCurrentMonth(new Date())}>
                  Hoje
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {eventTypes.map(t => (
                <div key={t} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/30 border border-border/50">
                  <div className={cn("w-1.5 h-1.5 rounded-full",
                    t === "Espiritual" ? "bg-amber-400" :
                      t === "Evento" ? "bg-primary" :
                        t === "Missões" ? "bg-emerald-400" :
                          t === "Departamento" ? "bg-blue-400" :
                            t === "Institucional" ? "bg-slate-400" : "bg-purple-400"
                  )} />
                  <span className="text-[10px] font-medium text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="grid grid-cols-7 border-b border-border/50">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                <div key={day} className="py-2 text-center text-[11px] font-bold text-muted-foreground uppercase bg-secondary/5">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1">
              {days.map((day, i) => {
                const dayEvents = events.filter(ev => isSameDay(parseISO(ev.date), day));
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[120px] border-r border-b border-border/30 p-2 transition-all hover:bg-secondary/5 relative group cursor-pointer",
                      !isCurrentMonth && "bg-secondary/5 opacity-40",
                      i % 7 === 6 && "border-r-0"
                    )}
                    onClick={() => { setSelectedDate(day); setView("calendar"); }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        "text-[12px] font-black tabular-nums",
                        isToday ? "bg-primary text-primary-foreground h-6 w-6 rounded-full flex items-center justify-center shadow-sm" : "text-muted-foreground/60"
                      )}>
                        {formatDateFns(day, "d")}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setForm({ ...emptyForm, date: formatDateFns(day, "yyyy-MM-dd") }); setDialogOpen(true); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded-md text-primary"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 4).map(ev => (
                        <div
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); openEdit(ev); }}
                          className={cn(
                            "px-2 py-1 rounded text-[10px] font-bold truncate transition-all hover:brightness-95 shadow-sm border-l-2",
                            ev.type === "Espiritual" ? "bg-amber-100/80 text-amber-800 border-amber-400" :
                              ev.type === "Evento" ? "bg-primary/10 text-primary border-primary" :
                                ev.type === "Missões" ? "bg-emerald-100/80 text-emerald-800 border-emerald-400" :
                                  ev.type === "Departamento" ? "bg-blue-100/80 text-blue-800 border-blue-400" :
                                    ev.type === "Institucional" ? "bg-slate-100/80 text-slate-800 border-slate-400" :
                                      "bg-purple-100/80 text-purple-800 border-purple-400"
                          )}
                        >
                          {ev.name}
                        </div>
                      ))}
                      {dayEvents.length > 4 && (
                        <div className="text-[9px] font-black text-muted-foreground/40 text-center uppercase tracking-tighter">
                          + {dayEvents.length - 4} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : view === "calendar" ? (
        <div className="grid gap-6 md:grid-cols-[400px_1fr]">
          <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden border-t-2 border-t-primary/10">
            <CardHeader className="bg-secondary/5 border-b border-border/50 py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CalIcon className="h-4 w-4 text-primary" /> Visualização Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                className="p-4"
                modifiers={{ event: eventDates }}
                modifiersClassNames={{
                  event: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full"
                }}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                {selectedDate ? (
                  <>Eventos para {formatDateFns(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</>
                ) : (
                  <>Selecione um dia</>
                )}
                <Badge variant="secondary" className="bg-primary/5 text-primary text-[10px] h-5">{eventsOnSelectedDay.length}</Badge>
              </h3>
            </div>

            <div className="grid gap-3 h-fit">
              {eventsOnSelectedDay.length > 0 ? (
                eventsOnSelectedDay.map((ev) => (
                  <Card key={ev.id} className="bg-card border-border hover:border-primary/20 transition-all group rounded-2xl shadow-sm border-l-4 border-l-primary/30">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] font-black uppercase text-primary border-primary/20 bg-primary/5 h-5">{ev.type || "Evento"}</Badge>
                        </div>
                        <h4 className="text-[14px] font-bold text-foreground mt-2 truncate group-hover:text-primary transition-colors">{ev.name}</h4>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(ev)} className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-primary transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(ev.id)} className="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="py-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center px-6">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <Info className="h-5 w-5 text-muted-foreground opacity-30" />
                  </div>
                  <p className="text-xs text-muted-foreground italic">Nenhum evento registrado para esta data</p>
                  <Button variant="link" className="text-[11px] font-bold uppercase tracking-tight h-auto mt-2 p-0 text-primary" onClick={openCreate}>Criar Novo Evento</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4 flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div>
                  <Skeleton className="h-6 w-20" />
                </CardContent>
              </Card>
            ))
          ) : (
            events.map((ev) => {
              const dateObj = parseISO(ev.date + 'T12:00:00');
              const day = dateObj.getDate();
              const month = monthNames[dateObj.getMonth()];

              return (
                <Card key={ev.id} className="bg-card border-border hover:bg-secondary/10 transition-all group overflow-hidden border-l-4 border-l-primary/20 shadow-sm rounded-2xl">
                  <CardContent className="p-4 flex items-center gap-5">
                    <div className="h-14 w-14 rounded-xl bg-secondary/50 flex flex-col items-center justify-center shrink-0 border border-border/50 shadow-inner">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">{month}</span>
                      <span className="text-[18px] font-black text-foreground leading-tight">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-black uppercase text-primary/70 border-primary/10 bg-primary/5 h-4.5">{ev.type || "Evento"}</Badge>
                      </div>
                      <h3 className="text-[14px] font-bold text-foreground leading-snug truncate mt-1.5 group-hover:text-primary transition-colors">{ev.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(ev)} className="p-2 hover:bg-secondary rounded-xl text-muted-foreground hover:text-primary transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(ev.id)} className="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
          {events.length === 0 && !loading && (
            <div className="py-24 text-center text-muted-foreground italic bg-secondary/10 rounded-3xl border-2 border-dashed border-border flex flex-col items-center gap-4">
              <CalIcon className="h-10 w-10 opacity-10" />
              <p className="text-sm">Nenhum evento agendado</p>
              <Button variant="outline" className="text-xs h-8 border-dashed rounded-xl" onClick={openCreate}>Começar Agenda</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
