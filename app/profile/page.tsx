"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ProfileForm } from "./profile-form"
import { Sidebar } from "../components/custom-ui/Sidebar"
import { useUserStore } from "@/lib/userStore"
import { Button } from "@/components/ui/button"

type User = {
  username?: string;
  email?: string;
  // ...其他字段
};

export default function ProfilePage() {
  const user = useUserStore((state) => state.user as User)

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <span className="text-primary/60 text-lg">Loading...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-8 px-2">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 md:gap-12">
        {/* Sidebar */}
        <Sidebar />
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center md:items-start gap-8 mt-20">
          {/* 顶部横向用户信息卡 */}
          <Card className="w-full max-w-2xl bg-gradient-to-r from-primary/5 to-primary/0 shadow-md rounded-2xl border-0 flex flex-col md:flex-row items-center md:items-center px-8 py-8 md:py-10 md:px-12 mb-2">
            <div className="flex items-center gap-6 w-full">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary shadow-sm">
                {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold text-primary truncate">{user.username || "User"}</div>
                <div className="text-base text-primary/70 truncate">{user.email}</div>
              </div>
              <Button variant="outline" className="rounded-full border-primary/20 text-primary hover:border-primary hover:bg-primary/10 transition font-semibold px-6 py-2 shadow-sm hidden md:block" onClick={() => {window.scrollTo({top: 9999, behavior: 'smooth'})}}>Edit Profile</Button>
            </div>
            {/* 移动端编辑按钮 */}
            <Button variant="outline" className="rounded-full border-primary/20 text-primary hover:border-primary hover:bg-primary/10 transition font-semibold px-6 py-2 shadow-sm mt-6 w-full md:hidden" onClick={() => {window.scrollTo({top: 9999, behavior: 'smooth'})}}>Edit Profile</Button>
          </Card>
          {/* 个人信息表单 */}
          <Card className="w-full max-w-2xl bg-white/95 shadow rounded-xl border-0 backdrop-blur-md">
            <CardContent className="pt-8 pb-8">
              <ProfileForm />
            </CardContent>
          </Card>
        </main>
      </div>
      {/* 移动端底部侧边栏入口 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/90 border-t border-primary/10 shadow-lg flex justify-center py-2">
        <Sidebar />
      </div>
    </div>
  )
}
