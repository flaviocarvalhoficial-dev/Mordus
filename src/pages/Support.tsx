import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Lock, BookOpen, AlertTriangle, ArrowRight, Wallet, History, Verified } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Support() {
    return (
        <div className="animate-fade-in space-y-8 pb-12">
            {/* Header Estilizado */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 border border-primary/10">
                <div className="relative z-10">
                    <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/20 border-0 uppercase text-[10px] tracking-widest font-black">
                        Central de Conhecimento
                    </Badge>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Guia de Uso & FAQ</h1>
                    <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed">
                        Aprenda a dominar o Mordus e entenda como nossa inteligência financeira ajuda a manter a saúde da sua instituição.
                    </p>
                </div>
                <HelpCircle className="absolute -bottom-6 -right-6 h-48 w-48 text-primary/5 rotate-12" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lado Esquerdo: Guia de Funcionalidades */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-bold">Domine os Lançamentos e Fechamentos</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 cursor-pointer group">
                                        <CardHeader className="pb-2">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                <History className="h-5 w-5 text-primary" />
                                            </div>
                                            <CardTitle className="text-sm font-bold">Fechamento Retroativo</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-[12px] text-muted-foreground leading-relaxed">
                                                Esqueceu de fechar um mês no ano passado? Sem problemas. O Mordus permite selecionar qualquer período no passado para regularizar seu caixa.
                                            </p>
                                            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-primary uppercase">
                                                Passo a passo <ArrowRight className="h-3 w-3" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </DialogTrigger>
                                <DialogContent className="max-w-md rounded-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <History className="h-5 w-5 text-primary" />
                                            Tutorial: Fechamento Retroativo
                                        </DialogTitle>
                                        <DialogDescription className="text-xs">
                                            Como regularizar meses anteriores de forma segura.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        {[
                                            { title: "Selecione o Período", desc: "No topo da tela de Lançamentos ou Fechamento, use o seletor de mês e ano para voltar ao mês desejado." },
                                            { title: "Verifique Lançamentos", desc: "Garanta que todas as entradas e saídas daquele mês específico foram registradas." },
                                            { title: "Inicie o Fechamento", desc: "Clique em 'Realizar Fechamento'. O sistema calculará o saldo automaticamente." },
                                            { title: "Propagação de Saldo", desc: "Ao fechar um mês antigo, o Mordus irá recalcular o saldo inicial de TODOS os meses seguintes até o dia de hoje." }
                                        ].map((step, i) => (
                                            <div key={i} className="flex gap-3">
                                                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold">{step.title}</p>
                                                    <p className="text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 cursor-pointer group">
                                        <CardHeader className="pb-2">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                <Wallet className="h-5 w-5 text-primary" />
                                            </div>
                                            <CardTitle className="text-sm font-bold">Saldo de Transporte (Carry-over)</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-[12px] text-muted-foreground leading-relaxed">
                                                O saldo final de um mês é automaticamente levado como saldo inicial para o próximo. Isso cria uma corrente inquebrável de auditoria.
                                            </p>
                                            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-primary uppercase">
                                                Entenda a lógica <ArrowRight className="h-3 w-3" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </DialogTrigger>
                                <DialogContent className="max-w-md rounded-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <Wallet className="h-5 w-5 text-primary" />
                                            Entenda o Saldo de Transporte
                                        </DialogTitle>
                                        <DialogDescription className="text-xs">
                                            A matemática por trás do seu fluxo de caixa.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-border space-y-2">
                                            <p className="text-[11px] font-mono text-center text-muted-foreground">Fórmula Mordus:</p>
                                            <p className="text-xs font-bold text-center tracking-tight">
                                                Saldo Inicial + Entradas - Saídas = Saldo Final
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex gap-3">
                                                <Verified className="h-4 w-4 text-success shrink-0" />
                                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                    <strong>Integridade:</strong> O saldo final do mês de Janeiro será, obrigatoriamente, o saldo inicial do mês de Fevereiro.
                                                </p>
                                            </div>
                                            <div className="flex gap-3">
                                                <Verified className="h-4 w-4 text-success shrink-0" />
                                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                    <strong>Auditabilidade:</strong> Isso impede que valores "surjam" ou "desapareçam" entre os meses sem uma transação registrada.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Verified className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-bold">Dúvidas Frequentes (FAQ)</h2>
                        </div>

                        <Accordion type="single" collapsible className="w-full space-y-2">
                            <AccordionItem value="item-1" className="border rounded-xl px-4 bg-muted/30">
                                <AccordionTrigger className="text-sm font-medium hover:no-underline py-4">
                                    Por que o sistema diz que existem "Lançamentos Retroativos"?
                                </AccordionTrigger>
                                <AccordionContent className="text-xs text-muted-foreground pb-4 leading-relaxed">
                                    Isso acontece quando você tem transações datadas antes do seu primeiro fechamento. O sistema detecta que parte do seu dinheiro não foi "oficializada" por nenhum período anterior. Recomendamos voltar nestes meses e fazer o fechamento para normalizar seu saldo.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-2" className="border rounded-xl px-4 bg-muted/30">
                                <AccordionTrigger className="text-sm font-medium hover:no-underline py-4">
                                    Posso reabrir um mês que já foi fechado?
                                </AccordionTrigger>
                                <AccordionContent className="text-xs text-muted-foreground pb-4 leading-relaxed">
                                    Sim! Basta ir ao histórico de fechamentos e clicar no ícone da lixeira (excluir). Isso tornará o período aberto novamente para você editar ou excluir transações. Lembre-se: excluir um fechamento afeta o saldo inicial dos meses seguintes.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-3" className="border rounded-xl px-4 bg-muted/30">
                                <AccordionTrigger className="text-sm font-medium hover:no-underline py-4">
                                    O que é o "Saldo Projetado"?
                                </AccordionTrigger>
                                <AccordionContent className="text-xs text-muted-foreground pb-4 leading-relaxed">
                                    É a previsão matemática do seu caixa. Somamos o saldo que veio do mês anterior + entradas - saídas do período atual. Se este número estiver negativo, você receberá um alerta visual.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-4" className="border rounded-xl px-4 bg-muted/30">
                                <AccordionTrigger className="text-sm font-medium hover:no-underline py-4">
                                    Qual a diferença entre o Modo Contínuo e Flexível?
                                </AccordionTrigger>
                                <AccordionContent className="text-xs text-muted-foreground pb-4 leading-relaxed">
                                    <p className="font-bold mb-2 text-primary">Modo Contínuo (Recomendado):</p>
                                    Exige que você feche os meses em ordem cronológica. Isso garante que o saldo final de um mês seja exatamente o saldo inicial do próximo, criando uma trilha de auditoria inquebrável. É o padrão para contabilidade oficial.

                                    <p className="font-bold mt-4 mb-2 text-primary">Modo Flexível:</p>
                                    Dá liberdade total. Você pode fechar qualquer período sem avisos de "lançamentos órfãos" ou "gaps" no tempo. Útil para quem está organizando históricos antigos ou prefere um controle menos rígido. Você pode alternar entre os modos nas Configurações Financeiras.
                                </AccordionContent>
                            </AccordionItem>

                            <AccordionItem value="item-5" className="border rounded-xl px-4 bg-muted/30">
                                <AccordionTrigger className="text-sm font-medium hover:no-underline py-4">
                                    Meus lançamentos não aparecem no fechamento, por que?
                                </AccordionTrigger>
                                <AccordionContent className="text-xs text-muted-foreground pb-4 leading-relaxed">
                                    Verifique se a data do lançamento está dentro do intervalo mostrado no card "Período em Aberto". Se o lançamento for muito antigo, use o seletor de mês/ano no topo da tela para encontrá-lo.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </section>
                </div>

                {/* Lado Direito: Call to Actions/Alertas */}
                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/20 shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-primary" />
                                Dica Profissional
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Mantenha seus fechamentos em ordem cronológica. Se você pular um mês, o Mordus tentará "pular o gap" e buscar todas as transações pendentes, mas o ideal para contabilidade é ter um fechamento por mês calendário.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-dashed border-border shadow-none">
                        <CardContent className="p-6 text-center">
                            <div className="h-12 w-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                                <Lock className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Segurança dos Dados</h4>
                            <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                                Todos os seus fechamentos são gravados com audit trail (quem fechou, quando e estado final), garantindo que seu financeiro seja à prova de erros.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
