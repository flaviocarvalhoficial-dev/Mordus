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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useChurch } from "@/contexts/ChurchContext";
import { MordusLogo } from "@/components/MordusLogo";
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
  { title: "Tesouraria", url: "/lancamentos", icon: ArrowUpDown },
  { title: "Secretaria", url: "/membros", icon: Users },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { settings, user, signOut } = useChurch();

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
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <MordusLogo
            variant={collapsed ? "icon" : "full"}
            className={`${collapsed ? "h-8 w-8" : "w-[100px] h-auto"} transition-all duration-300 text-sidebar-foreground`}
          />
        </div>
        {!collapsed && (
          <div className="relative mt-3">
            <Input
              placeholder="Buscar..."
              className="h-8 bg-secondary border-border text-xs pl-3 pr-8 placeholder:text-muted-foreground"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Navegação Principal", mainItems)}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border space-y-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut()}
              className="text-sidebar-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sair do Sistema</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {activeSocials.length > 0 && (
          <div className={`flex ${collapsed ? "flex-col" : ""} items-center gap-2 ${collapsed ? "" : "justify-center"}`}>
            {activeSocials.map((s) => (
              <a
                key={s.key}
                href={`${s.baseUrl}${settings.socialMedia[s.key]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sidebar-muted hover:text-primary transition-colors"
              >
                <s.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        )}
        {!collapsed && activeSocials.length === 0 && (
          <p className="text-[11px] text-muted-foreground text-center">v1.0 — MVP</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
