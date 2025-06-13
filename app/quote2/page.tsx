import { Metadata } from "next";
import { QuotePageClient } from "./components/QuotePageClient";

export const metadata: Metadata = {
  title: "PCB Quote Request - Get Instant Pricing | SpeedXPCB",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 relative">
      <div className="relative z-10">
        <QuotePageClient />
      </div>
    </div>
  );
} 