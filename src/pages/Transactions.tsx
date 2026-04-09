import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Trash2, Pencil, Calendar, Type, ArrowUpAZ, ArrowDownAZ, ArrowUp01, ArrowUpDown, Banknote, ListFilter, Lock, FileBarChart, HelpCircle, ChevronRight, Home, ExternalLink, FileCheck, FileText, Download, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TransactionsDialog } from "@/components/TransactionsDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PermissionGuard } from "@/components/PermissionGuard";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import type { Database } from "@/types/database.types";

import Categories from "./Categories";
import Closures from "./Closures";
import Reports from "./Reports";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  categories?: { name: string; color: string | null } | null;
  payment_method_cat?: any;
  receipt_url?: string | null;
};

const months = [
  { value: "all", label: "Todos os meses" },
  { value: "01", label: "Janeiro" }, { value: "02", label: "Fevereiro" }, { value: "03", label: "Março" },
  { value: "04", label: "Abril" }, { value: "05", label: "Maio" }, { value: "06", label: "Junho" },
  { value: "07", label: "Julho" }, { value: "08", label: "Agosto" }, { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" }, { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" },
];

const currentYear = new Date().getFullYear();
const years = [
  { value: "all", label: "Todos os anos" },
  ...Array.from({ length: 5 }, (_, i) => {
    const y = (currentYear - 2 + i).toString();
    return { value: y, label: y };
  }).reverse(),
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  // Usamos T12:00:00 para evitar que a conversão de fuso horário mude o dia
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
}

import { useQuery, useQueryClient } from "@tanstack/react-query";

