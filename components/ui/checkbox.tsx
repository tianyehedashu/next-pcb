import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

export const checkboxVariants = cva(
  "peer h-4 w-4 shrink-0 rounded border border-gray-300 bg-white ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {},
    defaultVariants: {},
  }
)

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(checkboxVariants(), className)}
        checked={checked}
        onChange={e => onCheckedChange?.(e.target.checked)}
        ref={ref}
        {...props}
      />
    )
  }
)

Checkbox.displayName = "Checkbox" 