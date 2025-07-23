'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface ClockedInWorker {
  worker_id: string
  worker_name: string
  project_id: string
  project_name: string
  last_clock_in: string
  clock_in_event_id: string
}

interface AutoClockOutResult {
  processed: number
  errors: string[]
}

export default function TestAutoClockOutPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [maxHours, setMaxHours] = useState(8)
  const [endOfDayTime, setEndOfDayTime] = useState('17:00')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AutoClockOutResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [clockedInWorkers, setClockedInWorkers] = useState<ClockedInWorker[]>([])
  const [loadingWorkers, setLoadingWorkers] = useState(false)

  const checkClockedInWorkers = async () => {
    setLoadingWorkers(true)
    setError(null)
    
    try {
      const response = await fetch('/api/qr-clock/auto-clockout')
      const data = await response.json()
      
      if (data.success) {
        setClockedInWorkers(data.data.clockedInWorkers)
      } else {
        setError(data.message || 'Failed to fetch clocked-in workers')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching clocked-in workers:', err)
    } finally {
      setLoadingWorkers(false)
    }
  }

  const generateAutoClockOuts = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await fetch('/api/qr-clock/auto-clockout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          maxHours,
          endOfDayTime
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
        // Refresh the clocked-in workers list
        await checkClockedInWorkers()
      } else {
        setError(data.message || 'Failed to generate automatic clock-outs')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error generating automatic clock-outs:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Automatic Clock-Out Test</h1>
        <p className="text-gray-500">
          Test the automatic clock-out functionality for workers who forgot to clock out
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Set parameters for automatic clock-out generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="date">Date (YYYY-MM-DD)</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="maxHours">Maximum Hours (default: 8)</Label>
              <Input
                id="maxHours"
                type="number"
                min="1"
                max="24"
                value={maxHours}
                onChange={(e) => setMaxHours(Number(e.target.value))}
              />
            </div>
            
            <div>
              <Label htmlFor="endOfDayTime">End of Day Time (HH:MM)</Label>
              <Input
                id="endOfDayTime"
                type="time"
                value={endOfDayTime}
                onChange={(e) => setEndOfDayTime(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={checkClockedInWorkers} 
                disabled={loadingWorkers}
                variant="outline"
                className="flex-1"
              >
                {loadingWorkers ? 'Checking...' : 'Check Clocked-In Workers'}
              </Button>
              
              <Button 
                onClick={generateAutoClockOuts} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Processing...' : 'Generate Auto Clock-Outs'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Results from automatic clock-out generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4">
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={result.processed > 0 ? "default" : "secondary"}>
                    {result.processed} Workers Processed
                  </Badge>
                  {result.errors.length > 0 && (
                    <Badge variant="destructive">
                      {result.errors.length} Errors
                    </Badge>
                  )}
                </div>

                {result.errors.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Errors:</h4>
                    <ul className="text-sm text-red-600 space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clocked-In Workers Card */}
      <Card>
        <CardHeader>
          <CardTitle>Currently Clocked-In Workers</CardTitle>
          <CardDescription>
            Workers who are currently clocked in and would be affected by automatic clock-out
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clockedInWorkers.length === 0 ? (
            <p className="text-gray-500">
              No workers are currently clocked in.
            </p>
          ) : (
            <div className="space-y-4">
              {clockedInWorkers.map((worker) => (
                <div key={`${worker.worker_id}-${worker.project_id}`} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{worker.worker_name}</h4>
                      <p className="text-sm text-gray-500">{worker.project_name}</p>
                    </div>
                    <Badge variant="outline">Clocked In</Badge>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Clock In Time:</span>
                      <p className="text-gray-500">
                        {formatTime(worker.last_clock_in)}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Event ID:</span>
                      <p className="text-gray-500 font-mono text-xs">
                        {worker.clock_in_event_id}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Automatic Clock-Out Process:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Identifies all workers who are currently clocked in</li>
              <li>Creates automatic clock-out events for each worker</li>
              <li>Generates timesheets with a maximum hour limit (default: 8 hours)</li>
              <li>Adds notes indicating the timesheet was auto-generated due to missing clock-out</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Use Cases:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>End-of-day processing for workers who forgot to clock out</li>
              <li>Prevents excessive hours from being billed</li>
              <li>Ensures all workers have timesheets for payroll processing</li>
              <li>Can be automated via cron job or manual trigger</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Configuration Options:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Date:</strong> The date for which to generate timesheets</li>
              <li><strong>Maximum Hours:</strong> Limit total hours to prevent over-billing (default: 8)</li>
              <li><strong>End of Day Time:</strong> Reference time for end-of-day processing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 