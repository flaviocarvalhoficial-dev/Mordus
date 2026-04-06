import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye, Loader2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";
import { toast } from "sonner";
import type { Database } from "@/types/database.types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"] & {
  categories?: { name: string } | null;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
}

interface ReportTemplateProps {
  organization: any;
  reportData: Transaction[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

const ReportTemplate = ({ organization, reportData, totalIncome, totalExpense, balance }: ReportTemplateProps) => (
  <div className="report-paper space-y-6 print:space-y-6">
    <div className="text-center border-b border-border pb-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{organization?.name}</h2>
      <h1 className="text-xl font-black text-foreground mt-1 uppercase tracking-tighter">Demonstrativo de Fluxo de Caixa</h1>
      <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
        <span>Período: Últimos 30 dias</span>
        <span>Emitido em: {new Date().toLocaleDateString("pt-BR")}</span>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 rounded-xl border border-border bg-secondary/10">
        <p className="text-[11px] text-muted-foreground uppercase font-medium">Entradas</p>
        <p className="text-lg font-bold font-mono text-success mt-1">{formatCurrency(totalIncome)}</p>
      </div>
      <div className="p-4 rounded-xl border border-border bg-secondary/10">
        <p className="text-[11px] text-muted-foreground uppercase font-medium">Saídas</p>
        <p className="text-lg font-bold font-mono text-destructive mt-1">{formatCurrency(totalExpense)}</p>
      </div>
      <div className="p-4 rounded-xl border border-border bg-secondary/5 print:bg-secondary/5">
        <p className="text-[11px] text-muted-foreground uppercase font-medium tracking-wider">Saldo Final</p>
        <p className={`text-xl font-bold font-mono mt-1 ${balance >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(balance)}</p>
      </div>
    </div>

    <div className="rounded-lg border border-border overflow-hidden print:border-none print:overflow-visible">
      <Table className="print:text-black">
        <TableHeader className="bg-secondary/20 print:bg-secondary/10">
          <TableRow>
            <TableHead className="w-[15%] text-[10px] font-bold uppercase tracking-tight py-3 text-center">Data</TableHead>
            <TableHead className="w-[50%] text-[10px] font-bold uppercase tracking-tight py-3 text-center">Descrição</TableHead>
            <TableHead className="w-[15%] text-[10px] font-bold uppercase tracking-tight py-3 text-center">Categoria</TableHead>
            <TableHead className="w-[20%] text-[10px] font-bold uppercase tracking-tight py-3 text-center">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reportData.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell className="text-xs font-mono text-center">{formatDate(tx.date)}</TableCell>
              <TableCell className="text-xs font-medium text-center">{tx.description}</TableCell>
              <TableCell className="text-xs text-muted-foreground text-center">{tx.categories?.name || "-"}</TableCell>
              <TableCell className={`text-xs font-bold font-mono text-center ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

    <div className="mt-8 pt-6 border-t border-border border-dashed text-center space-y-1">
      <p className="text-[12px] font-bold text-foreground">{organization?.name}</p>
      {organization?.cnpj && <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CNPJ: {organization.cnpj}</p>}
      {organization?.address && <p className="text-[10px] text-muted-foreground leading-snug">{organization.address}</p>}
      {organization?.phone && <p className="text-[10px] text-muted-foreground italic">Contato: {organization.phone}</p>}
    </div>
  </div>
);

export default function Reports() {
  const { organization } = useChurch();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<Transaction[]>([]);

  const fetchReportData = async (shouldOpenPreview = true) => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("transactions")
        .select(`*, categories!category_id(name)`)
        .eq("organization_id", organization.id)
        .gte("date", thirtyDaysAgo)
        .order("date", { ascending: false });

      if (error) throw error;
      setReportData(data || []);
      if (shouldOpenPreview) setPreviewOpen(true);
    } catch (err) {
      toast.error("Erro ao carregar prévia do relatório");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    // Se não houver dados, buscamos primeiro mas SEM abrir o modal automaticamente
    // (a versão oculta print:block cuidará da impressão)
    if (reportData.length === 0) {
      await fetchReportData(false);
    }

    setIsGenerating(true);
    try {
      // Pequeno delay para garantir que o DOM está pronto com os novos dados
      await new Promise(resolve => setTimeout(resolve, 500));

      const originalTitle = document.title;
      document.title = `Relatorio_Financeiro_${organization?.name?.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`;

      window.print();

      document.title = originalTitle;
      toast.success("Relatório preparado para impressão!");
    } catch (err) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  const totalIncome = reportData.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = reportData.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="print:hidden">
        <h2 className="text-lg font-semibold text-foreground">Relatórios</h2>
        <p className="text-muted-foreground text-[12px] mt-1">Prestação de contas corporativa — {organization?.name}</p>
      </div>

      <Card className="bg-card border-border print:hidden">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Gerar Relatórios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[13px] text-muted-foreground">
            Selecione o período para gerar o relatório de prestação de contas.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 bg-secondary/30 border-border hover:bg-secondary/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Últimos 30 Dias</p>
                  <p className="text-[11px] text-muted-foreground">Resumo geral das movimentações</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => fetchReportData(true)} disabled={loading}>
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5 mr-2" />}
                  Prévia
                </Button>
                <Button size="sm" className="flex-1 bg-primary text-primary-foreground" onClick={generatePDF} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-2" />}
                  Gerar PDF
                </Button>
              </div>
            </Card>

            <Card className="p-4 border-border border-dashed opacity-60">
              <div className="flex items-center gap-3">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="text-[13px] font-medium text-foreground">Relatório Anual 2025</p>
                  <p className="text-[11px] text-muted-foreground">Consolidado do ano anterior</p>
                </div>
              </div>
              <Button size="sm" className="mt-4 w-full" variant="outline" disabled>
                Disponível em breve
              </Button>
            </Card>
          </div>
        </CardContent>
      </Card>

      {reportData.length > 0 && (
        <div className="hidden print:block print:bg-white print:text-black print:m-0 print:p-0">
          <ReportTemplate
            organization={organization}
            reportData={reportData}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
          />
        </div>
      )}

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[820px] bg-zinc-100/90 dark:bg-zinc-900/90 border-border max-h-[90vh] overflow-y-auto print:hidden p-0 backdrop-blur-sm">
          <DialogHeader className="bg-background border-b border-border p-4 sticky top-0 z-10">
            <DialogTitle className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Prévia do Relatório de Movimentações (A4)
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 md:p-8">
            <ReportTemplate
              organization={organization}
              reportData={reportData}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              balance={balance}
            />
          </div>

          <div className="flex justify-end gap-2 p-4 border-t border-border bg-background sticky bottom-0 z-10">
            <Button variant="ghost" className="text-muted-foreground" onClick={() => setPreviewOpen(false)}>Fechar Janela</Button>
            <Button className="bg-primary text-primary-foreground print-allow" onClick={generatePDF} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Exportar em PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
