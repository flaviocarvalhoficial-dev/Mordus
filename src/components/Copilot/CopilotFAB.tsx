import { useState } from "react";
import { Sparkles, X, MessageSquareHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopilotPanel } from "@/components/Copilot/CopilotPanel";

export function CopilotFAB() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 animate-fade-in">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform active:scale-95",
                        isOpen
                            ? "bg-secondary text-secondary-foreground rotate-90"
                            : "bg-primary text-primary-foreground hover:shadow-primary/20 hover:shadow-xl"
                    )}
                >
                    {isOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <Sparkles className="h-6 w-6" />
                    )}
                </button>
            </div>

            <CopilotPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}
