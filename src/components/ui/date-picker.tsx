import * as React from "react";
import { format } from "date-fns";
import * as Popover from "@radix-ui/react-popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  id?: string;
}

function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  error,
  minDate,
  maxDate,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

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
              value ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {value ? format(value, "PPP") : placeholder}
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
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date);
              setOpen(false);
            }}
            minDate={minDate}
            maxDate={maxDate}
            initialFocus
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
DatePicker.displayName = "DatePicker";

export { DatePicker };
