import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export interface ButtonGroupItem {
  label: string;
  value: string;
  disabled?: boolean;
}

const buttonGroupVariants = cva(
  "inline-flex items-center rounded bg-grey-100 p-[2px] gap-1 dark:bg-grey-700",
  {
    variants: {
      size: {
        default: "",
        lg: "",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const buttonGroupItemVariants = cva(
  "flex-1 inline-flex items-center justify-center whitespace-nowrap rounded font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-[0.32] text-grey-600 hover:text-grey-900 dark:text-grey-400 dark:hover:text-grey-200 data-[state=on]:bg-white data-[state=on]:shadow-sm data-[state=on]:text-grey-900 dark:data-[state=on]:bg-grey-600 dark:data-[state=on]:text-grey-100",
  {
    variants: {
      size: {
        default: "px-sp-8 py-[2px] text-xs leading-5",
        lg: "px-3 py-1 text-sm leading-[22px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface ButtonGroupProps
  extends Omit<
      React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>,
      "type" | "value" | "defaultValue" | "onValueChange"
    >,
    VariantProps<typeof buttonGroupVariants> {
  items: ButtonGroupItem[] | string[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const ButtonGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ButtonGroupProps
>(
  (
    {
      className,
      items,
      value,
      defaultValue,
      onValueChange,
      size,
      disabled,
      ...props
    },
    ref
  ) => {
    const normalizedItems: ButtonGroupItem[] = items.map((item) =>
      typeof item === "string" ? { label: item, value: item } : item
    );

    const [internalValue, setInternalValue] = React.useState(
      defaultValue || normalizedItems[0]?.value || ""
    );
    const currentValue = value !== undefined ? value : internalValue;

    const handleValueChange = (val: string) => {
      if (val) {
        setInternalValue(val);
        onValueChange?.(val);
      }
    };

    return (
      <ToggleGroupPrimitive.Root
        ref={ref}
        type="single"
        value={currentValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        className={cn(buttonGroupVariants({ size, className }))}
        {...props}
      >
        {normalizedItems.map((item) => (
          <ToggleGroupPrimitive.Item
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(buttonGroupItemVariants({ size }))}
          >
            {item.label}
          </ToggleGroupPrimitive.Item>
        ))}
      </ToggleGroupPrimitive.Root>
    );
  }
);
ButtonGroup.displayName = "ButtonGroup";

export { ButtonGroup, buttonGroupVariants, buttonGroupItemVariants };
