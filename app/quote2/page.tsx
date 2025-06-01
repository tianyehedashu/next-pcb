import { Metadata } from "next";
import QuoteForm from "./components/QuoteForm";
import PriceSummary from "./components/PriceSummary";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12">
            {/* 表单区域 */}
            <div className="xl:col-span-2">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8">
                <QuoteForm />
              </div>
            </div>
            
            {/* 价格摘要区域 */}
            <div className="xl:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                  <PriceSummary />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 页脚信息 - 服务端渲染 */}
      <footer className="mt-12 pt-8 border-t border-gray-200">
        <div className="text-sm text-gray-500 space-y-2">
          <p>
            <strong>Need help?</strong> Contact our support team at{" "}
            <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
              support@example.com
            </a>
          </p>
          <p>
            All quotes are valid for 30 days. Final pricing may vary based on design complexity and requirements.
          </p>
        </div>
      </footer>
    </div>
  );
} 