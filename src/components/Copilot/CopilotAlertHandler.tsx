import { useEffect } from "react";
import { useCopilot } from "@/contexts/CopilotContext";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";

export function CopilotAlertHandler() {
    const { triggerAlert, sidebarAlert, dismissAlert } = useCopilot();
    const { organization } = useChurch();
    const location = useLocation();

    useEffect(() => {
        if (!organization?.id) return;

        const runDiagnostic = async () => {
            // Se estamos na tela de lançamentos
            if (location.pathname === "/lancamentos") {
                const { data } = await supabase
                    .from("transactions")
                    .select("id, description")
                    .eq("organization_id", organization.id)
                    .is("receipt_url", null)
                    .order("date", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data) {
                    // Só dispara se for um novo alerta ou se mudou a descrição
                    if (sidebarAlert.title !== "Comprovante Pendente" || !sidebarAlert.active) {
                        triggerAlert(
                            "Comprovante Pendente",
                            `O lançamento "${data.description}" está sem comprovante anexado.`,
                            `/lancamentos?tab=movimentacoes&highlight=${data.id}`
                        );
                    }
                } else if (sidebarAlert.title === "Comprovante Pendente" && sidebarAlert.active) {
                    // Resolvido!
                    dismissAlert();
                }
            }

            // Se estamos na tela de membros
            else if (location.pathname === "/membros") {
                const { data } = await supabase
                    .from("members")
                    .select("id, full_name")
                    .eq("organization_id", organization.id)
                    .or("phone.eq.'',phone.is.null")
                    .eq("status", "active")
                    .limit(1)
                    .maybeSingle();

                if (data) {
                    if (sidebarAlert.title !== "Cadastro Incompleto" || !sidebarAlert.active) {
                        triggerAlert(
                            "Cadastro Incompleto",
                            `O membro "${data.full_name}" está sem telefone cadastrado.`,
                            `/membros?tab=membros&highlight=${data.id}`
                        );
                    }
                } else if (sidebarAlert.title === "Cadastro Incompleto" && sidebarAlert.active) {
                    // Resolvido!
                    dismissAlert();
                }
            }
        };

        const timer = setTimeout(runDiagnostic, 2000);
        return () => clearTimeout(timer);
    }, [location.pathname, organization?.id, triggerAlert, dismissAlert, sidebarAlert.active, sidebarAlert.title]);

    return null;
}
