import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface RangeInputProps {
  fromValue?: string;
  toValue?: string;
  onFromChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  leadingIcon?: React.ReactNode;
  fromLeadingIcon?: React.ReactNode;
  toLeadingIcon?: React.ReactNode;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

const RangeInput = React.forwardRef<HTMLDivElement, RangeInputProps>(
  (
    {
      fromValue,
      toValue,
      onFromChange,
      onToChange,
      fromPlaceholder = "",
      toPlaceholder = "",
      leadingIcon,
      fromLeadingIcon,
      toLeadingIcon,
      disabled,
      error,
      className,
    },
    ref
  ) => {
    const fromIcon = fromLeadingIcon ?? leadingIcon;
    const toIcon = toLeadingIcon ?? leadingIcon;

    return (
      <div ref={ref} className={cn("flex flex-col gap-sp-4 w-full", className)}>
        {/* Sub-labels row */}
        <div className="flex items-center">
          <span className="flex-1 text-xs text-muted-foreground">From</span>
          <span className="w-8" />
          <span className="flex-1 text-xs text-muted-foreground">To</span>
        </div>
        {/* Inputs row */}
        <div className="flex items-center gap-sp-8">
          <Input
            value={fromValue}
            onChange={onFromChange}
            placeholder={fromPlaceholder}
            leadingIcon={fromIcon}
            disabled={disabled}
            error={error}
            className="flex-1"
          />
          <span className="text-foreground text-base leading-none shrink-0">-</span>
          <Input
            value={toValue}
            onChange={onToChange}
            placeholder={toPlaceholder}
            leadingIcon={toIcon}
            disabled={disabled}
            error={error}
            className="flex-1"
          />
        </div>
      </div>
    );
  }
);
RangeInput.displayName = "RangeInput";

export { RangeInput };
