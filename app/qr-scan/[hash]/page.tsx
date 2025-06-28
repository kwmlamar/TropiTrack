"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  User,
  Building,
  MapPin,
  Fingerprint,
  Camera,
  Shield
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface QRScanPageProps {
  params: {
    hash: string
  }
}

interface Worker {
  id: string
  name: string
  biometric_id?: string
}

interface Project {
  id: string
  name: string
}

interface QRCodeData {
  id: string
  name: string
  project_location: {
    id: string
    name: string
    project: Project
  }
}

interface ClockStatus {
  is_clocked_in: boolean
  last_event_type: string
  last_event_time: string
}

export default function QRScanPage({ params }: QRScanPageProps) {
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [selectedWorker, setSelectedWorker] = useState<string>("")
  const [clockStatus, setClockStatus] = useState<ClockStatus | null>(null)
  const [scanResult, setScanResult] = useState<{
    success: boolean
    message: string
    action: 'clock_in' | 'clock_out'
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [authStep, setAuthStep] = useState<'select' | 'biometric' | 'complete'>('select')
  const [biometricData, setBiometricData] = useState<string | null>(null)

  const loadQRCodeData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get QR code data
      const qrResponse = await fetch(`/api/qr-clock/scan?hash=${params.hash}`)
      const qrData = await qrResponse.json()
      
      if (!qrData.success) {
        setError("Invalid QR code")
        return
      }
      
      setQrCode(qrData.qr_code)
      
      // Get workers for this company
      const workersResponse = await fetch('/api/workers')
      const workersData = await workersResponse.json()
      
      if (workersData.success) {
        setWorkers(workersData.workers)
        if (workersData.workers.length > 0) {
          setSelectedWorker(workersData.workers[0].id)
        }
      }
      
    } catch (error) {
      console.error("Error loading QR code data:", error)
      setError("Failed to load QR code data")
    } finally {
      setLoading(false)
    }
  }, [params.hash])

  useEffect(() => {
    loadQRCodeData()
  }, [loadQRCodeData])

  const handleWorkerSelect = () => {
    setAuthStep('biometric')
  }

  const handleBiometricAuth = async () => {
    try {
      setScanning(true)
      
      // Simulate biometric authentication
      // In production, you'd integrate with actual biometric APIs
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // For demo purposes, we'll simulate successful authentication
      const biometricId = `bio_${selectedWorker}_${Date.now()}`
      setBiometricData(biometricId)
      
      // Verify biometric against worker record
      const selectedWorkerData = workers.find(w => w.id === selectedWorker)
      if (!selectedWorkerData) {
        toast.error("Worker not found")
        return
      }

      // In production, verify biometric data against stored worker biometrics
      // For now, we'll assume authentication is successful
      
      setAuthStep('complete')
      toast.success("Biometric verification successful")
      
    } catch (error) {
      console.error("Biometric authentication failed:", error)
      toast.error("Biometric verification failed")
    } finally {
      setScanning(false)
    }
  }

  const handleScan = async () => {
    if (!selectedWorker || !qrCode || !biometricData) return
    
    try {
      setScanning(true)
      setScanResult(null)
      
      const response = await fetch("/api/qr-clock/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          qr_code_hash: params.hash,
          worker_id: selectedWorker,
          project_id: qrCode.project_location.project.id,
          biometric_data: biometricData,
          device_info: {
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            location: await getLocationData(),
            device_id: await getDeviceId()
          }
        }),
      })

      const result = await response.json()

      if (result.success) {
        setScanResult({
          success: true,
          message: result.message,
          action: result.action
        })
        setClockStatus(result.worker_status)
        toast.success(result.message)
      } else {
        setScanResult({
          success: false,
          message: result.message,
          action: 'clock_in'
        })
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error scanning QR code:", error)
      setScanResult({
        success: false,
        message: "Failed to process scan",
        action: 'clock_in'
      })
      toast.error("Failed to process scan")
    } finally {
      setScanning(false)
    }
  }

  const getLocationData = async () => {
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          })
        })
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
      }
    } catch {
      console.warn("Location access denied or unavailable")
    }
    return null
  }

  const getDeviceId = async () => {
    // Generate a device fingerprint based on available data
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('device fingerprint', 10, 10)
    const fingerprint = canvas.toDataURL()
    
    return btoa(fingerprint + navigator.userAgent + screen.width + screen.height)
  }

  const getActionMessage = (action: string) => {
    return action === 'clock_in' ? 'CLOCKED IN' : 'CLOCKED OUT'
  }

  const resetFlow = () => {
    setAuthStep('select')
    setBiometricData(null)
    setScanResult(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Loading...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Invalid QR Code</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link href="/dashboard">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Clock In/Out</h1>
          <p className="text-gray-600">Secure biometric verification required</p>
        </div>

        {/* QR Code Info */}
        {qrCode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {qrCode.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Project:</span>
                <span>{qrCode.project_location.project.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Location:</span>
                <span>{qrCode.project_location.name}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Worker Selection */}
        {authStep === 'select' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Step 1: Select Worker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
              <Button 
                onClick={handleWorkerSelect}
                disabled={!selectedWorker}
                className="w-full"
              >
                Continue to Verification
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Biometric Authentication */}
        {authStep === 'biometric' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Step 2: Biometric Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  Verify your identity to prevent buddy punching
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleBiometricAuth()}
                  disabled={scanning}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Fingerprint className="h-8 w-8 mb-2" />
                  <span className="text-sm">Fingerprint</span>
                </Button>
                
                <Button
                  onClick={() => handleBiometricAuth()}
                  disabled={scanning}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Camera className="h-8 w-8 mb-2" />
                  <span className="text-sm">Face ID</span>
                </Button>
              </div>

              {scanning && (
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Verifying identity...</p>
                </div>
              )}

              <Button 
                onClick={resetFlow}
                variant="ghost"
                className="w-full"
              >
                Back to Worker Selection
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Clock In/Out */}
        {authStep === 'complete' && (
          <>
            {/* Current Status */}
            {clockStatus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={clockStatus.is_clocked_in ? "default" : "secondary"}>
                      {clockStatus.is_clocked_in ? "CLOCKED IN" : "CLOCKED OUT"}
                    </Badge>
                  </div>
                  {clockStatus.last_event_time && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium">Last Action:</span>
                      <span className="text-sm text-gray-600">
                        {new Date(clockStatus.last_event_time).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Scan Button */}
            <Button
              onClick={handleScan}
              disabled={scanning}
              className="w-full h-16 text-lg font-semibold"
              size="lg"
            >
              {scanning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 mr-2" />
                  CLOCK {clockStatus?.is_clocked_in ? 'OUT' : 'IN'}
                </>
              )}
            </Button>

            <Button 
              onClick={resetFlow}
              variant="outline"
              className="w-full"
            >
              Start Over
            </Button>
          </>
        )}

        {/* Scan Result */}
        {scanResult && (
          <Card className={`border-2 ${scanResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="text-center py-8">
              {scanResult.success ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-800 mb-2">
                    {getActionMessage(scanResult.action)}
                  </h2>
                  <p className="text-green-700 text-lg">{scanResult.message}</p>
                </>
              ) : (
                <>
                  <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
                  <p className="text-red-700">{scanResult.message}</p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <div className="text-center">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 