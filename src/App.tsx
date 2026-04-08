import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChurchProvider, useChurch } from "@/contexts/ChurchContext";
import { OnboardingModal } from "@/components/OnboardingModal";
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Members from "./pages/Members";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import Support from "./pages/Support";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

import { SidebarProvider } from "@/components/ui/sidebar";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useChurch();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <ChurchProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />

              <Route element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <AppLayout />
                  </SidebarProvider>
                </ProtectedRoute>
              }>
                <Route path="/" element={<><OnboardingModal /><Dashboard /></>} />
                <Route path="/lancamentos" element={<Transactions />} />
                <Route path="/membros" element={<Members />} />
                <Route path="/configuracoes" element={<Settings />} />
                <Route path="/ajuda" element={<Support />} />

                <Route path="/categorias" element={<Navigate to="/lancamentos?tab=categorias" replace />} />
                <Route path="/fechamento" element={<Navigate to="/lancamentos?tab=fechamento" replace />} />
                <Route path="/relatorios" element={<Navigate to="/lancamentos?tab=relatorios" replace />} />

                <Route path="/secretaria" element={<Navigate to="/membros?tab=resumo" replace />} />
                <Route path="/lideranca" element={<Navigate to="/membros?tab=lideranca" replace />} />
                <Route path="/departamentos" element={<Navigate to="/membros?tab=departamentos" replace />} />
                <Route path="/patrimonio" element={<Navigate to="/membros?tab=patrimonio" replace />} />
                <Route path="/documentos" element={<Navigate to="/membros?tab=documentos" replace />} />
                <Route path="/congregacoes" element={<Navigate to="/membros?tab=congregacoes" replace />} />
                <Route path="/calendario" element={<Navigate to="/membros?tab=calendario" replace />} />
                <Route path="/servico-social" element={<Navigate to="/membros?tab=social" replace />} />
                <Route path="/parceiros" element={<Navigate to="/membros?tab=parceiros" replace />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ChurchProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
