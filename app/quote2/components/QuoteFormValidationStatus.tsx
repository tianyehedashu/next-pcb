"use client";

import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface QuoteFormValidationStatusProps {
  validationState: 'idle' | 'validating' | 'valid' | 'invalid';
  submitError?: string | null;
}

export function QuoteFormValidationStatus({ validationState, submitError }: QuoteFormValidationStatusProps) {
  const getValidationIcon = () => {
    switch (validationState) {
      case 'validating':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'valid':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'invalid':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getValidationMessage = () => {
    switch (validationState) {
      case 'validating':
        return "Validating form data...";
      case 'valid':
        return "Form is ready to submit";
      case 'invalid':
        return submitError || "Please check form inputs";
      default:
        return "Fill out the form to get your PCB quote";
    }
  };

  const getValidationBadgeColor = () => {
    switch (validationState) {
      case 'validating':
        return "bg-blue-100 text-blue-700 border-blue-200";
      case 'valid':
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case 'invalid':
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 ${getValidationBadgeColor()} transition-all duration-200`}>
      {getValidationIcon()}
      <span className="font-medium">
        {getValidationMessage()}
      </span>
    </div>
  );
} 