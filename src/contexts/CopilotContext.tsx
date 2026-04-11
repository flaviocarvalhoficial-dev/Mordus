import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface SidebarAlert {
    title: string;
    message: string;
    url?: string;
    active: boolean;
}

interface CopilotContextType {
    messages: Message[];
    sendMessage: (content: string) => Promise<void>;
    isLoading: boolean;
    sidebarAlert: SidebarAlert;
    triggerAlert: (title: string, message: string, url?: string) => void;
    clearAlert: () => void;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

export function CopilotProvider({ children }: { children: ReactNode }) {
    const { profile, organization } = useChurch();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content: "Olá! Sou o Copilot do Mordus. Como posso ajudar com a Tesouraria ou Secretaria hoje?",
            timestamp: new Date(),
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarAlert, setSidebarAlert] = useState<SidebarAlert>({
        title: "",
        message: "",
        active: false
    });

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('mordus-copilot', {
                body: {
                    message: content,
                    context: {
                        user_role: profile?.role,
                        organization_name: organization?.name,
                        organization_id: organization?.id,
                        current_page: window.location.pathname,
                        history: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
                    }
                }
            });

            if (error) throw error;

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data?.reply || "Desculpe, tive um problema ao processar sua solicitação.",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Error sending message to Copilot:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Ocorreu um erro ao conectar com a inteligência artificial. Verifique sua conexão ou tente novamente mais tarde.",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [profile, organization, messages]);

    const triggerAlert = useCallback((title: string, message: string, url?: string) => {
        setSidebarAlert({ title, message, url, active: true });
    }, []);

    const clearAlert = useCallback(() => {
        setSidebarAlert((prev) => ({ ...prev, active: false }));
    }, []);

    return (
        <CopilotContext.Provider value={{
            messages,
            sendMessage,
            isLoading,
            sidebarAlert,
            triggerAlert,
            clearAlert
        }}>
            {children}
        </CopilotContext.Provider>
    );
}

export function useCopilot() {
    const context = useContext(CopilotContext);
    if (context === undefined) {
        throw new Error("useCopilot must be used within a CopilotProvider");
    }
    return context;
}
