import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  /** The text content of the tooltip */
  text: string;
  /** The trigger element */
  children: React.ReactNode;
  /** The preferred side of the trigger to render against */
  side?: "top" | "right" | "bottom" | "left";
  /** The preferred alignment against the trigger */
  align?: "start" | "center" | "end";
  /** The distance in pixels from the trigger */
  sideOffset?: number;
  /** The delay before the tooltip appears (in ms) */
  delayDuration?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

const TooltipProvider = TooltipPrimitive.Provider;

const TooltipRoot = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-w-xs rounded-lg bg-tooltip px-sp-16 py-sp-8 text-xs text-primary-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2",
        "data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2",
        "data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const TooltipArrow = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Arrow>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Arrow>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Arrow
    ref={ref}
    className={cn("fill-tooltip", className)}
    width={12}
    height={6}
    {...props}
  />
));
TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName;

/**
 * Tooltip component following Nuxt UI patterns
 */
const Tooltip = React.forwardRef<HTMLButtonElement, TooltipProps>(
  (
    {
      text,
      children,
      side = "top",
      align = "center",
      sideOffset = 8,
      delayDuration = 0,
      disabled = false,
      open,
      onOpenChange,
    },
    ref
  ) => {
    if (disabled) {
      return <>{children}</>;
    }

    return (
      <TooltipProvider delayDuration={delayDuration}>
        <TooltipRoot open={open} onOpenChange={onOpenChange}>
          <TooltipTrigger ref={ref} asChild>
            {children}
          </TooltipTrigger>
          <TooltipContent side={side} align={align} sideOffset={sideOffset}>
            {text}
            <TooltipArrow />
          </TooltipContent>
        </TooltipRoot>
      </TooltipProvider>
    );
  }
);
Tooltip.displayName = "Tooltip";

export {
  Tooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipArrow,
};
