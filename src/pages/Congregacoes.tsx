import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Pencil, Trash2, Loader2, Users, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import type { Database } from "@/types/database.types";

type Congregation = Database["public"]["Tables"]["congregations"]["Row"];

const emptyForm = { name: "", address: "", responsible_name: "", member_count: "" };

export default function Congregacoes() {
  const { organization } = useChurch();
  const [items, setItems] = useState<Congregation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (organization?.id) fetchCongregations();
  }, [organization?.id]);

  const fetchCongregations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("congregations")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("name");
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      toast.error("Erro ao carregar congregações");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Congregation) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      address: c.address || "",
      responsible_name: c.responsible_name || "",
      member_count: String(c.member_count || 0)
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !organization?.id) return;
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        responsible_name: form.responsible_name,
        member_count: parseInt(form.member_count) || 0,
        organization_id: organization.id,
      };

      if (editingId) {
        const { error } = await supabase.from("congregations").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Congregação atualizada");
      } else {
        const { error } = await supabase.from("congregations").insert([payload]);
        if (error) throw error;
        toast.success("Congregação criada");
      }
      setDialogOpen(false);
      fetchCongregations();
    } catch (err) {
      toast.error("Erro ao salvar congregação");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover esta congregação?")) return;
    try {
      const { error } = await supabase.from("congregations").delete().eq("id", id);
      if (error) throw error;
      toast.success("Congregação removida");
      setItems(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      toast.error("Erro ao remover congregação");
    }
  };

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Congregações</h2>
          <p className="text-muted-foreground text-[12px] mt-1">Gestão de filiais — {organization.name}</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Nova Congregação
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>{editingId ? "Editar Congregação" : "Nova Congregação"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label className="text-[13px]">Nome *</Label><Input placeholder="Nome da congregação" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label className="text-[13px]">Endereço</Label><Input placeholder="Endereço completo" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[13px]">Líder responsável</Label><Input placeholder="Nome do líder" value={form.responsible_name} onChange={(e) => setForm({ ...form, responsible_name: e.target.value })} /></div>
              <div className="space-y-2"><Label className="text-[13px]">Membros</Label><Input type="number" placeholder="0" value={form.member_count} onChange={(e) => setForm({ ...form, member_count: e.target.value })} /></div>
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
                <Input placeholder="Buscar congregações..." className="pl-9 h-9 text-xs" />
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
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Responsável</TableHead>
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Endereço</TableHead>
                  <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Membros</TableHead>
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
                    {items.map((c) => (
                      <TableRow
                        key={c.id}
                        className="group transition-colors odd:bg-transparent even:bg-secondary/10 hover:bg-secondary/20 border-b border-border/50"
                      >
                        <TableCell className="pl-6 py-2 border-r border-border/50 text-center font-bold text-[14px]">
                          {c.name}
                        </TableCell>
                        <TableCell className="text-center border-r border-border/50 py-2 font-medium text-[13px]">
                          {c.responsible_name || "-"}
                        </TableCell>
                        <TableCell className="text-center border-r border-border/50 py-2 text-[12px] text-muted-foreground max-w-[200px] truncate">
                          <div className="flex items-center justify-center gap-1.5">
                            <MapPin className="h-3 w-3 opacity-50" /> {c.address || "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center border-r border-border/50 py-2 font-mono text-[13px] font-bold">
                          <Badge variant="outline" className="h-5 px-2 text-[10px] font-mono tabular-nums border-border/50">
                            {(c.member_count || 0)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
                            <button onClick={() => openEdit(c)} className="p-1 px-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><Pencil className="h-3 w-3" /></button>
                            <button onClick={() => handleDelete(c.id)} className="p-1 px-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && items.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic border-b border-border/50">Nenhuma congregação registrada</TableCell></TableRow>
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
