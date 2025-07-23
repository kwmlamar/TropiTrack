'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function TestPayrollPage() {
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Payroll Testing</h1>
        <p className="text-gray-500 mb-8">
          Generate sample payroll data to test the payroll functionality
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
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
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 