"use client";
import React, { Suspense } from "react";
import OrdersPageContainer from "./components/OrdersPageContainer";

// 加载状态组件 - 响应式设计
function OrdersPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* 标题加载 */}
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-32 sm:w-40 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-24 sm:w-32"></div>
          </div>
          
          {/* 搜索栏加载 */}
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <div className="animate-pulse space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="h-10 bg-gray-200 rounded w-full sm:w-32"></div>
                <div className="h-10 bg-gray-200 rounded flex-1"></div>
                <div className="h-10 bg-gray-200 rounded w-full sm:w-20"></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="h-8 bg-gray-200 rounded w-full sm:w-40"></div>
                <div className="h-8 bg-gray-200 rounded w-full sm:w-32"></div>
              </div>
            </div>
          </div>
          
          {/* 表格/卡片加载 */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="animate-pulse">
              {/* 桌面端表格加载 */}
              <div className="hidden lg:block">
                <div className="p-4 border-b bg-gray-50">
                  <div className="grid grid-cols-7 gap-4">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
                <div className="divide-y">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-4">
                      <div className="grid grid-cols-7 gap-4">
                        {[...Array(7)].map((_, j) => (
                          <div key={j} className="h-4 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 移动端卡片加载 */}
              <div className="lg:hidden p-4 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                      <div className="grid grid-cols-2 gap-2">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="h-3 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage(): React.ReactElement {
  return (
    <Suspense fallback={<OrdersPageLoading />}>
      <OrdersPageContainer />
    </Suspense>
  );
}