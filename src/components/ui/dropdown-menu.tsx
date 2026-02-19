import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

// Types
export interface DropdownMenuItem {
  label: string;
  icon?: string;
  color?: "primary" | "neutral" | "error" | "success" | "warning";
  type?: "item" | "label" | "separator";
  disabled?: boolean;
  onSelect?: () => void;
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[][];
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  disabled?: boolean;
  children: React.ReactNode;
}

// Components
const DropdownMenu = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownMenuProps
>(
  (
    {
      items,
      align = "start",
      side = "bottom",
      sideOffset = 4,
      disabled = false,
      children,
    },
    ref
  ) => {
    return (
      <DropdownMenuPrimitive.Root>
        <DropdownMenuPrimitive.Trigger asChild disabled={disabled}>
          {children}
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            ref={ref}
            align={align}
            side={side}
            sideOffset={sideOffset}
            className="z-50 min-w-[180px] overflow-hidden rounded border border-grey-100 bg-white py-1 shadow-sm dark:border-grey-700 dark:bg-grey-800"
          >
            {items.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {groupIndex > 0 && (
                  <DropdownMenuPrimitive.Separator className="h-px bg-grey-100 dark:bg-grey-700 my-1" />
                )}
                {group.map((item, itemIndex) => {
                  if (item.type === "separator") {
                    return (
                      <DropdownMenuPrimitive.Separator
                        key={`${groupIndex}-${itemIndex}`}
                        className="h-px bg-grey-100 dark:bg-grey-700 my-1"
                      />
                    );
                  }

                  if (item.type === "label") {
                    return (
                      <DropdownMenuPrimitive.Label
                        key={`${groupIndex}-${itemIndex}`}
                        className="px-sp-16 py-[6px] text-xs font-semibold text-grey-500 dark:text-grey-400"
                      >
                        {item.label}
                      </DropdownMenuPrimitive.Label>
                    );
                  }

                  const isError = item.color === "error";

                  return (
                    <DropdownMenuPrimitive.Item
                      key={`${groupIndex}-${itemIndex}`}
                      className={cn(
                        "relative flex cursor-pointer select-none items-center px-sp-16 py-[6px] text-sm font-normal leading-[22px] gap-sp-8 outline-none transition-colors focus:bg-grey-100 dark:focus:bg-grey-700 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                        isError
                          ? "text-error hover:bg-error/10 dark:hover:bg-error/20"
                          : "text-grey-900 hover:bg-grey-100 dark:text-grey-100 dark:hover:bg-grey-700"
                      )}
                      disabled={item.disabled}
                      onSelect={item.onSelect}
                    >
                      {item.icon && (
                        <i
                          className={cn(
                            item.icon,
                            "w-5 text-center text-base text-grey-900 dark:text-grey-100"
                          )}
                        />
                      )}
                      <span>{item.label}</span>
                    </DropdownMenuPrimitive.Item>
                  );
                })}
              </React.Fragment>
            ))}
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    );
  }
);
DropdownMenu.displayName = "DropdownMenu";

export { DropdownMenu };
