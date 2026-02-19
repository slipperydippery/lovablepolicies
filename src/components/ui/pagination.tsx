import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";


import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const paginationVariants = cva("flex items-center gap-1", {
  variants: {
    size: {
      sm: "",
      md: "",
      lg: "",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const paginationItemVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-[0.32] rounded-md select-none",
  {
    variants: {
      size: {
        sm: "h-7 min-w-7 px-2 text-xs",
        md: "h-9 min-w-9 px-3 text-sm",
        lg: "h-11 min-w-11 px-4 text-base",
      },
      variant: {
        default: "text-muted-foreground hover:bg-muted hover:text-foreground",
        active: "ring-1 ring-inset ring-border bg-background text-foreground",
        ellipsis: "text-muted-foreground cursor-default",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  },
);

export interface PaginationProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof paginationVariants> {
  /** Total number of items */
  total: number;
  /** Items per page */
  itemsPerPage?: number;
  /** Current page (controlled) */
  page?: number;
  /** Default page (uncontrolled) */
  defaultPage?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Number of siblings around current page */
  siblingCount?: number;
  /** Always show first/last page and ellipsis */
  showEdges?: boolean;
  /** Show page selector dropdown */
  showPageSelect?: boolean;
  /** Show results label */
  showResultsLabel?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  (
    {
      className,
      total,
      itemsPerPage = 20,
      page: controlledPage,
      defaultPage = 1,
      onPageChange,
      siblingCount = 1,
      showEdges = true,
      showPageSelect = false,
      showResultsLabel = false,
      size,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [internalPage, setInternalPage] = React.useState(defaultPage);
    const currentPage = controlledPage !== undefined ? controlledPage : internalPage;

    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));

    const handlePageChange = (newPage: number) => {
      if (newPage < 1 || newPage > totalPages || disabled) return;
      setInternalPage(newPage);
      onPageChange?.(newPage);
    };

    // Generate page numbers with ellipsis
    const generatePages = (): (number | "ellipsis")[] => {
      const pages: (number | "ellipsis")[] = [];

      if (totalPages <= siblingCount * 2 + 3 + 2) {
        // Show all pages if total is small enough
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
        return pages;
      }

      if (!showEdges) {
        // Without edges, show siblings around current page
        const start = Math.max(1, currentPage - siblingCount);
        const end = Math.min(totalPages, currentPage + siblingCount);
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        return pages;
      }

      // Always include first page
      pages.push(1);

      // Calculate the range around current page
      const leftSibling = Math.max(2, currentPage - siblingCount);
      const rightSibling = Math.min(totalPages - 1, currentPage + siblingCount);

      // Add left ellipsis
      if (leftSibling > 2) {
        pages.push("ellipsis");
      }

      // Add middle pages
      for (let i = leftSibling; i <= rightSibling; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }

      // Add right ellipsis
      if (rightSibling < totalPages - 1) {
        pages.push("ellipsis");
      }

      // Always include last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }

      return pages;
    };

    const pages = generatePages();

    const startResult = (currentPage - 1) * itemsPerPage + 1;
    const endResult = Math.min(currentPage * itemsPerPage, total);

    return (
      <div ref={ref} className={cn("flex items-center justify-between gap-16", className)} {...props}>
        {/* Pagination controls */}
        <nav className={cn(paginationVariants({ size }))}>
          {/* Previous button */}
          <Button
            variant="ghost"
            square
            className="text-foreground"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || disabled}
            aria-label="Previous page"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </Button>

          {/* Page numbers */}
          {pages.map((pageItem, index) => {
            if (pageItem === "ellipsis") {
              return (
                <Button
                  key={`ellipsis-${index}`}
                  variant="ghost"
                  square
                  disabled
                  className="cursor-default text-foreground"
                >
                  <i className="fa-solid fa-ellipsis" aria-hidden="true" />
                </Button>
              );
            }

            return (
              <Button
                key={pageItem}
                variant={pageItem === currentPage ? "outline" : "ghost"}
                square
                className="text-foreground"
                onClick={() => handlePageChange(pageItem)}
                disabled={disabled}
                aria-label={`Page ${pageItem}`}
                aria-current={pageItem === currentPage ? "page" : undefined}
              >
                {pageItem}
              </Button>
            );
          })}

          {/* Next button */}
          <Button
            variant="ghost"
            square
            className="text-foreground"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || disabled}
            aria-label="Next page"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </Button>
        </nav>

        {/* Right side: page selector and results label */}
        {(showPageSelect || showResultsLabel) && (
          <div className="flex items-center gap-4">
            {showPageSelect && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Page</span>
                <Select
                  items={Array.from({ length: totalPages }, (_, i) => ({
                    label: String(i + 1),
                    value: String(i + 1),
                  }))}
                  value={String(currentPage)}
                  onValueChange={(val) => handlePageChange(Number(val))}
                  disabled={disabled}
                  className="w-[72px]"
                />
              </div>
            )}

            {showResultsLabel && total > 0 && (
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Results: {startResult} - {endResult} of {total}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);
Pagination.displayName = "Pagination";

export { Pagination, paginationVariants, paginationItemVariants };
