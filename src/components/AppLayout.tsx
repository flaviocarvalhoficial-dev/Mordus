import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation } from "react-router-dom";
import { Home, Bell, User, LayoutDashboard, ArrowUpDown, FolderOpen, Lock, FileText, Users, Building2, File as FileIcon, UsersRound, Heart, CalendarDays, Handshake, Settings, Church, Crown, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useChurch } from "@/contexts/ChurchContext";
import { useMemo } from "react";

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
  "/departamentos": { name: "Departamentos", section: "secretaria", icon: UsersRound },
  "/servico-social": { name: "Serviço Social", section: "secretaria", icon: Heart },
  "/calendario": { name: "Calendário", section: "secretaria", icon: CalendarDays },
  "/parceiros": { name: "Parceiros", section: "secretaria", icon: Handshake },
  "/lideranca": { name: "Liderança", section: "secretaria", icon: Crown },
  "/secretaria": { name: "Painel", section: "secretaria", icon: LayoutDashboard },
  "/configuracoes": { name: "Configurações", section: "sistema", icon: Settings },
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
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { settings, profile } = useChurch();
  const route = routeMap[location.pathname] || { name: "Página", section: "sistema" as const, icon: Home };
  const greeting = useMemo(() => getGreeting(), []);
  const SectionIcon = route.icon;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-border bg-background px-6">
            <div className="flex items-center gap-2 text-[13px] w-1/3">
              <SidebarTrigger className="mr-2" />
              <SectionIcon className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{sectionLabels[route.section]}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-semibold">{route.name}</span>
            </div>

            <div className="flex-1 max-w-sm relative group mx-4 h-8 flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Pesquisar no Mordus..."
                className="w-full h-8 bg-secondary/50 border-border/50 pl-8 pr-3 text-[13px] focus-visible:ring-primary/20 hover:bg-secondary/70 transition-all rounded-lg"
              />
            </div>

            <div className="flex items-center gap-3 justify-end w-1/3">
              <span className="text-[13px] text-muted-foreground hidden md:block">
                {greeting}, <span className="text-foreground font-medium">{settings.displayName || settings.churchName}</span>
              </span>
              <ThemeToggle />
              <button className="relative text-muted-foreground hover:text-foreground transition-colors">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
              </button>
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
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
