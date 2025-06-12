import React from "react";
import ProfileSidebar from "@/app/components/custom-ui/profile-sidebar";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto p-4 pt-20">
      <div className="flex flex-col md:flex-row gap-8">
        <ProfileSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
