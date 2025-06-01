"use client";

import { FileText } from "lucide-react";

export function QuoteFormHeader() {
  return (
    <div className="text-center space-y-4 mb-8">
      <div className="flex items-center justify-center gap-3">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          PCB Quote Configuration
        </h2>
      </div>
      <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
        Configure your PCB specifications below to get an instant, accurate quote. 
        Our advanced calculator considers all manufacturing factors for precise pricing.
      </p>
    </div>
  );
} 