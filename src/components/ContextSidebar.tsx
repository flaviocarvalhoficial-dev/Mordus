import { useLocation, Link } from "react-router-dom";
import {
    Users, Building2, FileText, MapPinned,
    Heart, CalendarDays, Handshake, Crown, LayoutDashboard,
    ArrowUpDown, FolderOpen, Lock, Bell, AlertCircle, TrendingUp,
    ChevronRight, ArrowRight, User, Settings, ShieldCheck, History, HardDrive, Layers
} from "lucide-react";
import { useChurch } from "@/contexts/ChurchContext";
import { Badge } from "@/components/ui/badge";
import { MordusLogo } from "@/components/MordusLogo";
import { useMemo } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    useSidebar
} from "@/components/ui/sidebar";

interface SubItem {
    title: string;
    url: string;
    icon: any;
    badge?: string;
}

const SECRETARIA_ITEMS: SubItem[] = [
    { title: "Dashboard", url: "/membros?tab=resumo", icon: LayoutDashboard },
    { title: "Membros", url: "/membros?tab=membros", icon: Users },
    { title: "Liderança", url: "/membros?tab=lideranca", icon: Crown },
    { title: "Departamentos", url: "/membros?tab=departamentos", icon: Layers },
    { title: "Patrimônio", url: "/membros?tab=patrimonio", icon: Building2 },
    { title: "Documentos", url: "/membros?tab=documentos", icon: FileText },
    { title: "Congregações", url: "/membros?tab=congregacoes", icon: MapPinned },
    { title: "Calendário", url: "/membros?tab=calendario", icon: CalendarDays },
    { title: "Ação Social", url: "/membros?tab=social", icon: Heart },
    { title: "Parcerias", url: "/membros?tab=parceiros", icon: Handshake },
];

const TESOURARIA_ITEMS: SubItem[] = [
    { title: "Resumo Financeiro", url: "/", icon: LayoutDashboard },
    { title: "Lançamentos", url: "/lancamentos?tab=movimentacoes", icon: ArrowUpDown },
    { title: "Categorias", url: "/lancamentos?tab=categorias", icon: FolderOpen },
    { title: "Fechamento", url: "/lancamentos?tab=fechamento", icon: Lock, badge: "Novo" },
    { title: "Relatórios", url: "/lancamentos?tab=relatorios", icon: FileText },
];

const SISTEMA_ITEMS: SubItem[] = [
    { title: "Meu Perfil", url: "/configuracoes?tab=perfil", icon: User },
    { title: "Instituição", url: "/configuracoes?tab=igreja", icon: Building2 },
    { title: "Financeiro", url: "/configuracoes?tab=financeiro", icon: ArrowUpDown },
    { title: "Armazenamento", url: "/configuracoes?tab=armazenamento", icon: HardDrive },
    { title: "Digital", url: "/configuracoes?tab=digital", icon: FileText },
    { title: "Configurações", url: "/configuracoes?tab=preferencias", icon: Settings },
    { title: "Equipe", url: "/configuracoes?tab=equipe", icon: ShieldCheck },
    { title: "Auditoria", url: "/configuracoes?tab=auditoria", icon: History },
];

export function ContextSidebar() {
    const location = useLocation();
    const { organization } = useChurch();
    const path = location.pathname;
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    const context = useMemo(() => {
        if (path.startsWith("/configuracoes") || path.startsWith("/ajuda")) return "sistema";
        if (path.startsWith("/membros") ||
            path.startsWith("/secretaria") ||
            path.startsWith("/patrimonio") ||
            path.startsWith("/documentos") ||
            path.startsWith("/congregacoes") ||
            path.startsWith("/departamentos") ||
            path.startsWith("/servico-social") ||
            path.startsWith("/calendario") ||
            path.startsWith("/parceiros") ||
            path.startsWith("/lideranca")) {
            return "secretaria";
        }
        return "tesouraria";
    }, [path]);

    const isItemActive = useMemo(() => {
        const fullPath = location.pathname + location.search;
        return (url: string) => {
            // Dashboard case (default tab is resumo)
            if (url === "/membros?tab=resumo") {
                return location.pathname === "/membros" && (!location.search || location.search.includes("tab=resumo"));
            }
            // Settings profile case (default tab is perfil)
            if (url === "/configuracoes?tab=perfil") {
                return location.pathname === "/configuracoes" && (!location.search || location.search.includes("tab=perfil"));
            }
            // Transactions default case
            if (url === "/lancamentos?tab=movimentacoes") {
                return location.pathname === "/lancamentos" && (!location.search || location.search.includes("tab=movimentacoes"));
            }
            // Other tab cases
            if (url.includes("?tab=")) {
                return fullPath === url;
            }
            // General case
            return location.pathname === url;
        };
    }, [location]);

    const items = context === "secretaria" ? SECRETARIA_ITEMS : context === "tesouraria" ? TESOURARIA_ITEMS : context === "sistema" ? SISTEMA_ITEMS : [];
    const title = context === "secretaria" ? "Secretaria" : context === "tesouraria" ? "Tesouraria" : "Sistema";

    // Special logic for Help page
    if (path === "/ajuda") {
        return (
            <div className={`border-r border-sidebar-border bg-sidebar-context flex flex-col h-screen transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-64 opacity-100"}`}>
                <div className="w-64">
                    <div className="p-6 pb-2">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 mb-4">Suporte</h2>
                    </div>
                    <div className="flex-1 px-4 py-8 text-center space-y-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold">Base de Conhecimento</h3>
                            <p className="text-xs text-muted-foreground mt-1">Consulte nossos manuais e tutoriais online.</p>
                        </div>
                        <Link to="/manual" className="block p-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity">
                            Abrir Manual
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`border-r border-sidebar-border bg-sidebar-context flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-64 opacity-100"}`}>
            <div className="w-64 flex flex-col h-full">
                <div className="p-6 pb-2">
                    <div className="mb-4">
                        <MordusLogo variant="full" className="h-5 w-auto" />
                    </div>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70 mb-4">{title}</h2>
                </div>

                <div className="flex-1 px-3 overflow-y-auto no-scrollbar">
                    <div className="space-y-1 py-2">
                        {items.map((item) => {
                            const active = isItemActive(item.url);
                            return (
                                <Link
                                    key={item.url}
                                    to={item.url}
                                    className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all group ${active
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${active ? "text-primary" : "text-muted-foreground/60"}`} />
                                        <span className={`text-[13px] ${active ? "font-bold" : "font-medium"}`}>{item.title}</span>
                                    </div>
                                    {item.badge ? (
                                        <Badge variant="secondary" className="bg-primary/10 text-primary text-[8px] font-black uppercase px-1.5 py-0 h-4 border-primary/20">
                                            {item.badge}
                                        </Badge>
                                    ) : (
                                        active && <ChevronRight className="h-3 w-3 opacity-50" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 mt-auto">
                    <div className="bg-white/50 border border-border/50 rounded-2xl p-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="h-12 w-12 text-primary" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status do Dia</span>
                        </div>
                        <p className="text-[11px] font-medium text-foreground leading-tight">
                            {context === 'secretaria' ? 'Não há aniversariantes hoje.' : 'Todas as contas estão em dia.'}
                        </p>
                        <Link to="/ajuda" className="flex items-center gap-1 text-[10px] text-primary font-bold mt-3 hover:gap-2 transition-all">
                            VER DETALHES <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
