import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressVariants = cva(
  "relative overflow-hidden rounded-full h-2"
);

const indicatorVariants = cva(
  "h-full rounded-full transition-all duration-300 ease-out",
  {
    variants: {
      animation: {
        none: "",
        carousel: "[animation:progress-carousel_1.5s_ease-in-out_infinite]",
        swing: "[animation:progress-swing_1.5s_ease-in-out_infinite]",
        elastic: "[animation:progress-elastic_1.5s_ease-in-out_infinite]",
      },
    },
    defaultVariants: {
      animation: "none",
    },
  }
);

const trackColorSchemeMap = {
  primary: "bg-blue-100",
  neutral: "bg-grey-200",
  success: "bg-green-100",
  warning: "bg-orange-100",
  error: "bg-red-100",
  info: "bg-blue-100",
};

const colorSchemeMap = {
  primary: "bg-primary",
  neutral: "bg-grey-500",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-info",
};

const textColorSchemeMap = {
  primary: "text-primary",
  neutral: "text-grey-500",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
  info: "text-info",
};

export interface ProgressSegment {
  value: number;
  colorScheme?: keyof typeof colorSchemeMap;
  label?: string;
  description?: string;
}

export interface ProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children">,
    VariantProps<typeof indicatorVariants> {
  /** Single value (0-100) or array of segments */
  value?: number | ProgressSegment[];
  /** Maximum value for percentage calculation */
  max?: number;
  /** Color scheme for single-value progress */
  colorScheme?: keyof typeof colorSchemeMap;
  /** Show percentage label */
  showLabel?: boolean;
  /** Indeterminate state (loading) */
  indeterminate?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      colorScheme = "primary",
      animation,
      showLabel = false,
      indeterminate = false,
      ...props
    },
    ref
  ) => {
    // Normalize segments
    const segments: ProgressSegment[] = Array.isArray(value)
      ? value
      : [{ value: value as number, colorScheme }];

    // Calculate total for label
    const total = segments.reduce((sum, seg) => sum + seg.value, 0);
    const percentage = Math.min(Math.round((total / max) * 100), 100);

    // For indeterminate, use animation
    const effectiveAnimation = indeterminate ? "carousel" : animation;

    const hasLegends = Array.isArray(value) && segments.some((s) => s.label);

    // No track background for multi-segment, matched light color for single
    const trackColor = Array.isArray(value) && value.length > 1
      ? ""
      : trackColorSchemeMap[Array.isArray(value) ? (value[0]?.colorScheme || colorScheme) : colorScheme];

    return (
      <div className="w-full">
        {showLabel && !indeterminate && (
          <div className="flex justify-end mb-1">
            <span className="text-sm text-muted-foreground">{percentage}%</span>
          </div>
        )}
        <div
          ref={ref}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : total}
          aria-valuemin={0}
          aria-valuemax={max}
          className={cn(progressVariants(), trackColor, className)}
          {...props}
        >
          {indeterminate ? (
            <div
              className={cn(
                indicatorVariants({ animation: effectiveAnimation }),
                colorSchemeMap[colorScheme],
                "w-1/3"
              )}
            />
          ) : (
            <div className="flex h-full">
              {segments.map((segment, index) => {
                const segmentWidth = (segment.value / max) * 100;
                return (
                  <div
                    key={index}
                    className={cn(
                      indicatorVariants({ animation: effectiveAnimation }),
                      colorSchemeMap[segment.colorScheme || colorScheme],
                      index > 0 && "ml-0.5"
                    )}
                    style={{ width: `${segmentWidth}%` }}
                  />
                );
              })}
            </div>
          )}
        </div>
        {hasLegends && (
          <div className="flex justify-between items-start mt-sp-16">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-baseline gap-sp-4">
                {segment.label && (
                  <span
                    className={cn(
                      "text-base font-semibold",
                      textColorSchemeMap[segment.colorScheme || colorScheme]
                    )}
                  >
                    {segment.label}
                  </span>
                )}
                {segment.description && (
                  <span className="text-sm text-foreground">
                    {segment.description}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress, progressVariants };