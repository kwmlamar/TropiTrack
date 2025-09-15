"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  Download, 
  Users, 
  CheckCircle, 
  XCircle, 
  Loader2,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import { setWorkerPin } from "@/lib/data/worker-pins"

interface PinSetupData {
  workerId: string
  workerName: string
  pin: string
}

export function BulkPinSetup() {
  const [csvData, setCsvData] = useState<PinSetupData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const data: PinSetupData[] = []

    for (let i = 1; i < lines.length; i++) { // Skip header
      const columns = lines[i].split(',').map(col => col.trim().replace(/"/g, ''))
      if (columns.length >= 3) {
        data.push({
          workerId: columns[0],
          workerName: columns[1],
          pin: columns[2]
        })
      }
    }

    setCsvData(data)
    setResults(null)
  }

  const processPins = async () => {
    if (csvData.length === 0) {
      toast.error("No data to process")
      return
    }

    setIsProcessing(true)
    const errors: string[] = []
    let success = 0
    let failed = 0

    for (const item of csvData) {
      try {
        // Validate PIN
        if (!/^\d{4,8}$/.test(item.pin)) {
          errors.push(`${item.workerName}: PIN must be 4-8 digits`)
          failed++
          continue
        }

        const result = await setWorkerPin("", item.workerId, item.pin)
        if (result.success) {
          success++
        } else {
          errors.push(`${item.workerName}: ${result.error}`)
          failed++
        }
      } catch (error) {
        errors.push(`${item.workerName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        failed++
      }
    }

    setResults({ success, failed, errors })
    setIsProcessing(false)

    if (success > 0) {
      toast.success(`Successfully set ${success} PINs`)
    }
    if (failed > 0) {
      toast.error(`Failed to set ${failed} PINs`)
    }
  }

  const downloadTemplate = () => {
    const csvContent = "worker_id,worker_name,pin\n" +
      "uuid-here,John Doe,1234\n" +
      "uuid-here,Jane Smith,5678"
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'worker_pins_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk PIN Setup
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload a CSV file to set PINs for multiple workers at once
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Instructions */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <strong>CSV Format Required:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• First row: worker_id, worker_name, pin</li>
                <li>• worker_id: The UUID of the worker from your database</li>
                <li>• worker_name: Display name (for reference only)</li>
                <li>• pin: 4-8 digit PIN for the worker</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Template Download */}
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <p className="text-sm text-muted-foreground">
              Use the template to format your data correctly
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="cursor-pointer"
            />
          </div>

          {/* Data Preview */}
          {csvData.length > 0 && (
            <div className="space-y-2">
              <Label>Data Preview ({csvData.length} workers)</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">Worker Name</th>
                      <th className="p-2 text-left">PIN</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{item.workerName}</td>
                        <td className="p-2 font-mono">{item.pin}</td>
                        <td className="p-2">
                          <Badge variant={/^\d{4,8}$/.test(item.pin) ? "default" : "destructive"}>
                            {/^\d{4,8}$/.test(item.pin) ? "Valid" : "Invalid"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Process Button */}
          {csvData.length > 0 && (
            <Button
              onClick={processPins}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing PINs...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4 mr-2" />
                  Set PINs for {csvData.length} Workers
                </>
              )}
            </Button>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-2">
              <Label>Results</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700">Success</p>
                    <p className="text-sm text-green-600">{results.success} PINs set</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-red-700">Failed</p>
                    <p className="text-sm text-red-600">{results.failed} PINs failed</p>
                  </div>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-red-600">Errors:</Label>
                  <div className="max-h-32 overflow-y-auto text-sm text-red-600 bg-red-50 p-2 rounded">
                    {results.errors.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
