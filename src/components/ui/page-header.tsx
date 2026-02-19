import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const pageHeaderVariants = cva(
  "flex items-start gap-sp-16",
  {
    variants: {
      size: {
        sm: "" as const,
        md: "" as const,
        lg: "" as const,
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const titleSizeMap = {
  sm: "text-lg font-semibold",
  md: "text-xl font-semibold",
  lg: "text-2xl font-semibold",
};

const subtitleSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

const iconSizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const avatarSizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const backButtonSizeMap = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export interface PageHeaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageHeaderVariants> {
  /** The page title */
  title: string;
  /** Subtitle or description text */
  subtitle?: string;
  /** Font Awesome icon class for the title (e.g., "fa-solid fa-user") */
  icon?: string;
  /** Avatar image URL (takes precedence over icon) */
  avatar?: string;
  /** Background color class for the avatar/icon container */
  avatarBg?: string;
  /** Icon class for the subtitle */
  subtitleIcon?: string;
  /** Show back button */
  showBack?: boolean;
  /** Callback when back button is clicked */
  onBack?: () => void;
  /** Href for back button (if using as link) */
  backHref?: string;
  /** Custom slot for right side actions */
  actions?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      className,
      title,
      subtitle,
      icon,
      avatar,
      avatarBg = "bg-orange-100",
      subtitleIcon,
      showBack = false,
      onBack,
      backHref,
      actions,
      size = "md",
      ...props
    },
    ref
  ) => {
    const sizeKey = size as "sm" | "md" | "lg";

    const handleBackClick = () => {
      if (onBack) {
        onBack();
      } else if (backHref) {
        window.location.href = backHref;
      }
    };

    const renderLeading = () => {
      if (showBack) {
        return (
          <button
            type="button"
            onClick={handleBackClick}
            className="flex items-center justify-center text-primary hover:text-primary/80 transition-colors"
            aria-label="Go back"
          >
            <i className={cn("fa-solid fa-chevron-left", backButtonSizeMap[sizeKey])} aria-hidden="true" />
          </button>
        );
      }

      if (avatar) {
        return (
          <div
            className={cn(
              "rounded-full flex items-center justify-center overflow-hidden shrink-0",
              avatarSizeMap[sizeKey],
              avatarBg
            )}
          >
            <img
              src={avatar}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        );
      }

      if (icon) {
        return (
          <div
            className={cn(
              "rounded-full flex items-center justify-center shrink-0",
              avatarSizeMap[sizeKey],
              avatarBg
            )}
          >
            <i className={cn(icon, iconSizeMap[sizeKey], "text-orange-600")} />
          </div>
        );
      }

      return null;
    };

    return (
      <div
        ref={ref}
        className={cn(pageHeaderVariants({ size }), className)}
        {...props}
      >
        {!showBack && renderLeading()}

        <div className="flex flex-col gap-sp-4 min-w-0 flex-1">
          <div className="flex items-center gap-sp-16">
            {showBack && renderLeading()}
            <h1 className={cn(titleSizeMap[sizeKey], "text-text-primary truncate")}>
              {title}
            </h1>
          </div>
          {subtitle && (
            <div className={cn("flex items-center gap-sp-8 text-text-secondary", subtitleSizeMap[sizeKey])}>
              {subtitleIcon && (
                <i className={cn(subtitleIcon, iconSizeMap[sizeKey])} />
              )}
              <span>{subtitle}</span>
            </div>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-sp-8 shrink-0">
            {actions}
          </div>
        )}
      </div>
    );
  }
);
PageHeader.displayName = "PageHeader";

export { PageHeader, pageHeaderVariants };
