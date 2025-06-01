"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { getInviteByToken, acceptInvite } from "@/lib/data/invites"
import type { InviteWithDetails } from "@/lib/types/invite"
import { Suspense } from "react"
import { OnboardingForm } from "@/components/onboarding/onboarding-form"
import { OnboardingHeader } from "@/components/onboarding/onboarding-header"

function OnboardingFormSkeleton() {
  return (
    <div className="mt-8 rounded-xl border bg-card p-8 shadow-lg">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

type AcceptInvitePageProps = {
  userId: string
}

export default function AcceptInvitePage({userId}: AcceptInvitePageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [invite, setInvite] = useState<InviteWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInvite() {
      if (!token) {
        setError("Invalid invitation link")
        setLoading(false)
        return
      }

      try {
        const response = await getInviteByToken(token)
        if (response.success && response.data) {
          setInvite(response.data)

          // Check if invite is expired
          const now = new Date()
          const expiresAt = new Date(response.data.expires_at)
          if (expiresAt < now) {
            setError("This invitation has expired")
          }

          // Check if invite is already used
          if (response.data.is_used) {
            setError("This invitation has already been used")
          }
        } else {
          setError("Invalid invitation link")
        }
      } catch (err) {
        console.error("Error fetching invite:", err)
        setError("Failed to load invitation details")
      } finally {
        setLoading(false)
      }
    }

    fetchInvite()
  }, [token])

  const handleAccept = async () => {
    if (!token || !invite) return

    setAccepting(true)
    try {
      // In a real app, you'd get the user ID from auth context
      // For now, we'll use a placeholder

      const response = await acceptInvite(token, userId)
      if (response.success) {
        toast.success("Invitation accepted!", {
          description: "You have successfully joined the company",
        })

        // In a real app, you'd redirect to onboarding or dashboard
        router.push("/dashboard")
      } else {
        setError(response.error || "Failed to accept invitation")
      }
    } catch (err) {
      console.error("Error accepting invite:", err)
      setError("An unexpected error occurred")
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Loading invitation...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => router.push("/")}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>This invitation link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => router.push("/")}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Join {invite.company_id}</CardTitle>
          <CardDescription>
            You have been invited to join as a <span className="font-medium capitalize">{invite.role}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <p>
                Invitation sent to: <span className="font-medium">{invite.email}</span>
              </p>
              {invite.inviter && (
                <p className="text-sm text-muted-foreground">
                  Invited by: {invite.inviter.first_name} {invite.inviter.last_name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleAccept} disabled={accepting}>
            {accepting ? "Accepting..." : "Accept Invitation"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
