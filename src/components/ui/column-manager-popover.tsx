import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { TableColumn } from "@/components/ui/table";

interface ColumnManagerPopoverProps<T = any> {
  columns: TableColumn<T>[];
  defaultColumns?: TableColumn<T>[];
  onColumnsChange?: (columns: TableColumn<T>[]) => void;
}

function ColumnManagerPopover<T>({
  columns,
  defaultColumns,
  onColumnsChange,
}: ColumnManagerPopoverProps<T>) {
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleToggle = (key: string, checked: boolean) => {
    const updated = columns.map((col) =>
      col.key === key ? { ...col, visible: checked } : col
    );
    onColumnsChange?.(updated);
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

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
    const updated = [...columns];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);
    onColumnsChange?.(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleReset = () => {
    if (defaultColumns) {
      onColumnsChange?.([...defaultColumns]);
    }
  };

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center text-foreground hover:text-primary transition-colors"
          aria-label="Manage columns"
        >
          <i className="fa-solid fa-gear text-base" aria-hidden="true" />
        </button>
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
            <p className="text-sm font-semibold text-foreground py-sp-4">Columns</p>
          </div>
          <div className="flex flex-col max-h-64 overflow-y-auto py-sp-4">
              {columns.filter((col) => !!col.label).map((col, index) => (
                <div
                  key={col.key}
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
                      checked={col.visible !== false}
                      onCheckedChange={(checked) => handleToggle(col.key, checked as boolean)}
                    />
                    <span className="text-sm text-foreground select-none">
                      {col.label || col.key}
                    </span>
                  </div>
                  <div className="flex-1 flex justify-end">
                    <i
                      className="fa-solid fa-grip-vertical text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
              </div>
            ))}
          </div>
          {defaultColumns && (
            <>
              <div className="border-t border-grey-200 dark:border-grey-700" />
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleReset}
              >
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

ColumnManagerPopover.displayName = "ColumnManagerPopover";

export { ColumnManagerPopover };
export type { ColumnManagerPopoverProps };
