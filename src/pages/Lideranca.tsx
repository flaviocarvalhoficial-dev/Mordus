import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Crown, Pencil, Loader2, Phone, Calendar, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
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

      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-secondary/10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome..." className="pl-9 h-9 text-xs" onChange={(e) => {/* Add search logic if needed */ }} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-340px)] w-full">
            <Table className="border-collapse border border-border/50">
              <TableHeader className="sticky top-0 bg-secondary/20 backdrop-blur-sm z-10 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50 pl-6">Nome</TableHead>
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Cargo</TableHead>
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Telefone</TableHead>
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Data de Posse</TableHead>
                  <TableHead className="w-[6%] text-[11px] font-black text-muted-foreground text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6 border-r border-border/50"><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell className="border-r border-border/50"><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell className="border-r border-border/50"><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell className="border-r border-border/50"><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {sorted.map((leader) => {
                      const roleInfo = roleLabels[leader.role || "auxiliar"] || roleLabels.auxiliar;
                      return (
                        <TableRow
                          key={leader.id}
                          className="group transition-colors odd:bg-transparent even:bg-secondary/10 hover:bg-secondary/20 border-b border-border/50"
                        >
                          <TableCell className="pl-6 py-2 border-r border-border/50 text-center font-bold text-[14px]">
                            {leader.name}
                          </TableCell>
                          <TableCell className="text-center border-r border-border/50 py-2">
                            <Badge variant="outline" className={`${roleInfo.color} border-border/50 text-[11px] font-medium h-6 px-2 py-0`}>
                              {roleInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center border-r border-border/50 py-2 font-mono text-[13px]">
                            {leader.phone || "-"}
                          </TableCell>
                          <TableCell className="text-center border-r border-border/50 py-2 font-mono text-[13px]">
                            {leader.appointment_date ? new Date(leader.appointment_date + 'T12:00:00').toLocaleDateString('pt-BR') : "-"}
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
                              <button onClick={() => openEdit(leader)} className="p-1 px-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><Pencil className="h-3 w-3" /></button>
                              <button onClick={() => handleDelete(leader.id)} className="p-1 px-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!loading && sorted.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic border-b border-border/50">Nenhum líder cadastrado</TableCell></TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
