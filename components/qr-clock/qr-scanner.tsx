"use client"

import { useState } from "react"
import { QrReader } from "react-qr-reader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Camera, CheckCircle, XCircle, User } from "lucide-react"
import { toast } from "sonner"
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"
import type { WorkerClockStatus } from "@/lib/types/qr-clock"

interface QRScannerProps {
  worker: Worker
  project: Project
  onScanSuccess?: (result: { success: boolean; message: string; event?: { event_time: string; worker?: { name: string }; project?: { name: string }; project_location?: { name: string } } }) => void
  onScanError?: (error: string) => void
}

export function QRScanner({ worker, project, onScanSuccess, onScanError }: QRScannerProps) {
  const [scanning, setScanning] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastScanResult, setLastScanResult] = useState<{ success: boolean; message: string; event?: { event_time: string; worker?: { name: string }; project?: { name: string }; project_location?: { name: string } } } | null>(null)
  const [workerStatus, setWorkerStatus] = useState<WorkerClockStatus | null>(null)

  // Get device info for tracking
  const getDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      fingerprint: `${navigator.userAgent}_${navigator.platform}_${window.screen.width}x${window.screen.height}`
    } as Record<string, unknown> // Type as Record to allow dynamic gps property
  }

  // Get GPS coordinates if available
  const getGPSLocation = (): Promise<{ latitude: number; longitude: number; accuracy?: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        () => {
          resolve(null)
        },
        { timeout: 5000, enableHighAccuracy: false }
      )
    })
  }

  const handleScan = async (result: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!result || processing) return

    setProcessing(true)
    setError(null)

    try {
      // Extract QR code hash from the scanned result
      const qrCodeHash = result.text

      // Get GPS location
      const gpsLocation = await getGPSLocation()
      const deviceInfo = getDeviceInfo()
      if (gpsLocation) {
        deviceInfo.gps = gpsLocation
      }

      // Send scan to API
      const response = await fetch("/api/qr-clock/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qr_code_hash: qrCodeHash,
          worker_id: worker.id,
          project_id: project.id,
          event_type: "clock_in", // This will be determined by the QR code type
          device_info: deviceInfo,
          notes: ""
        }),
      })

      const scanResult = await response.json()

      if (scanResult.success) {
        setLastScanResult(scanResult)
        setWorkerStatus(scanResult.worker_status)
        toast.success(scanResult.message)
        onScanSuccess?.(scanResult)
        
        // Stop scanning after successful scan
        setScanning(false)
      } else {
        setError(scanResult.message)
        toast.error(scanResult.message)
        onScanError?.(scanResult.message)
      }
    } catch (error) {
      const errorMessage = "Failed to process QR code scan"
      setError(errorMessage)
      toast.error(errorMessage)
      onScanError?.(errorMessage)
      console.error("QR scan error:", error)
    } finally {
      setProcessing(false)
    }
  }

  const startScanning = () => {
    setScanning(true)
    setError(null)
    setLastScanResult(null)
  }

  const stopScanning = () => {
    setScanning(false)
  }

  const getStatusBadge = (status: WorkerClockStatus | null) => {
    if (!status) {
      return <Badge variant="secondary">No Status</Badge>
    }

    switch (status.last_event_type) {
      case 'clock_in':
        return <Badge className="bg-green-100 text-green-800">Clocked In</Badge>
      case 'clock_out':
        return <Badge variant="secondary">Clocked Out</Badge>
      case 'break_start':
        return <Badge className="bg-yellow-100 text-yellow-800">On Break</Badge>
      case 'break_end':
        return <Badge className="bg-green-100 text-green-800">Clocked In</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Worker and Project Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Worker Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Worker</p>
              <p className="font-semibold">{worker.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Project</p>
              <p className="font-semibold">{project.name}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current Status</p>
            <div className="mt-1">
              {getStatusBadge(workerStatus)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            QR Code Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!scanning ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                <Camera className="h-16 w-16 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Click the button below to start scanning QR codes
              </p>
              <Button onClick={startScanning} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <QrReader
                  onResult={handleScan}
                  constraints={{ facingMode: "environment" }}
                  className="w-full max-w-md mx-auto"
                />
                {processing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="bg-white p-4 rounded-lg flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={stopScanning} 
                  variant="outline" 
                  className="flex-1"
                  disabled={processing}
                >
                  Stop Scanning
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Last Scan Result */}
          {lastScanResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">{lastScanResult.message}</p>
                  <div className="text-sm text-muted-foreground">
                    <p>Time: {lastScanResult.event?.event_time ? new Date(lastScanResult.event.event_time).toLocaleString() : 'Unknown'}</p>
                    <p>Location: {lastScanResult.event?.project_location?.name || "Unknown"}</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 