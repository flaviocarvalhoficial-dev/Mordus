import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChurch } from "@/contexts/ChurchContext";
import { LayoutDashboard, ArrowUpDown, Users, Lock, FileText, Church, Settings, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function OnboardingModal() {
  const { user, profile, organization, setHasSeenOnboarding, hasSeenOnboarding } = useChurch();
  const [step, setStep] = useState(0);
  const [churchName, setChurchName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Se o usuário já viu o onboarding, não mostra mais
  if (hasSeenOnboarding) return null;
  if (!user) return null; // Esperar auth

  const baseSteps = [
    {
      icon: Church,
      title: "Bem-vindo ao Mordus!",
      description: "Este sistema foi criado para facilitar a gestão financeira e administrativa da sua igreja. Vamos começar configurando sua organização!",
    },
    {
      icon: LayoutDashboard,
      title: "Painel (Dashboard)",
      description: "No painel principal, você acompanha o resumo financeiro da igreja com gráficos de entradas, saídas, dízimos e ofertas.",
    },
    {
      icon: ArrowUpDown,
      title: "Tesouraria",
      description: "Registre dízimos, ofertas e despesas com facilidade e gere relatórios automáticos.",
    },
    {
      icon: Users,
      title: "Secretaria",
      description: "Gerencie membros, liderança, congregações e toda a parte administrativa.",
    },
  ];

  const steps = [...baseSteps];

  // Se o usuário não tem igreja, adicionamos o passo de criação
  const showChurchStep = !organization;
  const currentStepData = steps[step];
  const Icon = currentStepData?.icon || Church;
  const isLast = step === steps.length - 1;

  const handleFinish = async () => {
    if (showChurchStep && !churchName) {
      toast.error("Por favor, informe o nome da sua igreja");
      setStep(0); // Volta pro primeiro passo se tentou pular
      return;
    }

    if (showChurchStep && !organization) {
      setIsCreating(true);
      try {
        // 1. Criar organização
        const { data: org, error: orgError } = await (supabase
          .from("organizations") as any)
          .insert([{ name: churchName }])
          .select()
          .single();

        if (orgError) throw orgError;
        if (!org) throw new Error("Não foi possível criar a organização");

        // 2. Vincular usuário à organização como admin
        const { error: profileError } = await (supabase
          .from("profiles") as any)
          .update({ organization_id: org.id, role: 'admin' })
          .eq("id", user.id);

        if (profileError) throw profileError;

        // 3. Inserir categorias padrão
        const defaultCategories = [
          { name: "Oferta", type: "income", color: "#10b981", organization_id: org.id },
          { name: "Dízimo", type: "income", color: "#10b981", organization_id: org.id },
          { name: "Doação", type: "income", color: "#10b981", organization_id: org.id },
          { name: "Venda", type: "income", color: "#10b981", organization_id: org.id },
          { name: "Água", type: "expense", color: "#f43f5e", organization_id: org.id },
          { name: "Energia", type: "expense", color: "#f43f5e", organization_id: org.id },
          { name: "Internet", type: "expense", color: "#f43f5e", organization_id: org.id },
        ];

        const { error: catError } = await (supabase
          .from("categories") as any)
          .insert(defaultCategories);

        if (catError) throw catError;

        setHasSeenOnboarding(true);
        toast.success("Igreja configurada com sucesso!");
        setTimeout(() => window.location.reload(), 100);
      } catch (error) {
        toast.error("Erro ao criar igreja");
        console.error(error);
      } finally {
        setIsCreating(false);
      }
    } else {
      setHasSeenOnboarding(true);
    }
  };

  return (
    <Dialog open={!hasSeenOnboarding || showChurchStep} onOpenChange={() => { }}>
      <DialogContent className="sm:max-w-md bg-card border-border" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="flex flex-col items-center text-center py-4 space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-8 w-8 text-primary" />
          </div>

          <h2 className="text-lg font-semibold text-foreground">{currentStepData.title}</h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed px-2">{currentStepData.description}</p>

          {step === 0 && showChurchStep && (
            <div className="w-full space-y-2 mt-4 text-left px-2">
              <Label htmlFor="church-name">Nome da sua Igreja</Label>
              <Input
                id="church-name"
                placeholder="Ex: Igreja Batista Central"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center gap-1.5 pt-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"}`}
              />
            ))}
          </div>

          <div className="flex gap-2 pt-2 w-full">
            {step > 0 && (
              <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            )}
            {isLast ? (
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={handleFinish} disabled={isCreating}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Começar agora!
              </Button>
            ) : (
              <Button className="flex-1 bg-primary text-primary-foreground" onClick={() => setStep(step + 1)}>
                Próximo
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
