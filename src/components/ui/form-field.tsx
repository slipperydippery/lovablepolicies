import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label?: string;
  description?: string;
  hint?: string;
  help?: string;
  error?: string | boolean;
  required?: boolean;
  size?: "sm" | "md" | "lg";
  orientation?: "vertical" | "horizontal";
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      label,
      description,
      hint,
      help,
      error,
      required,
      size = "md",
      orientation = "vertical",
      children,
      className,
      id,
    },
    ref
  ) => {
    const generatedId = React.useId();
    const fieldId = id || generatedId;
    const descriptionId = `${fieldId}-description`;
    const errorId = `${fieldId}-error`;
    const helpId = `${fieldId}-help`;

    const hasError = !!error;
    const errorMessage = typeof error === "string" ? error : undefined;

    // Clone children to pass error state and aria attributes
    const enhancedChildren = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        const childProps: Record<string, unknown> = {
          id: fieldId,
          "aria-invalid": hasError || undefined,
          "aria-describedby": cn(
            description && descriptionId,
            hasError && errorMessage && errorId,
            help && !hasError && helpId
          ) || undefined,
        };

        // Pass colorScheme error to Input components
        if (hasError && "colorScheme" in (child.props as object)) {
          childProps.colorScheme = "error";
        }

        return React.cloneElement(child, childProps);
      }
      return child;
    });

    const labelSizeClasses = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    };

    if (orientation === "horizontal") {
      return (
        <div
          ref={ref}
          className={cn("grid grid-cols-[auto_1fr] gap-x-sp-16 gap-y-sp-4", className)}
        >
          {/* Label column */}
          <div className="flex flex-col justify-center min-w-[120px]">
            {label && (
              <label
                htmlFor={fieldId}
                className={cn(
                  "font-medium text-foreground",
                  labelSizeClasses[size]
                )}
              >
                {label}
                {required && <span className="text-error ml-1">*</span>}
              </label>
            )}
            {description && (
              <p
                id={descriptionId}
                className="text-xs text-muted-foreground mt-sp-4"
              >
                {description}
              </p>
            )}
          </div>

          {/* Content column */}
          <div className="flex flex-col">
            {enhancedChildren}
            {hasError && errorMessage && (
              <p id={errorId} className="text-xs text-error mt-sp-4">
                {errorMessage}
              </p>
            )}
            {help && !hasError && (
              <p id={helpId} className="text-xs text-muted-foreground mt-sp-4">
                {help}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("flex flex-col gap-sp-4", className)}>
        {/* Label row with hint */}
        {(label || hint) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={fieldId}
                className={cn(
                  "font-medium text-foreground",
                  labelSizeClasses[size]
                )}
              >
                {label}
                {required && <span className="text-error ml-1">*</span>}
              </label>
            )}
            {hint && (
              <span className={cn("text-muted-foreground", labelSizeClasses[size])}>
                {hint}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}

        {/* Input */}
        {enhancedChildren}

        {/* Error or Help message */}
        {hasError && errorMessage && (
          <p id={errorId} className="text-xs text-error">
            {errorMessage}
          </p>
        )}
        {help && !hasError && (
          <p id={helpId} className="text-xs text-muted-foreground">
            {help}
          </p>
        )}
      </div>
    );
  }
);
FormField.displayName = "FormField";

export { FormField };
