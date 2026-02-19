import * as React from "react";
import { DayPicker, type DayPickerSingleProps, type DayPickerMultipleProps, type DayPickerRangeProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type CalendarProps = (
  | Omit<DayPickerSingleProps, "mode"> & { mode?: "single" }
  | Omit<DayPickerMultipleProps, "mode"> & { mode: "multiple" }
  | Omit<DayPickerRangeProps, "mode"> & { mode: "range" }
) & {
  className?: string;
  fixedWeeks?: boolean;
  numberOfMonths?: number;
  isDateDisabled?: (date: Date) => boolean;
  minDate?: Date;
  maxDate?: Date;
};

function Calendar({
  className,
  fixedWeeks = true,
  numberOfMonths = 1,
  isDateDisabled,
  minDate,
  maxDate,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      fixedWeeks={fixedWeeks}
      numberOfMonths={numberOfMonths}
      disabled={isDateDisabled}
      fromDate={minDate}
      toDate={maxDate}
      className={cn("p-3 pointer-events-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-foreground truncate",
        nav: "space-x-1 flex items-center",
        nav_button: "",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-8 font-medium text-xs",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has([aria-selected].day-range-end)]:rounded-r-full [&:has([aria-selected].day-range-start)]:rounded-l-full first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full"
            : "[&:has([aria-selected])]:rounded-full"
        ),
        day: "h-8 w-8 p-0 font-normal flex items-center justify-center rounded-full text-sm transition-colors hover:bg-state-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary aria-selected:opacity-100",
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "font-semibold text-primary",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-primary/10 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-primary/10 aria-selected:text-foreground",
        day_hidden: "invisible",
      }}
      components={{
        IconLeft: () => (
          <i className="fa-solid fa-chevron-left text-xs" aria-hidden="true" />
        ),
        IconRight: () => (
          <i className="fa-solid fa-chevron-right text-xs" aria-hidden="true" />
        ),
      }}
      {...(props as any)}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
