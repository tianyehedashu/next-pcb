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
    <nav className="w-40 flex flex-col items-center py-4 bg-gradient-to-b from-blue-50/80 via-white to-blue-100/60 rounded-xl shadow-sm select-none">
      {steps.map((label, idx) => (
        <React.Fragment key={label}>
          <button
            type="button"
            className="flex flex-col items-center group bg-transparent border-0 p-0 focus:outline-none transition-all"
            onClick={() => {
              if (sectionRefs && sectionRefs[idx]?.current) {
                sectionRefs[idx].current.scrollIntoView({ behavior: "smooth", block: "start" });
              }
              onTabChange && onTabChange(idx);
            }}
            aria-current={idx === activeSection ? "step" : undefined}
          >
            {idx === activeSection ? (
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center mb-2 mt-1 shadow-md" />
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center mb-2 mt-1" />
            )}
            <span
              className={`mb-2 text-xs truncate max-w-[120px] transition
                ${idx === activeSection
                  ? "text-blue-700 font-bold"
                  : "text-gray-400 group-hover:text-blue-500"}
              `}
            >
              {label}
            </span>
          </button>
          {idx < steps.length - 1 && (
            <div className="h-8 border-l border-dashed border-gray-300 mx-auto" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
} 