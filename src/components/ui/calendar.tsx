import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, useDayPicker } from "react-day-picker";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  // Estado interno para navegação de meses/anos
  const [internalMonth, setInternalMonth] = React.useState<Date | undefined>(
    props.month || props.defaultMonth || (props.selected as Date) || new Date()
  );

  // Sincroniza se o prop 'month' mudar externamente
  React.useEffect(() => {
    if (props.month) {
      setInternalMonth(props.month);
    }
  }, [props.month]);

  const handleMonthChange = (newMonth: Date) => {
    setInternalMonth(newMonth);
    props.onMonthChange?.(newMonth);
  };

  return (
    <DayPicker
      {...props}
      month={internalMonth}
      onMonthChange={handleMonthChange}
      showOutsideDays={showOutsideDays}
      // Mantém sempre 6 semanas para evitar que o modal mude de altura e "pule" na tela
      fixedWeeks
      className={cn("p-3", className)}
      fromYear={1900}
      toYear={2100}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium flex items-center gap-1",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-lg"),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-lg",
        day_today: "text-primary font-bold",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        CaptionLabel: ({ displayMonth }) => <YearEditor displayMonth={displayMonth} />,
      }}
    />
  );
}

function YearEditor({ displayMonth }: { displayMonth: Date }) {
  const { goToMonth, locale, onMonthChange } = useDayPicker();
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(displayMonth.getFullYear().toString());

  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(displayMonth.getFullYear().toString());
    }
  }, [displayMonth, isEditing]);

  const handleYearSubmit = (value: string) => {
    const year = parseInt(value);
    if (!isNaN(year) && year >= 1900 && year <= 2100) {
      const newMonth = new Date(displayMonth);
      newMonth.setFullYear(year);
      newMonth.setDate(1);

      onMonthChange?.(newMonth);
      goToMonth(newMonth);

      setIsEditing(false);
    } else {
      setInputValue(displayMonth.getFullYear().toString());
      setIsEditing(false);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setInputValue(value);

    if (value.length === 4) {
      handleYearSubmit(value);
    }
  };

  const monthLabel = format(displayMonth, "MMMM", { locale });

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <span className="capitalize">{monthLabel}</span>
        <input
          type="text"
          autoFocus
          maxLength={4}
          className="w-12 bg-accent/50 border-none rounded px-1 m-0 focus:outline-none focus:ring-1 focus:ring-primary text-sm font-medium text-primary text-center"
          value={inputValue}
          onChange={handleYearChange}
          onBlur={() => handleYearSubmit(inputValue)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleYearSubmit(inputValue);
            if (e.key === "Escape") {
              setInputValue(displayMonth.getFullYear().toString());
              setIsEditing(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-accent/50 rounded px-1 transition-colors flex items-center gap-1 group"
      onClick={() => setIsEditing(true)}
    >
      <span className="capitalize">{monthLabel}</span>
      <span className="group-hover:text-primary">{displayMonth.getFullYear()}</span>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
