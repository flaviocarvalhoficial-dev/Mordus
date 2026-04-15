import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building2, Smartphone, Mail, CalendarDays, Baby, Users2, History, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useChurch } from "@/contexts/ChurchContext";

interface MemberDrawerProps {
    member: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    departments?: any[];
    congregations?: any[];
}

export function MemberDrawer({ member, open, onOpenChange, departments: propsDepartments, congregations: propsCongregations }: MemberDrawerProps) {
    const { organization } = useChurch();

    const { data: fetchedDepts = [] } = useQuery({
        queryKey: ["departments", organization?.id],
        queryFn: async () => {
            if (!organization?.id) return [];
            const { data } = await supabase.from("departments").select("id, name").eq("organization_id", organization.id);
            return data || [];
        },
        enabled: open && !propsDepartments && !!organization?.id,
    });

    const { data: fetchedCongs = [] } = useQuery({
        queryKey: ["congregations", organization?.id],
        queryFn: async () => {
            if (!organization?.id) return [];
            const { data } = await supabase.from("congregations").select("id, name").eq("organization_id", organization.id);
            return data || [];
        },
        enabled: open && !propsCongregations && !!organization?.id,
    });

    const departments = propsDepartments || fetchedDepts;
    const congregations = propsCongregations || fetchedCongs;

    if (!member) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md p-0 overflow-y-auto scrollbar-hide border-l-border/50 bg-background/95 backdrop-blur-md">
                <div className="relative h-32 bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border/10">
                    <div className="absolute -bottom-8 left-8">
                        <div className="h-20 w-20 rounded-full bg-secondary border-4 border-background flex items-center justify-center overflow-hidden shadow-lg ring-1 ring-primary/10">
                            {member.avatar_url ? (
                                <img src={member.avatar_url} alt={member.full_name} className="h-full w-full object-cover" />
                            ) : (
                                <Users className="h-8 w-8 text-muted-foreground opacity-30" />
                            )}
                        </div>
                    </div>
                    <div className="absolute top-4 left-4">
                        <Badge variant="outline" className={cn(
                            "font-black uppercase tracking-widest text-[10px] px-3 py-1 border-border/50",
                            member.status === 'active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground"
                        )}>
                            {member.status === 'active' ? 'ATIVO' : 'INATIVO'}
                        </Badge>
                    </div>
                </div>

                <div className="px-8 pt-12 pb-8 space-y-8">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-foreground">{member.full_name}</h2>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {congregations.find(c => c.id === member.congregation_id)?.name || "Sede Principal"}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                            <div className="flex items-center gap-2 mb-2 text-primary opacity-70">
                                <Smartphone className="h-3.5 w-3.5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Whatsapp</span>
                            </div>
                            <p className="text-xs font-bold">{member.phone || "Não informado"}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                            <div className="flex items-center gap-2 mb-2 text-primary opacity-70">
                                <Mail className="h-3.5 w-3.5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">E-mail</span>
                            </div>
                            <p className="text-xs font-bold truncate max-w-full">{member.email || "Não informado"}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border/50 pb-2">Dados Gerais</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarDays className="h-4 w-4" />
                                        <span className="text-xs font-medium">Data de Nascimento</span>
                                    </div>
                                    <span className="text-xs font-bold">{member.birth_date ? new Date(member.birth_date + 'T12:00:00').toLocaleDateString('pt-BR') : "-"}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Baby className="h-4 w-4" />
                                        <span className="text-xs font-medium">Batizado</span>
                                    </div>
                                    <Badge variant="outline" className={cn("text-[10px] font-black", member.is_baptized ? "text-success border-success/20 bg-success/5" : "text-muted-foreground")}>
                                        {member.is_baptized ? "SIM" : "NÃO"}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users2 className="h-4 w-4" />
                                        <span className="text-xs font-medium">Departamento</span>
                                    </div>
                                    <span className="text-xs font-bold">{departments.find(d => d.id === member.department_id)?.name || "Geral"}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <History className="h-4 w-4" />
                                        <span className="text-xs font-medium">Procedência</span>
                                    </div>
                                    <span className="text-xs font-bold text-right max-w-[150px]">{member.previous_church || "Primeiro Membro"}</span>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 pt-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-border/50 pb-2">Endereço</h3>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-foreground leading-relaxed">
                                    {member.address || "Endereço não cadastrado"}
                                </p>
                            </div>
                        </section>
                    </div>

                    <div className="pt-8 border-t border-border/50">
                        <Button
                            variant="outline"
                            className="w-full rounded-xl border-border/50 font-bold hover:bg-secondary transition-all"
                            onClick={() => onOpenChange(false)}
                        >
                            Fechar Visualização
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
