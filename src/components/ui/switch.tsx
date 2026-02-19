import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>,
      "checked" | "defaultChecked" | "onCheckedChange"
    > {
  /** Current checked state */
  checked?: boolean;
  /** Default checked state (uncontrolled) */
  defaultChecked?: boolean;
  /** Callback when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Description text below the label */
  description?: string;
  /** Whether the switch is required */
  required?: boolean;
  /** Icon for checked state */
  checkedIcon?: React.ReactNode;
  /** Icon for unchecked state */
  uncheckedIcon?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
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
      checkedIcon,
      uncheckedIcon,
      loading,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const switchId = id || generatedId;

    const switchElement = (
      <SwitchPrimitive.Root
        ref={ref}
        id={switchId}
        className={cn(
          "peer inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:shadow-input-focus h-6 w-[44px]",
          // Unchecked
          "bg-grey-500",
          // Checked
          "data-[state=checked]:bg-primary",
          // Hover
          "hover:shadow-input-hover",
          // Disabled
          "disabled:cursor-not-allowed disabled:bg-grey-100 disabled:border disabled:border-grey-200",
          "disabled:data-[state=checked]:bg-grey-100 disabled:data-[state=checked]:border-grey-200",
          className
        )}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled || loading}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "pointer-events-none flex items-center justify-center rounded-full bg-white shadow-lg ring-0 transition-transform h-5 w-5 data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-0.5",
            // Disabled thumb
            "data-[disabled]:bg-grey-200 data-[disabled]:shadow-none data-[disabled]:data-[state=checked]:translate-x-5"
          )}
        >
          {loading ? (
            <span className="flex items-center justify-center text-grey-500 text-[10px]">
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
            </span>
          ) : (
            <>
              {checked && checkedIcon && (
                <span className="flex items-center justify-center text-primary text-[10px]">
                  {checkedIcon}
                </span>
              )}
              {!checked && uncheckedIcon && (
                <span className="flex items-center justify-center text-grey-500 text-[10px]">
                  {uncheckedIcon}
                </span>
              )}
            </>
          )}
        </SwitchPrimitive.Thumb>
      </SwitchPrimitive.Root>
    );

    if (!label && !description) {
      return switchElement;
    }

    return (
      <div className={cn("flex gap-sp-8", description ? "items-start" : "items-center")}>
        {switchElement}
        <div className="flex flex-col gap-sp-4">
          {label && (
            <label
              htmlFor={switchId}
              className={cn(
                "text-sm font-medium leading-none cursor-pointer select-none",
                (disabled || loading) && "opacity-50 cursor-not-allowed"
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
                (disabled || loading) && "opacity-50"
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

Switch.displayName = "Switch";

export { Switch };
