import * as React from "react";
import { cn } from "@/lib/utils";

export function Command({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 p-2", className)} {...props} />;
}

export function CommandInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn("w-full px-2 py-1 border rounded text-sm", className)} {...props} />;
}

export function CommandGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function CommandItem({ className, children, value, onSelect, ...props }: any) {
  return (
    <div
      className={cn("flex items-center px-2 py-1 cursor-pointer hover:bg-accent rounded", className)}
      onClick={() => onSelect && onSelect(value)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CommandEmpty({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-2 py-1 text-muted-foreground text-xs", className)} {...props} />;
} 