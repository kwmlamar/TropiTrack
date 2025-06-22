"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Users } from "lucide-react"
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

          <div className="px-4 py-2">
            <div className="grid grid-cols-2 gap-6">
              {/* Assigned Members Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Assigned Members ({teamMembers.length})</Label>
                  {teamMembers.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveAll}
                      className="h-auto p-1 text-xs"
                    >
                      {workersToRemove.length === teamMembers.length ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  {teamMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Users className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No team members assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`remove-${member.id}`}
                            checked={workersToRemove.includes(member.id)}
                            onCheckedChange={() => handleRemoveToggle(member.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <Label
                              htmlFor={`remove-${member.id}`}
                              className="text-sm font-medium cursor-pointer truncate block"
                            >
                              {member.name}
                            </Label>
                            <p className="text-xs text-muted-foreground truncate">
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Available Workers ({availableWorkers.length})</Label>
                  {availableWorkers.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-auto p-1 text-xs"
                    >
                      {selectedWorkers.length === availableWorkers.length ? "Deselect All" : "Select All"}
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  {availableWorkers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Users className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">All workers are already assigned</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableWorkers.map((worker) => (
                        <div key={worker.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={worker.id}
                            checked={selectedWorkers.includes(worker.id)}
                            onCheckedChange={() => handleWorkerToggle(worker.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <Label
                              htmlFor={worker.id}
                              className="text-sm font-medium cursor-pointer truncate block"
                            >
                              {worker.name}
                            </Label>
                            <p className="text-xs text-muted-foreground truncate">
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

            {(selectedWorkers.length > 0 || workersToRemove.length > 0) && (
              <div className="mt-4 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  {selectedWorkers.length > 0 && `${selectedWorkers.length} worker${selectedWorkers.length > 1 ? 's' : ''} to add`}
                  {selectedWorkers.length > 0 && workersToRemove.length > 0 && " • "}
                  {workersToRemove.length > 0 && `${workersToRemove.length} member${workersToRemove.length > 1 ? 's' : ''} to remove`}
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