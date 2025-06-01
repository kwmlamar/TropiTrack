"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { InviteDialog } from "./invite-dialog"
import { UserProfileWithCompany } from "@/lib/types/userProfile"

type InviteHeaderProps = {
    profile: UserProfileWithCompany
}

export function InvitesHeader({profile}: InviteHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invites</h1>
        <p className="text-muted-foreground">Manage invitations to your company</p>
      </div>
      <InviteDialog
        profile={profile}
        trigger={
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        }
      />
    </div>
  )
}
