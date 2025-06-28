"use client"

import { useState, useEffect, useCallback, use } from "react"
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
  params: Promise<{
    hash: string
  }>
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
  const { hash } = use(params)
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
      
      console.log("Loading QR code data for hash:", hash)
      
      // Get QR code data and workers
      const qrResponse = await fetch(`/api/qr-clock/scan?hash=${hash}`)
      const qrData = await qrResponse.json()
      
      console.log("QR code API response:", qrData)
      
      if (!qrData.success) {
        setError("Invalid QR code")
        return
      }
      
      setQrCode(qrData.qr_code)
      console.log("QR code data:", qrData.qr_code)
      
      // Workers are now included in the QR code response
      if (qrData.workers && qrData.workers.length > 0) {
        console.log("Workers found:", qrData.workers)
        setWorkers(qrData.workers)
        setSelectedWorker(qrData.workers[0].id)
      } else {
        console.log('No workers found for this QR code')
        setWorkers([])
      }
      
    } catch (error) {
      console.error("Error loading QR code data:", error)
      setError("Failed to load QR code data")
    } finally {
      setLoading(false)
    }
  }, [hash])

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
    
    console.log("Starting scan with:", {
      selectedWorker,
      projectId: qrCode.project_location.project.id,
      biometricData,
      qrCodeHash: hash
    })
    
    try {
      setScanning(true)
      setScanResult(null)
      
      const scanPayload = {
        qr_code_hash: hash,
        worker_id: selectedWorker,
        project_id: qrCode.project_location.project.id,
        biometric_data: biometricData,
        device_info: {
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          location: await getLocationData(),
          device_id: await getDeviceId()
        }
      }
      
      console.log("Sending scan payload:", scanPayload)
      
      const response = await fetch("/api/qr-clock/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scanPayload),
      })

      const result = await response.json()
      console.log("Scan API response:", result)

      if (result.success) {
        setScanResult({
          success: true,
          message: result.message,
          action: result.action
        })
        setClockStatus(result.worker_status)
        toast.success(result.message)
      } else {
        console.log("Scan failed - Debug info:", result.debug)
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
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Gradient overlay with Bahamas colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-transparent to-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 via-transparent to-cyan-400/20"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-cyan-300/10 via-transparent to-yellow-300/10"></div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-yellow-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-cyan-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-yellow-300/15 to-cyan-300/15 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <Card className="w-full max-w-sm border-yellow-400/30 bg-black/50 backdrop-blur-sm">
            <CardContent className="text-center py-16">
              <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <p className="text-xl font-medium text-yellow-100">Loading...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Gradient overlay with Bahamas colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-transparent to-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 via-transparent to-cyan-400/20"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-cyan-300/10 via-transparent to-yellow-300/10"></div>
        
        {/* Animated gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-yellow-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-cyan-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-yellow-300/15 to-cyan-300/15 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <Card className="w-full max-w-sm border-yellow-400/30 bg-black/50 backdrop-blur-sm">
            <CardContent className="text-center py-16">
              <XCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-4 text-yellow-100">Invalid QR Code</h1>
              <p className="text-gray-300 mb-8 text-lg">{error}</p>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black text-lg px-8 py-4 h-auto font-semibold">
                  <ArrowLeft className="h-5 w-5 mr-3" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Gradient overlay with Bahamas colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-transparent to-black/60"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 via-transparent to-cyan-400/20"></div>
      <div className="absolute inset-0 bg-gradient-to-bl from-cyan-300/10 via-transparent to-yellow-300/10"></div>
      
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-yellow-400/30 to-cyan-400/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-cyan-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-yellow-300/15 to-cyan-300/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      
      <div className="relative z-10 max-w-sm mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="text-center pt-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white via-yellow-100 to-cyan-100 bg-clip-text text-transparent">
            Clock In/Out
          </h1>
          <p className="text-gray-300 text-lg">Secure biometric verification required</p>
        </div>

        {/* QR Code Info */}
        {qrCode && (
          <Card className="border-yellow-400/30 bg-black/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-yellow-100 text-xl">
                <Building className="h-6 w-6" />
                {qrCode.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-base">
                <MapPin className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <span className="font-medium text-yellow-100">Project:</span>
                  <span className="text-white ml-2 font-medium">{qrCode.project_location?.project?.name || 'Unknown Project'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-base">
                <MapPin className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <div>
                  <span className="font-medium text-yellow-100">Location:</span>
                  <span className="text-white ml-2 font-medium">{qrCode.project_location?.name || 'Unknown Location'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Worker Selection */}
        {authStep === 'select' && (
          <Card className="border-yellow-400/30 bg-black/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-yellow-100 text-xl">
                <User className="h-6 w-6" />
                Step 1: Select Worker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {workers.length > 0 ? (
                <>
                  <select
                    value={selectedWorker}
                    onChange={(e) => setSelectedWorker(e.target.value)}
                    className="w-full p-4 border border-yellow-400/30 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent bg-gradient-to-r from-gray-800 to-gray-900 text-white placeholder-gray-400 text-lg shadow-lg"
                  >
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id} className="text-white bg-gray-800">
                        {worker.name}
                      </option>
                    ))}
                  </select>
                  <Button 
                    onClick={handleWorkerSelect}
                    disabled={!selectedWorker}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold text-lg px-8 py-4 h-auto"
                  >
                    Continue to Verification
                  </Button>
                </>
              ) : (
                <div className="text-center py-12">
                  <User className="h-16 w-16 mx-auto text-yellow-400 mb-6" />
                  <h3 className="text-xl font-medium mb-4 text-yellow-100">No Workers Available</h3>
                  <p className="text-gray-300 mb-8 text-lg">
                    No active workers found in your company. Please add workers first.
                  </p>
                  <Link href="/dashboard/workers">
                    <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black text-lg px-8 py-4 h-auto font-semibold">
                      Go to Workers
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Biometric Authentication */}
        {authStep === 'biometric' && (
          <Card className="border-yellow-400/30 bg-black/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-yellow-100 text-xl">
                <Shield className="h-6 w-6" />
                Step 2: Biometric Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-base text-gray-300 mb-6">
                  Verify your identity to prevent buddy punching
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleBiometricAuth()}
                  disabled={scanning}
                  className="h-24 flex flex-col items-center justify-center bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Fingerprint className="h-10 w-10 mb-3" />
                  <span className="text-base font-semibold">Fingerprint</span>
                </Button>
                
                <Button
                  onClick={() => handleBiometricAuth()}
                  disabled={scanning}
                  className="h-24 flex flex-col items-center justify-center bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Camera className="h-10 w-10 mb-3" />
                  <span className="text-base font-semibold">Face ID</span>
                </Button>
              </div>

              {scanning && (
                <div className="text-center py-6">
                  <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-base text-gray-300">Verifying identity...</p>
                </div>
              )}

              <Button 
                onClick={resetFlow}
                variant="ghost"
                className="w-full text-gray-300 hover:text-yellow-100 hover:bg-yellow-400/10 text-lg py-4 h-auto"
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
              <Card className="border-yellow-400/30 bg-black/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-yellow-100 text-xl">
                    <Clock className="h-6 w-6" />
                    Current Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-gray-300">Status:</span>
                    <Badge variant={clockStatus.is_clocked_in ? "default" : "secondary"} className={`text-base px-4 py-2 ${clockStatus.is_clocked_in ? "bg-green-600" : "bg-gray-600"}`}>
                      {clockStatus.is_clocked_in ? "CLOCKED IN" : "CLOCKED OUT"}
                    </Badge>
                  </div>
                  {clockStatus.last_event_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium text-gray-300">Last Action:</span>
                      <span className="text-base text-gray-200">
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
              className="w-full h-20 text-xl font-semibold bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
              size="lg"
            >
              {scanning ? (
                <>
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mr-3" />
                  Processing...
                </>
              ) : (
                <>
                  <Clock className="h-6 w-6 mr-3" />
                  CLOCK {clockStatus?.is_clocked_in ? 'OUT' : 'IN'}
                </>
              )}
            </Button>

            <Button 
              onClick={resetFlow}
              variant="ghost"
              className="w-full text-gray-300 hover:text-yellow-100 hover:bg-yellow-400/10 text-lg py-4 h-auto"
            >
              Start Over
            </Button>
          </>
        )}

        {/* Scan Result */}
        {scanResult && (
          <Card className={`border-2 backdrop-blur-sm rounded-xl ${scanResult.success ? 'border-green-400/50 bg-green-900/20' : 'border-red-400/50 bg-red-900/20'}`}>
            <CardContent className="text-center py-12">
              {scanResult.success ? (
                <>
                  <CheckCircle className="h-20 w-20 text-green-400 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold text-green-100 mb-4">
                    {getActionMessage(scanResult.action)}
                  </h2>
                  <p className="text-green-200 text-xl">{scanResult.message}</p>
                </>
              ) : (
                <>
                  <XCircle className="h-20 w-20 text-red-400 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-red-100 mb-4">Error</h2>
                  <p className="text-red-200 text-lg">{scanResult.message}</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 