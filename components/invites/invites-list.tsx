"use client"

import { useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { deleteInvite, getInvites, resendInvite } from "@/lib/data/invites"
import type { InviteWithDetails } from "@/lib/types/invite"

type InvitesListProps = {
  userId: string
}

export function InvitesList({userId}: InvitesListProps) {
  const [invites, setInvites] = useState<InviteWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const loadInvites = useCallback(async () => {
    setLoading(true)
    try {
      // In a real app, you'd get the company ID from auth context
      const response = await getInvites(userId)
      if (response.success && response.data) {
        setInvites(response.data)
      } else {
        toast.error("Error loading invites", {
          description: response.error || "Failed to load invites",
        })
      }
    } catch (error) {
      console.error("Error loading invites:", error)
      toast.error("Error loading invites", {
        description: "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadInvites()
  }, [loadInvites])

  const handleDelete = async (id: string) => {
    try {
      // In a real app, you'd get the company ID from auth context
      const response = await deleteInvite(userId, id)
      if (response.success) {
        setInvites(invites.filter((invite) => invite.id !== id))
        toast.success("Invite deleted", {
          description: "The invitation has been deleted successfully",
        })
      } else {
        toast.error("Error deleting invite", {
          description: response.error || "Failed to delete invite",
        })
      }
    } catch (error) {
      console.error("Error deleting invite:", error)
      toast.error("Error deleting invite", {
        description: "An unexpected error occurred",
      })
    }
  }

  const handleResend = async (id: string) => {
    try {
      // In a real app, you'd get the company ID from auth context
      const response = await resendInvite(userId, id)
      if (response.success && response.data) {
        // Update the invite in the list
        setInvites(invites.map((invite) => (invite.id === id ? (response.data as InviteWithDetails) : invite)))

        // Send the email (in a real app, this would be a server action)
        await sendInviteEmail(response.data)

        toast.success("Invite resent", {
          description: "The invitation has been resent successfully",
        })
      } else {
        toast.error("Error resending invite", {
          description: response.error || "Failed to resend invite",
        })
      }
    } catch (error) {
      console.error("Error resending invite:", error)
      toast.error("Error resending invite", {
        description: "An unexpected error occurred",
      })
    }
  }

  // This would be a server action in a real app
  const sendInviteEmail = async (invite: InviteWithDetails) => {
    // Simulate sending email
    console.log("Sending invite email to:", invite.email)
    return true
  }

  const getInviteStatus = (invite: InviteWithDetails) => {
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)

    if (invite.is_used) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Accepted
        </Badge>
      )
    } else if (expiresAt < now) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Expired
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Pending
        </Badge>
      )
    }
  }

  if (loading) {
    return <div>Loading invites...</div>
  }

  if (invites.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No invites found. Create one to get started.</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Invited By</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell className="font-medium">{invite.email}</TableCell>
              <TableCell className="capitalize">{invite.role}</TableCell>
              <TableCell>{getInviteStatus(invite)}</TableCell>
              <TableCell>
                {invite.inviter
                  ? `${invite.inviter.first_name || ""} ${invite.inviter.last_name || ""}`.trim() ||
                    invite.inviter.email
                  : "Unknown"}
              </TableCell>
              <TableCell>{format(new Date(invite.expires_at), "MMM d, yyyy")}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {!invite.is_used && new Date(invite.expires_at) > new Date() && (
                    <Button variant="outline" size="sm" onClick={() => handleResend(invite.id)}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Resend
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(invite.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
