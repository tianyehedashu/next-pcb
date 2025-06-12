"use client"

import { useUserStore } from "@/lib/userStore"
import { ProfileForm } from "./profile-form"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ProfilePage() {
  const user = useUserStore((state) => state.user)

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-muted-foreground">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            This is how others will see you on the site.
          </CardDescription>
        </CardHeader>
      </Card>
      <ProfileForm />
    </div>
  )
}
