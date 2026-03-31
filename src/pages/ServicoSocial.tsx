import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Heart, Users, ClipboardCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [form, setForm] = useState({ name: "", address: "", members_count: "1", needs: "", family_id: "", assistance_type: "Cesta Básica", items_count: "1", status: "delivered" });

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

  if (!organization) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Diretoria de Ação Social</h2>
          <p className="text-muted-foreground text-[12px] mt-1">Gestão de auxílio humanitário e apoio a famílias</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-9 text-xs" onClick={() => { setMode("family"); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Família</Button>
          <Button size="sm" className="h-9 text-xs" onClick={() => { setMode("assistance"); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Registrar Auxílio</Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border border-primary/20 shadow-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> {mode === "family" ? "Mapear Família" : "Registrar Auxílio"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            {mode === "family" ? (
              <>
                <div className="space-y-2"><Label className="text-[13px]">Nome da Família / Responsável *</Label><Input value={form.name} className="h-10" onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label className="text-[13px]">Endereço</Label><Input value={form.address} className="h-10" onChange={e => setForm({ ...form, address: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-[13px]">Qtd. Membros</Label><Input type="number" value={form.members_count} className="h-10" onChange={e => setForm({ ...form, members_count: e.target.value })} /></div>
                  <div className="space-y-2"><Label className="text-[13px]">Principais Necessidades</Label><Input placeholder="Ex: Alimentos, Remédios" className="h-10" value={form.needs} onChange={e => setForm({ ...form, needs: e.target.value })} /></div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-[13px]">Selecionar Família *</Label>
                  <Select value={form.family_id} onValueChange={v => setForm({ ...form, family_id: v })}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Selecione a família beneficiada" /></SelectTrigger>
                    <SelectContent>{families.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-[13px]">Qtd. Itens Entregues</Label><Input type="number" value={form.items_count} className="h-10" onChange={e => setForm({ ...form, items_count: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label className="text-[13px]">Status da Entrega</Label>
                    <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="delivered">Entregue</SelectItem><SelectItem value="pending">Pendente</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
            <Button className="w-full h-11 text-base font-bold shadow-lg shadow-primary/10 mt-2" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {mode === "family" ? "Salvar Cadastro" : "Confirmar Entrega"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="asst" className="w-full">
        <TabsList className="bg-secondary/30 p-1 border border-border/50 h-10 mb-4 inline-flex">
          <TabsTrigger value="asst" className="text-xs px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"><ClipboardCheck className="h-3.5 w-3.5 mr-2" /> Registro de Auxílios</TabsTrigger>
          <TabsTrigger value="fam" className="text-xs px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"><Users className="h-3.5 w-3.5 mr-2" /> Famílias Mapeadas</TabsTrigger>
        </TabsList>

        <TabsContent value="asst" className="mt-0 focus-visible:ring-0">
          <Card className="border-border shadow-sm overflow-hidden border-primary/5">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider pl-6">Família Beneficiada</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-center">Data</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-center">Volume</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-right pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={4} className="py-8"><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                    ))
                  ) : assistances.map(a => (
                    <TableRow key={a.id} className="group hover:bg-secondary/5 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                            <Heart className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-foreground leading-tight">{a.families?.name || "Desconhecido"}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{a.assistance_type}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-[12px] font-mono font-medium text-muted-foreground">{new Date(a.delivery_date).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-secondary/50 text-foreground font-mono text-[10px] h-5">{a.items_count} ITENS</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge variant="outline" className={`text-[9px] font-bold px-2 py-0 h-4 border-0 ${a.status === "delivered" ? "bg-success/15 text-success" : "bg-primary/15 text-primary"}`}>
                          {a.status === "delivered" ? "ENTREGUE" : "PENDENTE"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && assistances.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">Nenhum auxílio registrado ainda</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fam" className="mt-0 focus-visible:ring-0">
          <Card className="border-border shadow-sm overflow-hidden border-primary/5">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider pl-6">Família / Responsável</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider">Endereço</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-center">Membros</TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider pr-6">Necessidades</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={4} className="py-8"><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                    ))
                  ) : families.map(f => (
                    <TableRow key={f.id} className="group hover:bg-secondary/5 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center border border-border shrink-0">
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-[13px] font-bold text-foreground">{f.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate"><span className="text-[11px] text-muted-foreground">{f.address || "Sem endereço"}</span></TableCell>
                      <TableCell className="text-center"><Badge variant="outline" className="font-mono text-[10px] h-5">{f.members_count}</Badge></TableCell>
                      <TableCell className="pr-6"><p className="text-[11px] italic text-muted-foreground leading-snug line-clamp-1">{f.needs || "Nenhuma informada"}</p></TableCell>
                    </TableRow>
                  ))}
                  {!loading && families.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">Nenhuma família mapeada</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
