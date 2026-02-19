import * as React from "react";
import { format } from "date-fns";
import * as Popover from "@radix-ui/react-popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  numberOfMonths?: number;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  id?: string;
}

function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  error,
  numberOfMonths = 2,
  minDate,
  maxDate,
  className,
  id,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const label = React.useMemo(() => {
    if (!value?.from) return null;
    if (!value.to) return format(value.from, "PPP");
    return `${format(value.from, "PP")} - ${format(value.to, "PP")}`;
  }, [value]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild disabled={disabled}>
        <button
          id={id}
          type="button"
          className={cn(
            "flex w-full h-9 px-2 rounded text-sm transition-colors items-center gap-sp-8",
            "border shadow-input",
            "focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-[0.32]",
            !error
              ? "border-grey-300 bg-white dark:border-grey-600 dark:bg-grey-800 hover:border-grey-400 hover:shadow-none focus:border-primary focus:shadow-input-focus"
              : "border-error bg-white dark:bg-grey-800 focus:border-error focus:shadow-input-focus",
            className
          )}
          disabled={disabled}
        >
          <i
            className="fa-regular fa-calendar text-muted-foreground text-base leading-5 w-5 text-center"
            aria-hidden="true"
          />
          <span
            className={cn(
              "flex-1 text-left truncate",
              label ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {label ?? placeholder}
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          align="start"
          sideOffset={4}
        >
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            numberOfMonths={numberOfMonths}
            minDate={minDate}
            maxDate={maxDate}
            initialFocus
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
DateRangePicker.displayName = "DateRangePicker";

export { DateRangePicker };
