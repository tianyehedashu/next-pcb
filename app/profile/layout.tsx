import React from "react";
import ProfileSidebar from "@/app/components/custom-ui/profile-sidebar";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted">
      <ProfileSidebar />
      <main className="flex-1 p-8 bg-white rounded-lg shadow-md m-6">
        {children}
      </main>
    </div>
  );
}
