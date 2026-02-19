import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const radioGroupVariants = cva("grid gap-sp-8", {
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

export interface RadioGroupItem {
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>,
      "value" | "defaultValue" | "onValueChange"
    > {
  /** Array of radio items */
  items: RadioGroupItem[] | string[];
  /** Current selected value */
  value?: string;
  /** Default selected value (uncontrolled) */
  defaultValue?: string;
  /** Callback when selection changes */
  onValueChange?: (value: string) => void;
  /** Legend text for the radio group */
  legend?: string;
  /** Orientation of the radio group */
  orientation?: "vertical" | "horizontal";
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(
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
    const groupId = React.useId();
    const normalizedItems: RadioGroupItem[] = items.map((item) =>
      typeof item === "string" ? { label: item, value: item } : item
    );

    const radioGroup = (
      <RadioGroupPrimitive.Root
        ref={ref}
        className={cn(radioGroupVariants({ orientation }), className)}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        {...props}
      >
        {normalizedItems.map((item) => {
          const itemId = `${groupId}-radio-${item.value}`;
          return (
          <div key={item.value} className={cn("flex gap-sp-8", item.description ? "items-start" : "items-center")}>
            <RadioGroupPrimitive.Item
              id={itemId}
              value={item.value}
              disabled={item.disabled || disabled}
              className={cn(
                "peer shrink-0 rounded-full border-2 h-5 w-5 transition-colors focus-visible:outline-none",
                // Unchecked
                "border-grey-500",
                // Checked
                "data-[state=checked]:border-primary",
                // Hover
                "hover:shadow-input-hover data-[state=checked]:hover:border-primary/80",
                // Focus
                "focus-visible:shadow-input-focus",
                // Disabled
                "disabled:cursor-not-allowed disabled:bg-grey-100 disabled:border-grey-200",
                "disabled:data-[state=checked]:bg-grey-100 disabled:data-[state=checked]:border-grey-200"
              )}
            >
              <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                <span className={cn(
                  "rounded-full h-2.5 w-2.5 bg-primary",
                  "peer-disabled:bg-grey-200"
                )} />
              </RadioGroupPrimitive.Indicator>
            </RadioGroupPrimitive.Item>
            <div className="flex flex-col gap-sp-4">
              <label
                htmlFor={itemId}
                className={cn(
                  "text-sm font-medium leading-none cursor-pointer select-none",
                  (item.disabled || disabled) && "opacity-50 cursor-not-allowed"
                )}
              >
                {item.label}
              </label>
              {item.description && (
                <p
                  className={cn(
                    "text-xs text-muted-foreground",
                    (item.disabled || disabled) && "opacity-50"
                  )}
                >
                  {item.description}
                </p>
              )}
            </div>
          </div>
          );
        })}
      </RadioGroupPrimitive.Root>
    );

    if (!legend) {
      return radioGroup;
    }

    return (
      <fieldset className="space-y-sp-8">
        <legend className="text-sm font-medium">{legend}</legend>
        {radioGroup}
      </fieldset>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

export { RadioGroup, radioGroupVariants };
