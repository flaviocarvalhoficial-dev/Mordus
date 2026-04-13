import {
  LayoutDashboard,
  ArrowUpDown,
  FolderOpen,
  Lock,
  FileText,
  Search,
  Settings,
  Users,
  Building2,
  File,
  Home,
  Crown,
  UsersRound,
  Heart,
  Handshake,
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  LogOut,
  BookOpen,
  CircleDollarSign,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useChurch } from "@/contexts/ChurchContext";
import { MordusLogo } from "@/components/MordusLogo";
import { useMemo } from "react";
import { Plus } from "lucide-react";
import { useTransactionModal } from "@/contexts/TransactionModalContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Painel Geral", url: "/", icon: LayoutDashboard },
  { title: "Tesouraria", url: "/lancamentos", icon: CircleDollarSign },
  { title: "Secretaria", url: "/membros", icon: Users },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentPath = location.pathname;
  const { settings, user, logout, isAdmin, canManageFinances, canManageSecretariat, canAccessSecretariat } = useChurch();
  const { openNewTransaction } = useTransactionModal();

  const mainItems = useMemo(() => {
    const items = [
      { title: "Painel Geral", url: "/", icon: LayoutDashboard, visible: true },
      { title: "Tesouraria", url: "/lancamentos", icon: CircleDollarSign, visible: canManageFinances },
      { title: "Secretaria", url: "/membros?tab=membros", icon: Users, visible: canAccessSecretariat },
    ];
    return items.filter(item => item.visible);
  }, [canManageFinances, canAccessSecretariat]);

  const isActive = (url: string) => {
    const path = url.split(/[?#]/)[0];
    return path === "/" ? currentPath === "/" : currentPath.startsWith(path);
  };

  return (
    <aside className="w-16 h-screen sticky top-0 bg-sidebar flex flex-col items-center py-8 shrink-0 border-r border-border/50">
      <div className="flex flex-col items-center gap-6 w-full">

        <div className="flex flex-col items-center gap-5 w-full">
          {mainItems.map((item) => {
            const active = isActive(item.url);
            return (
              <Link
                key={item.title}
                to={item.url}
                className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all duration-300 relative group ${active
                  ? "bg-primary/15 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                  : "text-sidebar-foreground/60 hover:text-primary hover:bg-secondary/50"
                  }`}
              >
                <item.icon className={`h-5.5 w-5.5 transition-transform duration-300 group-hover:scale-110 ${active ? "scale-110" : ""}`} />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center w-full">
        <button
          onClick={openNewTransaction}
          className="h-12 w-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_-4px_rgba(var(--primary),0.4)] hover:scale-110 active:scale-95 transition-all duration-300 group relative"
          title="Novo Lançamento (Alt+N)"
        >
          <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 group-hover:opacity-40" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-5 mt-auto w-full">
        <Link
          to="/configuracoes"
          className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all duration-300 group ${isActive("/configuracoes")
            ? "bg-secondary text-primary"
            : "text-sidebar-foreground/60 hover:text-primary hover:bg-secondary/50"
            }`}
        >
          <Settings className="h-5.5 w-5.5 group-hover:rotate-90 transition-transform duration-500" />
        </Link>

        <Link
          to="/ajuda"
          className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all duration-300 group ${isActive("/ajuda")
            ? "bg-secondary text-primary"
            : "text-sidebar-foreground/60 hover:text-primary hover:bg-secondary/50"
            }`}
        >
          <BookOpen className="h-5.5 w-5.5" />
        </Link>

        <button
          onClick={() => logout()}
          className="h-11 w-11 flex items-center justify-center rounded-xl transition-all duration-300 text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 group"
        >
          <LogOut className="h-5.5 w-5.5 group-hover:-translate-x-1 transition-transform" />
        </button>
      </div>
    </aside>
  );
}
