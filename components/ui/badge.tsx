import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "outline";
}

const variantClasses: Record<string, string> = {
  default: "bg-blue-600 text-white border-transparent",
  secondary: "bg-gray-100 text-gray-800 border-gray-200",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  outline: "bg-transparent text-gray-800 border-gray-300",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium transition-colors",
          variantClasses[variant] || variantClasses.default,
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge"; 