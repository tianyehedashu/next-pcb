import { Metadata } from "next";
import QuoteForm from "./components/QuoteForm";
import PriceSummary from "./components/PriceSummary";
import { Card, CardContent } from "@/components/ui/card";
import {  Shield,   } from "lucide-react";

export const metadata: Metadata = {
  title: "PCB Quote Request - Get Instant Pricing | NextPCB",
  description: "Get instant PCB manufacturing quotes with our advanced calculator. Professional PCB fabrication services with competitive pricing and fast delivery.",
  keywords: ["PCB quote", "PCB manufacturing", "circuit board", "PCB fabrication", "electronics manufacturing"],
  openGraph: {
    title: "PCB Quote Request - Get Instant Pricing",
    description: "Professional PCB manufacturing services with instant quotes and competitive pricing.",
    type: "website",
  },
};

// 服务端组件 - 静态内容和 SEO
export default function Quote2Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 relative overflow-hidden">


      <div className="relative z-10">

        {/* 主要内容区域 */}
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12 items-start">
              {/* 表单区域 */}
              <div className="xl:col-span-2">
                <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 h-fit">
                  <CardContent className="p-0">
                    <QuoteForm />
                  </CardContent>
                </Card>
              </div>
              
              {/* 价格摘要区域 */}
              <div className="xl:col-span-1">
                <div className="sticky top-24 space-y-6">
                  <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 h-fit">
                    <CardContent className="p-0">
                      <PriceSummary />
                    </CardContent>
                  </Card>
                  
                  {/* 额外信息卡片 */}
                  <Card className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm border-blue-200/50 shadow-lg">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Quality Guarantee
                      </h3>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          100% electrical testing
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          IPC Class 2/3 standards
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          Free design review
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          24/7 engineering support
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
} 