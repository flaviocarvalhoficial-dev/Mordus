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
import Categories from "./pages/Categories";
import Closures from "./pages/Closures";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Patrimonio from "./pages/Patrimonio";
import Documentos from "./pages/Documentos";
import Congregacoes from "./pages/Congregacoes";
import Departamentos from "./pages/Departamentos";
import ServicoSocial from "./pages/ServicoSocial";
import Calendario from "./pages/Calendario";
import Parceiros from "./pages/Parceiros";
import Lideranca from "./pages/Lideranca";
import SecretariaDashboard from "./pages/SecretariaDashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

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
            <OnboardingModal />
            <Routes>
              <Route path="/auth" element={<Auth />} />

              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/lancamentos" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
              <Route path="/membros" element={<ProtectedRoute><Members /></ProtectedRoute>} />
              <Route path="/categorias" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
              <Route path="/fechamento" element={<ProtectedRoute><Closures /></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/patrimonio" element={<ProtectedRoute><Patrimonio /></ProtectedRoute>} />
              <Route path="/documentos" element={<ProtectedRoute><Documentos /></ProtectedRoute>} />
              <Route path="/congregacoes" element={<ProtectedRoute><Congregacoes /></ProtectedRoute>} />
              <Route path="/departamentos" element={<ProtectedRoute><Departamentos /></ProtectedRoute>} />
              <Route path="/servico-social" element={<ProtectedRoute><ServicoSocial /></ProtectedRoute>} />
              <Route path="/calendario" element={<ProtectedRoute><Calendario /></ProtectedRoute>} />
              <Route path="/parceiros" element={<ProtectedRoute><Parceiros /></ProtectedRoute>} />
              <Route path="/lideranca" element={<ProtectedRoute><Lideranca /></ProtectedRoute>} />
              <Route path="/secretaria" element={<ProtectedRoute><SecretariaDashboard /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ChurchProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
