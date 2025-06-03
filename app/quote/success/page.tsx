"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle2, Mail, Clock, Phone, Copy, FileText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function QuoteSuccess() {
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('id');

  const copyQuoteId = () => {
    if (quoteId) {
      navigator.clipboard.writeText(quoteId);
      toast.success('Quote ID copied to clipboard');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="flex flex-col items-center">
          <CheckCircle2 className="text-green-500 mb-2" size={48} />
          <CardTitle className="text-2xl font-bold text-center">Quote Request Submitted Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {/* 报价ID显示 */}
          {quoteId && (
            <div className="w-full bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-green-900">Your Quote ID</h3>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                  {quoteId}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyQuoteId}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-green-700 mt-2">
                Please save this ID for future reference. You can use it to inquire about your quote status.
              </p>
            </div>
          )}

          <div className="text-center space-y-3">
            <p className="text-gray-700">
              Thank you for your PCB quote request!
            </p>
            <p className="text-sm text-gray-600">
              Our engineering team will review your specifications and contact you within <strong>24 hours</strong> with a detailed quote.
            </p>
          </div>

          {/* 下一步说明 */}
          <div className="w-full bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              What happens next?
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                <span>Our team reviews your PCB specifications</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                <span>We prepare a detailed quote with pricing and lead time</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                <span>You receive the quote via email within 24 hours</span>
              </div>
            </div>
          </div>

          {/* 联系信息 */}
          <div className="w-full bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Need immediate assistance?</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>Email: support@nextpcb.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>Phone: +1 (555) 123-4567</span>
              </div>
              {quoteId && (
                <p className="text-xs text-gray-600 mt-2 bg-gray-100 p-2 rounded">
                  <strong>Tip:</strong> When contacting us, please provide your Quote ID ({quoteId}) for faster assistance.
                </p>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">Back to Home</Button>
            </Link>
            <Link href="/quote2" className="flex-1">
              <Button variant="default" className="w-full">Submit Another Quote</Button>
            </Link>
          </div>

          {/* 注册提示 */}
          <div className="text-center text-xs text-gray-500 border-t pt-4 w-full">
            <p>Want to track your quotes and orders? <Link href="/auth" className="text-blue-600 hover:underline">Create an account</Link> for a better experience.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 