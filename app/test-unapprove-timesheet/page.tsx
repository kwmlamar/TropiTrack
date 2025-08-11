"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { unapproveTimesheet } from "@/lib/data/timesheets"

export default function TestUnapproveTimesheet() {
  const [isLoading, setIsLoading] = useState(false)
  const [timesheetId, setTimesheetId] = useState("")

  const handleTestUnapprove = async () => {
    if (!timesheetId.trim()) {
      toast.error("Please enter a timesheet ID")
      return
    }

    setIsLoading(true)
    try {
      const result = await unapproveTimesheet(timesheetId)
      
      if (result.success) {
        toast.success("Timesheet unapproved successfully!")
      } else {
        toast.error(`Failed to unapprove timesheet: ${result.error}`)
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Test Unapprove Timesheet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Timesheet ID
            </label>
            <input
              type="text"
              value={timesheetId}
              onChange={(e) => setTimesheetId(e.target.value)}
              placeholder="Enter timesheet ID to unapprove"
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          <Button 
            onClick={handleTestUnapprove}
            disabled={isLoading || !timesheetId.trim()}
            className="w-full"
          >
            {isLoading ? "Unapproving..." : "Test Unapprove"}
          </Button>

          <div className="text-sm text-gray-600">
            <p>Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Enter a timesheet ID that is currently approved</li>
              <li>Click the button to test the unapprove functionality</li>
              <li>Check the database to verify the status changed to &quot;pending&quot;</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
