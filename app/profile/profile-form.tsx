"use client"

import { useEffect, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { useUserStore } from "@/lib/userStore"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Mail, 
  Building, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Loader2,
  CheckCircle2
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const profileFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  full_name: z.string().optional(),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().optional(),
  location: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
  const user = useUserStore((state) => state.user)
  const [isLoading, setIsLoading] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      email: user?.email || "",
      full_name: user?.full_name || "",
      company_name: user?.company_name || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      website: user?.website || "",
      location: user?.location || "",
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        email: user.email || "",
        full_name: user.full_name || "",
        company_name: user.company_name || "",
        phone: user.phone || "",
        bio: user?.bio || "",
        website: user?.website || "",
        location: user?.location || "",
      })
    }
  }, [user, form])

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: data.full_name,
          company_name: data.company_name,
          phone: data.phone,
          bio: data.bio,
          website: data.website,
          location: data.location,
        },
      })

      if (error) throw error

      setLastSaved(new Date())
      toast.success("Profile updated successfully!", {
        description: "Your changes have been saved and will be reflected shortly.",
      })
    } catch (error) {
      toast.error("Failed to update profile", {
        description: (error as Error).message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email?.slice(0, 2).toUpperCase() || 'U'
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Section */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-500" />
              Profile Picture
            </CardTitle>
            <CardDescription>
              Update your profile picture to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-gray-100">
                <AvatarImage src={user?.avatar_url} alt={user?.full_name || user?.email} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-bold">
                  {getInitials(user?.full_name, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button type="button" variant="outline" size="sm" disabled>
                  <Camera className="h-4 w-4 mr-2" />
                  Change Picture
                </Button>
                <p className="text-xs text-muted-foreground">
                  Avatar upload feature coming soon
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-500" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Your basic account information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input {...field} disabled className="bg-gray-50" />
                        <Badge variant="secondary" className="absolute right-2 top-2 text-xs">
                          Verified
                        </Badge>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Your email address cannot be changed for security reasons
                    </FormDescription>
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
                        placeholder="Enter your full name"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      This is how your name will appear to others
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Company Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your company name"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional - Your company or organization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 (555) 123-4567"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Include country code for international numbers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="City, Country"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Your general location (city, country)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>
              Optional details to help others learn more about you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://yourwebsite.com"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Your personal or company website
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a bit about yourself..."
                      className="min-h-[100px] resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description about yourself (max 500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Save Section */}
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            {lastSaved && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Profile updated successfully at {lastSaved.toLocaleTimeString()}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Changes are saved automatically to your account
              </div>
              <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
} 