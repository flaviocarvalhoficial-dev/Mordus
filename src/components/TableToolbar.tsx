import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Settings2, ArrowUpAZ, ArrowDownAZ, Columns } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortOption {
    field: string;
    label: string;
    icon: React.ReactNode;
}

interface ColumnOption {
    id: string;
    label: string;
}

interface TableToolbarProps {
    sortField: string;
    onSortFieldChange: (field: string) => void;
    sortOrder: 'asc' | 'desc';
    onSortOrderChange: (order: 'asc' | 'desc') => void;
    sortOptions: SortOption[];
    visibleColumns?: string[];
    onToggleColumn?: (id: string) => void;
    columnOptions?: ColumnOption[];
    className?: string;
}

export function TableToolbar({
    sortField,
    onSortFieldChange,
    sortOrder,
    onSortOrderChange,
    sortOptions,
    visibleColumns,
    onToggleColumn,
    columnOptions,
    className
}: TableToolbarProps) {
    return (
        <div className={cn("flex items-center gap-1.5 bg-background/60 p-1 rounded-2xl border border-border/40 ml-auto shadow-sm backdrop-blur-md", className)}>
            <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-[1rem]">
                {sortOptions.map((opt) => (
                    <Button
                        key={opt.field}
                        variant={sortField === opt.field ? 'secondary' : 'ghost'}
                        size="icon"
                        className={cn(
                            "h-7 w-7 rounded-[0.75rem] transition-all duration-300",
                            sortField === opt.field ? "bg-background text-primary shadow-sm ring-1 ring-primary/10" : "text-muted-foreground/70 hover:text-primary hover:bg-background/80"
                        )}
                        title={opt.label}
                        onClick={() => onSortFieldChange(opt.field)}
                    >
                        {React.cloneElement(opt.icon as React.ReactElement, { className: "h-3.5 w-3.5" })}
                    </Button>
                ))}
            </div>

            <Separator orientation="vertical" className="h-4 mx-0.5 bg-border/40" />

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl text-muted-foreground/70 hover:text-primary hover:bg-secondary/50 transition-all"
                title="Inverter Ordem"
                onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
                {sortOrder === 'asc' ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
            </Button>

            {columnOptions && onToggleColumn && visibleColumns && (
                <>
                    <Separator orientation="vertical" className="h-4 mx-0.5 bg-border/40" />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-muted-foreground/70 hover:text-primary hover:bg-secondary/50 transition-all" title="Colunas">
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-5 bg-card border-border/60 shadow-2xl rounded-[1.5rem] backdrop-blur-xl">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <Columns className="h-4 w-4 text-primary" />
                                    </div>
                                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Visualização</h4>
                                </div>
                                <div className="grid gap-4 pt-1">
                                    {columnOptions.map((col) => (
                                        <div key={col.id} className="flex items-center justify-between group">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">{col.label}</span>
                                            <Switch
                                                checked={visibleColumns.includes(col.id)}
                                                onCheckedChange={() => onToggleColumn(col.id)}
                                                className="scale-75 data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-3 border-t border-border/40 mt-2">
                                    <p className="text-[9px] text-muted-foreground italic font-medium">
                                        Ajuste a visibilidade das colunas da tabela.
                                    </p>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </>
            )}
        </div>
    );
}
