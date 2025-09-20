'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { checkPendingTimesheetsForPayrolls } from '@/lib/data/payroll'

export default function TestPayrollPage() {
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)

  const generateSamplePayrollData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/payroll/sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Sample payroll data created successfully!')
      } else {
        toast.error(result.message || 'Failed to create sample data')
      }
    } catch (error) {
      console.error('Error generating sample payroll data:', error)
      toast.error('Failed to generate sample payroll data')
    } finally {
      setLoading(false)
    }
  }

  const testPendingTimesheetsCheck = async () => {
    setTestLoading(true)
    try {
      // This is a test function - you would need actual payroll IDs to test with
      // For now, we'll just test the function with an empty array
      const result = await checkPendingTimesheetsForPayrolls([])
      
      if (result.success) {
        toast.success('Pending timesheets check function works!', {
          description: `Found ${result.data?.pendingCount || 0} pending timesheets.`
        })
      } else {
        toast.error('Pending timesheets check failed', {
          description: result.error || 'Unknown error'
        })
      }
    } catch (error) {
      console.error('Error testing pending timesheets check:', error)
      toast.error('Failed to test pending timesheets check')
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Payroll Testing</h1>
        <p className="text-gray-500 mb-8">
          Generate sample payroll data to test the payroll functionality
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Generate Sample Payroll Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              This will create sample approved timesheets and generate payroll records for the current week.
              This will populate the payroll page with test data.
            </p>
            <Button 
              onClick={generateSamplePayrollData} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Generating...' : 'Generate Sample Payroll Data'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Pending Timesheets Check</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Test the new pending timesheets check function that prevents payroll confirmation when there are pending timesheets.
            </p>
            <Button 
              onClick={testPendingTimesheetsCheck} 
              disabled={testLoading}
              className="w-full"
            >
              {testLoading ? 'Testing...' : 'Test Pending Timesheets Check'}
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
                Click &quot;Generate Sample Payroll Data&quot; to create sample approved timesheets and payroll records.
                This will create data for the current week that should appear on the payroll page.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">2. View Payroll Page</h3>
              <p className="text-sm text-gray-500">
                Navigate to <code className="bg-muted px-1 rounded">/dashboard/payroll</code> to see the payroll page with the generated data.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">3. Test Payroll Features</h3>
              <p className="text-sm text-gray-500">
                Once the data is generated, you can test:
              </p>
              <ul className="text-sm text-gray-500 list-disc list-inside mt-2 space-y-1">
                <li>Viewing payroll records in the table</li>
                <li>Confirming payroll entries</li>
                <li>Marking payroll as paid</li>
                <li>Adding payment amounts</li>
                <li>Filtering by status</li>
                <li><strong>NEW:</strong> Pending timesheets check before payroll confirmation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">4. Test Pending Timesheets Check</h3>
              <p className="text-sm text-gray-500">
                Click &quot;Test Pending Timesheets Check&quot; to verify the new functionality that checks for pending timesheets before allowing payroll confirmation.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">5. Test New Column Layout</h3>
              <p className="text-sm text-gray-500">
                Navigate to the payroll page and test the new column layout with:
              </p>
              <ul className="text-sm text-gray-500 list-disc list-inside mt-2 space-y-1">
                <li><strong>Payment Amount Column:</strong> Clean, simple display of paid amounts (clickable to edit)</li>
                <li><strong>Remaining Balance Column:</strong> Dedicated column showing what&apos;s left to pay</li>
                <li><strong>Real-time Updates:</strong> As you edit payment amounts, the remaining balance updates instantly</li>
                <li><strong>Smart Display:</strong> Shows net pay remaining (primary) and gross pay remaining (if different)</li>
                <li><strong>Visual Indicators:</strong> Green checkmark for fully paid, orange text for remaining balances</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 