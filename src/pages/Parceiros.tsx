import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Globe, User, Pencil, Trash2, Loader2, Handshake } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <Card key={p.id} className="bg-card border-border hover:bg-secondary/20 transition-all border-l-4 border-l-primary/40 group overflow-hidden shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                        <Globe className="h-3 w-3 text-primary/50" /> {p.field || "Campo não informado"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-primary transition-colors border border-transparent hover:border-border"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-destructive/10 rounded-md text-muted-foreground hover:text-destructive transition-colors border border-transparent hover:border-border"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <Badge variant="secondary" className={`border-0 text-[11px] font-bold h-4 px-2 ${p.status === "Ativo" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{p.status?.toUpperCase()}</Badge>
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {isMonetary(p.support) && (
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight whitespace-nowrap">Apoio:</span>
                    )}
                    <span className="text-[11px] font-black text-foreground bg-secondary/50 px-2 py-0.5 rounded-full border border-border/50 truncate">
                      {formatSupportValue(p.support)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl bg-secondary/10 italic">
              Nenhum parceiro missionário registrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
