import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Checkbox } from "./checkbox";

const checkboxGroupVariants = cva("grid gap-sp-8", {
  variants: {
    orientation: {
      vertical: "grid-flow-row",
      horizontal: "grid-flow-col auto-cols-max",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export interface CheckboxGroupItem {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface CheckboxGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  /** Array of checkbox items */
  items: CheckboxGroupItem[] | string[];
  /** Current selected values */
  value?: string[];
  /** Default selected values (uncontrolled) */
  defaultValue?: string[];
  /** Callback when selection changes */
  onValueChange?: (value: string[]) => void;
  /** Legend text for the checkbox group */
  legend?: string;
  /** Orientation of the checkbox group */
  orientation?: "vertical" | "horizontal";
  /** Whether all checkboxes are disabled */
  disabled?: boolean;
}

const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    {
      className,
      items,
      value,
      defaultValue,
      onValueChange,
      legend,
      orientation = "vertical",
      disabled,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState<string[]>(
      defaultValue || []
    );

    const selectedValues = value !== undefined ? value : internalValue;

    const normalizedItems: CheckboxGroupItem[] = items.map((item) =>
      typeof item === "string" ? { label: item, value: item } : item
    );

    const handleCheckedChange = (itemValue: string, checked: boolean) => {
      const newValue = checked
        ? [...selectedValues, itemValue]
        : selectedValues.filter((v) => v !== itemValue);

      if (value === undefined) {
        setInternalValue(newValue);
      }

      onValueChange?.(newValue);
    };

    const checkboxGroup = (
      <div
        ref={ref}
        role="group"
        className={cn(checkboxGroupVariants({ orientation }), className)}
        {...props}
      >
        {normalizedItems.map((item) => (
          <Checkbox
            key={item.value}
            label={item.label}
            description={item.description}
            checked={selectedValues.includes(item.value)}
            onCheckedChange={(checked) =>
              handleCheckedChange(item.value, checked === true)
            }
            disabled={item.disabled || disabled}
          />
        ))}
      </div>
    );

    if (!legend) {
      return checkboxGroup;
    }

    return (
      <fieldset className="space-y-sp-8">
        <legend className="text-sm font-medium">{legend}</legend>
        {checkboxGroup}
      </fieldset>
    );
  }
);

CheckboxGroup.displayName = "CheckboxGroup";

export { CheckboxGroup, checkboxGroupVariants };
