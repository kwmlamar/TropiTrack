"use client"

import { useState } from "react"
import { EditProjectDialog } from "./edit-project-dialog"
import { EditProjectButton } from "./edit-project-button"
import type { Project } from "@/lib/types/project"
import type { Client } from "@/lib/types/client"

interface ProjectDetailsClientProps {
  project: Project
  clients: Client[]
  userId: string
  children: React.ReactNode
}

export function ProjectDetailsClient({
  project,
  clients,
  userId,
  children,
}: ProjectDetailsClientProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleEditSuccess = () => {
    // Refresh the page to show updated data
    window.location.reload()
  }

  return (
    <>
      {children}
      
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

// Export a component that can be used to render the edit button
export function ProjectDetailsEditButton({ onEdit }: { onEdit: () => void }) {
  return <EditProjectButton onEdit={onEdit} />
} 