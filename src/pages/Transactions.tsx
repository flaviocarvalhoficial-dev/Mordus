import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Trash2, Pencil, Calendar, Type, ArrowUpAZ, ArrowDownAZ, ArrowUp01, ArrowUpDown, Banknote, ListFilter, Lock, FileBarChart, HelpCircle, ChevronRight, Home } from "lucide-react";
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
import { TransactionsDialog } from "@/components/TransactionsDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function TransactionsList() {
  const { organization } = useChurch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [sortField, setSortField] = useState<"date" | "description" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showTotals, setShowTotals] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchData();
      fetchCategories();
    }
  }, [organization?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: txs, error } = await supabase
        .from("transactions")
        .select(`*, categories!category_id(name, color), payment_method_cat:categories!payment_method_id(name)`)
        .eq("organization_id", organization!.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setData(txs || []);
    } catch (err) {
      toast.error("Erro ao carregar lançamentos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name, type")
      .eq("organization_id", organization!.id);
    setCategories(cats || []);
  };

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
      setData(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      toast.error("Erro ao excluir lançamento");
    }
  };

  const filtered = data.filter((tx) => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (categoryFilter !== "all" && tx.category_id !== categoryFilter) return false;
    if (yearFilter !== "all" && tx.date.split("-")[0] !== yearFilter) return false;
    if (monthFilter !== "all" && tx.date.split("-")[1] !== monthFilter) return false;
    if (searchQuery && !tx.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const sortedData = [...filtered].sort((a, b) => {
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
        onSuccess={fetchData}
        editingTransaction={editingTransaction}
      />

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
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Entradas</SelectItem>
                  <SelectItem value="expense">Saídas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Categorias</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-24 h-8 text-xs"><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>{years.map((y) => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-24 h-8 text-xs"><SelectValue placeholder="Mês" /></SelectTrigger>
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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[12%] text-[11px] uppercase font-bold text-muted-foreground text-center">Data</TableHead>
                <TableHead className="w-[35%] text-[11px] uppercase font-bold text-muted-foreground text-center">Descrição</TableHead>
                <TableHead className="w-[18%] text-[11px] uppercase font-bold text-muted-foreground text-center">Categoria</TableHead>
                <TableHead className="w-[18%] text-[11px] uppercase font-bold text-muted-foreground text-center">Meio</TableHead>
                <TableHead className="w-[12%] text-[11px] uppercase font-bold text-muted-foreground text-center">Valor</TableHead>
                <TableHead className="w-[5%]"></TableHead>
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
