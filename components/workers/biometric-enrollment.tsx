"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle, Fingerprint, User, Smartphone, Shield, Info } from "lucide-react"
import { toast } from "sonner"
import { WebAuthnManager, BiometricEnrollmentResult } from '@/lib/utils/webauthn'

interface BiometricEnrollmentProps {
  workerId: string
  workerName: string
  onEnrollmentComplete: () => void
  onCancel: () => void
}

type EnrollmentStep = 'compatibility' | 'selection' | 'enrollment' | 'verification' | 'complete'
type EnrollmentType = 'fingerprint' | 'face' | 'both'

export function BiometricEnrollment({ workerId, workerName, onEnrollmentComplete, onCancel }: BiometricEnrollmentProps) {
  const [currentStep, setCurrentStep] = useState<EnrollmentStep>('compatibility')
  const [selectedType, setSelectedType] = useState<EnrollmentType | null>(null)
  const [deviceCompatibility, setDeviceCompatibility] = useState({
    fingerprint: false,
    face: false,
    webauthn: false
  })
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrollmentProgress, setEnrollmentProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [, setEnrollmentData] = useState<BiometricEnrollmentResult | null>(null)
  const [capturePhase, setCapturePhase] = useState<'ready' | 'capturing' | 'processing'>('ready')
  const [webauthnManager] = useState(() => WebAuthnManager.getInstance())

  useEffect(() => {
    checkDeviceCompatibility()
  }, [])

  const checkDeviceCompatibility = async () => {
    try {
      const compatibility = await webauthnManager.isBiometricAvailable()
      setDeviceCompatibility(compatibility)
      
      if (!compatibility.webauthn) {
        setError('This device does not support WebAuthn biometric authentication.')
      }
    } catch (err) {
      console.error('Device compatibility check failed:', err)
      setError('Failed to check device compatibility.')
    }
  }

  const handleTypeSelection = (type: EnrollmentType) => {
    setSelectedType(type)
    setCurrentStep('enrollment')
  }

  const performRealEnrollment = async () => {
    if (!selectedType) return
    
    setIsEnrolling(true)
    setEnrollmentProgress(0)
    setError(null)
    setCapturePhase('ready')

    try {
      // Phase 1: Prepare for capture
      setCapturePhase('ready')
      setEnrollmentProgress(10)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Phase 2: Generate WebAuthn enrollment options
      setEnrollmentProgress(20)
      const enrollmentOptions = await webauthnManager.generateEnrollmentOptions(
        workerId,
        workerName,
        workerName,
        selectedType
      )
      
      // Phase 3: Start real biometric capture
      setCapturePhase('capturing')
      setEnrollmentProgress(30)
      
      // This will trigger the device's biometric prompt (fingerprint sensor, camera, etc.)
      const enrollmentResult = await webauthnManager.enroll(enrollmentOptions)
      
      setEnrollmentProgress(80)
      setCapturePhase('processing')
      
      // Phase 4: Process captured data
      setEnrollmentData(enrollmentResult)
      setEnrollmentProgress(90)
      await new Promise(resolve => setTimeout(resolve, 500))

      // Phase 5: Store enrollment via API
      const response = await fetch('/api/biometric-enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_id: workerId,
          enrollment_type: selectedType,
          device_id: webauthnManager.getDeviceInfo().platform,
          template_hash: enrollmentResult.credentialId, // Use credential ID as template hash
          webauthn_data: {
            credentialId: enrollmentResult.credentialId,
            publicKey: enrollmentResult.publicKey,
            attestationObject: enrollmentResult.attestationObject,
            clientDataJSON: enrollmentResult.clientDataJSON,
            rawId: enrollmentResult.rawId
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create enrollment');
      }

      setEnrollmentProgress(100)
      setCurrentStep('verification')
      
      // Phase 6: Test verification
      await testVerification(enrollmentResult.credentialId)
      
      setCurrentStep('complete')
      
      // Call completion callback after a delay
      setTimeout(() => {
        onEnrollmentComplete()
      }, 2000)

    } catch (err) {
      console.error('Real enrollment error:', err)
      setError(err instanceof Error ? err.message : 'Enrollment failed')
      setCurrentStep('enrollment')
    } finally {
      setIsEnrolling(false)
      setCapturePhase('ready')
    }
  }

  const testVerification = async (credentialId: string) => {
    try {
      // Generate verification options
      const verificationOptions = await webauthnManager.generateVerificationOptions([credentialId])
      
      // Perform verification (this will trigger biometric prompt again)
      const verificationResult = await webauthnManager.verify(verificationOptions)
      
      // Send verification to API
      const response = await fetch('/api/qr-clock/biometric-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_id: workerId,
          verification_type: selectedType,
          device_id: webauthnManager.getDeviceInfo().platform,
          template_hash: credentialId,
          webauthn_data: verificationResult
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }
      
      console.log('Verification test successful:', result)
      
    } catch (err) {
      console.error('Verification test failed:', err)
      // Don't fail the enrollment if verification test fails
      toast.warning('Enrollment completed but verification test failed. You can test later.')
    }
  }

  const getCaptureInstructions = () => {
    switch (selectedType) {
      case 'fingerprint':
        return 'Place your finger on the fingerprint sensor and follow the device prompts.'
      case 'face':
        return 'Position your face in front of the camera and follow the device prompts.'
      case 'both':
        return 'Follow the device prompts for both fingerprint and face recognition.'
      default:
        return ''
    }
  }

  const getCaptureIcon = () => {
    switch (selectedType) {
      case 'fingerprint':
        return <Fingerprint className="h-12 w-12 text-blue-600" />
      case 'face':
        return <User className="h-12 w-12 text-blue-600" />
      case 'both':
        return (
          <div className="flex space-x-2">
            <Fingerprint className="h-12 w-12 text-blue-600" />
            <User className="h-12 w-12 text-blue-600" />
          </div>
        )
      default:
        return <Shield className="h-12 w-12 text-blue-600" />
    }
  }

  const getStepContent = () => {
    switch (currentStep) {
      case 'compatibility':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold">Device Compatibility Check</h3>
              <p className="text-gray-500">Checking if your device supports biometric authentication...</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Fingerprint className="h-5 w-5" />
                  <span>Fingerprint Reader</span>
                </div>
                <Badge variant={deviceCompatibility.fingerprint ? "default" : "secondary"}>
                  {deviceCompatibility.fingerprint ? "Available" : "Not Available"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5" />
                  <span>Face Recognition</span>
                </div>
                <Badge variant={deviceCompatibility.face ? "default" : "secondary"}>
                  {deviceCompatibility.face ? "Available" : "Not Available"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5" />
                  <span>WebAuthn Support</span>
                </div>
                <Badge variant={deviceCompatibility.webauthn ? "default" : "secondary"}>
                  {deviceCompatibility.webauthn ? "Available" : "Not Available"}
                </Badge>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => setCurrentStep('selection')} 
                disabled={!deviceCompatibility.webauthn}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )

      case 'selection':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Choose Biometric Method</h3>
              <p className="text-gray-500">Select how you&apos;d like to authenticate</p>
            </div>
            
            <div className="grid gap-3">
              {deviceCompatibility.fingerprint && (
                <Button
                  variant="outline"
                  className="h-16 justify-start"
                  onClick={() => handleTypeSelection('fingerprint')}
                >
                  <Fingerprint className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Fingerprint</div>
                    <div className="text-sm text-gray-500">Use your fingerprint to clock in/out</div>
                  </div>
                </Button>
              )}
              
              {deviceCompatibility.face && (
                <Button
                  variant="outline"
                  className="h-16 justify-start"
                  onClick={() => handleTypeSelection('face')}
                >
                  <User className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Face Recognition</div>
                    <div className="text-sm text-gray-500">Use your face to clock in/out</div>
                  </div>
                </Button>
              )}
              
              {deviceCompatibility.fingerprint && deviceCompatibility.face && (
                <Button
                  variant="outline"
                  className="h-16 justify-start"
                  onClick={() => handleTypeSelection('both')}
                >
                  <div className="flex space-x-2 mr-3">
                    <Fingerprint className="h-5 w-5" />
                    <User className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Both Methods</div>
                    <div className="text-sm text-gray-500">Use either fingerprint or face recognition</div>
                  </div>
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setCurrentStep('compatibility')} className="flex-1">
                Back
              </Button>
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )

      case 'enrollment':
        return (
          <div className="space-y-4">
            <div className="text-center">
              {getCaptureIcon()}
              <h3 className="text-lg font-semibold mt-4">Biometric Enrollment</h3>
              <p className="text-gray-500">{getCaptureInstructions()}</p>
            </div>
            
            <div className="space-y-4">
              <Progress value={enrollmentProgress} className="w-full" />
              
              <div className="text-center">
                {capturePhase === 'ready' && (
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <Info className="h-4 w-4" />
                    <span>Preparing biometric capture...</span>
                  </div>
                )}
                
                {capturePhase === 'capturing' && (
                  <div className="flex items-center justify-center space-x-2 text-orange-600">
                    <Fingerprint className="h-4 w-4 animate-pulse" />
                    <span>Follow device prompts for biometric capture</span>
                  </div>
                )}
                
                {capturePhase === 'processing' && (
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Processing captured data...</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('selection')} 
                disabled={isEnrolling}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={performRealEnrollment}
                disabled={isEnrolling}
                className="flex-1"
              >
                {isEnrolling ? 'Enrolling...' : 'Start Enrollment'}
              </Button>
            </div>
          </div>
        )

      case 'verification':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold">Testing Verification</h3>
              <p className="text-gray-500">Testing the biometric enrollment with a verification attempt...</p>
            </div>
            
            <div className="space-y-4">
              <Progress value={100} className="w-full" />
              
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <Info className="h-4 w-4" />
                  <span>Please follow the device prompts to verify your biometric</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold">Enrollment Complete!</h3>
              <p className="text-gray-500">
                {workerName} has been successfully enrolled for {selectedType} authentication.
              </p>
            </div>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                The worker can now use their {selectedType} to clock in and out of work.
              </AlertDescription>
            </Alert>
            
            <div className="text-center">
              <Button onClick={onEnrollmentComplete} className="w-full">
                Done
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }



  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Biometric Enrollment</span>
        </CardTitle>
        <CardDescription>
          Set up biometric authentication for {workerName}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {getStepContent()}
      </CardContent>
    </Card>
  )
} 