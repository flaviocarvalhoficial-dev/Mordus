import { Sparkles, X, ArrowRight } from "lucide-react";
import { useCopilot } from "@/contexts/CopilotContext";
import { Link } from "react-router-dom";

export function CopilotSidebarAlert() {
    const { sidebarAlert, clearAlert } = useCopilot();

    if (!sidebarAlert.active) return null;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 z-10">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            clearAlert();
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Insight da IA</span>
                </div>

                <h4 className="text-[12px] font-bold text-foreground mb-1 pr-4 leading-tight">
                    {sidebarAlert.title}
                </h4>

                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                    {sidebarAlert.message}
                </p>

                {sidebarAlert.url ? (
                    <Link
                        to={sidebarAlert.url}
                        onClick={() => clearAlert()}
                        className="flex items-center gap-1 text-[10px] text-primary font-bold mt-4 cursor-pointer hover:gap-2 transition-all w-fit"
                    >
                        RESOLVER AGORA <ArrowRight className="h-3 w-3" />
                    </Link>
                ) : (
                    <div className="flex items-center gap-1 text-[10px] text-primary font-bold mt-4 cursor-pointer hover:gap-2 transition-all w-fit">
                        ENTENDI <ArrowRight className="h-3 w-3" />
                    </div>
                )}

                {/* Visual Glow Effect */}
                <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-primary/10 blur-2xl rounded-full" />
            </div>
        </div>
    );
}
