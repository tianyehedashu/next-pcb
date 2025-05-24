import { cn } from "@/lib/utils";
import { CheckCircle, Circle } from "lucide-react";
import React from "react";

// 英文步骤列表
const steps = [
  "Basic Information",
  "Process Information",
  "Service Information",
  "Shipping Information"
];

export default function SectionNav({ activeSection, onTabChange, sectionRefs }: { activeSection: number, onTabChange?: (idx: number) => void, sectionRefs: React.RefObject<HTMLDivElement | null>[] }) {
  return (
    <nav className="w-12 flex flex-col items-center py-6 bg-white rounded-2xl shadow-md">
      {steps.map((label, idx) => (
        <div key={label} className="flex flex-col items-center relative min-h-[44px]">
          {/* 竖线 */}
          {idx < steps.length - 1 && (
            <span className="absolute left-1/2 top-6 -translate-x-1/2 w-px h-[32px] bg-gray-200 z-0" />
          )}
          {/* 步骤圆点，带 Tooltip */}
          <button
            type="button"
            className={cn(
              "relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all focus:outline-none group",
              idx === activeSection
                ? "border-blue-600 bg-blue-600"
                : "border-gray-300 bg-white"
            )}
            onClick={() => {
              if (sectionRefs && sectionRefs[idx]?.current) {
                sectionRefs[idx].current.scrollIntoView({ behavior: "smooth", block: "start" });
              }
              onTabChange && onTabChange(idx);
            }}
            aria-current={idx === activeSection ? "step" : undefined}
          >
            {idx < activeSection ? (
              <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Circle className={cn("w-3.5 h-3.5", idx === activeSection ? "text-white" : "text-gray-300")} />
            )}
            {/* Tooltip */}
            <span className="absolute left-8 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition">
              {label}
            </span>
          </button>
        </div>
      ))}
    </nav>
  );
} 