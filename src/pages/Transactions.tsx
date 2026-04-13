import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Trash2, Pencil, Calendar, Type, ArrowUpAZ, ArrowDownAZ, ArrowUp01, ArrowUpDown, Banknote, ListFilter, Lock, FileBarChart, HelpCircle, ChevronRight, Home, ExternalLink, FileCheck, FileText, Download, X, Settings2, Columns, Loader2, History, AlertTriangle, Milestone, CalendarClock, AlertCircle, Clock, CheckCircle2, MoreHorizontal, TrendingUp, TrendingDown, Wallet, HandCoins, Coins } from "lucide-react";
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
  const [sortField, setSortField] = useState<"date" | "description" | "amount" | "created_at">(() => {
    return (localStorage.getItem('mordus_tx_sort_field') as any) || "date";
  });
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">(() => {
    return (localStorage.getItem('mordus_tx_sort_order') as any) || "desc";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showTotals, setShowTotals] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('mordus_visible_columns');
    return saved ? JSON.parse(saved) : ["date", "description", "category", "status", "amount"];
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('mordus_visible_columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem('mordus_tx_sort_field', sortField);
    localStorage.setItem('mordus_tx_sort_order', sortOrder);
  }, [sortField, sortOrder]);

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

  // Transactions Query (CAIXA / REALIZADO)
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ["transactions", organization?.id, yearFilter, monthFilter, typeFilter, categoryFilter, searchQuery],
    queryFn: async () => {
      if (!organization?.id) return [];
      let query = supabase
        .from("transactions")
        .select(`*, categories!category_id(name, color), payment_method_cat:categories!payment_method_id(name)`)
        .eq("organization_id", organization.id);

      if (yearFilter !== "all") {
        if (monthFilter === "all") {
          query = query.gte("date", `${yearFilter}-01-01`).lte("date", `${yearFilter}-12-31`);
        } else {
          const lastDay = new Date(Number(yearFilter), Number(monthFilter), 0).getDate();
          query = query.gte("date", `${yearFilter}-${monthFilter}-01`)
            .lte("date", `${yearFilter}-${monthFilter}-${String(lastDay).padStart(2, '0')}`);
        }
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category_id', categoryFilter);
      }

      const { data, error } = await query.order("date", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!organization?.id,
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

  // Installments Query (COMPETÊNCIA / OBRIGAÇÕES)
  const { data: installments = [], isLoading: loadingInstallments } = useQuery({
    queryKey: ["installments", organization?.id, yearFilter, monthFilter, typeFilter, categoryFilter],
    queryFn: async () => {
      if (!organization?.id) return [];
      let query = supabase
        .from("installments")
        .select(`*, purchase:installment_purchases(description, category_id, payment_method_id)`)
        .eq("organization_id", organization.id);

      // Filtramos por competência
      if (yearFilter !== "all") {
        if (monthFilter === "all") {
          query = query.gte("competence_date", `${yearFilter}-01-01`).lte("competence_date", `${yearFilter}-12-31`);
        } else {
          const lastDay = new Date(Number(yearFilter), Number(monthFilter), 0).getDate();
          query = query.gte("competence_date", `${yearFilter}-${monthFilter}-01`)
            .lte("competence_date", `${yearFilter}-${monthFilter}-${String(lastDay).padStart(2, '0')}`);
        }
      }

      const { data, error } = await query.order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  // Pendências Acumuladas (ATRASOS)
  const { data: overdueInstallments = [] } = useQuery({
    queryKey: ["overdue-installments", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from("installments")
        .select(`*, purchase:installment_purchases(description)`)
        .eq("organization_id", organization.id)
        .in("status", ["PENDENTE", "VENCIDA"])
        .lt("due_date", new Date().toISOString().split('T')[0])
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const loading = loadingTransactions || loadingInstallments;

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
    if (tx.installment_id || tx.description.startsWith("[P ")) {
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
        if (txToDelete.installment_id) {
          // Se for do novo sistema, deletamos o purchase (deleta cascata parcelas e limpa FK em transactions)
          const { data: inst } = await supabase.from("installments").select("purchase_id").eq("id", txToDelete.installment_id).single();
          if (inst?.purchase_id) {
            await supabase.from("installment_purchases").delete().eq("id", inst.purchase_id);
          }
        } else {
          // Sistema antigo (baseado em descrição)
          const cleanDesc = txToDelete.description.replace(/^\[P \d+\/\d+\] /, "");
          await supabase
            .from("transactions")
            .delete()
            .eq("organization_id", organization!.id)
            .ilike("description", `%${cleanDesc}`)
            .gte("date", txToDelete.date);
        }
        toast.success("Todas as parcelas futuras foram removidas");
      } else {
        const { error } = await supabase.from("transactions").delete().eq("id", id);
        if (error) throw error;
        toast.success("Lançamento removido");
      }

      setDeleteModalOpen(false);
      setTxToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-transactions"] });
    } catch (err) {
      toast.error("Erro ao excluir lançamento");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (tx: Transaction) => {
    setIsUpdatingStatus(tx.id);
    const newStatus = tx.status === 'completed' || !tx.status ? 'pending' : 'completed';
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ status: newStatus })
        .eq("id", tx.id);

      if (error) throw error;

      // Se houver parcelas vinculadas, talvez atualizar o status da parcela também?
      // Por agora, apenas o caixa

      const label = newStatus === 'completed'
        ? (tx.type === 'income' ? 'Recebido' : 'Pago')
        : 'Pendente';
      toast.success(`Lançamento marcado como ${label}`);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-transactions"] });
    } catch (err) {
      toast.error("Erro ao atualizar status");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (categoryFilter !== "all" && tx.category_id !== categoryFilter) return false;
      // Removido filtros de data aqui pois já são aplicados na query
      if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, searchQuery]);

  const sortedData = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortField === "date") {
        aVal = new Date(a.date + "T12:00:00").getTime();
        bVal = new Date(b.date + "T12:00:00").getTime();
        // Se a data for igual, usamos created_at como critério de desempate
        if (aVal === bVal) {
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
        }
      } else if (sortField === "created_at") {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
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
      // Ignora pendentes no cálculo dos totais da lista
      if (tx.status === 'pending') return acc;

      if (tx.type === 'income') acc.income += tx.amount;
      else acc.expense += tx.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [sortedData]);

  const kpis = useMemo(() => {
    return sortedData.reduce((acc, tx) => {
      const isIncome = tx.type === 'income';
      const isExpense = tx.type === 'expense';
      const isCompleted = tx.status === 'completed' || !tx.status;
      const catName = tx.categories?.name?.toLowerCase() || '';

      if (isCompleted) {
        if (isIncome) {
          acc.totalIncome += tx.amount;
          if (catName.includes('oferta')) {
            acc.ofertasValue += tx.amount;
            acc.ofertasCount += 1;
          }
          if (catName.includes('dízimo')) {
            acc.dizimosValue += tx.amount;
            acc.dizimosCount += 1;
          }
        } else if (isExpense) {
          acc.totalExpense += tx.amount;
        }
      }

      return acc;
    }, {
      totalIncome: 0,
      totalExpense: 0,
      ofertasValue: 0,
      ofertasCount: 0,
      dizimosValue: 0,
      dizimosCount: 0
    });
  }, [sortedData]);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Fluxo de Caixa</h2>
        <PermissionGuard requireWrite>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs rounded-full px-6 shadow-sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />Novo Lançamento
          </Button>
        </PermissionGuard>
      </div>

      {/* KPI CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                  <HandCoins className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ofertas</span>
              </div>
              <Badge variant="secondary" className="text-[10px] font-bold">{kpis.ofertasCount} itens</Badge>
            </div>
            <div className="text-xl font-black text-foreground font-mono">
              {formatCurrency(kpis.ofertasValue)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dízimos</span>
              </div>
              <Badge variant="secondary" className="text-[10px] font-bold">{kpis.dizimosCount} itens</Badge>
            </div>
            <div className="text-xl font-black text-foreground font-mono">
              {formatCurrency(kpis.dizimosValue)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-secondary/30 flex items-center justify-center border border-border">
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Entradas/Saídas</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[13px] font-bold">
              <span className="text-success">{formatCurrency(kpis.totalIncome)}</span>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-destructive">{formatCurrency(kpis.totalExpense)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 shadow-md ring-1 ring-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Saldo do Período</span>
              </div>
            </div>
            <div className={cn(
              "text-xl font-black font-mono",
              kpis.totalIncome - kpis.totalExpense >= 0 ? "text-success" : "text-destructive"
            )}>
              {formatCurrency(kpis.totalIncome - kpis.totalExpense)}
            </div>
          </CardContent>
        </Card>
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
                <DialogTitle className="text-xl font-semibold tracking-tight">Visualizar Comprovante</DialogTitle>
                <p className="text-[10px] text-muted-foreground font-semibold mt-1">Documento de Lançamento</p>
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
                          <p className="text-2xl font-semibold text-foreground uppercase tracking-tight">Documento PDF</p>
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

      {/* SEÇÃO 1: PENDÊNCIAS ACUMULADAS (ARREARS) */}
      {overdueInstallments.length > 0 && (
        <Card className="bg-destructive/5 border-destructive/20 border-l-4 border-l-destructive shadow-none overflow-hidden">
          <CardHeader className="py-3 bg-destructive/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <h4 className="text-xs font-bold text-destructive tracking-widest uppercase">Pendências Acumuladas (Vencidas)</h4>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] uppercase font-black">Atrasos</Badge>
              </div>
              <span className="text-[10px] font-bold text-destructive/70">{overdueInstallments.length} itens pendentes</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {overdueInstallments.map((inst: any) => (
                  <TableRow key={inst.id} className="hover:bg-destructive/10 border-b border-destructive/10 transition-colors">
                    <TableCell className="py-2 pl-4 w-[10%] text-xs font-mono text-destructive font-black whitespace-nowrap">{formatDate(inst.due_date)}</TableCell>
                    <TableCell className="py-2 w-[40%] text-[13px] font-bold text-destructive/80">{inst.purchase?.description}</TableCell>
                    <TableCell className="py-2 w-[20%] text-center">
                      <Badge variant="outline" className="text-[10px] border-destructive/20 text-destructive font-black uppercase">VENCIDA</Badge>
                    </TableCell>
                    <TableCell className="py-2 w-[20%] text-right font-mono font-black text-destructive pr-6">{formatCurrency(inst.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* SEÇÃO 2: PARCELAS DA COMPETÊNCIA (COMPACT DESIGN) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary/70" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Obrigações da Competência</span>
          </div>
          <Badge variant="outline" className="text-[9px] font-black uppercase text-muted-foreground/50 border-border/50">Mês de Referência</Badge>
        </div>

        <Card className="bg-card border-border shadow-sm overflow-hidden border-l-4 border-l-primary/30">
          <CardContent className="p-0">
            {loadingInstallments ? (
              <div className="p-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></div>
            ) : installments.length === 0 ? (
              <div className="p-6 text-center text-xs italic text-muted-foreground bg-secondary/5">Nenhuma obrigação parcelada para esta competência</div>
            ) : (
              <Table>
                <TableBody>
                  {installments.map((inst: any) => (
                    <TableRow key={inst.id} className="group hover:bg-secondary/10 transition-colors border-b border-border/10 last:border-0 h-10">
                      <TableCell className="py-2 pl-4 w-[12%] text-[11px] font-black text-muted-foreground italic whitespace-nowrap">
                        {months.find(m => m.value === inst.competence_date.split('-')[1])?.label.substring(0, 3)}/{inst.competence_date.split('-')[0]}
                      </TableCell>
                      <TableCell className="py-2 w-[40%] text-[13px] font-bold">{inst.purchase?.description}</TableCell>
                      <TableCell className="py-2 w-[18%] text-[11px] font-mono text-center text-muted-foreground">Venc: {formatDate(inst.due_date)}</TableCell>
                      <TableCell className="py-2 w-[15%] text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] font-black uppercase px-2 py-0 border-border/50",
                            inst.status === 'PAGA' || inst.status === 'PAGA_COM_ATRASO' ? "bg-success/5 text-success border-success/10" :
                              inst.status === 'VENCIDA' ? "bg-destructive/5 text-destructive border-destructive/10" : "bg-orange-500/5 text-orange-600 border-orange-500/10"
                          )}
                        >
                          {inst.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 w-[15%] text-right font-mono font-black pr-6 text-foreground/80">{formatCurrency(inst.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO 3: MOVIMENTAÇÕES (CASH FLOW / REALIZED) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" /> Movimentações do Caixa (Realizado)
          </h3>
          {showTotals && sortedData.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-success/5 border border-success/20 rounded-lg">
              <span className="text-[10px] font-bold text-success">REALIZADO NO PERÍODO: {formatCurrency(totals.income - totals.expense)}</span>
            </div>
          )}
        </div>

        <Card className="bg-card border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-3 bg-secondary/5">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por descrição..." className="pl-9 h-9 text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
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
                  <Button variant={sortField === 'created_at' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7" title="Ordenar por Último Registro" onClick={() => setSortField('created_at')}><History className="h-3.5 w-3.5" /></Button>
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
                          <h4 className="text-xs font-semibold uppercase tracking-wider">Colunas da Tabela</h4>
                        </div>
                        <div className="grid gap-3">
                          {[
                            { id: "date", label: "Data" },
                            { id: "description", label: "Descrição" },
                            { id: "category", label: "Categoria" },
                            { id: "status", label: "Status (Pago/Pendente)" },
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
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-600px)] w-full">
              <Table className="border-collapse border border-border/50">
                <TableHeader className="sticky top-0 bg-secondary/20 backdrop-blur-sm z-10 border-b border-border">
                  <TableRow className="hover:bg-transparent">
                    {visibleColumns.includes("date") && <TableHead className="w-[10%] text-[11px] font-semibold text-muted-foreground text-center border-r border-border/50">Data</TableHead>}
                    {visibleColumns.includes("description") && <TableHead className="w-[25%] text-[11px] font-semibold text-muted-foreground text-center border-r border-border/50">Descrição</TableHead>}
                    {visibleColumns.includes("category") && <TableHead className="w-[12%] text-[11px] font-semibold text-muted-foreground text-center border-r border-border/50">Categoria</TableHead>}
                    {visibleColumns.includes("status") && <TableHead className="w-[10%] text-[11px] font-semibold text-muted-foreground text-center border-r border-border/50">Status</TableHead>}
                    {visibleColumns.includes("receipt") && <TableHead className="w-[8%] text-[11px] font-semibold text-muted-foreground text-center border-r border-border/50">Doc</TableHead>}
                    {visibleColumns.includes("method") && <TableHead className="w-[12%] text-[11px] font-semibold text-muted-foreground text-center border-r border-border/50">Meio</TableHead>}
                    {visibleColumns.includes("occasion") && <TableHead className="w-[15%] text-[11px] font-semibold text-muted-foreground text-center border-r border-border/50">Ocasião</TableHead>}
                    {visibleColumns.includes("amount") && <TableHead className="w-[12%] text-[11px] font-semibold text-muted-foreground text-center border-r border-border/50">Valor</TableHead>}
                    <TableHead className="w-[6%] text-[11px] font-semibold text-muted-foreground text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTransactions ? (
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
                            {visibleColumns.includes("date") && <TableCell className="font-mono text-[13px] tabular-nums whitespace-nowrap text-center border-r border-border/50 py-2">{formatDate(tx.date)}</TableCell>}
                            {visibleColumns.includes("description") && <TableCell className="text-[13px] font-medium text-center border-r border-border/50 py-2">{tx.description}</TableCell>}
                            {visibleColumns.includes("category") && (
                              <TableCell className="text-center border-r border-border/50 py-2">
                                <Badge variant="outline" className="text-[12px] font-medium px-2 py-0 h-6 leading-none border-border/50 text-foreground/70">
                                  {tx.categories?.name || "Geral"}
                                </Badge>
                              </TableCell>
                            )}
                            {visibleColumns.includes("status") && (
                              <TableCell className="text-center border-r border-border/50 py-2">
                                <div className="flex items-center justify-center gap-2">
                                  <Switch
                                    checked={tx.status === 'completed' || !tx.status}
                                    onCheckedChange={() => handleToggleStatus(tx)}
                                    disabled={isUpdatingStatus === tx.id}
                                    className="data-[state=checked]:bg-success scale-75"
                                  />
                                  <span className={cn(
                                    "text-[10px] font-bold min-w-[70px] text-left uppercase",
                                    tx.status === 'completed' || !tx.status ? "text-success" : "text-orange-600"
                                  )}>
                                    {tx.status === 'completed' || !tx.status
                                      ? (tx.type === 'income' ? "RECEBIDO" : "PAGO")
                                      : (tx.type === 'income' ? "A RECEBER" : "A PAGAR")
                                    }
                                  </span>
                                </div>
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
                              <TableCell className="text-[13px] text-center border-r border-border/50 py-2">
                                {tx.occasion || "-"}
                              </TableCell>
                            )}
                            {visibleColumns.includes("amount") && (
                              <TableCell className={`font-semibold font-mono text-[13px] tabular-nums text-center border-r border-border/50 py-3 ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
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
                      {!loadingTransactions && sortedData.length === 0 && (
                        <TableRow><TableCell colSpan={visibleColumns.length + 1} className="text-center text-muted-foreground py-10 italic">Nenhum lançamento encontrado</TableCell></TableRow>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

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
                <h1 className="text-xl font-semibold text-foreground tracking-tight capitalize mt-0.5">
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
