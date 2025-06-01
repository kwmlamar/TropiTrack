"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, CheckCircle, XCircle, Clock, User, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

import { getInviteByToken, acceptInvite } from "@/lib/data/invites"
import type { InviteWithDetails } from "@/lib/types/invite"

const onboardingSchema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
    lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type OnboardingFormData = z.infer<typeof onboardingSchema>

type InviteState = "loading" | "valid" | "expired" | "used" | "invalid" | "error"

export function OnboardingForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [invite, setInvite] = useState<InviteWithDetails | null>(null)
  const [inviteState, setInviteState] = useState<InviteState>("loading")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    async function validateInvite() {
      if (!token) {
        setInviteState("invalid")
        return
      }

      try {
        const response = await getInviteByToken(token)

        if (!response.success || !response.data) {
          setInviteState("invalid")
          return
        }

        const inviteData = response.data
        setInvite(inviteData)

        // Check if invite is already used
        if (inviteData.is_used) {
          setInviteState("used")
          return
        }

        // Check if invite is expired
        const now = new Date()
        const expiresAt = new Date(inviteData.expires_at)
        if (expiresAt < now) {
          setInviteState("expired")
          return
        }

        setInviteState("valid")
      } catch (error) {
        console.error("Error validating invite:", error)
        setInviteState("error")
      }
    }

    validateInvite()
  }, [token])

  const onSubmit = async (data: OnboardingFormData) => {
    if (!token || !invite) return

    setIsSubmitting(true)
    try {
      // In a real app, you would:
      // 1. Create the user account with Supabase Auth
      // 2. Update the user profile with the provided information
      // 3. Accept the invite and link the user to the company

      const userId = crypto.randomUUID() // Placeholder - would come from auth

      const response = await acceptInvite(token, userId)

      if (response.success) {
        toast.success("Welcome to TropiTrack!", {
          description: "Your account has been created successfully",
        })

        // Redirect to dashboard
        router.push("/dashboard")
      } else {
        toast.error("Failed to complete onboarding", {
          description: response.error || "Please try again",
        })
      }
    } catch (error) {
      console.error("Error completing onboarding:", error)
      toast.error("An unexpected error occurred", {
        description: "Please try again or contact support",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (inviteState === "loading") {
    return <LoadingState />
  }

  if (inviteState !== "valid") {
    return <ErrorState state={inviteState} />
  }

  return (
    <Card className="mt-8 border-0 shadow-xl">
      <CardHeader className="space-y-4 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Complete Your Setup</CardTitle>
            <CardDescription className="mt-1">
              You're joining as a{" "}
              <Badge variant="secondary" className="ml-1 capitalize">
                {invite?.role}
              </Badge>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Valid Invite
          </div>
        </div>

        {invite && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <User className="h-4 w-4" />
            <AlertDescription>
              <strong>{invite.email}</strong> has been invited by{" "}
              {invite.inviter ? `${invite.inviter.first_name} ${invite.inviter.last_name}` : "your team"}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a secure password"
                        className="pl-10 pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="pl-10 pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4">
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Setting up your account..." : "Complete Setup"}
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingState() {
  return (
    <Card className="mt-8 border-0 shadow-xl">
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Validating your invitation...</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ErrorState({ state }: { state: InviteState }) {
  const router = useRouter()

  const getErrorContent = () => {
    switch (state) {
      case "expired":
        return {
          icon: <Clock className="h-12 w-12 text-amber-500" />,
          title: "Invitation Expired",
          description:
            "This invitation link has expired. Please request a new invitation from your team administrator.",
          action: "Contact Administrator",
        }
      case "used":
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: "Already Accepted",
          description:
            "This invitation has already been used. If you're having trouble accessing your account, please contact support.",
          action: "Sign In",
        }
      case "invalid":
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: "Invalid Invitation",
          description: "This invitation link is invalid or malformed. Please check the link and try again.",
          action: "Go Home",
        }
      default:
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: "Something Went Wrong",
          description: "We encountered an error while processing your invitation. Please try again later.",
          action: "Try Again",
        }
    }
  }

  const { icon, title, description, action } = getErrorContent()

  return (
    <Card className="mt-8 border-0 shadow-xl">
      <CardContent className="py-12 text-center">
        <div className="mx-auto mb-4 flex justify-center">{icon}</div>
        <h2 className="mb-2 text-xl font-semibold">{title}</h2>
        <p className="mb-6 text-sm text-muted-foreground">{description}</p>
        <div className="space-y-2">
          <Button onClick={() => window.location.reload()} className="w-full">
            {action}
          </Button>
          <Button variant="outline" onClick={() => router.push("/")} className="w-full">
            Return to Home
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
