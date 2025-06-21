import React from "react";
import ProfileSidebar from "@/app/components/custom-ui/profile-sidebar";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* 顶部装饰条 */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-[calc(100vh-12rem)] md:min-h-[calc(100vh-14rem)]">
          {/* 侧边栏 - 添加粘性定位和现代设计 */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProfileSidebar />
          </div>
          
          {/* 主内容区域 */}
          <main className="flex-1 min-w-0">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 lg:p-8 transition-all duration-300 hover:shadow-2xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
