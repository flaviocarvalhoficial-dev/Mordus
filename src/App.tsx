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
import { Loader2 } from "lucide-react";

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
        <SidebarProvider>
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
                <Route path="/configuracoes" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SidebarProvider>
      </ChurchProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
