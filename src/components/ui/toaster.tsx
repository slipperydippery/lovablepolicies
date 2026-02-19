import * as React from "react";
import { Toast, type ToastProps } from "./toast";
import { cn } from "@/lib/utils";

export interface ToastItem extends Omit<ToastProps, "onClose" | "id"> {
  id: string | number;
}

export interface ToasterProps {
  toasts: ToastItem[];
  onRemove: (id: string | number) => void;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  max?: number;
}

const positionClasses = {
  "top-left": "top-4 left-4 items-start",
  "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
  "top-right": "top-4 right-4 items-end",
  "bottom-left": "bottom-4 left-4 items-start",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-4 right-4 items-end",
};

const EXIT_DURATION = 300;

const Toaster = ({
  toasts,
  onRemove,
  position = "top-center",
  max = 5,
}: ToasterProps) => {
  const [leavingIds, setLeavingIds] = React.useState<Set<string | number>>(new Set());
  const prevToastIds = React.useRef<Set<string | number>>(new Set());

  React.useEffect(() => {
    const currentIds = new Set(toasts.map((t) => t.id));
    const removed = [...prevToastIds.current].filter((id) => !currentIds.has(id));

    if (removed.length > 0) {
      // Re-add removed toasts temporarily for exit animation
      setLeavingIds((prev) => {
        const next = new Set(prev);
        removed.forEach((id) => next.add(id));
        return next;
      });

      setTimeout(() => {
        setLeavingIds((prev) => {
          const next = new Set(prev);
          removed.forEach((id) => next.delete(id));
          return next;
        });
      }, EXIT_DURATION);
    }

    prevToastIds.current = currentIds;
  }, [toasts]);

  // Keep a ref of all toast data for exit animation
  const toastMap = React.useRef<Map<string | number, ToastItem>>(new Map());
  toasts.forEach((t) => toastMap.current.set(t.id, t));

  const visibleToasts = [
    ...toasts.slice(-max),
    ...[...leavingIds]
      .filter((id) => !toasts.some((t) => t.id === id))
      .map((id) => toastMap.current.get(id))
      .filter(Boolean) as ToastItem[],
  ];

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-sp-8 pointer-events-none",
        positionClasses[position]
      )}
    >
      {visibleToasts.map(({ id, ...toastProps }) => (
        <div
          key={id}
          className={cn(
            "pointer-events-auto transition-all duration-300",
            leavingIds.has(id)
              ? "animate-out slide-out-to-top-full fade-out duration-300"
              : "animate-in slide-in-from-top-full duration-300"
          )}
        >
          <Toast {...toastProps} />
        </div>
      ))}
    </div>
  );
};

export { Toaster };
