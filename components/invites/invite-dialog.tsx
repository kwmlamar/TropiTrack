"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { InviteForm } from "./invite-form"
import type { Invite } from "@/lib/types/invite"
import type { UserProfileWithCompany } from "@/lib/types/userProfile"

interface InviteDialogProps {
  profile: UserProfileWithCompany
  trigger: React.ReactNode
  onSuccess?: (invite: Invite) => void
}

export function InviteDialog({ profile, trigger, onSuccess }: InviteDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = (invite: Invite) => {
    setOpen(false)
    onSuccess?.(invite)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        <InviteForm profile={profile} onSuccess={handleSuccess} onCancel={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
