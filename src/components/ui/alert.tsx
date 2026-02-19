import * as React from "react";
import { cn } from "@/lib/utils";

const colorSchemeStyles = {
  info: "bg-blue-50 border-blue-100 text-blue-500",
  success: "bg-green-50 border-green-100 text-green-500",
  error: "bg-red-50 border-red-100 text-red-500",
  warning: "bg-orange-50 border-orange-100 text-orange-500",
} as const;

const accentStyles = {
  info: "bg-blue-500",
  success: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-orange-500",
} as const;

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  colorScheme?: keyof typeof colorSchemeStyles;
  title?: string;
  description: string;
  icon?: string;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      colorScheme = "info",
      title,
      description,
      icon = "fa-solid fa-circle-info",
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "flex items-stretch rounded border overflow-hidden",
          colorSchemeStyles[colorScheme],
          className
        )}
        {...props}
      >
        {/* Accent strip */}
        <div className={cn("w-[2px] shrink-0", accentStyles[colorScheme])} />

        {/* Icon */}
        <div
          className={cn(
            "flex pl-sp-8 shrink-0",
            title ? "items-start pt-[10px]" : "items-center"
          )}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <i className={cn(icon, "text-xs")} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-sp-4 p-sp-8">
          {title && (
            <span className="font-semibold text-sm leading-[22px]">
              {title}
            </span>
          )}
          <span className="font-normal text-xs leading-6">{description}</span>
        </div>
      </div>
    );
  }
);

Alert.displayName = "Alert";

export { Alert };
