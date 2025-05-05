"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useUserStore } from "@/lib/userStore"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  bio: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function ProfileForm() {
  const supabase = createClientComponentClient()
  const user = useUserStore(state => state.user)
  const [editMode, setEditMode] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      bio: user?.bio || "",
    },
  })

  // 同步 user 数据到表单
  useEffect(() => {
    form.reset({
      username: user?.username || "",
      email: user?.email || "",
      bio: user?.bio || "",
    })
  }, [user])

  async function onSubmit(values: FormValues) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Please sign in to update your profile")
        return
      }
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: session.user.id,
          ...values,
          updated_at: new Date().toISOString(),
        })
      if (error) throw error
      toast.success("Profile updated successfully")
      setEditMode(false)
      // 更新全局用户信息
      useUserStore.getState().fetchUser()
    } catch (error) {
      toast.error("Failed to update profile")
      console.error(error)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto bg-white/95 shadow-2xl rounded-2xl border-0 backdrop-blur-md px-2 py-4 md:px-8 md:py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* 左侧栏：头像与基础信息 */}
        <div className="md:w-1/3 flex flex-col items-center md:items-start gap-4 md:gap-8 border-b md:border-b-0 md:border-r border-primary/10 pb-6 md:pb-0 md:pr-8">
          <Avatar className="w-20 h-20 bg-primary/10 text-primary">
            <AvatarFallback className="text-3xl font-bold">
              {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-xl font-semibold text-primary mt-2">{user?.username || "User"}</div>
            <div className="text-sm text-primary/70">{user?.email}</div>
          </div>
        </div>
        {/* 右侧栏：表单内容 */}
        <motion.div
          className="md:w-2/3 w-full"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mb-6 text-lg font-bold text-primary">Profile Information</div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary">Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your username"
                        {...field}
                        disabled={!editMode}
                        className={`transition bg-white ${!editMode ? 'text-gray-500 border-gray-200 bg-gray-50 cursor-not-allowed' : 'text-primary border-primary/30 focus:border-primary focus:ring-primary/10'} rounded-lg`}
                      />
                    </FormControl>
                    <FormDescription>This is your public display name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        type="email"
                        {...field}
                        disabled={!editMode}
                        className={`transition bg-white ${!editMode ? 'text-gray-500 border-gray-200 bg-gray-50 cursor-not-allowed' : 'text-primary border-primary/30 focus:border-primary focus:ring-primary/10'} rounded-lg`}
                      />
                    </FormControl>
                    <FormDescription>Your email address will be used for notifications.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary">Bio</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tell us about yourself"
                        {...field}
                        disabled={!editMode}
                        className={`transition bg-white ${!editMode ? 'text-gray-500 border-gray-200 bg-gray-50 cursor-not-allowed' : 'text-primary border-primary/30 focus:border-primary focus:ring-primary/10'} rounded-lg`}
                      />
                    </FormControl>
                    <FormDescription>Brief description for your profile.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <motion.div
                className="flex gap-4 justify-end mt-8"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                {editMode ? (
                  <>
                    <Button type="submit" className="rounded-full px-8 py-2 font-semibold bg-primary text-white hover:bg-primary/90 shadow-md transition">Save</Button>
                    <Button type="button" variant="outline" className="rounded-full px-8 py-2 font-semibold border-primary/30 text-primary hover:border-primary hover:bg-primary/10 transition" onClick={() => { setEditMode(false); form.reset(); }}>Cancel</Button>
                  </>
                ) : (
                  <Button type="button" variant="outline" className="rounded-full px-8 py-2 font-semibold border-primary/30 text-primary hover:border-primary hover:bg-primary/10 transition" onClick={() => setEditMode(true)}>
                    Edit
                  </Button>
                )}
              </motion.div>
            </form>
          </Form>
        </motion.div>
      </div>
    </Card>
  )
} 