"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { useUserStore } from "@/lib/userStore"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const profileFormSchema = z.object({
  email: z.string().email(),
  full_name: z.string().optional(),
  company_name: z.string().optional(),
  phone: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const user = useUserStore((state) => state.user)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: user?.email || "",
      full_name: user?.full_name || "",
      company_name: user?.company_name || "",
      phone: user?.phone || "",
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email || "",
        full_name: user.full_name || "",
        company_name: user.company_name || "",
        phone: user.phone || "",
      })
    }
  }, [user, form])

  async function onSubmit(data: ProfileFormValues) {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          company_name: data.company_name,
          phone: data.phone,
        },
      })

      if (error) throw error

      toast.success(
        "Profile updated successfully! Changes may take a moment to reflect."
      )
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your account settings. Email address cannot be changed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your full name"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your company name"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your phone number"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Save</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
} 