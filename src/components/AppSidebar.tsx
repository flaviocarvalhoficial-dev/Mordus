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
import { cn } from "@/lib/utils";
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
    <aside className="w-20 h-screen sticky top-0 bg-sidebar flex flex-col items-center py-10 shrink-0 border-r border-sidebar-border/50">
      <div className="flex flex-col items-center gap-8 w-full">
        <div className="flex flex-col items-center gap-4 w-full px-3">
          {mainItems.map((item) => {
            const active = isActive(item.url);
            return (
              <Link
                key={item.title}
                to={item.url}
                className={`h-12 w-12 flex items-center justify-center rounded-2xl transition-all duration-500 relative group ${active
                  ? "bg-background text-primary shadow-[0_8px_16px_-4px_rgba(var(--primary),0.15)] ring-1 ring-primary/10"
                  : "text-sidebar-foreground/50 hover:text-primary hover:bg-background/40"
                  }`}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-all duration-500",
                  active ? "scale-110 stroke-[2.5px]" : "group-hover:scale-110"
                )} />
                {active && (
                  <div className="absolute -left-3 w-1 h-6 bg-primary rounded-r-full animate-in slide-in-from-left duration-500" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center w-full my-8">
        <button
          onClick={openNewTransaction}
          className="h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_24px_-8px_rgba(var(--primary),0.5)] hover:scale-110 active:scale-95 transition-all duration-500 group relative ring-4 ring-primary/5"
          title="Novo Lançamento (Alt+N)"
        >
          <Plus className="h-7 w-7 group-hover:rotate-90 transition-transform duration-700 ease-in-out" />
          <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20 group-hover:opacity-40 pointer-events-none" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 mt-auto w-full px-3">
        <Link
          to="/configuracoes"
          className={cn(
            "h-12 w-12 flex items-center justify-center rounded-2xl transition-all duration-500 group",
            isActive("/configuracoes")
              ? "bg-background text-primary shadow-sm ring-1 ring-primary/10"
              : "text-sidebar-foreground/50 hover:text-primary hover:bg-background/40"
          )}
        >
          <Settings className="h-5 w-5 group-hover:rotate-45 transition-transform duration-700" />
        </Link>

        <Link
          to="/ajuda"
          className={cn(
            "h-12 w-12 flex items-center justify-center rounded-2xl transition-all duration-500 group",
            isActive("/ajuda")
              ? "bg-background text-primary shadow-sm ring-1 ring-primary/10"
              : "text-sidebar-foreground/50 hover:text-primary hover:bg-background/40"
          )}
        >
          <BookOpen className="h-5 w-5 group-hover:scale-110 transition-transform duration-500" />
        </Link>

        <button
          onClick={() => logout()}
          className="h-12 w-12 flex items-center justify-center rounded-2xl transition-all duration-500 text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 group mt-2"
        >
          <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-500" />
        </button>
      </div>
    </aside>
  );
}
