import { useState, useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";

interface AIInsightCardProps {
    mode?: "tesouraria" | "secretaria";
}

export function AIInsightCard({ mode = "tesouraria" }: AIInsightCardProps) {
    const { organization, profile } = useChurch();
    const [currentIndex, setCurrentIndex] = useState(0);

    const { data: insight, isLoading, isError, refetch } = useQuery({
        queryKey: ["dashboard-ai-insight", organization?.id, mode],
        queryFn: async () => {
            if (!organization?.id) return null;

            const { data, error } = await supabase.functions.invoke("mordus-copilot", {
                body: {
                    message: `Gere um resumo estratégico focado em ${mode} em exatas 3 frases cursas. Use dados reais. Proibido usar números, tópicos ou prefixos.`,
                    context: {
                        user_role: profile?.role,
                        organization_name: organization?.name,
                        organization_id: organization?.id,
                        current_page: "/dashboard",
                        dashboard_mode: mode
                    }
                }
            });

            if (error) throw error;
            return data?.reply;
        },
        enabled: !!organization?.id,
        staleTime: 1000 * 60 * 30, // 30 minutes
    });

    // Limpeza profunda das frases para remover lixo de formatação da IA
    const sentences = insight
        ? insight
            .split(/[.!?]/)
            .map((s: string) => s.replace(/^\d+[\s.)|-]+/, "").trim()) // Limpa "1. ", "01 - ", etc.
            .filter((s: string) => s.length > 5)
        : [];

    useEffect(() => {
        if (sentences.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % sentences.length);
        }, 6000);

        return () => clearInterval(interval);
    }, [sentences]);

    if (!organization) return null;

    return (
        <Card className="bg-gradient-to-br from-card to-secondary/30 border-primary/20 shadow-sm overflow-hidden group">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-primary/80">Inteligência Mordus</h3>
                                <span className="flex h-1.5 w-1.5 rounded-full bg-primary/50 animate-pulse" />
                            </div>
                            <button
                                onClick={() => {
                                    refetch();
                                    setCurrentIndex(0);
                                }}
                                className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                            >
                                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Atualizar"}
                            </button>
                        </div>

                        <div className="h-10 flex items-center">
                            {isLoading ? (
                                <div className="h-4 w-full bg-secondary/50 animate-pulse rounded" />
                            ) : isError ? (
                                <p className="text-[13px] text-muted-foreground">Ocorreu um erro ao carregar insights.</p>
                            ) : sentences.length > 0 ? (
                                <div className="relative w-full h-full flex items-center overflow-hidden">
                                    {sentences.map((stmt: string, i: number) => (
                                        <p
                                            key={i}
                                            className={`text-[14px] font-medium text-foreground leading-tight absolute transition-all duration-700 ease-in-out ${i === currentIndex
                                                ? "opacity-100 translate-y-0"
                                                : "opacity-0 translate-y-4 pointer-events-none"
                                                }`}
                                        >
                                            {stmt}.
                                        </p>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[14px] font-medium text-foreground opacity-60 italic">
                                    {insight || "Aguardando novos dados para gerar insights estratégicos."}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
