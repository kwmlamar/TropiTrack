"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { EditProjectDialog } from "./edit-project-dialog"
import type { ProjectWithDetails } from "@/lib/types/project"
import type { Client } from "@/lib/types/client"

interface ProjectDetailsSectionProps {
  project: ProjectWithDetails
  clients: Client[]
  userId: string
}

export function ProjectDetailsSection({
  project,
  clients,
  userId,
}: ProjectDetailsSectionProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleEditClick = () => {
    setIsEditDialogOpen(true)
  }

  const handleEditSuccess = () => {
    // Refresh the page to show updated data
    window.location.reload()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      not_started: {
        label: "Not Started",
        className: "bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20 dark:bg-secondary/20 dark:text-secondary-foreground dark:border-secondary/30 px-4 py-1.5 text-sm font-medium",
      },
      in_progress: {
        label: "In Progress",
        className: "bg-info/10 text-info border-info/20 hover:bg-info/20 dark:bg-info/20 dark:text-info-foreground dark:border-info/30 px-4 py-1.5 text-sm font-medium",
      },
      paused: {
        label: "Paused",
        className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 dark:bg-warning/20 dark:text-warning-foreground dark:border-warning/30 px-4 py-1.5 text-sm font-medium",
      },
      completed: {
        label: "Completed",
        className: "bg-success/10 text-success border-success/20 hover:bg-success/20 dark:bg-success/20 dark:text-success-foreground dark:border-success/30 px-4 py-1.5 text-sm font-medium",
      },
      cancelled: {
        label: "Cancelled",
        className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 dark:bg-destructive/20 dark:text-destructive-foreground dark:border-destructive/30 px-4 py-1.5 text-sm font-medium",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.not_started;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      {/* Project Details */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Project Details</h3>
            <p className="text-sm text-gray-500">
              Key information and details about this project.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-sm text-gray-500">Project Name</h4>
              <p className="text-sm mt-1">{project.name}</p>
            </div>
            {project.client && (
              <div>
                <h4 className="font-medium text-sm text-gray-500">Client</h4>
                <p className="text-sm mt-1">{project.client.name}</p>
                {project.client.company && (
                  <p className="text-sm text-gray-500">{project.client.company}</p>
                )}
              </div>
            )}
          </div>
          <Separator />
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-sm text-gray-500">Status</h4>
              <div className="mt-1">
                {getStatusBadge(project.status)}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-500">Start Date</h4>
              <p className="text-sm mt-1">
                {project.start_date ? format(new Date(project.start_date), "MMM d, yyyy") : "Not started"}
              </p>
            </div>
          </div>
          <Separator />
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-sm text-gray-500">End Date</h4>
              <p className="text-sm mt-1">
                {project.end_date ? format(new Date(project.end_date), "MMM d, yyyy") : "No end date"}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-500">Location</h4>
              <p className="text-sm mt-1">{project.location || "No location specified"}</p>
            </div>
          </div>
        </div>
      </div>

      <EditProjectDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        userId={userId}
        project={project}
        clients={clients}
        onSuccess={handleEditSuccess}
      />
    </>
  )
} 