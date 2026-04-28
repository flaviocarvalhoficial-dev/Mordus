import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChurch } from "@/contexts/ChurchContext";
import { Church, Loader2, PlusCircle, LogIn, X, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function OnboardingModal() {
  const { user, profile, organization, loading, setHasSeenOnboarding, hasSeenOnboarding, logout } = useChurch();
  const [churchName, setChurchName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [onboardingType, setOnboardingType] = useState<"create" | "join" | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Se estiver carregando os dados do contexto, não mostra o onboarding ainda
  if (loading) return null;
  // Se o usuário já ignorou ou tem igreja, pula
  if (hasSeenOnboarding || organization || profile?.organization_id) return null;
  if (!user) return null;

  const handleCreateChurch = async () => {
    // ... same logic ...
    if (!churchName) {
      toast.error("Por favor, informe o nome da sua igreja");
      return;
    }

    setIsCreating(true);
    try {
      const { data: org, error: orgError } = await (supabase
        .from("organizations") as any)
        .insert([{ name: churchName }])
        .select()
        .single();

      if (orgError) throw orgError;

      const { error: profileError } = await (supabase
        .from("profiles") as any)
        .update({ organization_id: org.id, role: 'admin' })
        .eq("id", user.id);

      if (profileError) throw profileError;

      const defaultCategories = [
        { name: "Oferta", type: "income", color: "success", organization_id: org.id },
        { name: "Dízimo", type: "income", color: "success", organization_id: org.id },
        { name: "Água", type: "expense", color: "destructive", organization_id: org.id },
        { name: "Energia", type: "expense", color: "destructive", organization_id: org.id },
      ];

      await (supabase.from("categories") as any).insert(defaultCategories);

      setHasSeenOnboarding(true);
      toast.success("Igreja criada com sucesso!");
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      toast.error("Erro ao configurar igreja");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinChurch = async () => {
    if (!joinCode) {
      toast.error("Por favor, informe o código da igreja");
      return;
    }

    setIsCreating(true);
    try {
      const { data: org, error: orgError } = await (supabase
        .from("organizations") as any)
        .select("id, name")
        .eq("id", joinCode.trim())
        .single();

      if (orgError || !org) {
        toast.error("Código de igreja inválido");
        return;
      }

      const { error: profileError } = await (supabase
        .from("profiles") as any)
        .update({ organization_id: org.id, role: 'viewer' })
        .eq("id", user.id);

      if (profileError) throw profileError;

      setHasSeenOnboarding(true);
      toast.success(`Você entrou na igreja ${org.name}!`);
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      toast.error("Erro ao entrar na igreja");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setHasSeenOnboarding(true);
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-none p-0 overflow-hidden rounded-3xl shadow-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="relative p-8 flex flex-col items-center text-center space-y-6">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 hover:bg-secondary/50 rounded-full transition-colors text-muted-foreground z-50 border border-border"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Church className="h-10 w-10 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-foreground">Configuração de Igreja</h2>
            <p className="text-[14px] text-muted-foreground leading-relaxed px-4">
              Identificamos que sua conta ainda não possui uma igreja vinculada. Como deseja prosseguir?
            </p>
          </div>

          {!onboardingType ? (
            <div className="grid grid-cols-1 gap-4 w-full">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all group rounded-2xl"
                onClick={() => setOnboardingType("create")}
              >
                <div className="flex items-center gap-2 font-black text-foreground uppercase tracking-widest text-xs">
                  <PlusCircle className="h-5 w-5 text-primary" /> Criar Minha Igreja
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">Ideal para pastores que estão começando no Mordus.</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all group rounded-2xl"
                onClick={() => setOnboardingType("join")}
              >
                <div className="flex items-center gap-2 font-black text-foreground uppercase tracking-widest text-xs">
                  <LogIn className="h-5 w-5 text-primary" /> Entrar em Igreja Existente
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">Use o código fornecido pelo seu administrador.</span>
              </Button>

              <div className="pt-4 flex flex-col gap-2">
                <Button
                  variant="ghost"
                  className="text-xs text-muted-foreground hover:text-destructive h-8"
                  onClick={logout}
                >
                  <LogOut className="h-3 w-3 mr-2" /> Sair da conta
                </Button>
              </div>
            </div>
          ) : onboardingType === "create" ? (
            <div className="w-full space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="church-name" className="text-xs font-bold text-muted-foreground ml-1 text-center block">NOME DA SUA IGREJA</Label>
                <Input
                  id="church-name"
                  placeholder="Ex: Igreja Batista Central"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  className="h-12 bg-secondary/20 border-border/40 rounded-xl"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setOnboardingType(null)}>Voltar</Button>
                <Button className="flex-[2] h-12 rounded-xl font-bold" onClick={handleCreateChurch} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Configurar Agora
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="join-code" className="text-xs font-bold text-muted-foreground ml-1 text-center block">CÓDIGO DE ACESSO</Label>
                <Input
                  id="join-code"
                  placeholder="Cole o ID da igreja aqui"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="h-12 bg-secondary/20 border-border/40 font-mono text-xs rounded-xl text-center"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setOnboardingType(null)}>Voltar</Button>
                <Button className="flex-[2] h-12 rounded-xl font-bold" onClick={handleJoinChurch} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Vincular Agora
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground italic">
                Ao entrar em uma igreja existente, você começará como 'Visualizador'.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
