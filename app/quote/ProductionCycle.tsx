import { Card, CardHeader, CardContent } from "@/components/ui/card";
import React, { useEffect, useRef, useState } from "react";

export interface ProductionCycleProps {
  form: any;
  className?: string;
  calcProductionCycle: (form: any, orderTime?: Date) => { cycleDays: number, reason: string[] };
  getRealDeliveryDate: (start: Date, days: number) => Date;
}

export default function ProductionCycle({ form, className = "", calcProductionCycle, getRealDeliveryDate }: ProductionCycleProps) {
  const compareOptions = [
    { label: "Standard", delivery: "standard" },
    { label: "Urgent", delivery: "urgent" }
  ];
  const now = new Date();
  // 动画状态
  const [cycleDaysArr, setCycleDaysArr] = useState([0, 0]);
  const [animateArr, setAnimateArr] = useState([false, false]);
  const prevDays = useRef([0, 0]);

  useEffect(() => {
    const newArr = compareOptions.map(opt => {
      const testForm = { ...form, delivery: opt.delivery };
      return calcProductionCycle(testForm, now).cycleDays;
    });
    // 检查天数是否变化
    newArr.forEach((days, idx) => {
      if (days !== prevDays.current[idx]) {
        setAnimateArr(arr => arr.map((a, i) => (i === idx ? true : a)));
        setTimeout(() => {
          setAnimateArr(arr => arr.map((a, i) => (i === idx ? false : a)));
        }, 500);
      }
    });
    prevDays.current = newArr;
    setCycleDaysArr(newArr);
  }, [form]);

  return (
    <Card className={`${className} rounded-2xl shadow-lg border-blue-100`}>
      <CardHeader className="pb-1 flex flex-row items-center gap-2 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
        <div className="flex justify-between items-center w-full">
          <span className="text-base font-bold tracking-wide">Production Cycle</span>
          <a href="#" className="text-blue-600 text-xs underline">Shipping Standard</a>
        </div>
      </CardHeader>
      <CardContent className="pt-3 pb-4 px-4">
        <div className="border rounded-md bg-slate-50 mb-2 overflow-x-auto">
          <table className="w-full text-xs text-center">
            <thead>
              <tr className="border-b">
                <th className="py-2 font-medium">Cycle</th>
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium">Est. Finish</th>
              </tr>
            </thead>
            <tbody>
              {compareOptions.map((opt, idx) => {
                const testForm = { ...form, delivery: opt.delivery };
                const info = calcProductionCycle(testForm, now);
                const finishDate = getRealDeliveryDate(now, info.cycleDays);
                const isUrgent = opt.delivery === "urgent";
                return (
                  <tr
                    key={opt.label}
                    className={isUrgent ? "bg-red-50 text-red-600 font-semibold" : ""}
                  >
                    <td className="py-2">
                      <span
                        className={`inline-block transition-all duration-300 font-bold text-xs ${animateArr[idx] ? (isUrgent ? "scale-125 bg-red-100" : "scale-125 bg-blue-50") : ""}`}
                      >
                        {info.cycleDays} day(s)
                      </span>
                    </td>
                    <td className="py-2 flex items-center justify-center gap-1">
                      {isUrgent && <span className="text-base">⚡</span>}
                      {opt.label}
                    </td>
                    <td className="py-2">{finishDate.toISOString().slice(0, 10)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
} 