import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-sp-8 whitespace-nowrap rounded-md font-semibold transition-colors disabled:pointer-events-none disabled:opacity-[0.32] [&_svg]:pointer-events-none [&_svg]:shrink-0 h-9 px-sp-16 text-sm [&_svg]:size-4 [&_i]:text-base [&_i]:leading-5 [&_i]:w-5 [&_i]:text-center",
  {
    variants: {
      variant: {
        solid: "",
        outline: "ring-1 ring-inset bg-transparent",
        ghost: "bg-transparent",
        link: "underline-offset-4 hover:underline",
      },
      colorScheme: {
        primary: "",
        error: "",
        success: "",
      },
      square: {
        true: "!px-sp-8 w-9",
        false: "",
      },
    },
    compoundVariants: [
      // Primary color variants
      {
        colorScheme: "primary",
        variant: "solid",
        class:
          "bg-btn-primary text-btn-primary-foreground shadow-btn-inset hover:bg-btn-primary-hover active:bg-btn-primary-active focus-visible:shadow-btn-focus",
      },
      {
        colorScheme: "primary",
        variant: "outline",
        class:
          "bg-btn-secondary-bg ring-btn-secondary-border text-btn-secondary-foreground hover:ring-btn-secondary-border-hover active:ring-btn-secondary-border-active active:bg-btn-secondary-bg-active focus-visible:shadow-btn-focus",
      },
      {
        colorScheme: "primary",
        variant: "ghost",
        class:
          "text-btn-flat-color hover:text-btn-flat-color-hover active:text-btn-flat-color-active focus-visible:shadow-btn-focus",
      },
      {
        colorScheme: "primary",
        variant: "link",
        class: "text-btn-flat-color hover:text-btn-flat-color-hover p-0 h-auto",
      },

      // Error color variants (solid only)
      {
        colorScheme: "error",
        variant: "solid",
        class:
          "bg-error text-error-foreground shadow-btn-inset hover:bg-error-hover active:bg-error-active focus-visible:shadow-btn-focus",
      },

      // Success color variants (solid only)
      {
        colorScheme: "success",
        variant: "solid",
        class:
          "bg-success text-success-foreground shadow-btn-inset hover:bg-success-hover active:bg-success-active focus-visible:shadow-btn-focus",
      },
    ],
    defaultVariants: {
      variant: "solid",
      colorScheme: "primary",
      square: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      colorScheme,
      square,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, colorScheme, square, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <i className="fa-solid fa-spinner fa-spin" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
