import * as React from "react";
import { cn } from "@/lib/utils";

const colorSchemeStyles = {
  primary: "bg-blue-50 text-blue-500",
  neutral: "bg-grey-200 text-grey-700",
  success: "bg-green-50 text-green-600",
  warning: "bg-orange-50 text-orange-600",
  error: "bg-red-50 text-red-500",
  purple: "bg-purple-50 text-purple-500",
} as const;

const dotColorStyles = {
  primary: "bg-blue-500",
  neutral: "bg-grey-700",
  success: "bg-green-600",
  warning: "bg-orange-600",
  error: "bg-red-600",
  purple: "bg-purple-500",
} as const;

export type BadgeColorScheme = keyof typeof colorSchemeStyles;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color scheme */
  colorScheme?: BadgeColorScheme;
  /** Leading icon (Font Awesome class or React node) */
  icon?: string | React.ReactNode;
  /** Status mode: pill shape with colored dot */
  status?: boolean;
  /** Badge label text */
  label?: string;
  /** Show close button */
  closable?: boolean;
  /** Callback when close button is clicked */
  onClose?: () => void;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      colorScheme = "primary",
      icon,
      status,
      label,
      closable,
      onClose,
      children,
      ...props
    },
    ref
  ) => {
    const renderIcon = (iconProp: string | React.ReactNode) => {
      if (typeof iconProp === "string") {
        return <i className={cn(iconProp, "text-xs")} aria-hidden="true" />;
      }
      return iconProp;
    };

    if (closable) {
      return (
        <span
          ref={ref}
          className={cn(
            "inline-flex items-center bg-blue-100 rounded-lg border border-blue-100 overflow-hidden",
            className
          )}
          {...props}
        >
          <span className="self-stretch py-0.5 pl-3 pr-1 text-sm font-semibold text-blue-500 inline-flex items-center">
            {label || children}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            className="self-stretch py-0.5 pl-2 pr-2 rounded-r-lg hover:bg-blue-200 transition-colors flex items-center justify-center focus:outline-none"
            aria-label="Remove"
          >
            <i className="fa-solid fa-xmark text-base text-blue-500" aria-hidden="true" />
          </button>
        </span>
      );
    }

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-normal text-xs leading-5 transition-colors focus:outline-none",
          "px-sp-8 py-0.5",
          status ? "rounded-lg gap-2 font-semibold" : "rounded gap-1",
          colorSchemeStyles[colorScheme],
          className
        )}
        {...props}
      >
        {status && (
          <span
            className={cn("h-2 w-2 rounded-full shrink-0", dotColorStyles[colorScheme])}
            aria-hidden="true"
          />
        )}
        {!status && icon && renderIcon(icon)}
        {label || children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
