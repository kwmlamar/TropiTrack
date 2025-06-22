"use client"

import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"

interface EditProjectButtonProps {
  onEdit: () => void
}

export function EditProjectButton({ onEdit }: EditProjectButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onEdit}
      className="flex items-center gap-2"
    >
      <Edit className="h-4 w-4" />
      Edit
    </Button>
  )
} 