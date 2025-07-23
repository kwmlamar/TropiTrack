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
  Shield,
  Loader2,
  Globe
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

type Language = 'english' | 'creole'

const translations = {
  english: {
    kioskTitle: "TropiTrack Kiosk",
    kioskSubtitle: "Time & Attendance System",
    loading: "Loading...",
    loadingSubtitle: "Preparing clock-in system",
    invalidQR: "Invalid QR Code",
    backToDashboard: "Back to Dashboard",
    step1Title: "Step 1: Select Your Name",
    step2Title: "Step 2: Identity Verification",
    step3Title: "Step 3: Clock In/Out",
    selectWorker: "Select Worker:",
    continueToVerification: "Continue to Verification",
    noWorkersTitle: "No Workers Available",
    noWorkersMessage: "No active workers found in your company. Please add workers first.",
    goToWorkers: "Go to Workers",
    verifyIdentity: "Please verify your identity to prevent buddy punching",
    fingerprint: "Fingerprint",
    faceId: "Face ID",
    verifyingIdentity: "Verifying identity...",
    backToWorkerSelection: "Back to Worker Selection",
    currentStatus: "Current Status",
    status: "Status:",
    lastAction: "Last Action:",
    clockIn: "Clock In",
    clockOut: "Clock Out",
    processing: "Processing...",
    success: "Success!",
    error: "Error",
    clockInOutAgain: "Clock In/Out Again",
    languageSelection: "Select Language / Chwazi Lang",
    english: "English",
    creole: "Kreyòl"
  },
  creole: {
    kioskTitle: "TropiTrack Kiosk",
    kioskSubtitle: "Sistèm Tan ak Prezans",
    loading: "Chaje...",
    loadingSubtitle: "Prepare sistèm antre-soti",
    invalidQR: "Kòd QR Envalid",
    backToDashboard: "Retounen nan Tablo",
    step1Title: "Etap 1: Chwazi Non Ou",
    step2Title: "Etap 2: Verifikasyon Idantite",
    step3Title: "Etap 3: Antre-Soti",
    selectWorker: "Chwazi Travayè:",
    continueToVerification: "Kontinye nan Verifikasyon",
    noWorkersTitle: "Pa Gen Travayè Disponib",
    noWorkersMessage: "Pa gen travayè aktif yo jwenn nan konpayi ou. Tanpri ajoute travayè anvan.",
    goToWorkers: "Ale nan Travayè",
    verifyIdentity: "Tanpri verifye idantite ou pou anpeche frape kòkòt",
    fingerprint: "Anprent Dijital",
    faceId: "Id Figi",
    verifyingIdentity: "Verifye idantite...",
    backToWorkerSelection: "Retounen nan Seleksyon Travayè",
    currentStatus: "Estati Aktyèl",
    status: "Estati:",
    lastAction: "Dènye Aksyon:",
    clockIn: "Antre",
    clockOut: "Soti",
    processing: "Pwosesis...",
    success: "Siksè!",
    error: "Erè",
    clockInOutAgain: "Antre-Soti Ankò",
    languageSelection: "Select Language / Chwazi Lang",
    english: "English",
    creole: "Kreyòl"
  }
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
  const [authStep, setAuthStep] = useState<'language' | 'select' | 'biometric' | 'complete'>('language')
  const [biometricData, setBiometricData] = useState<string | null>(null)
  const [language, setLanguage] = useState<Language>('english')
  const [currentTime, setCurrentTime] = useState(new Date())

  const t = translations[language]

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

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

  const handleLanguageSelect = (selectedLanguage: Language) => {
    setLanguage(selectedLanguage)
    setAuthStep('select')
  }

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
          message: result.message || "Scan failed",
          action: 'clock_in'
        })
        toast.error(result.message || "Scan failed")
      }
    } catch (error) {
      console.error("Scan error:", error)
      setScanResult({
        success: false,
        message: "Network error occurred",
        action: 'clock_in'
      })
      toast.error("Network error occurred")
    } finally {
      setScanning(false)
    }
  }

  const getLocationData = async () => {
    try {
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false
          })
        })
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        }
      }
    } catch {
      console.log("Location access denied or unavailable")
    }
    return null
  }

  const getDeviceId = async () => {
    // Generate a simple device fingerprint
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx?.fillText('device-fingerprint', 0, 0)
    return canvas.toDataURL().slice(-20)
  }



  const resetFlow = () => {
    setAuthStep('language')
    setBiometricData(null)
    setScanResult(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-16">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-primary" />
            <h2 className="text-2xl font-semibold mb-2">{t.loading}</h2>
            <p className="text-gray-500">{t.loadingSubtitle}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-16">
            <XCircle className="h-16 w-16 mx-auto mb-6 text-destructive" />
            <h1 className="text-2xl font-bold mb-4">{t.invalidQR}</h1>
            <p className="text-gray-500 mb-8">{error}</p>
            <Link href="/dashboard">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.backToDashboard}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Kiosk Header */}
      <div className="bg-primary text-primary-foreground py-4 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">{t.kioskTitle}</h1>
              <p className="text-sm opacity-90">{t.kioskSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {/* Language Dropdown */}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 opacity-80" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-white text-black border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer min-w-[120px]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2rem'
                }}
              >
                <option value="english" style={{ backgroundColor: 'white', color: 'black' }}>🇺🇸 English</option>
                <option value="creole" style={{ backgroundColor: 'white', color: 'black' }}>🇭🇹 Kreyòl</option>
              </select>
            </div>
            
            {/* Date and Time */}
            <div className="text-right">
              <div className="text-sm opacity-90">
                {currentTime.toLocaleDateString()}
              </div>
              <div className="text-lg font-semibold">
                {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Language Selection */}
        {authStep === 'language' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-primary" />
                {t.languageSelection}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleLanguageSelect('english')}
                  className="h-20 flex flex-col items-center justify-center text-lg font-semibold"
                  size="lg"
                >
                  <span className="text-2xl mb-2">🇺🇸</span>
                  {t.english}
                </Button>
                
                <Button
                  onClick={() => handleLanguageSelect('creole')}
                  className="h-20 flex flex-col items-center justify-center text-lg font-semibold"
                  size="lg"
                >
                  <span className="text-2xl mb-2">🇭🇹</span>
                  {t.creole}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* QR Code Info */}
        {qrCode && authStep !== 'language' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Building className="h-6 w-6 text-primary" />
                {qrCode.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0" />
                <div>
                  <span className="font-medium">Project:</span>
                  <span className="ml-2">{qrCode.project_location?.project?.name || 'Unknown Project'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500 flex-shrink-0" />
                <div>
                  <span className="font-medium">Location:</span>
                  <span className="ml-2">{qrCode.project_location?.name || 'Unknown Location'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1: Worker Selection */}
        {authStep === 'select' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <User className="h-6 w-6 text-primary" />
                {t.step1Title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {workers.length > 0 ? (
                <>
                  <div className="space-y-3">
                    <label className="text-sm font-medium">{t.selectWorker}</label>
                    <select
                      value={selectedWorker}
                      onChange={(e) => setSelectedWorker(e.target.value)}
                      className="w-full p-4 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground text-lg"
                    >
                      {workers.map((worker) => (
                        <option key={worker.id} value={worker.id}>
                          {worker.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button 
                    onClick={handleWorkerSelect}
                    disabled={!selectedWorker}
                    className="w-full h-14 text-lg font-semibold"
                    size="lg"
                  >
                    {t.continueToVerification}
                  </Button>
                </>
              ) : (
                <div className="text-center py-12">
                  <User className="h-16 w-16 mx-auto text-gray-500 mb-6" />
                  <h3 className="text-xl font-medium mb-4">{t.noWorkersTitle}</h3>
                  <p className="text-gray-500 mb-8">
                    {t.noWorkersMessage}
                  </p>
                  <Link href="/dashboard/workers">
                    <Button size="lg">
                      {t.goToWorkers}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Biometric Authentication */}
        {authStep === 'biometric' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                {t.step2Title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-gray-500 mb-6">
                  {t.verifyIdentity}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleBiometricAuth()}
                  disabled={scanning}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center border-2 hover:border-primary"
                >
                  <Fingerprint className="h-10 w-10 mb-3 text-primary" />
                  <span className="text-base font-semibold">{t.fingerprint}</span>
                </Button>
                
                <Button
                  onClick={() => handleBiometricAuth()}
                  disabled={scanning}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center border-2 hover:border-primary"
                >
                  <Camera className="h-10 w-10 mb-3 text-primary" />
                  <span className="text-base font-semibold">{t.faceId}</span>
                </Button>
              </div>

              {scanning && (
                <div className="text-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-gray-500">{t.verifyingIdentity}</p>
                </div>
              )}

              <Button 
                onClick={resetFlow}
                variant="ghost"
                className="w-full"
              >
                {t.backToWorkerSelection}
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
                  <CardTitle className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-primary" />
                    {t.currentStatus}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t.status}</span>
                    <Badge variant={clockStatus.is_clocked_in ? "default" : "secondary"} className="text-base px-4 py-2">
                      {clockStatus.is_clocked_in ? "CLOCKED IN" : "CLOCKED OUT"}
                    </Badge>
                  </div>
                  {clockStatus.last_event_time && (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t.lastAction}</span>
                      <span>
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
              className="w-full h-20 text-xl font-semibold"
              size="lg"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                  {t.processing}
                </>
              ) : (
                <>
                  <Clock className="h-6 w-6 mr-3" />
                  {clockStatus?.is_clocked_in ? t.clockOut : t.clockIn}
                </>
              )}
            </Button>

            {/* Scan Result */}
            {scanResult && (
              <Card className={scanResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <CardContent className="text-center py-8">
                  {scanResult.success ? (
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
                  ) : (
                    <XCircle className="h-16 w-16 mx-auto mb-4 text-red-600" />
                  )}
                  <h3 className="text-xl font-semibold mb-2">
                    {scanResult.success ? t.success : t.error}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {scanResult.message}
                  </p>
                  <Button onClick={resetFlow} variant="outline">
                    {t.clockInOutAgain}
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
} 