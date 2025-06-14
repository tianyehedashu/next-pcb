"use client";

import React from "react";
import QuoteForm from "./QuoteForm";
import PriceSummary from "./PriceSummary";
import { FormStepNavigation } from "./FormStepNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { fieldGroups } from "../schema/pcbFormilySchema";

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
      <main className="pt-20 pb-12">
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
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 