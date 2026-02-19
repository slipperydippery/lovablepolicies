import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

const CardButton = React.forwardRef<HTMLButtonElement, CardButtonProps>(
  ({ className, label, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          "w-full rounded p-sp-16 bg-grey-200 hover:bg-grey-300 transition-colors",
          "inline-flex items-center justify-center gap-sp-8",
          "text-sm font-semibold leading-[22px] text-grey-900",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          "disabled:pointer-events-none disabled:opacity-[0.32]",
          "dark:bg-grey-700 dark:hover:bg-grey-600 dark:text-grey-100",
          className
        )}
        {...props}
      >
        <i className="fa-solid fa-plus text-base leading-5 w-5 text-center" aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  }
);
CardButton.displayName = "CardButton";

export { CardButton };
