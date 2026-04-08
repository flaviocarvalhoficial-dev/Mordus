import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle2, FileText, Info, ShieldCheck, Zap, ArrowLeft, MousePointer2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Manual() {
    return (
        <div className="max-w-5xl mx-auto py-12 px-4 space-y-12 animate-fade-in">
            {/* Header com Navegação */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <Link to="/ajuda" className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest hover:gap-3 transition-all mb-4">
                        <ArrowLeft className="h-4 w-4" /> Voltar ao Suporte
                    </Link>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">Manual do Sistema</h1>
                    <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
                        Documentação técnica e funcional completa para dominar todas as ferramentas do Mordus.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl font-bold text-xs uppercase" onClick={() => window.print()}>
                        Imprimir PDF
                    </Button>
                </div>
            </div>

            {/* Grid de Seções */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-border">
                {/* Navegação Rápida */}
                <div className="md:col-span-1 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Tópicos principais</h3>
                    <nav className="space-y-1">
                        {["Visão Geral", "Gestão de Membros", "Gestão Financeira", "Relatórios Financeiros", "Configurações Globais", "Segurança e Permissões"].map((item) => (
                            <a
                                key={item}
                                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                                className="block px-4 py-3 rounded-xl hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border"
                            >
                                {item}
                            </a>
                        ))}
                    </nav>

                    <Card className="bg-primary/5 border-primary/20 shadow-none mt-8">
                        <CardContent className="p-4 space-y-3">
                            <Info className="h-5 w-5 text-primary" />
                            <h4 className="text-sm font-bold">Precisa de Ajuda Extra?</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Se não encontrar o que procura aqui, entre em contato com nosso suporte técnico via chat.
                            </p>
                            <Button className="w-full rounded-xl text-xs font-bold uppercase bg-primary hover:bg-primary/90">
                                Falar com Consultor
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Conteúdo do Manual */}
                <div className="md:col-span-2 space-y-16">
                    <section id="visao-geral" className="space-y-4">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Zap className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-bold">Visão Geral do Mordus</h2>
                        <div className="prose prose-sm prose-neutral dark:prose-invert">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                O Mordus é um ecossistema completo para gestão eclesiástica. Nosso foco é
                                <strong> transparência, agilidade e inteligência financeira</strong>. O sistema é dividido
                                em três grandes pilares: Secretaria, Tesouraria e Administração.
                            </p>
                            <ul className="space-y-4 pt-4">
                                <li className="flex gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">Gestão Multidepartamental</p>
                                        <p className="text-xs text-muted-foreground">Controle cada departamento da igreja de forma independente porém integrada.</p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold">Tesouraria Blindada</p>
                                        <p className="text-xs text-muted-foreground">Sistema de fechamento mensal que garante que nenhum centavo seja esquecido.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section id="gestao-financeira" className="space-y-6 pt-8 border-t border-border/50 font-sans">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-bold">Gestão Financeira e Fechamentos</h2>

                        <div className="space-y-8">
                            <div className="bg-muted/30 p-6 rounded-2xl border border-border">
                                <h4 className="font-bold text-base mb-4 flex items-center gap-2">
                                    <MousePointer2 className="h-4 w-4 text-primary" /> Como realizar um fechamento
                                </h4>
                                <ol className="space-y-4">
                                    {[
                                        "Acesse a aba 'Lançamentos' e clique em 'Fechamento'.",
                                        "Verifique se o saldo inicial está correto (ele vem do mês anterior).",
                                        "Confira todas as entradas e saídas listadas no período.",
                                        "Se tudo estiver ok, clique em 'Finalizar Fechamento'.",
                                        "O sistema irá bloquear edições para este período e gerar o saldo de transporte."
                                    ].map((step, idx) => (
                                        <li key={idx} className="flex gap-3 text-sm text-muted-foreground">
                                            <span className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</span>
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            <Card className="border-l-4 border-l-primary border-border bg-card">
                                <CardContent className="p-6">
                                    <h5 className="font-bold text-sm mb-2">Importante: Fechamento Retroativo</h5>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Se você pular um mês, o Mordus manterá o período como "Aberto". Para regularizar, você deve fechar os meses em ordem. O sistema permite fechar meses passados, mas lembre-se que isso recalculará todos os saldos sucessores automaticamente.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    <section id="seguranca-e-permissoes" className="space-y-4 pt-8 border-t border-border/50">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <h2 className="text-2xl font-bold">Segurança e Permissões</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            O acesso aos módulos financeiros e de pessoal é restrito por níveis. Apenas usuários com permissão de administrador ou tesoureiro podem realizar e reabrir fechamentos mensais. Todas as ações críticas geram logs de auditoria consultáveis.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
