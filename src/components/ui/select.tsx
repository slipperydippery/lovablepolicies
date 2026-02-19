import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";

import { cn } from "@/lib/utils";

export interface SelectItem {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
}

export interface SelectProps {
  items: SelectItem[] | string[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  error?: boolean;
  static?: boolean;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  sideOffset?: number;
  className?: string;
}

const Select = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectProps
>(
  (
    {
      items,
      value,
      defaultValue,
      onValueChange,
      placeholder = "Select an option",
      leadingIcon,
      trailingIcon,
      loading = false,
      disabled = false,
      error = false,
      static: isStatic = false,
      align = "start",
      side = "bottom",
      sideOffset = 4,
      className,
    },
    ref
  ) => {
    // Normalize items to SelectItem[]
    const normalizedItems: SelectItem[] = items.map((item) =>
      typeof item === "string" ? { label: item, value: item } : item
    );

    // Find the selected item for static display
    const selectedItem = normalizedItems.find(
      (item) => item.value === value || item.value === defaultValue
    );

    // Static display mode
    if (isStatic) {
      return (
        <div
          className={cn(
            "flex h-9 w-full items-center gap-sp-8 px-2 text-sm text-foreground",
            className
          )}
        >
          {leadingIcon && (
            <span className="text-muted-foreground h-4 w-4 shrink-0">
              {leadingIcon}
            </span>
          )}
          {selectedItem?.icon && (
            <i
              className={cn(
                selectedItem.icon,
                "w-5 text-center text-muted-foreground"
              )}
            />
          )}
          <span>{selectedItem?.label || placeholder}</span>
        </div>
      );
    }

    const hasLeading = !!leadingIcon;

    return (
      <SelectPrimitive.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled || loading}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          className={cn(
            "relative flex h-9 w-full items-center justify-between rounded px-2 text-sm transition-colors",
            "focus:outline-none",
            "disabled:cursor-not-allowed",
            // Default state
            !disabled && !error && [
              "border border-grey-300 bg-white shadow-input",
              "dark:border-grey-600 dark:bg-grey-800",
              "hover:border-grey-400 hover:shadow-none",
              "focus:border-primary focus:shadow-input-focus",
              "data-[state=open]:border-primary data-[state=open]:shadow-input-focus",
            ],
            // Disabled state
            disabled && [
              "border border-grey-200 bg-grey-100 shadow-input",
              "dark:border-grey-600 dark:bg-grey-700",
            ],
            // Error state
            error && !disabled && [
              "border border-error bg-white shadow-input",
              "dark:bg-grey-800",
              "focus:border-error focus:shadow-input-focus",
              "data-[state=open]:border-error data-[state=open]:shadow-input-focus",
            ],
            hasLeading && "pl-8",
            className
          )}
        >
          {leadingIcon && (
            <span className="absolute left-2 text-muted-foreground h-4 w-4 shrink-0">
              {leadingIcon}
            </span>
          )}
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            {loading ? (
              <i className="fa-solid fa-spinner fa-spin ml-2 shrink-0 text-muted-foreground" aria-hidden="true" />
            ) : trailingIcon ? (
              <span className="ml-2 h-4 w-4 shrink-0 text-muted-foreground">
                {trailingIcon}
              </span>
            ) : (
              <i className="fa-solid fa-chevron-down ml-2 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            align={align}
            side={side}
            sideOffset={sideOffset}
            position="popper"
            className={cn(
              "z-50 max-h-96 w-[--radix-popper-anchor-width] min-w-[8rem] overflow-hidden rounded-lg border border-grey-200 bg-white shadow-md",
              "dark:border-grey-700 dark:bg-grey-800",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
            )}
          >
            <SelectPrimitive.Viewport className="py-sp-8">
              {normalizedItems.map((item) => (
                <SelectPrimitive.Item
                  key={item.value}
                  value={item.value}
                  disabled={item.disabled}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center gap-sp-8 px-sp-16 py-sp-8 pr-10 text-sm text-foreground outline-none transition-colors",
                    "hover:bg-grey-100 focus:bg-grey-100",
                    "dark:hover:bg-grey-700 dark:focus:bg-grey-700",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  )}
                >
                  {item.icon && (
                    <i
                      className={cn(
                        item.icon,
                        "w-5 text-center text-muted-foreground"
                      )}
                    />
                  )}
                  <SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-3">
                    <i className="fa-solid fa-check text-primary" aria-hidden="true" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  }
);
Select.displayName = "Select";

export { Select };
