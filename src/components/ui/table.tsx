import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnManagerPopover } from "@/components/ui/column-manager-popover";

export interface TableColumn<T = any> {
  key: string;
  label?: string;
  sortable?: boolean;
  direction?: "asc" | "desc";
  header?: (column: TableColumn<T>) => React.ReactNode;
  cell?: (row: T, rowIndex: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  visible?: boolean;
  sum?: boolean;
}

export interface TableSort {
  column: string;
  direction: "asc" | "desc";
}

const tableVariants = cva("w-full border-collapse");

const cellPadding = "px-sp-16 py-sp-8";
const headerCellPadding = "px-sp-16 py-sp-12";
const textSize = "text-xs";

export interface TableProps<T = any>
  extends Omit<React.HTMLAttributes<HTMLTableElement>, "children"> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (rows: T[]) => void;
  rowKey?: keyof T | ((row: T) => string | number);
  sort?: TableSort;
  onSortChange?: (sort: TableSort) => void;
  stickyHeader?: boolean;
  maxRows?: number;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string | ((row: T, index: number) => string);
  columnManager?: boolean;
  onColumnsChange?: (columns: TableColumn<T>[]) => void;
  defaultColumns?: TableColumn<T>[];
}

function getRowKey<T>(row: T, index: number, rowKey?: keyof T | ((row: T) => string | number)): string | number {
  if (!rowKey) return index;
  if (typeof rowKey === "function") return rowKey(row);
  return row[rowKey] as string | number;
}

function useScrollbarWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      setWidth(el.offsetWidth - el.clientWidth);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return width;
}