function TransactionsList() {
  const { organization } = useChurch();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [sortField, setSortField] = useState<"date" | "description" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showTotals, setShowTotals] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const fileName = url.split('/').pop() || 'comprovante';
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      // Se falhar o fetch (CORS), abre em nova aba como fallback
      window.open(url, '_blank');
    }
  };

  // Transactions Query
  const { data: transactions = [], isLoading: loading } = useQuery({
    queryKey: ["transactions", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select(`*, categories!category_id(name, color), payment_method_cat:categories!payment_method_id(name)`)
        .eq("organization_id", organization.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Categories Query
  const { data: categories = [] } = useQuery({
    queryKey: ["categories", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, type")
        .eq("organization_id", organization.id);
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
    staleTime: 1000 * 60 * 15,
  });

  useEffect(() => {
    if (searchParams.get("new") === "true" && !dialogOpen) {
      setEditingTransaction(null);
      setDialogOpen(true);
      const params = new URLSearchParams(searchParams);
      params.delete("new");
      setSearchParams(params, { replace: true });
    }
  }, [searchParams, dialogOpen, setSearchParams]);

  const openEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este lançamento?")) return;

    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Lançamento removido");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-transactions"] });
    } catch (err) {
      toast.error("Erro ao excluir lançamento");
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (categoryFilter !== "all" && tx.category_id !== categoryFilter) return false;
      if (yearFilter !== "all" && tx.date.split("-")[0] !== yearFilter) return false;
      if (monthFilter !== "all" && tx.date.split("-")[1] !== monthFilter) return false;
      if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, yearFilter, monthFilter, searchQuery]);

  const sortedData = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortField === "date") {
        aVal = new Date(a.date + "T12:00:00").getTime();
        bVal = new Date(b.date + "T12:00:00").getTime();
      } else if (sortField === "description") {
        aVal = a.description.toLowerCase();
        bVal = b.description.toLowerCase();
      } else if (sortField === "amount") {
        aVal = Number(a.amount);
        bVal = Number(b.amount);
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortOrder]);

  const totals = useMemo(() => {
    return sortedData.reduce((acc, tx) => {
      if (tx.type === 'income') acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [sortedData]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Movimentações</h2>
          <p className="text-muted-foreground text-[12px] mt-0.5">Listagem detalhada de entradas e saídas</p>
        </div>
        <PermissionGuard requireWrite>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Novo Lançamento
          </Button>
        </PermissionGuard>
      </div>

      <TransactionsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["transactions"] })}
        editingTransaction={editingTransaction}
      />

      <Dialog open={!!viewingReceipt} onOpenChange={(o) => !o && setViewingReceipt(null)}>
        <DialogContent className="sm:max-w-4xl bg-card p-0 overflow-hidden border-border shadow-2xl ring-1 ring-primary/10">
          <DialogHeader className="p-6 border-b border-border bg-secondary/10 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">Visualizar Comprovante</DialogTitle>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Documento de Lançamento</p>
              </div>
            </div>
          </DialogHeader>

          <div className="bg-secondary/5 relative">
            <ScrollArea className="h-[65vh] w-full">
              <div className="p-8 flex items-center justify-center min-h-full">
                {viewingReceipt && (
                  <div className="w-full flex items-center justify-center">
                    {viewingReceipt.toLowerCase().includes('.pdf') ? (
                      <div className="flex flex-col items-center gap-8 py-16 animate-in fade-in zoom-in-95 duration-500">
                        <div className="h-28 w-28 rounded-[2.5rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/5">
                          <FileText className="h-14 w-14 text-primary" />
                        </div>
                        <div className="text-center space-y-3">
                          <p className="text-2xl font-black text-foreground uppercase tracking-tight">Documento PDF</p>
                          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mx-auto">Este arquivo está em formato PDF. Clique em "Baixar" para visualizar o conteúdo completo no navegador.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group rounded-xl overflow-hidden border border-border shadow-2xl bg-background w-fit mx-auto animate-in fade-in zoom-in-95 duration-500">
                        <img
                          src={viewingReceipt}
                          alt="Comprovante"
                          className="max-w-full h-auto object-contain cursor-zoom-in"
                          onClick={() => window.open(viewingReceipt, '_blank')}
                          onLoad={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.opacity = "1";
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/800x600/f3ede4/e69b1a?text=Erro+ao+carregar+imagem";
                          }}
                        />
                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center">
                          <p className="text-white text-[11px] font-black uppercase tracking-widest">Clique para ver tamanho original</p>
                          <p className="text-white/60 text-[9px] mt-1 uppercase font-bold tracking-tighter">Use o scroll para navegar em documentos longos</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="p-6 bg-secondary/10 border-t border-border flex flex-row items-center justify-end gap-3">
            <Button
              variant="outline"
              className="h-11 px-8 font-bold border-border/50 bg-background transition-all"
              onClick={() => setViewingReceipt(null)}
            >
              Fechar
            </Button>
            {viewingReceipt && (
              <Button
                className="h-11 px-10 gap-3 font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all bg-gradient-to-r from-primary to-primary/80"
                onClick={() => handleDownload(viewingReceipt)}
              >
                <Download className="h-5 w-5" />
                Baixar Arquivo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="bg-card border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-3 bg-secondary/10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por descrição..." className="pl-9 h-9 text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              {showTotals && sortedData.length > 0 && (
                <div className="flex items-center gap-4 px-4 py-1.5 bg-background rounded-xl border border-border/50 shadow-sm animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase font-black text-success/70 leading-none mb-1 tracking-tighter">Entradas</span>
                    <span className="text-[11px] font-mono font-black text-success">+{formatCurrency(totals.income)}</span>
                  </div>
                  <Separator orientation="vertical" className="h-6 opacity-30" />
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase font-black text-destructive/70 leading-none mb-1 tracking-tighter">Saídas</span>
                    <span className="text-[11px] font-mono font-black text-destructive">-{formatCurrency(totals.expense)}</span>
                  </div>
                  <Separator orientation="vertical" className="h-6 opacity-30" />
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] uppercase font-black text-muted-foreground leading-none mb-1 tracking-tighter">Saldo</span>
                    <span className={`text-[11px] font-mono font-black ${totals.income - totals.expense >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                      {formatCurrency(totals.income - totals.expense)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Entradas</SelectItem>
                  <SelectItem value="expense">Saídas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-52 h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Categorias</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>{years.map((y) => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>{months.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>

              <div className="flex items-center gap-1 bg-background p-0.5 rounded-md border border-border ml-auto">
                <Button variant={sortField === 'date' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setSortField('date')}><Calendar className="h-3.5 w-3.5" /></Button>
                <Button variant={sortField === 'description' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setSortField('description')}><Type className="h-3.5 w-3.5" /></Button>
                <Button variant={sortField === 'amount' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" onClick={() => setSortField('amount')}><ArrowUp01 className="h-3.5 w-3.5" /></Button>
                <Separator orientation="vertical" className="h-4 mx-0.5" />
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                  {sortOrder === 'asc' ? <ArrowUpAZ className="h-3.5 w-3.5" /> : <ArrowDownAZ className="h-3.5 w-3.5" />}
                </Button>
              </div>

              <div className="flex items-center gap-2 ml-2 border-l border-border pl-3">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Totais</span>
                <Switch
                  checked={showTotals}
                  onCheckedChange={setShowTotals}
                  className="scale-75 data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-340px)] w-full">
            <Table>
              <TableHeader className="sticky top-0 bg-secondary/10 backdrop-blur-sm z-10">
                <TableRow className="hover:bg-transparent border-b border-border/50">
                  <TableHead className="w-[10%] text-[11px] uppercase font-bold text-muted-foreground text-center">Data</TableHead>
                  <TableHead className="w-[30%] text-[11px] uppercase font-bold text-muted-foreground text-center">Descrição</TableHead>
                  <TableHead className="w-[15%] text-[11px] uppercase font-bold text-muted-foreground text-center">Categoria</TableHead>
                  <TableHead className="w-[8%] text-[11px] uppercase font-bold text-muted-foreground text-center">Doc</TableHead>
                  <TableHead className="w-[15%] text-[11px] uppercase font-bold text-muted-foreground text-center">Meio</TableHead>
                  <TableHead className="w-[14%] text-[11px] uppercase font-bold text-muted-foreground text-center">Valor</TableHead>
                  <TableHead className="w-[8%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                  ))
                ) : (
                  <>
                    {sortedData.map((tx) => (
                      <TableRow key={tx.id} className="group transition-colors odd:bg-transparent even:bg-secondary/20">
                        <TableCell className="font-mono text-[11px] tabular-nums whitespace-nowrap text-center">{formatDate(tx.date)}</TableCell>
                        <TableCell className="text-[13px] font-medium text-center">{tx.description}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline" className="text-[10px] font-medium px-2 py-0 h-5 leading-none">{tx.categories?.name || "Geral"}</Badge></TableCell>
                        <TableCell className="text-center">
                          {tx.receipt_url && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setViewingReceipt(tx.receipt_url || null); }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all shadow-sm border border-primary/20"
                              title="Ver Comprovante"
                            >
                              <FileCheck className="h-4 w-4" />
                            </button>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0 h-5 leading-none bg-orange-500/10 text-orange-500 border-orange-500/20">
                            {tx.payment_method_cat?.name || tx.payment_method || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className={`font-bold font-mono text-[13px] tabular-nums text-center ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                          {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell>
                          <PermissionGuard requireWrite>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                              <button onClick={() => openEdit(tx)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                              <button onClick={() => handleDelete(tx.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </PermissionGuard>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && sortedData.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10 italic">Nenhum lançamento encontrado</TableCell></TableRow>
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

export default function Transactions() {
  const { organization } = useChurch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "movimentacoes";

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando dados...</div>;

  return (
    <>
      <PermissionGuard
        requireFinance
        fallback={
          <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-3xl bg-destructive/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Acesso Restrito</h2>
              <p className="text-muted-foreground text-sm max-w-xs">Você não tem permissão para acessar o módulo financeiro. Entre em contato com o administrador.</p>
            </div>
          </div>
        }
      >
        <div className="animate-fade-in space-y-6 print:space-y-0 print:m-0 print:p-0">
          <div className="flex items-center gap-3 print:hidden">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
              <Banknote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Tesouraria & Finanças</h1>
              <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.1em]">{organization.name}</p>
            </div>
          </div>

          <Tabs
            value={searchParams.get("tab") || "movimentacoes"}
            onValueChange={(v) => setSearchParams({ tab: v })}
            className="w-full"
          >
            <div className="flex items-center gap-2 mb-6 px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 print:hidden">
              <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer" onClick={() => navigate("/")}>
                <Home className="h-3 w-3" /> Dashboard
              </span>
              <ChevronRight className="h-3 w-3 opacity-30" />
              <span className="text-foreground capitalize">
                {activeTab === 'movimentacoes' ? 'Lançamentos' :
                  activeTab === 'fechamento' ? 'Fechamentos' :
                    activeTab.replace(/-/g, ' ')}
              </span>
            </div>

            <TabsContent value="movimentacoes" className="mt-0 focus-visible:ring-0 outline-none">
              <TransactionsList />
            </TabsContent>
            <TabsContent value="categorias" className="mt-0 focus-visible:ring-0 outline-none">
              <Categories />
            </TabsContent>
            <TabsContent value="fechamento" className="mt-0 focus-visible:ring-0 outline-none">
              <Closures />
            </TabsContent>
            <TabsContent value="relatorios" className="mt-0 focus-visible:ring-0 outline-none">
              <Reports />
            </TabsContent>
          </Tabs>
        </div>
      </PermissionGuard>
    </>
  );
}
