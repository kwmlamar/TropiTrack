"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function BulkTimesheetHeaderActionsWrapper() {
  const handleSubmit = () => {
    // Find the form in the page and trigger its submission
    const form = document.querySelector('form')
    if (form) {
      form.requestSubmit()
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleSubmit}
    >
      <Plus className="h-4 w-4 mr-2" />
      Submit Timesheets
    </Button>
  )
}