function Table<T extends Record<string, any>>({
  className,
  data,
  columns,
  loading = false,
  loadingRows = 5,
  emptyMessage = "No data available",
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowKey,
  sort,
  onSortChange,
  stickyHeader = false,
  maxRows = 100,
  onRowClick,
  rowClassName,
  columnManager = false,
  onColumnsChange,
  defaultColumns,
  ...props
}: TableProps<T>) {
  const bodyScrollRef = React.useRef<HTMLDivElement>(null);
  const scrollbarWidth = useScrollbarWidth(bodyScrollRef);

  // Data columns: visible columns with labels
  const dataColumns = columns.filter((col) => col.label && col.visible !== false);
  // Actions column: last column without label (always visible)
  const actionsColumn = columns.find((col) => !col.label && col.width);
  const visibleColumns = actionsColumn ? [...dataColumns, actionsColumn] : dataColumns;

  const needsGearColumn = columnManager && !actionsColumn;

  // Auto-sort data internally when sort is provided
  const sortedData = React.useMemo(() => {
    if (!sort?.column) return data;
    const col = columns.find((c) => c.key === sort.column);
    if (!col?.sortable) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sort.column];
      const bVal = b[sort.column];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      let cmp: number;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sort.direction === "desc" ? -cmp : cmp;
    });
  }, [data, sort, columns]);

  const isRowSelected = (row: T): boolean => {
    const key = getRowKey(row, data.indexOf(row), rowKey);
    return selectedRows.some((r) => getRowKey(r, data.indexOf(r), rowKey) === key);
  };

  const isAllSelected = data.length > 0 && selectedRows.length === data.length;
  const isSomeSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  const handleSelectAll = (checked: boolean) => {
    onSelectionChange?.(checked ? [...data] : []);
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedRows, row]);
    } else {
      const key = getRowKey(row, data.indexOf(row), rowKey);
      onSelectionChange?.(selectedRows.filter((r) => getRowKey(r, data.indexOf(r), rowKey) !== key));
    }
  };

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSortChange) return;
    const newDirection =
      sort?.column === column.key
        ? sort.direction === "asc" ? "desc" : "asc"
        : column.direction || "asc";
    onSortChange({ column: column.key, direction: newDirection });
  };

  const getAlignmentClass = (align?: "left" | "center" | "right") => {
    switch (align) {
      case "center": return "text-center";
      case "right": return "text-right";
      default: return "text-left";
    }
  };

  const renderHeaderCell = (column: TableColumn<T>) => {
    if (column.header) return column.header(column);
    const isSorted = sort?.column === column.key;
    const sortIconClass = sort?.direction === "asc" ? "fa-caret-up" : "fa-caret-down";
    return (
      <div
        className={cn(
          "flex items-center gap-sp-8",
          column.sortable && "cursor-pointer select-none hover:text-foreground",
          column.align === "right" && "justify-end",
          column.align === "center" && "justify-center"
        )}
        onClick={() => handleSort(column)}
      >
        <span className="uppercase tracking-wide">{column.label}</span>
        {column.sortable && (
          <i
            className={cn(
              "fa-solid", sortIconClass, "text-foreground",
              "text-sm transition-opacity",
              isSorted ? "opacity-100" : "opacity-0 group-hover:opacity-50"
            )}
            aria-hidden="true"
          />
        )}
      </div>
    );
  };

  const renderCell = (row: T, column: TableColumn<T>, rowIndex: number) => {
    if (column.cell) return column.cell(row, rowIndex);
    return row[column.key] ?? "-";
  };

  const getRowClassName = (row: T, index: number): string => {
    if (!rowClassName) return "";
    if (typeof rowClassName === "function") return rowClassName(row, index);
    return rowClassName;
  };

  const rowHeight = 36;
  const maxHeight = maxRows * rowHeight;
  const needsScroll = sortedData.length > maxRows;

  // Colgroup for split-table mode — extra scrollbar col for header/footer
  const renderColGroup = (includeScrollbarCol = false) => (
    <colgroup>
      {selectable && <col style={{ width: "40px" }} />}
      {visibleColumns.map((col) => (
        <col key={col.key} style={col.width ? { width: col.width } : undefined} />
      ))}
      {needsGearColumn && <col style={{ width: "40px" }} />}
      {includeScrollbarCol && scrollbarWidth > 0 && <col style={{ width: `${scrollbarWidth}px` }} />}
    </colgroup>
  );

  const renderGearHeader = () => (
    <div className="flex items-center justify-center">
      <ColumnManagerPopover columns={columns} defaultColumns={defaultColumns} onColumnsChange={onColumnsChange} />
    </div>
  );

  const renderThead = (includeScrollbarCol = false) => (
    <thead>
      <tr className="border-b border-input bg-muted h-[44px]">
        {selectable && (
          <th className={cn(headerCellPadding, textSize, "w-10 text-center")}>
            <div className="flex items-center justify-center">
              <Checkbox
                checked={isSomeSelected ? "indeterminate" : isAllSelected}
                onCheckedChange={handleSelectAll}
              />
            </div>
          </th>
        )}
        {visibleColumns.map((column, colIndex) => {
          const isActionsCol = actionsColumn && column === actionsColumn;
          return (
            <th
              key={column.key}
              className={cn(headerCellPadding, textSize, "font-semibold text-muted-foreground group", getAlignmentClass(column.align))}
              style={{ width: column.width }}
            >
              {isActionsCol && columnManager ? renderGearHeader() : renderHeaderCell(column)}
            </th>
          );
        })}
        {needsGearColumn && (
          <th className={cn(headerCellPadding, textSize, "w-10 text-center")}>
            {renderGearHeader()}
          </th>
        )}
        {includeScrollbarCol && scrollbarWidth > 0 && <th style={{ width: `${scrollbarWidth}px`, padding: 0 }} />}
      </tr>
    </thead>
  );

  const renderTbody = () => (
    <tbody>
      {loading ? (
        Array.from({ length: loadingRows }).map((_, index) => (
          <tr key={`loading-${index}`} className={cn(index % 2 === 1 && "bg-surface")}>
            {selectable && (
              <td className={cn(cellPadding, "w-10")}>
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </td>
            )}
            {visibleColumns.map((column) => (
              <td key={column.key} className={cn(cellPadding)}>
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              </td>
            ))}
            {needsGearColumn && <td className={cn(cellPadding, "w-10")} />}
          </tr>
        ))
      ) : sortedData.length === 0 ? (
        <tr>
          <td
            colSpan={visibleColumns.length + (selectable ? 1 : 0) + (needsGearColumn ? 1 : 0)}
            className={cn(cellPadding, textSize, "text-center text-muted-foreground py-sp-32")}
          >
            {emptyMessage}
          </td>
        </tr>
      ) : (
        sortedData.map((row, rowIndex) => (
          <tr
            key={getRowKey(row, rowIndex, rowKey)}
            className={cn(
              rowIndex % 2 === 1 && "bg-surface",
              isRowSelected(row) && "bg-primary/5",
              "hover:bg-grey-100 dark:hover:bg-grey-700",
              onRowClick && "cursor-pointer",
              getRowClassName(row, rowIndex)
            )}
            onClick={() => onRowClick?.(row, rowIndex)}
          >
            {selectable && (
              <td className={cn(cellPadding, "w-10 text-center")} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-center">
                  <Checkbox checked={isRowSelected(row)} onCheckedChange={(checked) => handleSelectRow(row, checked as boolean)} />
                </div>
              </td>
            )}
            {visibleColumns.map((column) => (
              <td
                key={column.key}
                className={cn(cellPadding, textSize, "text-foreground", getAlignmentClass(column.align), column.sortable && column.align === "right" && "pr-sp-32")}
              >
                {renderCell(row, column, rowIndex)}
              </td>
            ))}
            {needsGearColumn && <td className={cn(cellPadding, "w-10")} />}
          </tr>
        ))
      )}
    </tbody>
  );

  const hasSumFooter = !loading && data.length > 0 && visibleColumns.some((col) => col.sum);

  const renderTfoot = (includeScrollbarCol = false) => {
    if (!hasSumFooter) return null;
    return (
      <tfoot>
        <tr className="border-t border-border bg-muted font-semibold">
          {selectable && <td className={cn(cellPadding, "w-10")} />}
          {(() => {
            const sumColIndices = visibleColumns.map((col, i) => (col.sum ? i : -1)).filter((i) => i >= 0);
            const firstSumIndex = sumColIndices[0];
            const totalLabelIndex = firstSumIndex > 0 ? firstSumIndex - 1 : -1;

            return visibleColumns.map((column, colIndex) => {
              if (column.sum) {
                const total = data.reduce((acc, row) => {
                  const val = Number(row[column.key]);
                  return acc + (isNaN(val) ? 0 : val);
                }, 0);
                return (
                  <td key={column.key} className={cn(cellPadding, textSize, "text-foreground", getAlignmentClass(column.align), column.sortable && column.align === "right" && "pr-sp-32")}>
                    {column.cell ? column.cell({ [column.key]: total } as T, -1) : total.toLocaleString()}
                  </td>
                );
              }
              if (colIndex === totalLabelIndex) {
                return (
                  <td key={column.key} className={cn(cellPadding, textSize, "text-muted-foreground text-right")}>
                    Total
                  </td>
                );
              }
              return <td key={column.key} className={cn(cellPadding)} />;
            });
          })()}
          {needsGearColumn && <td className={cn(cellPadding, "w-10")} />}
          {includeScrollbarCol && scrollbarWidth > 0 && <td style={{ width: `${scrollbarWidth}px`, padding: 0 }} />}
        </tr>
      </tfoot>
    );
  };

  // Split-table mode: scrollbar only on body
  if (stickyHeader) {
    return (
      <div className={cn("w-full border border-input rounded-lg overflow-hidden flex flex-col", className)}>
        {/* Fixed header */}
        <div className="overflow-hidden">
          <table className={cn(tableVariants())} style={{ tableLayout: "fixed" }} {...props}>
            {renderColGroup(true)}
            {renderThead(true)}
          </table>
        </div>

        {/* Scrollable body */}
        <div ref={bodyScrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <table className={cn(tableVariants())} style={{ tableLayout: "fixed" }}>
            {renderColGroup(false)}
            {renderTbody()}
          </table>
        </div>

        {/* Fixed footer */}
        {hasSumFooter && (
          <div className="overflow-hidden">
            <table className={cn(tableVariants())} style={{ tableLayout: "fixed" }}>
              {renderColGroup(true)}
              {renderTfoot(true)}
            </table>
          </div>
        )}
      </div>
    );
  }

  // Single-table mode (default)
  return (
    <div
      className={cn("w-full overflow-x-auto border border-input rounded-lg overflow-hidden", className)}
      style={needsScroll ? { maxHeight: `${maxHeight + rowHeight}px`, overflow: 'auto' } : undefined}
    >
      <table className={cn(tableVariants(), className)} {...props}>
        {renderThead()}
        {renderTbody()}
        {renderTfoot()}
      </table>
    </div>
  );
}

Table.displayName = "Table";

export { Table, tableVariants };
