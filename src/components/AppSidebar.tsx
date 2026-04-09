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
import { useLocation, Link } from "react-router-dom";
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
  const currentPath = location.pathname;
  const { settings, user, logout, isAdmin, canManageFinances, canManageSecretariat, canAccessSecretariat } = useChurch();

  const mainItems = useMemo(() => {
    const items = [
      { title: "Painel Geral", url: "/", icon: LayoutDashboard, visible: true },
      { title: "Tesouraria", url: "/lancamentos", icon: CircleDollarSign, visible: canManageFinances },
      { title: "Secretaria", url: "/membros", icon: Users, visible: canAccessSecretariat },
      { title: "Configurações", url: "/configuracoes", icon: Settings, visible: true },
    ];
    return items.filter(item => item.visible);
  }, [canManageFinances, canAccessSecretariat]);

  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  const renderGroup = (label: string, items: { title: string; url: string; icon: any }[]) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-muted-foreground text-[10px] uppercase tracking-[0.15em] font-medium">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="hover:bg-sidebar-accent/50 text-sidebar-foreground text-[13px]"
                  activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-l-primary"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  const socialLinks = [
    { key: "instagram" as const, icon: Instagram, baseUrl: "https://instagram.com/" },
    { key: "facebook" as const, icon: Facebook, baseUrl: "https://facebook.com/" },
    { key: "youtube" as const, icon: Youtube, baseUrl: "https://youtube.com/" },
    { key: "whatsapp" as const, icon: MessageCircle, baseUrl: "https://wa.me/" },
  ];

  const activeSocials = socialLinks.filter((s) => settings.socialMedia[s.key]);

  return (
    <Sidebar collapsible="none" className="w-[72px] border-r border-sidebar-border bg-sidebar shrink-0">
      <SidebarContent className="p-2 gap-4 pt-4">
        <SidebarGroup className="p-0">
          <SidebarMenu className="gap-4">
            {mainItems.map((item) => {
              const active = isActive(item.url);
              return (
                <SidebarMenuItem key={item.title} className="flex justify-center">
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 relative group p-0 ${active
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground"
                      }`}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-5 w-5" />
                      {active && (
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                      )}
                      <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 uppercase tracking-wider border border-border">
                        {item.title}
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 pb-6 border-t border-sidebar-border gap-4 flex flex-col items-center">
        <SidebarMenu className="gap-4">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/ajuda")}
              className="h-10 w-10 p-0 flex items-center justify-center rounded-xl hover:bg-sidebar-accent text-sidebar-foreground/60"
            >
              <Link to="/ajuda">
                <BookOpen className="h-4 w-4" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logout()}
              className="h-10 w-10 p-0 flex items-center justify-center rounded-xl hover:bg-destructive/10 text-sidebar-foreground/60 hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
