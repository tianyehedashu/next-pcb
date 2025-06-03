"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CheckCircle2, Mail, Clock, Phone } from "lucide-react";

export default function QuoteSuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="flex flex-col items-center">
          <CheckCircle2 className="text-green-500 mb-2" size={48} />
          <CardTitle className="text-2xl font-bold text-center">Quote Request Submitted Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
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