import { X, Send, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useCopilot } from "@/contexts/CopilotContext";

interface CopilotPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CopilotPanel({ isOpen, onClose }: CopilotPanelProps) {
    const { messages, sendMessage, isLoading } = useCopilot();
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, isLoading]);

    const handleSend = () => {
        if (!input.trim() || isLoading) return;
        sendMessage(input);
        setInput("");
    };

    return (
        <div
            className={cn(
                "fixed bottom-24 right-6 z-50 w-[380px] h-[550px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right",
                isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
            )}
        >
            {/* Header */}
            <div className="p-4 border-b border-border bg-sidebar-context flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-semibold text-foreground">Copilot Mordus</h3>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                            Pronto para ajudar
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollRef}>
                <div className="flex flex-col gap-4">
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={cn(
                                "max-w-[85%] rounded-2xl p-3 text-[13px] leading-relaxed",
                                m.role === "assistant"
                                    ? "bg-secondary text-secondary-foreground self-start rounded-tl-none border border-border/50"
                                    : "bg-primary text-primary-foreground self-end rounded-tr-none shadow-md shadow-primary/10"
                            )}
                        >
                            {m.content}
                        </div>
                    ))}

                    {messages.length === 1 && !isLoading && (
                        <div className="flex flex-col gap-2 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <p className="text-[11px] text-muted-foreground px-1 mb-1 italic">Sugestões para agora:</p>
                            {[
                                "Como estão as finanças deste mês?",
                                "Existem membros sem telefone?",
                                "Qual o saldo total em caixa?",
                                "Quais os lançamentos sem categoria?"
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => sendMessage(suggestion)}
                                    className="text-left p-2 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 text-[12px] text-foreground transition-colors hover:border-primary/30"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-background">
                <div className="flex gap-2 relative">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Pergunte sobre dízimos, membros..."
                        className="flex-1 pr-10 h-10 bg-secondary/50 border-border focus-visible:ring-primary/20 rounded-xl"
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-1 top-1 h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 transition-transform active:scale-90"
                    >
                        {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <Send className="h-3.5 w-3.5" />
                        )}
                    </Button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-wider font-medium opacity-60">
                    Inteligência Artificial Mordus
                </p>
            </div>
        </div>
    );
}
