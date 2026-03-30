import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import type { Database } from "@/types/database.types";

type Family = { id: string; name: string; address?: string; members_count?: number; needs?: string };
type Assistance = { id: string; family_id?: string; assistance_type: string; delivery_date: string; items_count: number; status: string; families?: Family };

export default function ServicoSocial() {
  const { organization } = useChurch();
  const [families, setFamilies] = useState<Family[]>([]);
  const [assistances, setAssistances] = useState<Assistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<"family" | "assistance">("family");
  const [form, setForm] = useState({ name: "", address: "", members_count: "1", needs: "", family_id: "", assistance_type: "Cesta Básica", items_count: "10", status: "delivered" });

  useEffect(() => {
    if (organization?.id) fetchData();
  }, [organization?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: fams }, { data: assts }] = await Promise.all([
        supabase.from("families").select("*").eq("organization_id", organization!.id).order("name"),
        supabase.from("social_assistance").select("*, families(name)").eq("organization_id", organization!.id).order("delivery_date", { ascending: false })
      ]);
      setFamilies(fams || []);
      setAssistances((assts as any) || []);
    } catch (err) {
      toast.error("Erro ao carregar dados sociais");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization?.id) return;
    setIsSaving(true);
    try {
      if (mode === "family") {
        if (!form.name) return;
        const { error } = await supabase.from("families").insert([{ name: form.name, address: form.address, members_count: parseInt(form.members_count), needs: form.needs, organization_id: organization.id }]);
        if (error) throw error;
        toast.success("Família registrada");
      } else {
        if (!form.family_id) return;
        const { error } = await supabase.from("social_assistance").insert([{ family_id: form.family_id, assistance_type: form.assistance_type, items_count: parseInt(form.items_count), status: form.status, organization_id: organization.id }]);
        if (error) throw error;
        toast.success("Entrega registrada");
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error("Erro ao salvar registro");
    } finally {
      setIsSaving(false);
    }
  };

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Serviço Social</h1>
            <p className="text-muted-foreground text-[13px] mt-1">Gestão de auxílio humanitário — {organization.name}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setMode("family"); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Família</Button>
            <Button size="sm" onClick={() => { setMode("assistance"); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Auxílio</Button>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>{mode === "family" ? "Mapear Família" : "Registrar Auxílio"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              {mode === "family" ? (
                <>
                  <div className="space-y-2"><Label className="text-[13px]">Nome da Família / Responsável *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label className="text-[13px]">Endereço</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[13px]">Membros</Label><Input type="number" value={form.members_count} onChange={e => setForm({ ...form, members_count: e.target.value })} /></div>
                    <div className="space-y-2"><Label className="text-[13px]">Necessidades</Label><Input placeholder="Ex: Alimentos, Remédios" value={form.needs} onChange={e => setForm({ ...form, needs: e.target.value })} /></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-[13px]">Família Selecionada *</Label>
                    <Select value={form.family_id} onValueChange={v => setForm({ ...form, family_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione a família" /></SelectTrigger>
                      <SelectContent>{families.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[13px]">Qtd. Itens</Label><Input type="number" value={form.items_count} onChange={e => setForm({ ...form, items_count: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label className="text-[13px]">Status</Label>
                      <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="delivered">Entregue</SelectItem><SelectItem value="pending">Pendente</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
              <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar Registro
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="asst">
          <TabsList className="bg-secondary/40 border border-border">
            <TabsTrigger value="asst" className="text-xs">Entregas de Auxílio</TabsTrigger>
            <TabsTrigger value="fam" className="text-xs">Famílias Mapeadas</TabsTrigger>
          </TabsList>

          <TabsContent value="asst">
            <Card className="mt-4 border-border overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Família</TableHead><TableHead>Data</TableHead><TableHead>Itens</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : assistances.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="text-[13px] font-medium">{a.families?.name || "Desconhecido"}</TableCell>
                        <TableCell className="text-xs font-mono">{new Date(a.delivery_date).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="text-xs">{a.items_count} Itens</TableCell>
                        <TableCell><Badge className={a.status === "delivered" ? "bg-success/15 text-success border-0" : "bg-primary/15 text-primary border-0"}>{a.status === "delivered" ? "Entregue" : "Pendente"}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {!loading && assistances.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma entrega registrada</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fam">
            <Card className="mt-4 border-border overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Família</TableHead><TableHead>Endereço</TableHead><TableHead>Membros</TableHead><TableHead>Necessidades</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                    ) : families.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="text-[13px] font-medium">{f.name}</TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">{f.address || "-"}</TableCell>
                        <TableCell className="text-xs">{f.members_count}</TableCell>
                        <TableCell className="text-xs italic text-muted-foreground">{f.needs || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {!loading && families.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma família mapeada</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
