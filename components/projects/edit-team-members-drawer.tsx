"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProjectWithDetails } from "@/lib/types/project"
import type { Worker } from "@/lib/types/worker"
import { assignWorkersToProject, unassignWorkerFromProject } from "@/lib/data/project-assignments"
import { toast } from "sonner"

interface TeamMember {
  id: string
  name: string
  position: string
  hourlyRate: number
  totalHours: number
  totalPay: number
}

interface EditTeamMembersDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: ProjectWithDetails
  workers: Worker[]
  teamMembers: TeamMember[]
  userId: string
  onSuccess?: () => void
}

export function EditTeamMembersDrawer({
  open,
  onOpenChange,
  project,
  workers,
  teamMembers,
  userId,
  onSuccess,
}: EditTeamMembersDrawerProps) {
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [workersToRemove, setWorkersToRemove] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Filter out workers who are already assigned to the project
  const assignedWorkerIds = new Set(teamMembers.map(member => member.id))
  const availableWorkers = workers.filter(worker => !assignedWorkerIds.has(worker.id))

  const handleWorkerToggle = (workerId: string) => {
    setSelectedWorkers(prev => 
      prev.includes(workerId) 
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    )
  }

  const handleRemoveToggle = (workerId: string) => {
    setWorkersToRemove(prev => 
      prev.includes(workerId) 
        ? prev.filter(id => id !== workerId)
        : [...prev, workerId]
    )
  }

  const handleSelectAll = () => {
    if (selectedWorkers.length === availableWorkers.length) {
      setSelectedWorkers([])
    } else {
      setSelectedWorkers(availableWorkers.map(worker => worker.id))
    }
  }

  const handleRemoveAll = () => {
    if (workersToRemove.length === teamMembers.length) {
      setWorkersToRemove([])
    } else {
      setWorkersToRemove(teamMembers.map(member => member.id))
    }
  }

  const handleSubmit = async () => {
    if (selectedWorkers.length === 0 && workersToRemove.length === 0) {
      toast.error("Please select workers to add or remove")
      return
    }

    setIsLoading(true)
    try {
      // Add new workers
      if (selectedWorkers.length > 0) {
        const addResult = await assignWorkersToProject(
          userId,
          project.id,
          selectedWorkers
        )

        if (!addResult.success) {
          console.error('Error adding team members:', addResult.error)
          toast.error("Failed to add team members")
          return
        }
      }

      // Remove workers
      if (workersToRemove.length > 0) {
        for (const workerId of workersToRemove) {
          const removeResult = await unassignWorkerFromProject(
            userId,
            project.id,
            workerId
          )

          if (!removeResult.success) {
            console.error('Error removing team member:', removeResult.error)
            toast.error("Failed to remove some team members")
            return
          }
        }
      }

      const addMessage = selectedWorkers.length > 0 ? `Added ${selectedWorkers.length} member${selectedWorkers.length > 1 ? 's' : ''}` : ""
      const removeMessage = workersToRemove.length > 0 ? `Removed ${workersToRemove.length} member${workersToRemove.length > 1 ? 's' : ''}` : ""
      const message = [addMessage, removeMessage].filter(Boolean).join(" and ")
      
      toast.success(message)
      setSelectedWorkers([])
      setWorkersToRemove([])
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating team members:', error)
      toast.error("Failed to update team members")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setSelectedWorkers([])
    setWorkersToRemove([])
    onOpenChange(false)
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-4xl">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Edit Team Members
            </DrawerTitle>
            <DrawerDescription>
              Add or remove workers from &quot;{project.name}&quot; project
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assigned Members Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-[#111827] dark:text-[#fafafa]">
                    Assigned Members
                    <span className="ml-2 text-xs font-normal text-[#6b7280] dark:text-[#a1a1aa]">
                      ({teamMembers.length})
                    </span>
                  </Label>
                  {teamMembers.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAll}
                      className="h-7 px-2 text-xs text-[#2596be] hover:text-[#1e7fa3] hover:bg-[#2596be]/10"
                    >
                      {workersToRemove.length === teamMembers.length ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-[280px] w-full rounded-lg border border-[#e5e7eb] dark:border-[#3f3f46] bg-[#f9fafb] dark:bg-[#27272a] p-1">
                  {teamMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <div className="rounded-full bg-[#e5e7eb] dark:bg-[#3f3f46] p-3 mb-3">
                        <Users className="h-6 w-6 text-[#6b7280] dark:text-[#a1a1aa]" />
                      </div>
                      <p className="text-sm font-medium text-[#374151] dark:text-[#d4d4d8]">No team members</p>
                      <p className="text-xs text-[#6b7280] dark:text-[#71717a] mt-1">Add workers from the right</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer",
                            "hover:bg-[#f3f4f6] dark:hover:bg-[#3f3f46]",
                            workersToRemove.includes(member.id) && "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
                          )}
                          onClick={() => handleRemoveToggle(member.id)}
                        >
                          <Checkbox
                            id={`remove-${member.id}`}
                            checked={workersToRemove.includes(member.id)}
                            onCheckedChange={() => handleRemoveToggle(member.id)}
                            className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                          />
                          <div className="flex-1 min-w-0">
                            <Label
                              htmlFor={`remove-${member.id}`}
                              className="text-sm font-medium cursor-pointer truncate block text-[#111827] dark:text-[#fafafa]"
                            >
                              {member.name}
                            </Label>
                            <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] truncate">
                              {member.position} • ${member.hourlyRate}/hr
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Available Workers Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-[#111827] dark:text-[#fafafa]">
                    Available Workers
                    <span className="ml-2 text-xs font-normal text-[#6b7280] dark:text-[#a1a1aa]">
                      ({availableWorkers.length})
                    </span>
                  </Label>
                  {availableWorkers.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-7 px-2 text-xs text-[#2596be] hover:text-[#1e7fa3] hover:bg-[#2596be]/10"
                    >
                      {selectedWorkers.length === availableWorkers.length ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-[280px] w-full rounded-lg border border-[#e5e7eb] dark:border-[#3f3f46] bg-[#f9fafb] dark:bg-[#27272a] p-1">
                  {availableWorkers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <div className="rounded-full bg-[#e5e7eb] dark:bg-[#3f3f46] p-3 mb-3">
                        <Users className="h-6 w-6 text-[#6b7280] dark:text-[#a1a1aa]" />
                      </div>
                      <p className="text-sm font-medium text-[#374151] dark:text-[#d4d4d8]">All assigned</p>
                      <p className="text-xs text-[#6b7280] dark:text-[#71717a] mt-1">All workers are on this project</p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {availableWorkers.map((worker) => (
                        <div
                          key={worker.id}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer",
                            "hover:bg-[#f3f4f6] dark:hover:bg-[#3f3f46]",
                            selectedWorkers.includes(worker.id) && "bg-[#2596be]/10 dark:bg-[#2596be]/20 border border-[#2596be]/30"
                          )}
                          onClick={() => handleWorkerToggle(worker.id)}
                        >
                          <Checkbox
                            id={worker.id}
                            checked={selectedWorkers.includes(worker.id)}
                            onCheckedChange={() => handleWorkerToggle(worker.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <Label
                              htmlFor={worker.id}
                              className="text-sm font-medium cursor-pointer truncate block text-[#111827] dark:text-[#fafafa]"
                            >
                              {worker.name}
                            </Label>
                            <p className="text-xs text-[#6b7280] dark:text-[#a1a1aa] truncate">
                              {worker.position} • ${worker.hourly_rate}/hr
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            {/* Selection Summary */}
            {(selectedWorkers.length > 0 || workersToRemove.length > 0) && (
              <div className="mt-4 p-3 rounded-lg bg-[#f0f9ff] dark:bg-[#0c4a6e]/30 border border-[#bae6fd] dark:border-[#0369a1]/50">
                <p className="text-sm font-medium text-[#0369a1] dark:text-[#7dd3fc]">
                  {selectedWorkers.length > 0 && (
                    <span className="inline-flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#2596be] mr-2" />
                      {selectedWorkers.length} worker{selectedWorkers.length > 1 ? 's' : ''} to add
                    </span>
                  )}
                  {selectedWorkers.length > 0 && workersToRemove.length > 0 && <span className="mx-2">•</span>}
                  {workersToRemove.length > 0 && (
                    <span className="inline-flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2" />
                      {workersToRemove.length} member{workersToRemove.length > 1 ? 's' : ''} to remove
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          <DrawerFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || (selectedWorkers.length === 0 && workersToRemove.length === 0)}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Team"
                )}
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
} 