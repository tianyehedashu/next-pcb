"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function TestEditPage() {
  const router = useRouter();

  const testQuoteId = "aba642d6-1a20-4ac5-a466-4fbc8fdf5fa0"; // 示例ID

  const handleTestEdit = () => {
    router.push(`/quote2?edit=${testQuoteId}`);
  };

  const handleNewQuote = () => {
    router.push('/quote2');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Quote Edit Functionality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Test the quote editing functionality with different scenarios:
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleTestEdit}
                className="w-full"
                variant="default"
              >
                Test Edit Quote (ID: {testQuoteId})
              </Button>
              
              <Button 
                onClick={handleNewQuote}
                className="w-full"
                variant="outline"
              >
                Create New Quote
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Test Scenarios:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Admin users can edit all quotes</li>
                <li>• Users can edit their own quotes in pending/draft status</li>
                <li>• Users cannot edit quotes in quoted/paid status</li>
                <li>• Guest users can edit their quotes via email verification</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 