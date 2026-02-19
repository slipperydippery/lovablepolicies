import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export interface TabItem {
  label: string;
  icon?: string;
  value?: string;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface TabsProps
  extends Omit<React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>, "defaultValue" | "content"> {
  items: TabItem[];
  defaultValue?: string;
  showContent?: boolean;
}

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(
  (
    {
      className,
      items,
      defaultValue,
      value,
      onValueChange,
      showContent = true,
      ...props
    },
    ref
  ) => {
    const normalizedItems = items.map((item, index) => ({
      ...item,
      value: item.value ?? String(index),
    }));

    const initialValue = defaultValue ?? normalizedItems[0]?.value;

    return (
      <TabsPrimitive.Root
        ref={ref}
        defaultValue={initialValue}
        value={value}
        onValueChange={onValueChange}
        className={cn("w-full", className)}
        {...props}
      >
        <TabsPrimitive.List
          className="inline-flex items-center gap-0 border-b border-border w-full [border-bottom-width:1px]"
        >
          {normalizedItems.map((item) => (
            <TabsPrimitive.Trigger
              key={item.value}
              value={item.value}
              disabled={item.disabled}
              className="inline-flex items-center justify-center whitespace-nowrap h-8 px-sp-24 py-sp-12 -mb-px text-sm gap-sp-8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 relative border-b border-transparent text-foreground hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
            >
              {item.icon && (
                <i className={cn(item.icon, "text-sm")} />
              )}
              {item.label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        {showContent &&
          normalizedItems.map((item) => (
            <TabsPrimitive.Content
              key={item.value}
              value={item.value}
              className="mt-sp-16 focus-visible:outline-none"
            >
              {item.content}
            </TabsPrimitive.Content>
          ))}
      </TabsPrimitive.Root>
    );
  }
);
Tabs.displayName = "Tabs";

export { Tabs };
