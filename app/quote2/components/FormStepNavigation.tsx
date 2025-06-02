"use client";

import React from "react";
import { fieldGroups } from "../schema/pcbFormilySchema";

interface FormStepNavigationProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function FormStepNavigation({ currentStep, onStepClick }: FormStepNavigationProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-2">
      <div className="flex flex-col gap-2">
        {fieldGroups.map((group, index) => (
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
            {index < fieldGroups.length - 1 && (
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