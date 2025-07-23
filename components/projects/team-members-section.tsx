"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Edit } from "lucide-react"
import { EditTeamMembersDrawer } from "./edit-team-members-drawer"
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

interface TeamMembersSectionProps {
  project: ProjectWithDetails
  teamMembers: TeamMember[]
  workers: Worker[]
  userId: string
  onSuccess?: () => void
}

export function TeamMembersSection({
  project,
  teamMembers,
  workers,
  userId,
  onSuccess,
}: TeamMembersSectionProps) {
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false)

  const handleAddSuccess = () => {
    setIsAddDrawerOpen(false)
    onSuccess?.()
  }

  return (
    <>
      {/* Team Members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Team Members</h3>
            <p className="text-sm text-gray-500">
              Workers assigned to this project and their performance metrics.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddDrawerOpen(true)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
        <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            {teamMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                  <Users className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No team members assigned
                </h3>
                <p className="text-sm text-gray-500 text-center mb-6 max-w-sm">
                  No workers have been assigned to this project yet.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDrawerOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Add Your First Team Member
                </Button>
              </div>
            ) : (
              <div className="space-y-0">
                {/* Column Headers */}
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 border-b border-border/50 bg-muted/30">
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Name
                  </div>
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Position
                  </div>
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Hourly Rate
                  </div>
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Total Hours
                  </div>
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Total Pay
                  </div>
                </div>

                {/* Data Rows */}
                <div className="divide-y divide-border/50">
                  {teamMembers.map((member, i) => (
                    <div
                      key={member.id || i}
                      className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-muted/20 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{member.name}</p>
                      </div>
                      <div className="text-foreground">
                        {member.position}
                      </div>
                      <div className="text-foreground">
                        ${member.hourlyRate.toFixed(2)}
                      </div>
                      <div className="text-foreground">
                        {member.totalHours % 1 === 0 ? member.totalHours.toFixed(0) : member.totalHours.toFixed(1)}h
                      </div>
                      <div className="text-foreground">
                        ${member.totalPay.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EditTeamMembersDrawer
        open={isAddDrawerOpen}
        onOpenChange={setIsAddDrawerOpen}
        project={project}
        workers={workers}
        teamMembers={teamMembers}
        userId={userId}
        onSuccess={handleAddSuccess}
      />
    </>
  )
} 