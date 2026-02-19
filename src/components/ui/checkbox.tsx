import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
      "checked" | "defaultChecked" | "onCheckedChange"
    > {
  /** Current checked state */
  checked?: boolean | "indeterminate";
  /** Default checked state (uncontrolled) */
  defaultChecked?: boolean | "indeterminate";
  /** Callback when checked state changes */
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
  /** Label text */
  label?: string;
  /** Description text below the label */
  description?: string;
  /** Whether the checkbox is required */
  required?: boolean;
  /** Custom icon for checked state */
  icon?: React.ReactNode;
  /** Custom icon for indeterminate state */
  indeterminateIcon?: React.ReactNode;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(
  (
    {
      className,
      checked,
      defaultChecked,
      onCheckedChange,
      label,
      description,
      required,
      icon,
      indeterminateIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    const checkbox = (
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        className={cn(
          "peer shrink-0 rounded h-5 w-5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed",
          // Unchecked default
          "border border-grey-500 bg-white shadow-checkbox",
          // Checked
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:shadow-none",
          "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-[state=indeterminate]:shadow-none",
          // Hover
          "hover:border-grey-400 data-[state=checked]:hover:bg-primary/90 data-[state=indeterminate]:hover:bg-primary/90",
          // Disabled unchecked
          "disabled:bg-grey-100 disabled:border-grey-200 disabled:shadow-none",
          // Disabled checked
          "disabled:data-[state=checked]:bg-grey-100 disabled:data-[state=checked]:border-grey-200 disabled:data-[state=checked]:text-white",
          "disabled:data-[state=indeterminate]:bg-grey-100 disabled:data-[state=indeterminate]:border-grey-200 disabled:data-[state=indeterminate]:text-white",
          className
        )}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        {...props}
      >
        <CheckboxPrimitive.Indicator forceMount className="flex items-center justify-center data-[state=unchecked]:hidden">
          {checked === "indeterminate" || defaultChecked === "indeterminate" ? (
            indeterminateIcon || <i className="fa-solid fa-minus" aria-hidden="true" />
          ) : (
            icon || <i className="fa-solid fa-check" aria-hidden="true" />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );

    // If no label or description, just return the checkbox
    if (!label && !description) {
      return checkbox;
    }

    return (
      <div className={cn("flex gap-sp-8", description ? "items-start" : "items-center")}>
        {checkbox}
        <div className="flex flex-col gap-sp-4">
          {label && (
            <label
              htmlFor={checkboxId}
              className={cn(
                "text-sm font-medium leading-none cursor-pointer select-none",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {label}
              {required && (
                <span className="text-error ml-1">*</span>
              )}
            </label>
          )}
          {description && (
            <p
              className={cn(
                "text-xs text-muted-foreground",
                disabled && "opacity-50"
              )}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
