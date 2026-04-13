import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Pencil, Trash2, Loader2, Users, Search, ChevronDown, ChevronUp, Type, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { TableToolbar } from "@/components/TableToolbar";
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

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [congregationMembers, setCongregationMembers] = useState<Record<string, any[]>>({});
  const [membersLoading, setMembersLoading] = useState<Record<string, boolean>>({});

  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("asc");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["name", "responsible", "address", "members"]);

  useEffect(() => {
    if (organization?.id) fetchCongregations();
  }, [organization?.id, sortField, sortOrder]);

  const fetchCongregations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("congregations")
        .select(`
          *,
          members:members(count)
        `)
        .eq("organization_id", organization!.id)
        .order(sortField, { ascending: sortOrder === 'asc' });
      if (error) throw error;

      const congregationsWithCount = (data || []).map(c => ({
        ...c,
        real_member_count: (c as any).members?.[0]?.count || 0
      }));
      setItems(congregationsWithCount);
    } catch (err) {
      toast.error("Erro ao carregar congregações");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembersForCongregation = async (congId: string) => {
    if (congregationMembers[congId]) return;
    try {
      setMembersLoading(prev => ({ ...prev, [congId]: true }));
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("congregation_id", congId)
        .order("full_name");
      if (error) throw error;
      setCongregationMembers(prev => ({ ...prev, [congId]: data || [] }));
    } catch (err) {
      toast.error("Erro ao carregar membros");
    } finally {
      setMembersLoading(prev => ({ ...prev, [congId]: false }));
    }
  };

  const handleToggleExpand = (congId: string) => {
    const isExpanding = expandedId !== congId;
    setExpandedId(isExpanding ? congId : null);
    if (isExpanding) {
      fetchMembersForCongregation(congId);
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

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("Deseja realmente remover esta congregação?")) return;

    try {
      // Check if there are real members linked, regardless of the 'member_count' field
      const { count, error: countError } = await supabase
        .from("members")
        .select("*", { count: 'exact', head: true })
        .eq("congregation_id", id);

      if (countError) throw countError;

      if (count && count > 0) {
        toast.error(`Não é possível remover: existem ${count} membro(s) vinculados a esta congregação.`, {
          description: "Mova-os para outra congregação antes de excluir."
        });
        return;
      }

      const { error } = await supabase.from("congregations").delete().eq("id", id);
      if (error) throw error;
      toast.success("Congregação removida");
      setItems(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao remover congregação", {
        description: err.message?.includes("foreign key")
          ? "Existem registros vinculados que impedem a exclusão."
          : "Tente novamente em instantes."
      });
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
            <div className="space-y-2">
              <Label className="text-[13px]">Líder responsável</Label>
              <Input placeholder="Nome do líder" value={form.responsible_name} onChange={(e) => setForm({ ...form, responsible_name: e.target.value })} />
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
              <TableToolbar
                sortField={sortField}
                onSortFieldChange={setSortField}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                sortOptions={[
                  { field: 'name', label: 'Nome', icon: <Type /> },
                  { field: 'responsible_name', label: 'Responsável', icon: <User /> },
                  { field: 'member_count', label: 'Membros', icon: <Users /> },
                ]}
                visibleColumns={visibleColumns}
                onToggleColumn={(id) => setVisibleColumns(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])}
                columnOptions={[
                  { id: "name", label: "Nome" },
                  { id: "responsible", label: "Responsável" },
                  { id: "address", label: "Endereço" },
                  { id: "members", label: "Membros" },
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-340px)] w-full">
            <Table className="border-collapse border border-border/50">
              <TableHeader className="sticky top-0 bg-secondary/20 backdrop-blur-sm z-10 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10 text-center border-r border-border/50 px-2"></TableHead>
                  {visibleColumns.includes("name") && <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Nome</TableHead>}
                  {visibleColumns.includes("responsible") && <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Responsável</TableHead>}
                  {visibleColumns.includes("address") && <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Endereço</TableHead>}
                  {visibleColumns.includes("members") && <TableHead className="text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Membros</TableHead>}
                  <TableHead className="w-[6%] text-[11px] font-black text-muted-foreground text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="border-r border-border/50"></TableCell>
                      {visibleColumns.includes("name") && <TableCell className="border-r border-border/50"><Skeleton className="h-4 w-full" /></TableCell>}
                      {visibleColumns.includes("responsible") && <TableCell className="border-r border-border/50"><Skeleton className="h-4 w-full" /></TableCell>}
                      {visibleColumns.includes("address") && <TableCell className="border-r border-border/50"><Skeleton className="h-4 w-full" /></TableCell>}
                      {visibleColumns.includes("members") && <TableCell className="border-r border-border/50"><Skeleton className="h-4 w-full" /></TableCell>}
                      <TableCell><Skeleton className="h-4 w-8 rounded ml-auto mr-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {items.map((c) => (
                      <React.Fragment key={c.id}>
                        <TableRow
                          className="group transition-colors odd:bg-transparent even:bg-secondary/10 hover:bg-secondary/20 border-b border-border/50 cursor-pointer"
                          onClick={() => handleToggleExpand(c.id)}
                        >
                          <TableCell className="border-r border-border/50 text-center px-2">
                            {expandedId === c.id ? <ChevronUp className="h-4 w-4 mx-auto text-primary" /> : <ChevronDown className="h-4 w-4 mx-auto text-muted-foreground opacity-50" />}
                          </TableCell>
                          {visibleColumns.includes("name") && (
                            <TableCell className="pl-6 py-2 border-r border-border/50 text-center font-bold text-[14px]">
                              {c.name}
                            </TableCell>
                          )}
                          {visibleColumns.includes("responsible") && (
                            <TableCell className="text-center border-r border-border/50 py-2 font-medium text-[13px]">
                              {c.responsible_name || "-"}
                            </TableCell>
                          )}
                          {visibleColumns.includes("address") && (
                            <TableCell className="text-center border-r border-border/50 py-2 text-[12px] text-muted-foreground max-w-[200px] truncate">
                              <div className="flex items-center justify-center gap-1.5">
                                <MapPin className="h-3 w-3 opacity-50" /> {c.address || "-"}
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.includes("members") && (
                            <TableCell className="text-center border-r border-border/50 py-2 font-mono text-[13px] font-bold">
                              <Badge variant="outline" className="h-5 px-2 text-[10px] font-mono tabular-nums border-border/50 bg-primary/5 text-primary">
                                {(c as any).real_member_count || 0}
                              </Badge>
                            </TableCell>
                          )}
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
                              <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} className="p-1 px-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><Pencil className="h-3 w-3" /></button>
                              <button onClick={(e) => handleDelete(c.id, e)} className="p-1 px-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {expandedId === c.id && (
                          <TableRow className="bg-secondary/5 border-b border-border">
                            <TableCell colSpan={visibleColumns.length + 2} className="p-0">
                              <div className="p-4 px-6 animate-in slide-in-from-top-2 duration-300">
                                <div className="rounded-lg border border-border/50 overflow-hidden shadow-sm bg-card">
                                  <Table className="border-collapse">
                                    <TableHeader className="bg-secondary/20">
                                      <TableRow className="hover:bg-transparent h-8">
                                        <TableHead className="text-[10px] font-black text-muted-foreground border-r border-border/50 text-center uppercase">Perfil</TableHead>
                                        <TableHead className="text-[10px] font-black text-muted-foreground border-r border-border/50 text-center uppercase">Batizado</TableHead>
                                        <TableHead className="text-[10px] font-black text-muted-foreground border-r border-border/50 text-center uppercase">Status</TableHead>
                                        <TableHead className="text-[10px] font-black text-muted-foreground text-center uppercase">Contato</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {membersLoading[c.id] ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                          <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                                        ))
                                      ) : !congregationMembers[c.id] || congregationMembers[c.id].length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-6 text-[12px] italic text-muted-foreground">Nenhum membro vinculado</TableCell></TableRow>
                                      ) : congregationMembers[c.id].map((m) => (
                                        <TableRow key={m.id} className="hover:bg-secondary/10 transition-colors border-b border-border/50 h-10">
                                          <TableCell className="border-r border-border/50 py-1 pl-4">
                                            <div className="flex items-center gap-2">
                                              <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border">
                                                {m.avatar_url ? <img src={m.avatar_url} className="h-full w-full object-cover rounded-full" /> : <Users className="h-2 w-2 text-muted-foreground opacity-30" />}
                                              </div>
                                              <div className="text-left">
                                                <p className="text-[12px] font-bold text-foreground leading-tight">{m.full_name}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono">{m.email || 'Sem e-mail'}</p>
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center border-r border-border/50 py-1">
                                            <Badge variant="outline" className={`text-[10px] font-black px-1.5 py-0 h-4 border-border/50 ${m.is_baptized ? "text-success bg-success/5" : "text-muted-foreground bg-muted/5"}`}>
                                              {m.is_baptized ? "SIM" : "NÃO"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-center border-r border-border/50 py-1">
                                            <Badge variant="outline" className={`text-[10px] font-black px-1.5 py-0 h-4 border-border/50 ${m.status === "active" ? "text-primary bg-primary/5" : "text-muted-foreground bg-muted/5"}`}>
                                              {m.status === "active" ? "ATIVO" : "INATIVO"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-center py-1 font-mono text-[11px] font-bold text-muted-foreground">
                                            {m.phone || "-"}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                    {!loading && items.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic border-b border-border/50">Nenhuma congregação registrada</TableCell></TableRow>
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
