import { Tabs, TabsList, Tab } from "@/components/ui/tabs";
import { Layers, Settings, UserCheck } from "lucide-react";
import React from "react";

export default function SectionNav({ sectionList, activeSection, onTabChange, sectionRefs }: any) {
  return (
    <div className="bg-white/80 shadow-md border border-blue-100 rounded-xl py-2 text-xs">
      <Tabs
        value={sectionList[activeSection].label}
        onValueChange={v => {
          const idx = sectionList.findIndex((sec: any) => sec.label === v);
          if (idx !== -1) sectionRefs[idx].current?.scrollIntoView({ behavior: "smooth", block: "start" });
          if (onTabChange) onTabChange(idx);
        }}
        orientation="vertical"
      >
        <TabsList className="flex flex-col w-full gap-1 bg-transparent p-2">
          <Tab tabValue="Basic Information" icon={<Layers size={15} />}>Basic Information</Tab>
          <Tab tabValue="Process Information" icon={<Settings size={15} />}>Process Information</Tab>
          <Tab tabValue="Service Information" icon={<UserCheck size={15} />}>Service Information</Tab>
        </TabsList>
      </Tabs>
    </div>
  );
} 