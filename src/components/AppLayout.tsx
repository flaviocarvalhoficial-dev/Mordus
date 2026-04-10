import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ContextSidebar } from "@/components/ContextSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation, Outlet } from "react-router-dom";
import { Home, Bell, User, LayoutDashboard, ArrowUpDown, FolderOpen, Lock, FileText, Users, Building2, File as FileIcon, UsersRound, Heart, CalendarDays, Handshake, Settings, Church, Crown, Search, BookOpen, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useChurch } from "@/contexts/ChurchContext";
import { useMemo, useState, useEffect } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RouteInfo {
  name: string;
  section: "tesouraria" | "secretaria" | "sistema";
  icon: typeof LayoutDashboard;
}

const routeMap: Record<string, RouteInfo> = {
  "/": { name: "Painel", section: "tesouraria", icon: LayoutDashboard },
  "/lancamentos": { name: "Lançamentos", section: "tesouraria", icon: ArrowUpDown },
  "/categorias": { name: "Categorias", section: "tesouraria", icon: FolderOpen },
  "/fechamento": { name: "Fechamento", section: "tesouraria", icon: Lock },
  "/relatorios": { name: "Relatórios", section: "tesouraria", icon: FileText },
  "/membros": { name: "Membros", section: "secretaria", icon: Users },
  "/patrimonio": { name: "Patrimônio", section: "secretaria", icon: Building2 },
  "/documentos": { name: "Documentos", section: "secretaria", icon: FileIcon },
  "/congregacoes": { name: "Congregações", section: "secretaria", icon: Church },
  "/departamentos": { name: "Departamentos", section: "secretaria", icon: Layers },
  "/servico-social": { name: "Serviço Social", section: "secretaria", icon: Heart },
  "/calendario": { name: "Calendário", section: "secretaria", icon: CalendarDays },
  "/parceiros": { name: "Parceiros", section: "secretaria", icon: Handshake },
  "/lideranca": { name: "Liderança", section: "secretaria", icon: Crown },
  "/secretaria": { name: "Painel", section: "secretaria", icon: LayoutDashboard },
  "/configuracoes": { name: "Configurações", section: "sistema", icon: Settings },
  "/ajuda": { name: "Guia de Uso", section: "sistema", icon: BookOpen },
};

const sectionLabels = {
  tesouraria: "Tesouraria",
  secretaria: "Secretaria",
  sistema: "Sistema",
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { settings, profile } = useChurch();
  const route = routeMap[location.pathname] || { name: "Página", section: "sistema" as const, icon: Home };
  const greeting = useMemo(() => getGreeting(), []);
  const SectionIcon = route.icon;
  return (
    <div className="h-screen flex w-full overflow-hidden">
      <AppSidebar />
      <ContextSidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <header className="h-16 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6 md:px-10 sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-2 text-[13px] w-1/3">
            <SidebarTrigger className="mr-2" />
            <SectionIcon className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">{sectionLabels[route.section]}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-semibold">{route.name}</span>
          </div>

          <GlobalSearch />

          <div className="flex items-center gap-3 justify-end w-1/3">
            <span className="text-[13px] text-muted-foreground hidden md:block">
              {greeting}, <span className="text-foreground font-medium">{settings.displayName || settings.churchName}</span>
            </span>
            <ThemeToggle />
            <Link to="/configuracoes" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center border border-border overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="User Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-hidden print:overflow-visible">
          <ScrollArea className="h-full w-full" scrollHideDelay={0}>
            <div className="px-6 py-6 md:px-10 md:py-8 print:p-0 max-w-[1600px] mx-auto w-full">
              {children || <Outlet />}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}
