import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, User, Pencil, Trash2, Loader2, Handshake, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import type { Database } from "@/types/database.types";

type Partner = Database["public"]["Tables"]["partners"]["Row"];

const emptyForm = { name: "", field: "", status: "Ativo", support: "" };

export default function Parceiros() {
  const { organization } = useChurch();
  const [items, setItems] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (organization?.id) fetchPartners();
  }, [organization?.id]);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("name");
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      toast.error("Erro ao carregar parceiros");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: Partner) => { setEditingId(p.id); setForm({ name: p.name, field: p.field || "", status: p.status || "Ativo", support: p.support || "" }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !organization?.id) return;
    setIsSaving(true);
    try {
      const payload = { ...form, organization_id: organization.id };
      if (editingId) {
        const { error } = await supabase.from("partners").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("partners").insert([payload]);
        if (error) throw error;
      }
      setDialogOpen(false);
      fetchPartners();
      toast.success(editingId ? "Parceiro atualizado" : "Parceiro adicionado");
    } catch (err) {
      toast.error("Erro ao salvar parceiro");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este parceiro?")) return;
    try {
      const { error } = await supabase.from("partners").delete().eq("id", id);
      if (error) throw error;
      toast.success("Parceiro removido");
      setItems(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error("Erro ao remover parceiro");
    }
  };

  const isMonetary = (val: string | null) => {
    if (!val) return false;
    const numericOnly = val.replace(/[^0-9]/g, "");
    return numericOnly.length > 0 && /^[0-9., \s]+$/.test(val.replace("R$", "").trim());
  };

  const formatSupportValue = (val: string | null) => {
    if (!val) return "Sob demanda";
    if (isMonetary(val)) {
      const hasCurrency = val.includes("R$");
      return `${hasCurrency ? "" : "R$ "}${val}`;
    }
    return val;
  };

  if (!organization) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Relacionamento & Parcerias</h2>
          <p className="text-muted-foreground text-[12px] mt-1">Gestão de parceiros missionários e institucionais</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Novo Parceiro
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border shadow-2xl border-primary/20">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Handshake className="h-5 w-5 text-primary" /> {editingId ? "Editar Parceiro" : "Novo Parceiro"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label className="text-[13px]">Nome da Instituição / Pessoa *</Label><Input placeholder="Ex: Missionário João" className="h-10" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[13px]">Campo / Localidade</Label><Input placeholder="Ex: Sertão, África" className="h-10" value={form.field} onChange={(e) => setForm({ ...form, field: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[13px]">Apoio Mensal</Label><Input placeholder="Ex: R$ 500,00" className="h-10" value={form.support} onChange={(e) => setForm({ ...form, support: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px]">Status da Parceria</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Ativo">Ativo</SelectItem><SelectItem value="Inativo">Inativo</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="flex justify-center pt-2">
              <Button
                className="w-full sm:w-[160px] h-11 text-sm font-bold shadow-lg shadow-primary/10 mt-2"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Atualizar" : "Salvar Parceiro"}
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
                <Input placeholder="Buscar por nome..." className="pl-9 h-9 text-xs" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-340px)] w-full">
            <Table className="border-collapse border border-border/50">
              <TableHeader className="sticky top-0 bg-secondary/20 backdrop-blur-sm z-10 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50 pl-6">Nome / Instituição</TableHead>
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Campo / Localidade</TableHead>
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Status</TableHead>
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Apoio Mensal</TableHead>
                  <TableHead className="w-[6%] text-[11px] font-black text-muted-foreground text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6 border-r border-border/50"><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell className="border-r border-border/50"><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell className="border-r border-border/50"><Skeleton className="h-4 w-full" /></TableCell>
                      <TableCell className="border-r border-border/50"><Skeleton className="h-6 w-full" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-lg" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {items.map((p) => (
                      <TableRow
                        key={p.id}
                        className="group transition-colors odd:bg-transparent even:bg-secondary/10 hover:bg-secondary/20 border-b border-border/50"
                      >
                        <TableCell className="pl-6 py-2 border-r border-border/50 text-center font-bold text-[14px]">
                          {p.name}
                        </TableCell>
                        <TableCell className="text-center border-r border-border/50 py-2 text-[13px] text-muted-foreground">
                          <div className="flex items-center justify-center gap-1.5 uppercase tracking-wider font-semibold text-[10px]">
                            <Globe className="h-3 w-3 text-primary/50" /> {p.field || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center border-r border-border/50 py-2">
                          <Badge variant="outline" className={`border-border/50 text-[10px] font-bold h-5 px-2 ${p.status === "Ativo" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                            {p.status?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center border-r border-border/50 py-2 font-mono text-[13px] font-bold">
                          {formatSupportValue(p.support)}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
                            <button onClick={() => openEdit(p)} className="p-1 px-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><Pencil className="h-3 w-3" /></button>
                            <button onClick={() => handleDelete(p.id)} className="p-1 px-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && items.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic border-b border-border/50">Nenhum parceiro registrado</TableCell></TableRow>
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
