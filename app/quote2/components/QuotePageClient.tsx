"use client";

import React from "react";
import QuoteForm from "./QuoteForm";
import PriceSummary from "./PriceSummary";
import { FormStepNavigation } from "./FormStepNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, BookOpen, ExternalLink, CheckCircle, ArrowRight } from "lucide-react";
import { fieldGroups } from "../schema/pcbFormilySchema";
import Link from "next/link";

interface QuotePageClientProps {
  editId?: string;
}

export function QuotePageClient({ editId }: QuotePageClientProps) {
  const [currentStep, setCurrentStep] = React.useState(0);

  // 滚动到指定步骤
  const scrollToStep = React.useCallback((stepIndex: number) => {
    const stepElement = document.getElementById(`form-step-${stepIndex}`);
    if (stepElement) {
      stepElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
      setCurrentStep(stepIndex);
    }
  }, []);

  // 监听滚动位置更新当前步骤
  React.useEffect(() => {
    const handleScroll = () => {
      const stepElements = fieldGroups.map((_, index) => 
        document.getElementById(`form-step-${index}`)
      ).filter(Boolean);

      const scrollPosition = window.scrollY + window.innerHeight / 3;

      for (let i = stepElements.length - 1; i >= 0; i--) {
        const element = stepElements[i];
        if (element && element.offsetTop <= scrollPosition) {
          setCurrentStep(i);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* 主要内容区域 */}
      <main className="pb-12">
        <div className="container mx-auto px-4 lg:px-6 xl:px-8">
          <div className="grid grid-cols-1 xl:grid-cols-6 gap-6 lg:gap-8">
            {/* 表单区域 - 相对定位容器 */}
            <div className="xl:col-span-4 space-y-8 relative lg:ml-4 xl:ml-2">
              {/* 侧边导航 - 固定在屏幕左侧 */}
              <div className="hidden lg:block fixed left-2 lg:left-3 xl:left-4 top-1/2 transform -translate-y-1/2 z-50">
                <FormStepNavigation currentStep={currentStep} onStepClick={scrollToStep} />
              </div>


              {/* 表单区域 */}
              <Card className="bg-white/70 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500 h-fit">
                <CardContent className="p-0">
                  <QuoteForm editId={editId} />
                </CardContent>
              </Card>
            </div>
            
            {/* 价格摘要区域 */}
            <div className="xl:col-span-2">
              <div className="sticky top-20 z-40 space-y-4">
                <Card className="bg-white/95 backdrop-blur-md border-white/20 shadow-xl hover:shadow-2xl transition-all duration-500">
                  <CardContent className="p-0">
                    <PriceSummary />
                  </CardContent>
                </Card>
                
                {/* 额外信息卡片 */}
                <Card className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-md border-blue-200/50 shadow-lg">
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
                
                {/* How to Order Guide */}
                <Card className="bg-gradient-to-br from-green-50/90 to-emerald-50/90 backdrop-blur-md border-green-200/50 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Register for Best Experience
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          1
                        </div>
                        <div>
                          <p className="font-medium text-green-900">Quick Registration</p>
                          <p className="text-green-700 text-xs">30-second signup for instant dashboard access</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          2
                        </div>
                        <div>
                          <p className="font-medium text-green-900">Instant Quote Display</p>
                          <p className="text-green-700 text-xs">See quotes directly in dashboard + email notification</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          3
                        </div>
                        <div>
                          <p className="font-medium text-green-900">One-Click Ordering</p>
                          <p className="text-green-700 text-xs">Saved addresses and preferences for fast checkout</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          4
                        </div>
                        <div>
                          <p className="font-medium text-green-900">Real-Time Tracking</p>
                          <p className="text-green-700 text-xs">Live order updates and production photos</p>
                        </div>
                      </div>
                    </div>
                    <Link 
                      href="/services#how-to-order" 
                      className="flex items-center justify-center gap-2 mt-4 p-2 bg-green-100/80 rounded-lg hover:bg-green-200/80 transition-colors group"
                    >
                      <span className="text-sm font-medium text-green-800">View Detailed Process</span>
                      <ArrowRight className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </CardContent>
                </Card>

                {/* Technical Resources */}
                <Card className="bg-gradient-to-br from-purple-50/90 to-pink-50/90 backdrop-blur-md border-purple-200/50 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Technical Resources
                    </h3>
                    <div className="space-y-3">
                      <Link 
                        href="/content/guides" 
                        className="flex items-center justify-between p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors group"
                      >
                        <span className="text-sm font-medium text-purple-800">PCB Design Guidelines</span>
                        <ExternalLink className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link 
                        href="/content/articles" 
                        className="flex items-center justify-between p-3 bg-white/60 rounded-lg hover:bg-white/80 transition-colors group"
                      >
                        <span className="text-sm font-medium text-purple-800">Manufacturing Tips</span>
                        <ExternalLink className="h-4 w-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link 
                        href="/content" 
                        className="flex items-center justify-center p-2 bg-purple-100/80 rounded-lg hover:bg-purple-200/80 transition-colors"
                      >
                        <span className="text-sm font-medium text-purple-800">Browse All Resources</span>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 