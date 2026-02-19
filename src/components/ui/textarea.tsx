import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  rows?: number;
  maxRows?: number;
  autoresize?: boolean;
  loading?: boolean;
  error?: boolean;
  static?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      rows = 3,
      maxRows,
      autoresize = false,
      loading,
      disabled,
      error,
      static: isStatic,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Combine forwarded ref with internal ref
    React.useImperativeHandle(ref, () => textareaRef.current!);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoresize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = "auto";

        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
        const newHeight = textarea.scrollHeight;
        const maxHeight = maxRows ? maxRows * lineHeight + 16 : Infinity; // +16 for padding

        textarea.style.height = `${Math.min(newHeight, maxHeight)}px`;
      }
      onChange?.(e);
    };

    // Initialize height on mount for autoresize
    React.useEffect(() => {
      if (autoresize && textareaRef.current) {
        const textarea = textareaRef.current;
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [autoresize]);

    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            "flex w-full px-2 py-1 rounded text-sm text-foreground transition-colors resize-none",
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
            loading && "pr-8",
            className
          )}
          ref={textareaRef}
          rows={autoresize ? 1 : rows}
          disabled={disabled || loading}
          onChange={handleInput}
          {...props}
        />

        {loading && (
          <div className="absolute right-2 top-3 text-muted-foreground pointer-events-none h-4 w-4">
            <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
