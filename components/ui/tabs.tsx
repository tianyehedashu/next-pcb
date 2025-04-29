import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, orientation = "horizontal", className, children }: TabsProps) {
  return (
    <div
      className={cn(
        "flex",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className
      )}
      role="tablist"
    >
      {React.Children.map(children, child => {
        if (!React.isValidElement(child)) return child;
        const tabValue = (child as React.ReactElement<any>).props.tabValue;
        const active = value === tabValue;
        return React.cloneElement(child as React.ReactElement<any>, { active, onValueChange });
      })}
    </div>
  );
}

interface TabProps {
  tabValue: string;
  active?: boolean;
  onValueChange?: (value: string) => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Tab({ tabValue, active, onValueChange, icon, children }: TabProps) {
  return (
    <button
      role="tab"
      aria-selected={active}
      className={cn(
        "flex items-center gap-2 px-6 py-3 text-left transition-all relative",
        active ? "font-bold text-green-600 bg-green-50 border-l-2 border-green-500" : "text-black font-normal border-l-2 border-transparent hover:bg-slate-100"
      )}
      onClick={() => onValueChange && onValueChange(tabValue)}
    >
      {active && icon && <span className="text-green-600">{icon}</span>}
      <span>{children}</span>
    </button>
  );
} 