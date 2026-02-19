import * as React from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

export interface DownloadItem {
  id: string | number;
  fileName: string;
  status: "in-progress" | "error" | "complete";
  errorMessage?: string;
  onRetry?: () => void;
  onDownload?: () => void;
}

export interface DownloadManagerProps {
  items: DownloadItem[];
  open?: boolean;
  onClose?: () => void;
  message?: string;
  className?: string;
}

const statusConfig = {
  "in-progress": {
    label: "In progress",
    icon: "fa-solid fa-spinner fa-spin",
    iconColor: "text-primary",
  },
  error: {
    label: "Something went wrong, try again",
    icon: "fa-solid fa-triangle-exclamation",
    iconColor: "text-error",
  },
  complete: {
    label: "Ready for download",
    icon: "fa-solid fa-circle-check",
    iconColor: "text-success",
  },
};

const DownloadManager = React.forwardRef<HTMLDivElement, DownloadManagerProps>(
  ({ items, open = true, onClose, message, className }, ref) => {
    const [collapsed, setCollapsed] = React.useState(false);

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "fixed top-sp-16 right-sp-16 z-50 w-96 shadow-lg overflow-hidden",
          collapsed ? "rounded" : "rounded-lg",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-grey-800 text-text-inverse px-sp-16 py-[14px] rounded-t">
          <div className="flex items-center gap-sp-8">
            <i className="fa-solid fa-download text-base" aria-hidden="true" />
            <span className="text-base font-semibold">Downloads</span>
          </div>
          <div className="flex items-center gap-sp-24">
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="p-sp-4 hover:bg-surface/10 rounded transition-colors"
              aria-label={collapsed ? "Expand downloads" : "Collapse downloads"}
            >
              <i
                className={cn(
                  "fa-solid text-base",
                  collapsed ? "fa-chevron-down" : "fa-chevron-up"
                )}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-sp-4 hover:bg-surface/10 rounded transition-colors"
              aria-label="Close downloads"
            >
              <i className="fa-solid fa-xmark text-base" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!collapsed && (
          <div className="bg-grey-300 rounded-b overflow-hidden flex flex-col gap-[1px]">
            {/* Info message (above rows per spec) */}
            {message && (
              <div className="bg-grey-50 px-sp-16 py-sp-8 text-xs text-foreground">
                {message}
              </div>
            )}

            {items.length === 0 ? (
              <div className="px-sp-16 py-sp-24 text-center text-sm text-muted-foreground bg-surface">
                No downloads
              </div>
            ) : (
              items.map((item) => {
                const config = statusConfig[item.status];

                const iconElement = (
                  <i
                    className={cn(config.icon, config.iconColor, "text-base")}
                    aria-hidden="true"
                  />
                );

                return (
                  <div
                    key={item.id}
                    className="flex items-center px-sp-16 bg-surface"
                  >
                    {/* Filename */}
                    <div className="flex-1 min-w-0 py-[9px]">
                      <p className="text-sm font-normal text-foreground truncate">
                        {item.fileName}
                      </p>
                    </div>

                    {/* Status icon with tooltip */}
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      <Tooltip text={config.label} side="left" delayDuration={0}>
                        {item.status === "error" && item.onRetry ? (
                          <button
                            type="button"
                            onClick={item.onRetry}
                            className="rounded p-sp-4 hover:bg-grey-100 transition-colors"
                            aria-label="Retry download"
                          >
                            {iconElement}
                          </button>
                        ) : item.status === "complete" && item.onDownload ? (
                          <button
                            type="button"
                            onClick={item.onDownload}
                            className="rounded p-sp-4 hover:bg-grey-100 transition-colors"
                            aria-label="Download file"
                          >
                            {iconElement}
                          </button>
                        ) : (
                          <span className="inline-flex rounded p-sp-4 hover:bg-grey-100 transition-colors cursor-default">{iconElement}</span>
                        )}
                      </Tooltip>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }
);

DownloadManager.displayName = "DownloadManager";

export { DownloadManager };
