"use client";
import React, { Suspense } from "react";
import OrdersPageClient from "./OrdersPageClient";

// 加载状态组件
function OrdersPageLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage(): React.ReactElement {
  return (
    <Suspense fallback={<OrdersPageLoading />}>
      <OrdersPageClient />
    </Suspense>
  );
}