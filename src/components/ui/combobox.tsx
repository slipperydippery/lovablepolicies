import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export interface SelectMenuItem {
  label: string;
  value: string;
  icon?: string;
  disabled?: boolean;
}

export interface SelectMenuProps {
  items: SelectMenuItem[] | string[];
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  multiple?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  error?: boolean;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
  sideOffset?: number;
  className?: string;
}

const SelectMenu = React.forwardRef<HTMLButtonElement, SelectMenuProps>(
  (
    {
      items,
      value,
      defaultValue,
      onValueChange,
      placeholder = "Select an option",
      searchable = true,
      searchPlaceholder = "Search...",
      multiple = false,
      leadingIcon,
      trailingIcon,
      loading = false,
      disabled = false,
      error = false,
      align = "start",
      side = "bottom",
      sideOffset = 4,
      className,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Handle uncontrolled default value
    const [internalValue, setInternalValue] = React.useState<string | string[]>(
      defaultValue || (multiple ? [] : "")
    );
    
    const currentValue = value !== undefined ? value : internalValue;

    // Normalize items to SelectMenuItem[]
    const normalizedItems: SelectMenuItem[] = React.useMemo(
      () =>
        items.map((item) =>
          typeof item === "string" ? { label: item, value: item } : item
        ),
      [items]
    );

    // Filter items based on search
    const filteredItems = React.useMemo(() => {
      if (!search) return normalizedItems;
      return normalizedItems.filter((item) =>
        item.label.toLowerCase().includes(search.toLowerCase())
      );
    }, [normalizedItems, search]);

    // Get selected items for display
    const selectedItems = React.useMemo(() => {
      if (multiple) {
        const values = Array.isArray(currentValue) ? currentValue : [];
        return normalizedItems.filter((item) => values.includes(item.value));
      } else {
        const item = normalizedItems.find((item) => item.value === currentValue);
        return item ? [item] : [];
      }
    }, [currentValue, normalizedItems, multiple]);

    // Display text for trigger
    const displayText = React.useMemo(() => {
      if (selectedItems.length === 0) return null;
      if (multiple) {
        return selectedItems.map((item) => item.label).join(", ");
      }
      return selectedItems[0]?.label;
    }, [selectedItems, multiple]);

    // Handle item selection
    const handleSelect = (itemValue: string) => {
      if (multiple) {
        const current = Array.isArray(currentValue) ? currentValue : [];
        const updated = current.includes(itemValue)
          ? current.filter((v) => v !== itemValue)
          : [...current, itemValue];
        
        if (value === undefined) {
          setInternalValue(updated);
        }
        onValueChange?.(updated);
      } else {
        if (value === undefined) {
          setInternalValue(itemValue);
        }
        onValueChange?.(itemValue);
        setOpen(false);
      }
    };

    // Check if item is selected
    const isSelected = (itemValue: string) => {
      if (multiple) {
        const values = Array.isArray(currentValue) ? currentValue : [];
        return values.includes(itemValue);
      }
      return currentValue === itemValue;
    };

    // Clear search on close
    React.useEffect(() => {
      if (!open) {
        setSearch("");
      } else if (searchable && searchInputRef.current) {
        // Focus search input when opening
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    }, [open, searchable]);

    const hasLeading = !!leadingIcon;

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger
          ref={ref}
          disabled={disabled || loading}
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
            <span className="absolute left-2 flex h-4 w-4 items-center justify-center text-muted-foreground">
              {leadingIcon}
            </span>
          )}
          <span className={cn(
            "flex-1 text-left truncate",
            !displayText && "text-muted-foreground"
          )}>
            {displayText || placeholder}
          </span>
          {loading ? (
            <i className="fa-solid fa-spinner fa-spin ml-2 shrink-0 text-muted-foreground" aria-hidden="true" />
          ) : trailingIcon ? (
            <span className="ml-2 h-4 w-4 shrink-0 text-muted-foreground">
              {trailingIcon}
            </span>
          ) : (
            <i className={cn(
              "fa-solid fa-chevron-down ml-2 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )} aria-hidden="true" />
          )}
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align={align}
            side={side}
            sideOffset={sideOffset}
            className={cn(
              "z-50 w-[--radix-popper-anchor-width] min-w-[8rem] overflow-hidden rounded-lg border border-grey-200 bg-white shadow-md",
              "dark:border-grey-700 dark:bg-grey-800",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
            )}
          >
            {/* Search Input */}
            {searchable && (
              <div className="flex items-center gap-sp-8 px-sp-16 py-sp-8 border-b border-grey-200 dark:border-grey-700">
                <i className="fa-solid fa-magnifying-glass text-muted-foreground shrink-0" aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none"
                  )}
                />
              </div>
            )}

            {/* Items List */}
            <div className="max-h-72 overflow-auto py-sp-8">
              {filteredItems.length === 0 ? (
                <div className="px-sp-16 py-sp-8 text-sm text-muted-foreground text-center">
                  No results found
                </div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => handleSelect(item.value)}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center gap-sp-8 px-sp-16 py-sp-8 text-sm text-foreground outline-none transition-colors",
                      "hover:bg-grey-100 focus:bg-grey-100",
                      "dark:hover:bg-grey-700 dark:focus:bg-grey-700",
                      "disabled:pointer-events-none disabled:opacity-50",
                      !multiple && "pr-10"
                    )}
                  >
                    {/* Checkbox for multiple mode */}
                    {multiple && (
                      <Checkbox
                        checked={isSelected(item.value)}
                        
                        className="pointer-events-none"
                      />
                    )}
                    
                    {/* Item icon */}
                    {item.icon && (
                      <i
                        className={cn(
                          item.icon,
                          "w-5 text-center text-muted-foreground"
                        )}
                      />
                    )}
                    
                    {/* Item label */}
                    <span className="flex-1 text-left">{item.label}</span>
                    
                    {/* Check indicator for single mode */}
                    {!multiple && isSelected(item.value) && (
                      <i className="fa-solid fa-check absolute right-3 text-primary" aria-hidden="true" />
                    )}
                  </button>
                ))
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }
);

SelectMenu.displayName = "SelectMenu";

export { SelectMenu };
