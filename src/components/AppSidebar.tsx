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
    <aside className="w-14 h-screen sticky top-0 bg-sidebar flex flex-col items-center justify-between py-6 shrink-0">
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {mainItems.map((item) => {
          const active = isActive(item.url);
          return (
            <Link
              key={item.title}
              to={item.url}
              className={`h-10 w-10 flex items-center justify-center transition-all duration-300 ${active
                ? "text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                : "text-sidebar-foreground/80 hover:text-primary"
                }`}
            >
              <item.icon className="h-6 w-6 transition-transform active:scale-90" />
            </Link>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-4 mt-auto">
        <Link
          to="/configuracoes"
          className={`h-10 w-10 flex items-center justify-center transition-all duration-300 ${isActive("/configuracoes")
            ? "text-primary"
            : "text-sidebar-foreground/80 hover:text-primary"
            }`}
        >
          <Settings className="h-5 w-5" />
        </Link>

        <Link
          to="/ajuda"
          className={`h-10 w-10 flex items-center justify-center transition-all duration-300 ${isActive("/ajuda")
            ? "text-primary"
            : "text-sidebar-foreground/80 hover:text-primary"
            }`}
        >
          <BookOpen className="h-5 w-5" />
        </Link>

        <button
          onClick={() => logout()}
          className="h-10 w-10 flex items-center justify-center transition-all duration-300 text-sidebar-foreground/80 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
