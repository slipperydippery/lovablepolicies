import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toastVariants = cva(
  "px-sp-24 py-sp-16 rounded-lg shadow-xs text-white text-center text-sm transition-all duration-300",
  {
    variants: {
      colorScheme: {
        success: "bg-success",
        error: "bg-error",
        warning: "bg-warning",
        info: "bg-info",
      },
    },
    defaultVariants: {
      colorScheme: "info",
    },
  }
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  /** Toast title */
  title?: string;
  /** Toast description */
  description?: string;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, colorScheme, title, description, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(toastVariants({ colorScheme }), className)}
        role="alert"
        {...props}
      >
        {title && <span className="font-semibold">{title} </span>}
        {description && <span className="font-normal">{description}</span>}
        {children}
      </div>
    );
  }
);
Toast.displayName = "Toast";

export { Toast, toastVariants };
