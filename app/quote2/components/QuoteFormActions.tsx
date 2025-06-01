"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Zap } from "lucide-react";

interface QuoteFormActionsProps {
  isSubmitting: boolean;
  validationState: 'idle' | 'validating' | 'valid' | 'invalid';
  onReset: () => void;
}

export function QuoteFormActions({ isSubmitting, validationState, onReset }: QuoteFormActionsProps) {
  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-white">
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Button 
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={isSubmitting}
            className="px-8 py-3 text-base font-medium border-2 hover:bg-gray-50 transition-all duration-200"
          >
            Reset Form
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting || validationState === 'invalid'}
            className="px-12 py-3 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Getting Quote...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Get Instant Quote
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 