import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export interface FilterItemDef {
  key: string;
  label: string;
  visible?: boolean;
}

interface FilterManagerPopoverProps {
  filters: FilterItemDef[];
  defaultFilters?: FilterItemDef[];
  onFiltersChange?: (filters: FilterItemDef[]) => void;
}

function FilterManagerPopover({
  filters,
  defaultFilters,
  onFiltersChange,
}: FilterManagerPopoverProps) {
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleToggle = (key: string, checked: boolean) => {
    const updated = filters.map((f) =>
      f.key === key ? { ...f, visible: checked } : f
    );
    onFiltersChange?.(updated);
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...filters];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);
    onFiltersChange?.(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleReset = () => {
    if (defaultFilters) {
      onFiltersChange?.([...defaultFilters]);
    }
  };

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <Button variant="ghost" colorScheme="primary" className="text-xs h-auto py-sp-4 px-sp-8">
          <i className="fa-solid fa-cog" aria-hidden="true" />
          Edit filters
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 w-64 overflow-hidden rounded-lg border border-grey-200 bg-white shadow-md",
            "dark:border-grey-700 dark:bg-grey-800",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
          <div className="px-sp-16 py-sp-8">
            <p className="text-sm font-semibold text-foreground py-sp-4">Filters</p>
          </div>
          <div className="flex flex-col max-h-64 overflow-y-auto py-sp-4">
            {filters.map((filter, index) => (
              <div
                key={filter.key}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center px-sp-16 py-sp-8 cursor-grab transition-colors",
                  "hover:bg-grey-100 dark:hover:bg-grey-700",
                  dragOverIndex === index && "bg-muted/70"
                )}
              >
                <div className="flex items-center gap-sp-8">
                  <Checkbox
                    checked={filter.visible !== false}
                    onCheckedChange={(checked) => handleToggle(filter.key, checked as boolean)}
                  />
                  <span className="text-sm text-foreground select-none">
                    {filter.label}
                  </span>
                </div>
                <div className="flex-1 flex justify-end">
                  <i className="fa-solid fa-grip-vertical text-muted-foreground" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
          {defaultFilters && (
            <>
              <div className="border-t border-grey-200 dark:border-grey-700" />
              <Button variant="ghost" className="w-full" onClick={handleReset}>
                <i className="fa-solid fa-arrow-rotate-left" aria-hidden="true" />
                Back to default
              </Button>
            </>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export interface SidebarFilterProps {
  collapsed?: boolean;
  onCollapse?: () => void;
  filters?: FilterItemDef[];
  defaultFilters?: FilterItemDef[];
  onFiltersChange?: (filters: FilterItemDef[]) => void;
  children: React.ReactNode;
  className?: string;
}

export function SidebarFilter({
  collapsed = false,
  onCollapse,
  filters,
  defaultFilters,
  onFiltersChange,
  children,
  className,
}: SidebarFilterProps) {
  if (collapsed) {
    return (
      <div
        className={cn(
          "flex flex-col border-l border-border bg-grey-50 h-full w-[48px]",
          className
        )}
      >
        <div className="flex items-center justify-center pt-sp-16">
          <i className="fa-solid fa-filter text-xs text-foreground" aria-hidden="true" />
        </div>
        <div className="flex-1" />
        <div className="border-t border-border p-sp-16">
          <button
            onClick={onCollapse}
            className="flex items-center justify-center w-4 h-4 text-foreground"
          >
            <i className="fa-solid fa-chevron-left text-xs" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col border-l border-border bg-grey-50 h-full w-[292px]",
        className
      )}
    >
      {/* Header */}
      <div className="h-[62px] flex items-center justify-between px-sp-16 py-sp-8 shrink-0">
        <div className="flex items-center gap-sp-4">
          <i className="fa-solid fa-filter text-xs text-foreground" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">FILTERS</span>
        </div>
        {filters && onFiltersChange && (
          <FilterManagerPopover
            filters={filters}
            defaultFilters={defaultFilters}
            onFiltersChange={onFiltersChange}
          />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-sp-16">
        <div className="flex flex-col gap-sp-16">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border p-sp-16 shrink-0">
        <button
          onClick={onCollapse}
          className="flex items-center justify-center w-4 h-4 text-foreground"
        >
          <i className="fa-solid fa-chevron-right text-xs" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
