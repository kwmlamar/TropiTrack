"use client"

import { useRouter } from "next/navigation"
import { TeamMembersSection } from "./team-members-section"
import type { ProjectWithDetails } from "@/lib/types/project"
import type { Worker } from "@/lib/types/worker"

interface TeamMember {
  id: string
  name: string
  position: string
  hourlyRate: number
  totalHours: number
  totalPay: number
}

interface TeamMembersClientProps {
  project: ProjectWithDetails
  teamMembers: TeamMember[]
  workers: Worker[]
  userId: string
}

export function TeamMembersClient({
  project,
  teamMembers,
  workers,
  userId,
}: TeamMembersClientProps) {
  const router = useRouter()

  const handleSuccess = () => {
    // Refresh the page to show updated team members
    router.refresh()
  }

  return (
    <TeamMembersSection
      project={project}
      teamMembers={teamMembers}
      workers={workers}
      userId={userId}
      onSuccess={handleSuccess}
    />
  )
} 