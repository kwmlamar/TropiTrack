"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function TestApprovalsPage() {
  const [loading, setLoading] = useState(false)

  const createSampleUnapprovedTimesheets = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/time-logs/sample', {
        method: 'POST',
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create sample timesheets')
      }
      
      toast.success('Sample unapproved timesheets created successfully!')
    } catch (err) {
      console.error('Error creating sample timesheets:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to create sample timesheets')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Test Approvals</h1>
          <p className="text-gray-500">
            Generate sample unapproved timesheets to test the approvals functionality.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Sample Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              This will create sample timesheets with pending approval status for testing the approvals page.
            </p>
            <Button
              onClick={createSampleUnapprovedTimesheets}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Sample Unapproved Timesheets'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              1. Click the button above to create sample unapproved timesheets
            </p>
            <p className="text-sm">
              2. Navigate to the Approvals page to see the pending timesheets
            </p>
            <p className="text-sm">
              3. Test the approve and reject functionality
            </p>
            <p className="text-sm">
              4. Check that timesheets are removed from the list after approval/rejection
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 