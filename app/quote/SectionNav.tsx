import { Tabs, Tab } from "@/components/ui/tabs";
import { MapPin } from "lucide-react";
import React from "react";

export default function SectionNav({ sectionList, activeSection, onTabChange, sectionRefs }: any) {
  return (
    <div className="bg-white/80 shadow-md border border-blue-100 rounded-xl py-4 text-xs">
      <Tabs
        value={sectionList[activeSection].label}
        onValueChange={v => {
          const idx = sectionList.findIndex((sec: any) => sec.label === v);
          if (idx !== -1) sectionRefs[idx].current?.scrollIntoView({ behavior: "smooth", block: "start" });
          if (onTabChange) onTabChange(idx);
        }}
        orientation="vertical"
      >
        <Tab tabValue="Basic Information" icon={<MapPin size={18} />}>Basic Information</Tab>
        <Tab tabValue="Process Information">Process Information</Tab>
        <Tab tabValue="Service Information">Service Information</Tab>
      </Tabs>
    </div>
  );
} 