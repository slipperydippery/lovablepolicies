import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";


import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

const modalVariants = cva(
  "fixed z-50 bg-background shadow-lg duration-200",
  {
    variants: {
      fullscreen: {
        true: "inset-0 rounded-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        false: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border border-grey-300 max-h-[85vh] w-full transition-opacity data-[state=open]:opacity-100 data-[state=closed]:opacity-0",
      },
    },
    defaultVariants: {
      fullscreen: false,
    },
  }
);

const sizeVariants = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export interface ModalProps extends VariantProps<typeof modalVariants> {
  /** Whether the modal is open */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Default open state for uncontrolled usage */
  defaultOpen?: boolean;
  /** Modal title displayed in header */
  title?: string;
  /** Modal description displayed below title */
  description?: string;
  /** Icon element to display before title */
  icon?: React.ReactNode;
  /** Size of the modal */
  size?: keyof typeof sizeVariants;
  /** Whether to show the close button */
  close?: boolean | ButtonProps;
  /** Whether the modal has an overlay */
  overlay?: boolean;
  /** Whether the modal can be dismissed by clicking outside or pressing escape */
  dismissible?: boolean;
  /** The trigger element */
  children?: React.ReactNode;
  /** Content to render in the modal (replaces header/body/footer slots) */
  content?: React.ReactNode;
  /** Header content (overrides title/description/icon) */
  header?: React.ReactNode;
  /** Body content */
  body?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
}

const Modal = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ModalProps
>(
  (
    {
      open,
      onOpenChange,
      defaultOpen,
      title,
      description,
      icon,
      size = "md",
      fullscreen = false,
      close = true,
      overlay = true,
      dismissible = true,
      children,
      content,
      header,
      body,
      footer,
    },
    ref
  ) => {
    const handleOpenChange = (newOpen: boolean) => {
      if (!newOpen && !dismissible) {
        return;
      }
      onOpenChange?.(newOpen);
    };

    const closeButtonProps: ButtonProps =
      typeof close === "object"
        ? close
        : { variant: "ghost" as const, square: true as const };

    const showHeader = header || title || description || icon;
    const showCloseButton = close !== false && !content;

    return (
      <DialogPrimitive.Root
        open={open}
        onOpenChange={handleOpenChange}
        defaultOpen={defaultOpen}
      >
        <DialogPrimitive.Trigger asChild>{children}</DialogPrimitive.Trigger>
        <DialogPrimitive.Portal>
          {overlay && (
            <DialogPrimitive.Overlay
              className={cn(
                "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
                "data-[state=open]:animate-in data-[state=closed]:animate-out",
                "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
              )}
            />
          )}
          <DialogPrimitive.Content
            ref={ref}
            onPointerDownOutside={(e) => {
              if (!dismissible) {
                e.preventDefault();
              }
            }}
            onEscapeKeyDown={(e) => {
              if (!dismissible) {
                e.preventDefault();
              }
            }}
            className={cn(
              modalVariants({ fullscreen }),
              !fullscreen && sizeVariants[size]
            )}
          >
            {content ? (
              content
            ) : (
              <>
                {/* Header */}
                {showHeader && (
                  <div className="flex items-start justify-between gap-sp-16 px-sp-24 py-5 bg-grey-50 rounded-t border-b border-grey-300">
                    <div className="flex items-center gap-sp-16 flex-1 min-w-0">
                      {icon && (
                        <div className="flex-shrink-0 text-primary">{icon}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        {header || (
                          <>
                            {title && (
                              <DialogPrimitive.Title className="text-2xl font-semibold text-foreground">
                                {title}
                              </DialogPrimitive.Title>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {showCloseButton && (
                      <DialogPrimitive.Close asChild>
                        <Button {...closeButtonProps}>
                          <i className="fa-solid fa-xmark" aria-hidden="true" />
                        </Button>
                      </DialogPrimitive.Close>
                    )}
                  </div>
                )}

                {/* Body */}
                {body && <div className="px-sp-24 py-sp-24">{body}</div>}

                {/* Footer */}
                {footer && (
                  <div className="flex items-center justify-end gap-sp-16 px-sp-24 py-sp-16 bg-grey-50 rounded-b border-t border-grey-300">
                    {footer}
                  </div>
                )}
              </>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }
);
Modal.displayName = "Modal";

// Export sub-components for advanced usage
const ModalClose = DialogPrimitive.Close;
ModalClose.displayName = "ModalClose";

export { Modal, ModalClose };
