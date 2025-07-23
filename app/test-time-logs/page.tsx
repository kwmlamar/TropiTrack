'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function TestTimeLogsPage() {
  const [loading, setLoading] = useState(false)

  const generateSampleData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/time-logs/sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Sample time logs data created successfully!')
      } else {
        toast.error(result.message || 'Failed to create sample data')
      }
    } catch (error) {
      console.error('Error generating sample data:', error)
      toast.error('Failed to generate sample data')
    } finally {
      setLoading(false)
    }
  }

  const testTimeLogsAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/time-logs')
      const result = await response.json()

      if (result.success) {
        console.log('Time logs data:', result.data)
        toast.success('Time logs API working correctly!')
      } else {
        toast.error(result.message || 'Time logs API failed')
      }
    } catch (error) {
      console.error('Error testing time logs API:', error)
      toast.error('Failed to test time logs API')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Time Logs Testing</h1>
        <p className="text-gray-500 mb-8">
          Test the time logs functionality and generate sample data
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate Sample Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Create sample timesheets for the last 7 days to test the time logs functionality.
            </p>
            <Button 
              onClick={generateSampleData} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Generating...' : 'Generate Sample Data'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Time Logs API</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Test the time logs API endpoint to verify it&apos;s working correctly.
            </p>
            <Button 
              onClick={testTimeLogsAPI} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test API'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Generate Sample Data</h3>
              <p className="text-sm text-gray-500">
                Click &quot;Generate Sample Data&quot; to create sample timesheets for testing. 
                This will create timesheets for the last 7 days with a mix of approved and pending statuses.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">2. Test the API</h3>
              <p className="text-sm text-gray-500">
                Click &quot;Test API&quot; to verify that the time logs API is working correctly. 
                Check the browser console for the returned data.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">3. View Time Logs</h3>
              <p className="text-sm text-gray-500">
                Navigate to <code className="bg-muted px-1 rounded">/dashboard/time-logs</code> to see the time logs page with real data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 