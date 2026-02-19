import * as React from "react";
import { cn } from "@/lib/utils";

export interface StepperItem {
  title?: string;
  value?: string | number;
  disabled?: boolean;
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  items: StepperItem[];
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  disabled?: boolean;
}

const indicatorStateClasses = {
  completed: "bg-primary text-white",
  active: "bg-white border-2 border-primary text-primary",
  inactive: "bg-grey-400 text-white",
};

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      className,
      items,
      value,
      defaultValue = 0,
      onValueChange,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const currentStep = value !== undefined ? value : internalValue;

    const handleStepClick = (index: number, item: StepperItem) => {
      if (disabled || item.disabled) return;
      if (index > currentStep + 1) return;

      if (value === undefined) {
        setInternalValue(index);
      }
      onValueChange?.(index);
    };

    const getStepState = (index: number) => {
      if (index < currentStep) return "completed";
      if (index === currentStep) return "active";
      return "inactive";
    };

    return (
      <div
        ref={ref}
        className={cn("flex w-full flex-row items-center gap-1", className)}
        {...props}
      >
        {items.map((item, index) => {
          const state = getStepState(index);
          const isClickable =
            !disabled && !item.disabled && index <= currentStep + 1;

          return (
            <React.Fragment key={item.value ?? index}>
              <div
                className={cn(
                  "flex items-center gap-sp-8",
                  isClickable && "cursor-pointer",
                  (disabled || item.disabled) && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => handleStepClick(index, item)}
              >
                {/* Indicator */}
                <div
                  className={cn(
                    "flex items-center justify-center rounded-full font-semibold transition-colors shrink-0 h-6 w-6 text-sm",
                    indicatorStateClasses[state]
                  )}
                >
                  {index + 1}
                </div>

                {/* Title */}
                {item.title && (
                  <span className="font-semibold leading-tight text-sm text-foreground">
                    {item.title}
                  </span>
                )}
              </div>

              {/* Separator */}
              {index < items.length - 1 && (
                <div
                  className={cn(
                    "transition-colors h-0.5 flex-1 mx-sp-8",
                    index < currentStep
                      ? "bg-primary"
                      : "bg-grey-300"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
);
Stepper.displayName = "Stepper";

export { Stepper };
