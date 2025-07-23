"use client"

import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { InviteDialog } from "./invite-dialog"
import { UserProfileWithCompany } from "@/lib/types/userProfile"

type InviteHeaderProps = {
    profile: UserProfileWithCompany
}

export function InvitesHeader({profile}: InviteHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Invites</h1>
        <p className="text-gray-500">Manage invitations to your company</p>
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
