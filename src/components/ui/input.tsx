import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
  error?: boolean;
  static?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      leadingIcon,
      trailingIcon,
      loading,
      disabled,
      error,
      static: isStatic,
      ...props
    },
    ref
  ) => {
    const hasLeading = !!leadingIcon;
    const hasTrailing = !!trailingIcon || loading;

    return (
      <div className="relative w-full">
        {leadingIcon && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground pointer-events-none h-4 w-4">
            {leadingIcon}
          </div>
        )}

        <input
          type={type}
          className={cn(
            "flex w-full h-9 px-2 rounded text-sm text-foreground transition-colors",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none",
            "disabled:cursor-not-allowed",
            // Default state
            !isStatic && !disabled && !error && [
              "border border-grey-300 bg-white shadow-input",
              "dark:border-grey-600 dark:bg-grey-800",
              "hover:border-grey-400 hover:shadow-none",
              "focus:border-primary focus:shadow-input-focus",
            ],
            // Disabled state
            disabled && [
              "border border-grey-200 bg-grey-100 shadow-input",
              "dark:border-grey-600 dark:bg-grey-700",
            ],
            // Error state
            error && !disabled && [
              "border border-error bg-white shadow-input",
              "dark:bg-grey-800",
              "focus:border-error focus:shadow-input-focus",
            ],
            // Static state (no border, no background)
            isStatic && [
              "border-transparent bg-transparent",
              "pointer-events-none",
            ],
            hasLeading && "pl-8",
            hasTrailing && "pr-8",
            className
          )}
          ref={ref}
          disabled={disabled || loading}
          {...props}
        />

        {(trailingIcon || loading) && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-muted-foreground pointer-events-none h-4 w-4">
            {loading ? (
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
            ) : (
              trailingIcon
            )}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
