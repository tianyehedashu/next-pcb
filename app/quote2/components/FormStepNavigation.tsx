"use client";

import React from "react";
import { fieldGroups } from "../schema/pcbFormilySchema";
import { useUserStore } from "@/lib/userStore";

interface FormStepNavigationProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function FormStepNavigation({ currentStep, onStepClick }: FormStepNavigationProps) {
  const user = useUserStore((state) => state.user);

  // 根据用户登录状态过滤字段分组，与 QuoteForm.tsx 中的逻辑保持一致
  const getVisibleFieldGroups = React.useMemo(() => {
    if (user) {
      // 登录用户：显示前3个分组 + Shipping Information（跳过 Shipping Cost Estimation）
      return fieldGroups.filter((group, index) => index < 3 || index === 4);
    } else {
      // 游客用户：显示前3个分组 + Shipping Cost Estimation（跳过 Shipping Information）
      return fieldGroups.filter((group, index) => index < 4);
    }
  }, [user]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-2">
      <div className="flex flex-col gap-2">
        {getVisibleFieldGroups.map((group, index) => (
          <button
            key={index}
            onClick={() => onStepClick(index)}
            className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              index === currentStep
                ? 'bg-blue-500 text-white shadow-md scale-110'
                : index < currentStep
                ? 'bg-green-400 text-white shadow-sm'
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
            title={group.title}
          >
            {index + 1}
            {/* 连接线 */}
            {index < getVisibleFieldGroups.length - 1 && (
              <div 
                className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-2 ${
                  index < currentStep ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
} 