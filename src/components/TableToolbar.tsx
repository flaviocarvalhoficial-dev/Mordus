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
        <div className={cn("flex items-center gap-1 bg-background/50 p-1.5 rounded-2xl border border-border/50 ml-auto shadow-sm backdrop-blur-sm", className)}>
            {sortOptions.map((opt) => (
                <Button
                    key={opt.field}
                    variant={sortField === opt.field ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8 rounded-xl transition-all hover:bg-secondary/80"
                    title={opt.label}
                    onClick={() => onSortFieldChange(opt.field)}
                >
                    {React.cloneElement(opt.icon as React.ReactElement, { className: "h-4 w-4" })}
                </Button>
            ))}

            <Separator orientation="vertical" className="h-5 mx-0.5 bg-border/50" />

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl hover:bg-secondary/80 transition-all"
                title="Inverter Ordem"
                onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
                {sortOrder === 'asc' ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
            </Button>

            {columnOptions && onToggleColumn && visibleColumns && (
                <>
                    <Separator orientation="vertical" className="h-5 mx-0.5 bg-border/50" />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-secondary/80 transition-all" title="Colunas">
                                <Settings2 className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4 bg-card border-border shadow-2xl rounded-2xl">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 border-b border-border pb-2">
                                    <Columns className="h-4 w-4 text-primary" />
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Colunas da Tabela</h4>
                                </div>
                                <div className="grid gap-3">
                                    {columnOptions.map((col) => (
                                        <div key={col.id} className="flex items-center justify-between gap-4">
                                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">{col.label}</span>
                                            <Switch
                                                checked={visibleColumns.includes(col.id)}
                                                onCheckedChange={() => onToggleColumn(col.id)}
                                                className="scale-75 data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[9px] text-muted-foreground italic border-t border-border pt-2 mt-2 font-medium">
                                    Configuração de Visualização
                                </p>
                            </div>
                        </PopoverContent>
                    </Popover>
                </>
            )}
        </div>
    );
}
