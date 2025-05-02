import * as React from "react";

export function Popover({ open, onOpenChange, children }: any) {
  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (child.type.displayName === "PopoverTrigger") {
          return React.cloneElement(child, {
            onClick: () => {
              if (!open) {
                onOpenChange && onOpenChange(true);
              }
            }
          });
        }
        if (child.type.displayName === "PopoverContent" && open) {
          return child;
        }
        return child;
      })}
    </div>
  );
}

export function PopoverTrigger({ asChild, children, ...props }: any) {
  return React.cloneElement(children, props);
}
PopoverTrigger.displayName = "PopoverTrigger";

export function PopoverContent({ className, children }: any) {
  return (
    <div className={`absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 shadow-md ${className || ""}`}>{children}</div>
  );
}
PopoverContent.displayName = "PopoverContent"; 