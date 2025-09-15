"use client"

import { useState, useEffect, useCallback, use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  User,
  Building,
  MapPin,
  Shield,
  Loader2,
  Globe,
  Key
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { verifyWorkerPin, hasWorkerPin, setWorkerPin } from "@/lib/data/worker-pins"

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
    verifyIdentity: "Please enter your PIN to verify your identity",
    fingerprint: "Fingerprint",
    faceId: "Face ID",
    verifyingIdentity: "Verifying identity...",
    enterPin: "Enter 4-Digit PIN",
    pinPlaceholder: "Enter PIN",
    pinVerification: "PIN Verification",
    setupPin: "Set Up PIN",
    setupPinMessage: "Set up a secure PIN for clock in/out verification",
    confirmPin: "Confirm PIN",
    settingUpPin: "Setting up PIN...",
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
    verifyIdentity: "Tanpri antre PIN ou pou verifye idantite ou",
    fingerprint: "Anprent Dijital",
    faceId: "Id Figi",
    verifyingIdentity: "Verifye idantite...",
    enterPin: "Antre PIN 4-Chif",
    pinPlaceholder: "Antre PIN",
    pinVerification: "Verifikasyon PIN",
    setupPin: "Konfigire PIN",
    setupPinMessage: "Konfigire yon PIN sekirite pou verifikasyon antre-soti",
    confirmPin: "Konfime PIN",
    settingUpPin: "Ap konfigire PIN...",
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
  const [authStep, setAuthStep] = useState<'language' | 'select' | 'biometric' | 'pin-setup' | 'complete'>('select')
  const [biometricData, setBiometricData] = useState<string | null>(null)
  const [pin, setPin] = useState<string>('')
  const [confirmPin, setConfirmPin] = useState<string>('')
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


  const handleWorkerSelect = async () => {
    console.log("handleWorkerSelect called with selectedWorker:", selectedWorker)
    
    if (!selectedWorker) {
      console.log("No worker selected, returning")
      return
    }
    
    try {
      console.log("Checking PIN status for worker:", selectedWorker)
      // Check if worker has a PIN set up
      const result = await hasWorkerPin(selectedWorker)
      console.log("PIN status result:", result)
      
      if (result.success) {
        if (result.data) {
          // Worker has PIN, go to verification
          console.log("Worker has PIN, going to verification")
          setAuthStep('biometric')
        } else {
          // Worker doesn't have PIN, go to setup
          console.log("Worker doesn't have PIN, going to setup")
          setAuthStep('pin-setup')
        }
      } else {
        console.log("Failed to check PIN status:", result.error)
        toast.error("Failed to check PIN status")
        setAuthStep('biometric') // Fallback to verification
      }
    } catch (error) {
      console.error("Error checking PIN status:", error)
      toast.error("Failed to check PIN status")
      setAuthStep('biometric') // Fallback to verification
    }
  }

  const handlePinSetup = async () => {
    try {
      setScanning(true)
      
      // Validate PIN length
      if (pin.length !== 4) {
        toast.error("Please enter a 4-digit PIN")
        return
      }
      
      if (!/^\d+$/.test(pin)) {
        toast.error("PIN must contain only numbers")
        return
      }
      
      if (pin !== confirmPin) {
        toast.error("PINs do not match")
        return
      }
      
      // Set PIN for worker
      const result = await setWorkerPin("", selectedWorker, pin)
      
      if (!result.success) {
        toast.error(result.error || "Failed to set PIN")
        return
      }
      
      if (!result.data) {
        toast.error("Failed to set PIN")
        return
      }

      // PIN set successfully, proceed to verification
      toast.success("PIN set successfully!")
      setAuthStep('biometric')
      
    } catch (error) {
      console.error("PIN setup failed:", error)
      toast.error("PIN setup failed")
    } finally {
      setScanning(false)
    }
  }

  const handlePinVerification = async () => {
    try {
      setScanning(true)
      
      // Validate PIN length
      if (pin.length !== 4) {
        toast.error("Please enter a 4-digit PIN")
        return
      }
      
      // Verify PIN against worker's stored PIN
      const result = await verifyWorkerPin(selectedWorker, pin)
      
      if (!result.success) {
        toast.error(result.error || "PIN verification failed")
        return
      }
      
      if (!result.data) {
        toast.error("Invalid PIN. Please try again.")
        return
      }

      // Successful verification
      const pinId = `pin_${selectedWorker}_${Date.now()}`
      setBiometricData(pinId)
      
      setAuthStep('complete')
      toast.success("PIN verification successful")
      
    } catch (error) {
      console.error("PIN verification failed:", error)
      toast.error("PIN verification failed")
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
    setAuthStep('select')
    setBiometricData(null)
    setPin('')
    setConfirmPin('')
    setShowPinSetup(false)
    setScanResult(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12 sm:py-16">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin mx-auto mb-4 sm:mb-6 text-primary" />
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">{t.loading}</h2>
            <p className="text-sm sm:text-base text-gray-500">{t.loadingSubtitle}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12 sm:py-16">
            <XCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-destructive" />
            <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{t.invalidQR}</h1>
            <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">{error}</p>
            <Link href="/dashboard">
              <Button className="w-full h-10 sm:h-11 text-sm sm:text-base">
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
      <div className="bg-primary text-primary-foreground py-3 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {/* Mobile-first header layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{t.kioskTitle}</h1>
                <p className="text-xs sm:text-sm opacity-90">{t.kioskSubtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:gap-6">
              {/* Language Dropdown */}
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 opacity-80" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-white text-black border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer min-w-[100px] sm:min-w-[120px]"
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
                <div className="text-xs sm:text-sm opacity-90">
                  {currentTime.toLocaleDateString()}
                </div>
                <div className="text-sm sm:text-lg font-semibold">
                  {currentTime.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">

        {/* QR Code Info */}
        {qrCode && (
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
            <CardContent className="space-y-4 sm:space-y-6">
              {workers.length > 0 ? (
                <>
                  <div className="space-y-3">
                    <label className="text-sm sm:text-base font-medium">{t.selectWorker}</label>
                    <select
                      value={selectedWorker}
                      onChange={(e) => setSelectedWorker(e.target.value)}
                      className="w-full p-3 sm:p-4 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground text-base sm:text-lg min-h-[48px]"
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
                    className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
                    size="lg"
                  >
                    {t.continueToVerification}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 sm:py-12">
                  <User className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-gray-500 mb-4 sm:mb-6" />
                  <h3 className="text-lg sm:text-xl font-medium mb-3 sm:mb-4">{t.noWorkersTitle}</h3>
                  <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">
                    {t.noWorkersMessage}
                  </p>
                  <Link href="/dashboard/workers">
                    <Button size="lg" className="h-12 text-base">
                      {t.goToWorkers}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: PIN Verification */}
        {authStep === 'biometric' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                {t.pinVerification}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
                  {t.verifyIdentity}
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <label className="block text-sm sm:text-base font-medium mb-3">
                    {t.enterPin}
                  </label>
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setPin(value)
                    }}
                    placeholder={t.pinPlaceholder}
                    className="text-center text-xl sm:text-2xl font-mono tracking-widest h-14 sm:h-16 text-base sm:text-lg max-w-[200px] mx-auto"
                    maxLength={4}
                    autoComplete="off"
                  />
                  <div className="flex justify-center gap-2 mt-4">
                    {[1, 2, 3, 4].map((digit) => (
                      <div
                        key={digit}
                        className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                          digit <= pin.length ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {scanning && (
                  <div className="text-center py-4 sm:py-6">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4 text-primary" />
                    <p className="text-sm sm:text-base text-gray-500">{t.verifyingIdentity}</p>
                  </div>
                )}

                <Button 
                  onClick={handlePinVerification}
                  disabled={scanning || pin.length !== 4}
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
                  size="lg"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                      {t.verifyingIdentity}
                    </>
                  ) : (
                    t.enterPin
                  )}
                </Button>
              </div>

              <Button 
                onClick={resetFlow}
                variant="ghost"
                className="w-full h-10 sm:h-11 text-sm sm:text-base"
              >
                {t.backToWorkerSelection}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2.5: PIN Setup */}
        {authStep === 'pin-setup' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Key className="h-6 w-6 text-primary" />
                {t.setupPin}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
                  {t.setupPinMessage}
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="text-center">
                  <label className="block text-sm sm:text-base font-medium mb-3">
                    {t.enterPin}
                  </label>
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setPin(value)
                    }}
                    placeholder={t.pinPlaceholder}
                    className="text-center text-xl sm:text-2xl font-mono tracking-widest h-14 sm:h-16 text-base sm:text-lg max-w-[200px] mx-auto"
                    maxLength={4}
                    autoComplete="off"
                  />
                  <div className="flex justify-center gap-2 mt-4">
                    {[1, 2, 3, 4].map((digit) => (
                      <div
                        key={digit}
                        className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${
                          digit <= pin.length ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-center">
                  <label className="block text-sm sm:text-base font-medium mb-3">
                    {t.confirmPin}
                  </label>
                  <Input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setConfirmPin(value)
                    }}
                    placeholder={t.pinPlaceholder}
                    className="text-center text-xl sm:text-2xl font-mono tracking-widest h-14 sm:h-16 text-base sm:text-lg max-w-[200px] mx-auto"
                    maxLength={4}
                    autoComplete="off"
                  />
                  <div className="flex justify-center gap-2 mt-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((digit) => (
                      <div
                        key={digit}
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                          digit <= confirmPin.length ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {scanning && (
                  <div className="text-center py-4 sm:py-6">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-3 sm:mb-4 text-primary" />
                    <p className="text-sm sm:text-base text-gray-500">{t.settingUpPin}</p>
                  </div>
                )}

                <Button 
                  onClick={handlePinSetup}
                  disabled={scanning || pin.length < 4 || pin !== confirmPin}
                  className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold"
                  size="lg"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                      {t.settingUpPin}
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      {t.setupPin}
                    </>
                  )}
                </Button>

                <Button 
                  onClick={resetFlow}
                  variant="outline"
                  className="w-full h-10 sm:h-11 text-sm sm:text-base"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t.backToWorkerSelection}
                </Button>
              </div>
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
              className="w-full h-16 sm:h-20 text-lg sm:text-xl font-semibold"
              size="lg"
            >
              {scanning ? (
                <>
                  <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 animate-spin" />
                  {t.processing}
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                  {clockStatus?.is_clocked_in ? t.clockOut : t.clockIn}
                </>
              )}
            </Button>

            {/* Scan Result */}
            {scanResult && (
              <Card className={scanResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <CardContent className="text-center py-6 sm:py-8">
                  {scanResult.success ? (
                    <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-green-600" />
                  ) : (
                    <XCircle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-red-600" />
                  )}
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">
                    {scanResult.success ? t.success : t.error}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
                    {scanResult.message}
                  </p>
                  <Button onClick={resetFlow} variant="outline" className="h-10 sm:h-11 text-sm sm:text-base">
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