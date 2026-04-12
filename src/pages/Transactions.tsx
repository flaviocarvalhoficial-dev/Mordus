import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Trash2, Pencil, Calendar, Type, ArrowUpAZ, ArrowDownAZ, ArrowUp01, ArrowUpDown, Banknote, ListFilter, Lock, FileBarChart, HelpCircle, ChevronRight, Home, ExternalLink, FileCheck, FileText, Download, X, Settings2, Columns, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  occasion?: string | null;
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
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
  const [monthFilter, setMonthFilter] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [sortField, setSortField] = useState<"date" | "description" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showTotals, setShowTotals] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["date", "description", "category", "receipt", "method", "amount"]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleColumn = (col: string) => {
    setVisibleColumns(prev => {
      if (prev.includes(col)) {
        if (prev.length <= 3) {
          toast.error("Mínimo de 3 colunas permitido");
          return prev;
        }
        return prev.filter(c => c !== col);
      }
      if (prev.length >= 8) {
        toast.error("Limite de 8 colunas atingido");
        return prev;
      }
      return [...prev, col];
    });
  };

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

  const handleDeleteClick = (tx: Transaction) => {
    if (tx.description.startsWith("[P ")) {
      setTxToDelete(tx);
      setDeleteModalOpen(true);
    } else {
      if (confirm("Deseja realmente excluir este lançamento?")) {
        confirmDelete(tx.id);
      }
    }
  };

  const confirmDelete = async (id: string, deleteAllFromBatch = false) => {
    setIsDeleting(true);
    try {
      if (deleteAllFromBatch && txToDelete) {
        // Extrai a parte da descrição sem o [P XX/YY]
        const cleanDesc = txToDelete.description.replace(/^\[P \d+\/\d+\] /, "");
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("organization_id", organization!.id)
          .ilike("description", `%${cleanDesc}`)
          .gte("date", txToDelete.date);

        if (error) throw error;
        toast.success("Todas as parcelas futuras foram removidas");
      } else {
        const { error } = await supabase.from("transactions").delete().eq("id", id);
        if (error) throw error;
        toast.success("Lançamento removido");
      }

      setDeleteModalOpen(false);
      setTxToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-transactions"] });
    } catch (err) {
      toast.error("Erro ao excluir lançamento");
    } finally {
      setIsDeleting(false);
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
      <div className="flex items-center justify-end">
        <PermissionGuard requireWrite>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs rounded-full px-6 shadow-sm" onClick={openCreate}>
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
                <p className="text-[10px] text-muted-foreground font-black mt-1">Documento de Lançamento</p>
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
                    <span className="text-[9px] font-black text-success/70 leading-none mb-1">Entradas</span>
                    <span className="text-[11px] font-mono font-black text-success">+{formatCurrency(totals.income)}</span>
                  </div>
                  <Separator orientation="vertical" className="h-6 opacity-30" />
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-destructive/70 leading-none mb-1">Saídas</span>
                    <span className="text-[11px] font-mono font-black text-destructive">-{formatCurrency(totals.expense)}</span>
                  </div>
                  <Separator orientation="vertical" className="h-6 opacity-30" />
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-muted-foreground leading-none mb-1">Saldo</span>
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
                <Button variant={sortField === 'date' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" title="Ordenar por Data" onClick={() => setSortField('date')}><Calendar className="h-3.5 w-3.5" /></Button>
                <Button variant={sortField === 'description' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" title="Ordenar por Descrição" onClick={() => setSortField('description')}><Type className="h-3.5 w-3.5" /></Button>
                <Button variant={sortField === 'amount' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" title="Ordenar por Valor" onClick={() => setSortField('amount')}><ArrowUp01 className="h-3.5 w-3.5" /></Button>
                <Separator orientation="vertical" className="h-4 mx-0.5" />
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Inverter Ordem" onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                  {sortOrder === 'asc' ? <ArrowUpAZ className="h-3.5 w-3.5" /> : <ArrowDownAZ className="h-3.5 w-3.5" />}
                </Button>
                <Separator orientation="vertical" className="h-4 mx-0.5" />

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualização de Colunas">
                      <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4 bg-card border-border shadow-xl">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Columns className="h-4 w-4 text-primary" />
                        <h4 className="text-xs font-black uppercase tracking-wider">Colunas da Tabela</h4>
                      </div>
                      <div className="grid gap-3">
                        {[
                          { id: "date", label: "Data" },
                          { id: "description", label: "Descrição" },
                          { id: "category", label: "Categoria" },
                          { id: "receipt", label: "Comprovante" },
                          { id: "method", label: "Meio de Pagamento" },
                          { id: "amount", label: "Valor" },
                          { id: "occasion", label: "Ocasião Principal" },
                        ].map((col) => (
                          <div key={col.id} className="flex items-center justify-between gap-4">
                            <span className="text-[11px] font-medium text-muted-foreground">{col.label}</span>
                            <Switch
                              checked={visibleColumns.includes(col.id)}
                              onCheckedChange={() => toggleColumn(col.id)}
                              className="scale-75"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-muted-foreground italic border-t border-border pt-2 mt-2">
                        Limite: 8 colunas simultâneas
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-2 ml-2 border-l border-border pl-3">
                <span className="text-[10px] text-muted-foreground font-bold">Totais</span>
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
            <Table className="border-collapse border border-border/50">
              <TableHeader className="sticky top-0 bg-secondary/20 backdrop-blur-sm z-10 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  {visibleColumns.includes("date") && <TableHead className="w-[10%] text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Data</TableHead>}
                  {visibleColumns.includes("description") && <TableHead className="w-[25%] text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Descrição</TableHead>}
                  {visibleColumns.includes("category") && <TableHead className="w-[12%] text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Categoria</TableHead>}
                  {visibleColumns.includes("receipt") && <TableHead className="w-[8%] text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Doc</TableHead>}
                  {visibleColumns.includes("method") && <TableHead className="w-[12%] text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Meio</TableHead>}
                  {visibleColumns.includes("occasion") && <TableHead className="w-[15%] text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Ocasião</TableHead>}
                  {visibleColumns.includes("amount") && <TableHead className="w-[12%] text-[11px] font-black text-muted-foreground text-center border-r border-border/50">Valor</TableHead>}
                  <TableHead className="w-[6%] text-[11px] font-black text-muted-foreground text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}><TableCell colSpan={visibleColumns.length + 1}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                  ))
                ) : (
                  <>
                    {sortedData.map((tx) => {
                      const isHighlighted = searchParams.get("highlight") === tx.id;
                      return (
                        <TableRow
                          key={tx.id}
                          className={cn(
                            "group transition-colors odd:bg-transparent even:bg-secondary/10 hover:bg-secondary/20 border-b border-border/50",
                            isHighlighted && "animate-highlight-orange z-20"
                          )}
                        >
                          {visibleColumns.includes("date") && <TableCell className="font-mono text-[14px] tabular-nums whitespace-nowrap text-center border-r border-border/50 py-2">{formatDate(tx.date)}</TableCell>}
                          {visibleColumns.includes("description") && <TableCell className="text-[14px] font-medium text-center border-r border-border/50 py-2">{tx.description}</TableCell>}
                          {visibleColumns.includes("category") && (
                            <TableCell className="text-center border-r border-border/50 py-2">
                              <Badge variant="outline" className="text-[12px] font-medium px-2 py-0 h-6 leading-none border-border/50 text-foreground/70">
                                {tx.categories?.name || "Geral"}
                              </Badge>
                            </TableCell>
                          )}
                          {visibleColumns.includes("receipt") && (
                            <TableCell className="text-center border-r border-border/50 py-2">
                              {tx.receipt_url && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setViewingReceipt(tx.receipt_url || null); }}
                                  className="inline-flex items-center justify-center w-6 h-5 rounded-full border border-border/50 bg-transparent text-muted-foreground hover:bg-secondary/20 transition-all"
                                  title="Ver Comprovante"
                                >
                                  <FileCheck className="h-3 w-3" />
                                </button>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.includes("method") && (
                            <TableCell className="text-center border-r border-border/50 py-2">
                              <Badge variant="outline" className="text-[12px] font-medium px-2 py-0 h-6 leading-none border-border/50 text-foreground/70">
                                {tx.payment_method_cat?.name || tx.payment_method || "-"}
                              </Badge>
                            </TableCell>
                          )}
                          {visibleColumns.includes("occasion") && (
                            <TableCell className="text-[14px] text-center border-r border-border/50 py-2">
                              {tx.occasion || "-"}
                            </TableCell>
                          )}
                          {visibleColumns.includes("amount") && (
                            <TableCell className={`font-bold font-mono text-[14px] tabular-nums text-center border-r border-border/50 py-3 ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                              {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                            </TableCell>
                          )}
                          <TableCell className="py-2">
                            <PermissionGuard requireWrite>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
                                <button onClick={() => openEdit(tx)} className="p-1 px-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><Pencil className="h-3 w-3" /></button>
                                <button onClick={() => handleDeleteClick(tx)} className="p-1 px-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3 w-3" /></button>
                              </div>
                            </PermissionGuard>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!loading && sortedData.length === 0 && (
                      <TableRow><TableCell colSpan={visibleColumns.length + 1} className="text-center text-muted-foreground py-10 italic">Nenhum lançamento encontrado</TableCell></TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card p-6 border-border rounded-[2.5rem] shadow-2xl">
          <DialogHeader className="items-center text-center pb-4">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-lg font-bold">Excluir Parcelamento</DialogTitle>
            <p className="text-xs text-muted-foreground mt-2">
              Este lançamento faz parte de um conjunto de parcelas. Como deseja prosseguir?
            </p>
          </DialogHeader>

          <div className="grid gap-3 pt-2">
            <Button
              variant="outline"
              className="h-12 rounded-2xl font-bold text-xs hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 border-border/50"
              onClick={() => confirmDelete(txToDelete!.id, false)}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir apenas esta parcela
            </Button>
            <Button
              className="h-12 rounded-2xl font-bold text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDelete(txToDelete!.id, true)}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir esta e todas as parcelas futuras
            </Button>
            <Button
              variant="ghost"
              className="h-10 rounded-2xl font-bold text-xs text-muted-foreground"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
          <div className="flex items-center justify-between pb-2 border-b border-border/50 print:hidden">
            <div className="flex items-center gap-4 text-left">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                <Banknote className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col text-left items-start">
                <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70">
                  <Home className="h-2.5 w-2.5" />
                  <ChevronRight className="h-2.5 w-2.5 opacity-30" />
                  Tesouraria
                  <ChevronRight className="h-2.5 w-2.5 opacity-30" />
                  {organization.name}
                </div>
                <h1 className="text-xl font-black text-foreground tracking-tight capitalize mt-0.5">
                  {activeTab === 'movimentacoes' ? 'Lançamentos' :
                    activeTab === 'fechamento' ? 'Fechamentos' :
                      activeTab.replace(/-/g, ' ')}
                </h1>
              </div>
            </div>
          </div>

          <Tabs
            value={searchParams.get("tab") || "movimentacoes"}
            onValueChange={(v) => setSearchParams({ tab: v })}
            className="w-full"
          >

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
