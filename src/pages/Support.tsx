import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Lock, BookOpen, AlertTriangle, ArrowRight, Wallet, History, Verified, Sparkles, ShieldCheck, Globe, Users, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Support() {
    return (
        <div className="animate-fade-in space-y-16 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero Section - Storytelling Intro */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#FDFCFB] dark:bg-zinc-900/40 p-8 md:p-12 border border-orange-100 dark:border-orange-500/10 shadow-sm">
                <div className="relative z-10 max-w-3xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-0 uppercase text-[10px] tracking-[0.2em] font-black px-4 py-1">
                            Manual de Excelência
                        </Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] dark:text-white tracking-tight leading-tight mb-6">
                        Domine a Arte da <span className="text-orange-500">Mordomia Moderna</span>
                    </h1>

                    <div className="space-y-6 text-[#4A4A4A] dark:text-zinc-400">
                        <p className="text-lg font-medium leading-relaxed">
                            Aprenda a dominar o Mordus e entenda como nossa inteligência financeira ajuda a manter a saúde e a transparência da sua instituição.
                        </p>

                        <div className="h-px w-20 bg-orange-200 dark:bg-orange-500/20" />

                        <div className="space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-orange-600 dark:text-orange-500 flex items-center gap-2">
                                <Sparkles className="h-3 w-3" /> Por que "Mordus"?
                            </h3>
                            <p className="text-sm leading-relaxed opacity-90">
                                O <strong>Mordus</strong> nasce da união de <em>Mord</em> (mordomo) e <em>Ordus</em> (ordem), representando o propósito de trazer organização e responsabilidade à gestão da igreja. Mais do que um sistema de tesouraria, o Mordus é uma plataforma completa que auxilia tanto no controle financeiro quanto na organização administrativa, apoiando também a secretaria na gestão de membros, registros e informações essenciais. Com uma abordagem simples e estruturada, ele permite que tudo esteja no lugar certo — finanças, dados e processos — promovendo transparência, clareza e eficiência no dia a dia da igreja.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Decorative background element - Hand-drawn feel */}
                <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-orange-50/50 to-transparent pointer-events-none hidden md:block" />
                <HelpCircle className="absolute -bottom-10 -right-10 h-64 w-64 text-orange-500/5 rotate-12 pointer-events-none" />
            </div>

            {/* Quick Stats/Manifesto Tiles - Strategic Foundations */}
            <div id="fundamentos" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: ShieldCheck, title: "Gestão Blindada", desc: "Processos de fechamento que garantem 100% de integridade dos dados." },
                    { icon: Globe, title: "Transparência Total", desc: "Relatórios claros que geram confiança para toda a membresia." },
                    { icon: BookOpen, title: "Legado Digital", desc: "Histórico inalterável para as futuras gerações da instituição." }
                ].map((item, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-border/60 dark:border-white/5 hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors group">
                        <item.icon className="h-6 w-6 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h4 className="font-bold text-sm text-[#1A1A1A] dark:text-white mb-2">{item.title}</h4>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-20">

                    {/* 1. Integrated Manual Section - The Foundation */}
                    <section id="manual-completo" className="space-y-10">
                        <div className="space-y-2">
                            <Badge className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 border-0 uppercase text-[9px] tracking-[0.2em] font-black px-3 py-0.5 mb-2">
                                Enciclopédia Mordus
                            </Badge>
                            <h2 className="text-3xl font-black text-[#1A1A1A] dark:text-white">Conheça os Módulos</h2>
                            <p className="text-sm text-muted-foreground max-w-xl">
                                Uma visão profunda sobre como cada engrenagem do Mordus trabalha para a sua instituição.
                            </p>
                        </div>

                        <div className="space-y-10">
                            {/* Membros e Secretaria */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-3 text-slate-800 dark:text-zinc-200">
                                    <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-500">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    Gestão de Membros e Secretaria
                                </h3>
                                <div className="bg-slate-50/50 dark:bg-zinc-900/40 rounded-3xl p-8 border border-slate-100 dark:border-white/5 space-y-6">
                                    <p className="text-[13px] text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
                                        A Secretaria no Mordus é um organismo vivo de informações eclesiásticas:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <p className="text-[12px] font-bold text-slate-800 dark:text-zinc-200">Prontuário e Histórico</p>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-relaxed">Registro completo de batismos, cargos, consagrações e movimentações entre congregações.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[12px] font-bold text-slate-800 dark:text-zinc-200">Departamentalização</p>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-relaxed">Organização de ministérios e departamentos com gestão de lideranças e membros ativos.</p>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-widest font-black text-slate-400">
                                        <span>• Cadastro Digital</span>
                                        <span>• Atas e Documentos</span>
                                        <span>• Certificados</span>
                                        <span>• Inteligência de Dados</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tesouraria Blindada */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold flex items-center gap-3 text-slate-800 dark:text-zinc-200">
                                    <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-500">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                    Inteligência Financeira
                                </h3>
                                <Card className="rounded-[2rem] p-8 border-slate-100 dark:border-white/5 shadow-sm bg-white dark:bg-zinc-900 space-y-8 overflow-hidden relative">
                                    <p className="text-[13px] text-slate-600 dark:text-zinc-400 leading-relaxed relative z-10">
                                        Nosso sistema financeiro é construído sobre o pilar da <strong>Auditabilidade Contínua</strong>:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                        <div className="space-y-2">
                                            <p className="text-[12px] font-bold text-slate-800 dark:text-zinc-200">Fluxo de Caixa Seguro</p>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-relaxed">Saldos iniciais e finais são vinculados matematicamente, impedindo inconsistências no transporte de valores.</p>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[12px] font-bold text-slate-800 dark:text-zinc-200">Categorização Multinível</p>
                                            <p className="text-[11px] text-slate-500 dark:text-zinc-500 leading-relaxed">Centros de custos e categorias permitem uma visão clara de onde os recursos da instituição estão sendo aplicados.</p>
                                        </div>
                                    </div>
                                    <Verified className="absolute -bottom-6 -right-6 h-32 w-32 text-orange-500/5 rotate-12" />
                                </Card>
                            </div>
                        </div>
                    </section>

                    {/* 2. Operational Guide Section - The tutorials */}
                    <section id="tutoriais" className="space-y-10 pt-10 border-t border-border/50 dark:border-white/5">
                        <div className="space-y-2">
                            <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-50 border-0 uppercase text-[9px] tracking-[0.2em] font-black px-3 py-0.5 mb-2">
                                Passo a Passo
                            </Badge>
                            <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white">Processos de Fechamento</h2>
                            <p className="text-sm text-muted-foreground max-w-xl">
                                Guia prático para as operações mais críticas do sistema.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="group cursor-pointer bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-border/60 dark:border-white/5 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all duration-300 relative overflow-hidden">
                                        <History className="h-6 w-6 text-orange-600 mb-4" />
                                        <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white mb-2">Fechamento Retroativo</h3>
                                        <p className="text-[12px] text-muted-foreground leading-relaxed">Consertar meses anteriores sem quebrar o presente.</p>
                                        <div className="mt-4 text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                                            Abrir Tutorial <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none ring-1 ring-black/5 dark:ring-white/5 shadow-2xl bg-white dark:bg-zinc-900 transition-colors">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-black dark:text-white">Fechamento Retroativo</DialogTitle>
                                        <DialogDescription className="text-xs">Regularize meses passados com segurança.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-6 pt-6">
                                        {[
                                            { t: "Seletor de Data", d: "No dashboard, selecione o mês histórico que deseja regularizar." },
                                            { t: "Lançamentos", d: "Certifique-se que todas as notas e registros deste período estão corretos." },
                                            { t: "O Clique", d: "Ao fechar, o Mordus recalcula todos os saldos sucessores em uma reação em cadeia." },
                                            { t: "Resultado", d: "Seu caixa presente estará ajustado e auditável sem esforço manual." }
                                        ].map((s, i) => (
                                            <div key={i} className="flex gap-4">
                                                <div className="h-6 w-6 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</div>
                                                <div className="space-y-0.5 font-sans">
                                                    <p className="text-[13px] font-bold text-[#1A1A1A] dark:text-white">{s.t}</p>
                                                    <p className="text-[12px] text-muted-foreground leading-relaxed">{s.d}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <div className="group cursor-pointer bg-white dark:bg-zinc-900 rounded-[2rem] p-8 border border-border/60 dark:border-white/5 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all duration-300 relative overflow-hidden">
                                        <History className="h-6 w-6 text-orange-600 mb-4" />
                                        <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white mb-2">Transporte de Saldo</h3>
                                        <p className="text-[12px] text-muted-foreground leading-relaxed">A mágica da integridade contínua do Mordus.</p>
                                        <div className="mt-4 text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                                            Entenda a lógica <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </DialogTrigger>
                                <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none ring-1 ring-black/5 dark:ring-white/5 shadow-2xl bg-white dark:bg-zinc-900 transition-colors">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-black dark:text-white">Transporte de Saldo</DialogTitle>
                                        <DialogDescription className="text-xs">A matemática por trás do seu caixa.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-6 pt-6">
                                        <div className="bg-orange-50/50 dark:bg-orange-500/10 p-6 rounded-2xl text-center space-y-2 border border-orange-100 dark:border-orange-500/20 font-sans">
                                            <p className="text-[10px] font-black uppercase text-orange-700/60 dark:text-orange-500/60">Fórmula Mordus</p>
                                            <p className="text-xl font-black text-orange-900 dark:text-orange-400 tracking-tight">SI + E - S = SF</p>
                                        </div>
                                        <p className="text-[12px] text-muted-foreground leading-relaxed">
                                            O <strong>Saldo Final</strong> de um período é obrigatoriamente o <strong>Saldo Inicial</strong> do período seguinte. Essa conexão inquebrável blinda seu caixa contra erros de digitação e fraudes.
                                        </p>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </section>

                    {/* 3. FAQ Section */}
                    <section id="faq" className="space-y-8 pt-10 border-t border-border/50 dark:border-white/5">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-[#1A1A1A] dark:text-white flex items-center gap-3 font-sans uppercase tracking-tight">
                                <span className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                    <HelpCircle className="h-4 w-4 text-orange-600" />
                                </span>
                                Perguntas Frequentes
                            </h2>
                            <p className="text-sm text-muted-foreground">O atalho para as dúvidas rotineiras de nossos usuários.</p>
                        </div>

                        <Accordion type="single" collapsible className="w-full space-y-3">
                            {[
                                { q: "O que são 'Lançamentos Retroativos'?", a: "Valores registrados com datas anteriores ao último mês fechado. Eles servem como aviso de que o histórico foi alterado e precisa de um novo fechamento para manter a integridade." },
                                { q: "Como 'reabrir' um mês fechado?", a: "No histórico de fechamentos, exclua o registro do mês desejado. Isso desbloqueia o período para edições e ajustes." },
                                { q: "O 'Saldo Projetado' é confiável?", a: "Sim. Ele é o resultado matemático instantâneo do último saldo fechado somado a tudo que foi inserido no período atual (entradas e saídas)." },
                                { q: "Existe limite de usuários para suporte?", a: "Não. Administradores podem definir quem tem permissão para acessar este guia e solicitar ajuda especializada." }
                            ].map((item, idx) => (
                                <AccordionItem key={idx} value={`tab-${idx}`} className="border border-border/80 dark:border-white/5 rounded-2xl px-6 bg-white dark:bg-zinc-900 overflow-hidden transition-all hover:border-orange-200 dark:hover:border-orange-500/20 font-sans">
                                    <AccordionTrigger className="text-[13px] font-bold py-5 hover:no-underline dark:text-white">{item.q}</AccordionTrigger>
                                    <AccordionContent className="text-[12px] text-muted-foreground pb-6 leading-relaxed">{item.a}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </section>
                </div>

                {/* Sidebar Contextual - Fixed Navigation Index */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-[2rem] bg-orange-500/5 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 shadow-none p-8 relative overflow-hidden group">
                        <div className="relative z-10 space-y-6">
                            <div className="h-10 w-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-sm font-black uppercase tracking-[0.1em] text-orange-700 dark:text-orange-500 font-sans">Conselho Técnico</h4>
                                <p className="text-[13px] text-orange-950/80 dark:text-orange-200/80 leading-relaxed font-medium">
                                    Mantenha seus fechamentos em ordem cronológica rígida para garantir a integridade total dos dados.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 dark:from-zinc-950 dark:to-zinc-900 text-white space-y-6 transition-colors font-sans">
                        <h4 className="text-lg font-bold leading-tight">Ajuda especializada?</h4>
                        <p className="text-[12px] text-slate-400 dark:text-zinc-500 leading-relaxed">
                            Nossa equipe de suporte está pronta para auxiliar sua instituição.
                        </p>
                        <button className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 transition-colors text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20">
                            Falar com Suporte
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
