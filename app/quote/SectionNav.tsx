import { Layers, Settings, UserCheck } from "lucide-react";
import React from "react";

const steps = [
  { label: "Basic Information", icon: <Layers size={16} /> },
  { label: "Process Information", icon: <Settings size={16} /> },
  { label: "Service Information", icon: <UserCheck size={16} /> },
];

export default function SectionNav({ sectionList, activeSection, onTabChange, sectionRefs }: any) {
  return (
    <nav className="bg-white/90 shadow-md border border-blue-100 rounded-2xl py-4 px-2 flex flex-col gap-2 w-full">
      {sectionList.map((sec: any, idx: number) => {
        const isActive = idx === activeSection;
        return (
          <button
            key={sec.label}
            type="button"
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-semibold text-sm text-left
              ${isActive
                ? "bg-blue-50 text-blue-700 shadow border border-blue-500"
                : "bg-white text-gray-500 border border-transparent hover:bg-blue-50 hover:text-blue-600"}
            `}
            onClick={() => {
              sectionRefs[idx]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              if (onTabChange) onTabChange(idx);
            }}
            aria-current={isActive ? "step" : undefined}
          >
            <span className={`flex items-center justify-center w-7 h-7 rounded-full border-2 mr-2 transition-all
              ${isActive ? "bg-blue-600 border-blue-600 text-white" : "bg-gray-100 border-gray-300 text-gray-400"}
            `}>
              {steps[idx]?.icon}
            </span>
            <span className="truncate">{sec.label}</span>
          </button>
        );
      })}
    </nav>
  );
} 