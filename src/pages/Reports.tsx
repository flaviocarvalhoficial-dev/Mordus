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

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays, subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  periodLabel: string;
}

const ReportTemplate = ({ organization, reportData, totalIncome, totalExpense, balance, periodLabel }: ReportTemplateProps) => (
  <div className="report-paper flex flex-col justify-between print:m-0 print:p-[20mm] bg-white">
    <div className="w-full">
      <div className="text-center border-b-2 border-primary/20 pb-8 mb-12 pt-4 relative">
        <div className="absolute top-0 right-0 text-[8px] text-muted-foreground/60 font-mono uppercase tracking-tighter">
          {`DOCRef: ${organization?.name?.substring(0, 3)}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}`}
        </div>
        <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary/80">{organization?.name}</h2>
        <h1 className="text-3xl font-black text-foreground mt-4 uppercase tracking-tighter leading-tight">Demonstrativo de Fluxo de Caixa</h1>
        <div className="flex items-center justify-between mt-10 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
          <span>Período: {periodLabel}</span>
          <span>Emitido em: {new Date().toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
      {/* ... rest of the template ... */}

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
    </div>

    <div className="mt-12 pt-6 border-t border-border border-dashed text-center space-y-1">
      <p className="text-[12px] font-bold text-foreground">{organization?.name}</p>
      {organization?.cnpj && <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CNPJ: {organization.cnpj}</p>}
      {organization?.address && <p className="text-[10px] text-muted-foreground leading-snug">{organization.address}</p>}
      {organization?.phone && <p className="text-[10px] text-muted-foreground italic">Contato: {organization.phone}</p>}
    </div>
  </div >
);

// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function Reports() {
  const { organization } = useChurch();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const getPeriodLabel = () => {
    if (!dateRange?.from) return "Período não selecionado";
    if (!dateRange?.to) return `A partir de ${format(dateRange.from, "dd/MM/yyyy")}`;
    return `${format(dateRange.from, "dd/MM/yyyy")} a ${format(dateRange.to, "dd/MM/yyyy")}`;
  };

  const fetchReportData = async (shouldOpenPreview = true) => {
    if (!organization?.id || !dateRange?.from) return;
    setLoading(true);
    try {
      const from = dateRange.from.toISOString().split('T')[0];
      const to = (dateRange.to || dateRange.from).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("transactions")
        .select(`*, categories!category_id(name)`)
        .eq("organization_id", organization.id)
        .gte("date", from)
        .lte("date", to)
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
    if (reportData.length === 0) {
      await fetchReportData(false);
    }

    // Pegamos a organização atualizada caso não tenha sido carregada
    if (!organization) return;

    setIsGenerating(true);
    const toastId = toast.loading("Gerando arquivo PDF...");

    try {
      // Pequeno delay para garantir que o DOM está pronto com os novos dados
      await new Promise(resolve => setTimeout(resolve, 800));

      const element = document.getElementById('report-to-print');
      if (!element) throw new Error("Elemento do relatório não encontrado");

      const opt = {
        margin: 0,
        filename: `Relatorio_${organization.name?.replace(/\s+/g, '_')}_${format(new Date(), "dd-MM-yyyy")}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollY: 0,
          scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      } as const;

      // No modo download direto, precisamos garantir que o elemento esteja visível temporariamente
      // ou renderizá-lo em um local que o html2pdf consiga capturar sem interferência da UI
      await html2pdf().set(opt).from(element).save();

      toast.success("Download concluído com sucesso!", { id: toastId });
    } catch (err) {
      console.error("Erro no PDF:", err);
      toast.error("Erro ao gerar o download do PDF", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const totalIncome = reportData.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = reportData.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="animate-fade-in space-y-6">


      <Card className="bg-card border-border print:hidden">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Gerar Relatórios</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground ml-1">Período do Relatório</label>
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                className="w-full md:w-[320px]"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="flex-1 md:w-32 rounded-full" onClick={() => fetchReportData(true)} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ver Prévia"}
              </Button>
              <Button className="flex-1 md:w-32 bg-primary text-primary-foreground rounded-full" onClick={generatePDF} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar PDF"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Card className="p-2.5 bg-secondary/10 border-border hover:bg-secondary/20 transition-all cursor-pointer group w-fit min-w-[180px]" onClick={() => {
              setDateRange({ from: subDays(new Date(), 30), to: new Date() });
            }}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[12px] font-bold">Últimos 30 Dias</p>
                  <p className="text-[10px] text-muted-foreground">Configuração rápida</p>
                </div>
              </div>
            </Card>

            <Card className="p-2.5 bg-secondary/10 border-border hover:bg-secondary/20 transition-all cursor-pointer group w-fit min-w-[180px]" onClick={() => {
              const now = new Date();
              setDateRange({
                from: new Date(now.getFullYear(), now.getMonth(), 1),
                to: now
              });
            }}>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[12px] font-bold">Mês Atual</p>
                  <p className="text-[10px] text-muted-foreground">Lançamentos de {format(new Date(), "MMMM", { locale: ptBR })}</p>
                </div>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="absolute left-[-9999px] top-0 overflow-hidden">
        <div id="report-to-print" className="bg-white text-black p-0 m-0 w-[210mm] leading-none">
          <ReportTemplate
            organization={organization}
            reportData={reportData}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
            periodLabel={getPeriodLabel()}
          />
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[820px] bg-zinc-100/90 dark:bg-zinc-900/90 border-border max-h-[90vh] overflow-y-auto p-0 backdrop-blur-sm print:hidden">
          <DialogHeader className="bg-background border-b border-border p-4 sticky top-0 z-10 print:hidden">
            <DialogTitle className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Prévia do Relatório (A4)
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 md:p-8">
            <ReportTemplate
              organization={organization}
              reportData={reportData}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              balance={balance}
              periodLabel={getPeriodLabel()}
            />
          </div>

          <div className="flex justify-end gap-2 p-4 border-t border-border bg-background sticky bottom-0 z-10 print:hidden">
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
