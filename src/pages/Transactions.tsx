import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, Trash2, Pencil, Calendar, Type, ArrowUpAZ, ArrowDownAZ, ArrowUp01, ArrowUpDown, Banknote, ListFilter, Lock, FileBarChart } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsDialog } from "@/components/TransactionsDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import type { Database } from "@/types/database.types";

import Categories from "./Categories";
import Closures from "./Closures";
import Reports from "./Reports";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  categories?: { name: string; color: string | null } | null;
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
  return new Date(dateStr).toLocaleDateString("pt-BR");
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
        .select(`*, categories(name, color)`)
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
      aVal = new Date(a.date).getTime();
      bVal = new Date(b.date).getTime();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Movimentações</h2>
          <p className="text-muted-foreground text-[12px] mt-0.5">Listagem detalhada de entradas e saídas</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 text-xs" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />Novo Lançamento
        </Button>
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por descrição..." className="pl-9 h-9 text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px] text-[11px] uppercase font-bold text-muted-foreground">Data</TableHead>
                <TableHead className="text-[11px] uppercase font-bold text-muted-foreground">Descrição</TableHead>
                <TableHead className="text-[11px] uppercase font-bold text-muted-foreground">Categoria</TableHead>
                <TableHead className="text-right text-[11px] uppercase font-bold text-muted-foreground">Valor</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell></TableRow>
                ))
              ) : sortedData.map((tx) => (
                <TableRow key={tx.id} className="group transition-colors">
                  <TableCell className="font-mono text-[11px] tabular-nums whitespace-nowrap">{formatDate(tx.date)}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-[13px] font-medium">{tx.description}</TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] font-medium px-2 py-0 h-5 leading-none">{tx.categories?.name || "Geral"}</Badge></TableCell>
                  <TableCell className={`text-right font-bold font-mono text-[13px] tabular-nums ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => openEdit(tx)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(tx.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && sortedData.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10 italic">Nenhum lançamento encontrado</TableCell></TableRow>
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

  if (!organization) return <div className="p-8 text-center text-muted-foreground">Carregando dados...</div>;

  return (
    <AppLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
            <Banknote className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Tesouraria & Finanças</h1>
            <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.1em]">{organization.name}</p>
          </div>
        </div>

        <Tabs defaultValue="movimentacoes" className="w-full">
          <TabsList className="bg-secondary/50 p-1 mb-4 h-10 border border-border/50">
            <TabsTrigger value="movimentacoes" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
              <ListFilter className="h-3.5 w-3.5 mr-2" /> Movimentações
            </TabsTrigger>
            <TabsTrigger value="categorias" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
              <Type className="h-3.5 w-3.5 mr-2" /> Categorias
            </TabsTrigger>
            <TabsTrigger value="fechamento" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
              <Lock className="h-3.5 w-3.5 mr-2" /> Fechamentos
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
              <FileBarChart className="h-3.5 w-3.5 mr-2" /> Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="movimentacoes" className="mt-0 focus-visible:ring-0">
            <TransactionsList />
          </TabsContent>
          <TabsContent value="categorias" className="mt-0 focus-visible:ring-0">
            <Categories />
          </TabsContent>
          <TabsContent value="fechamento" className="mt-0 focus-visible:ring-0">
            <Closures />
          </TabsContent>
          <TabsContent value="relatorios" className="mt-0 focus-visible:ring-0">
            <Reports />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
