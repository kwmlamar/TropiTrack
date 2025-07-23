"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Fingerprint, User, Smartphone, Shield, Zap } from "lucide-react"
import { toast } from "sonner"
import { WebAuthnManager, BiometricEnrollmentResult, BiometricVerificationResult } from '@/lib/utils/webauthn'

interface TestBiometricVerificationProps {
  workerId: string
  workerName: string
}

type TestStep = 'compatibility' | 'enrollment' | 'verification' | 'complete'
type BiometricType = 'fingerprint' | 'face' | 'both'

export function TestBiometricVerification({ workerId, workerName }: TestBiometricVerificationProps) {
  const [currentStep, setCurrentStep] = useState<TestStep>('compatibility')
  const [selectedType, setSelectedType] = useState<BiometricType>('fingerprint')
  const [deviceCompatibility, setDeviceCompatibility] = useState({
    fingerprint: false,
    face: false,
    webauthn: false
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [enrollmentData, setEnrollmentData] = useState<BiometricEnrollmentResult | null>(null)
  const [verificationData, setVerificationData] = useState<BiometricVerificationResult | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<unknown>(null)
  const [webauthnManager] = useState(() => WebAuthnManager.getInstance())

  useEffect(() => {
    checkDeviceCompatibility()
  }, [])

  const checkDeviceCompatibility = async () => {
    try {
      const compatibility = await webauthnManager.isBiometricAvailable()
      setDeviceCompatibility(compatibility)
      setDeviceInfo(webauthnManager.getDeviceInfo())
      
      if (!compatibility.webauthn) {
        setError('This device does not support WebAuthn biometric authentication.')
      } else {
        setCurrentStep('enrollment')
      }
    } catch (err) {
      console.error('Device compatibility check failed:', err)
      setError('Failed to check device compatibility.')
    }
  }

  const performRealEnrollment = async () => {
    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      // Phase 1: Prepare for enrollment
      setProgress(10)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Phase 2: Generate WebAuthn enrollment options
      setProgress(20)
      const enrollmentOptions = await webauthnManager.generateEnrollmentOptions(
        workerId,
        workerName,
        workerName,
        selectedType
      )
      
      // Phase 3: Perform real biometric enrollment
      setProgress(40)
      toast.info('Follow your device prompts for biometric enrollment')
      
      const enrollmentResult = await webauthnManager.enroll(enrollmentOptions)
      
      setProgress(80)
      setEnrollmentData(enrollmentResult)
      
      // Phase 4: Store enrollment
      const response = await fetch('/api/biometric-enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_id: workerId,
          enrollment_type: selectedType,
          device_id: (deviceInfo as { userAgent: string; platform: string; isSecure: boolean; hasWebAuthn: boolean })?.platform || 'unknown',
          template_hash: enrollmentResult.credentialId,
          webauthn_data: enrollmentResult
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create enrollment');
      }

      setProgress(100)
      toast.success('Enrollment completed successfully!')
      setCurrentStep('verification')
      
    } catch (err) {
      console.error('Enrollment error:', err)
      setError(err instanceof Error ? err.message : 'Enrollment failed')
      toast.error('Enrollment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const performRealVerification = async () => {
    if (!enrollmentData) return
    
    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      // Phase 1: Prepare for verification
      setProgress(10)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Phase 2: Generate verification options
      setProgress(30)
      const verificationOptions = await webauthnManager.generateVerificationOptions([enrollmentData.credentialId])
      
      // Phase 3: Perform real biometric verification
      setProgress(50)
      toast.info('Follow your device prompts for biometric verification')
      
      const verificationResult = await webauthnManager.verify(verificationOptions)
      
      setProgress(80)
      setVerificationData(verificationResult)
      
      // Phase 4: Send verification to API
      const response = await fetch('/api/qr-clock/biometric-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_id: workerId,
          verification_type: selectedType,
          device_id: (deviceInfo as { userAgent: string; platform: string; isSecure: boolean; hasWebAuthn: boolean })?.platform || 'unknown',
          template_hash: enrollmentData.credentialId,
          webauthn_data: verificationResult
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }
      
      setProgress(100)
      toast.success('Verification completed successfully!')
      setCurrentStep('complete')
      
    } catch (err) {
      console.error('Verification error:', err)
      setError(err instanceof Error ? err.message : 'Verification failed')
      toast.error('Verification failed')
    } finally {
      setIsProcessing(false)
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
              <p className="text-gray-500">Checking WebAuthn biometric support...</p>
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

            {deviceInfo && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Device Information</h4>
                <div className="text-sm space-y-1">
                  <div><span className="font-medium">Platform:</span> {(deviceInfo as { userAgent: string; platform: string; isSecure: boolean; hasWebAuthn: boolean })?.platform}</div>
                  <div><span className="font-medium">Secure Context:</span> {(deviceInfo as { userAgent: string; platform: string; isSecure: boolean; hasWebAuthn: boolean })?.isSecure ? 'Yes' : 'No'}</div>
                  <div><span className="font-medium">WebAuthn:</span> {(deviceInfo as { userAgent: string; platform: string; isSecure: boolean; hasWebAuthn: boolean })?.hasWebAuthn ? 'Supported' : 'Not Supported'}</div>
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <Shield className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )

      case 'enrollment':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Zap className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold">Real WebAuthn Enrollment</h3>
              <p className="text-gray-500">
                This will use your device&apos;s actual biometric sensors (fingerprint, face, etc.)
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  className="h-16 justify-start"
                  onClick={() => setSelectedType('fingerprint')}
                  disabled={!deviceCompatibility.fingerprint || isProcessing}
                >
                  <Fingerprint className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Fingerprint Enrollment</div>
                    <div className="text-sm text-gray-500">Use your device&apos;s fingerprint sensor</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-16 justify-start"
                  onClick={() => setSelectedType('face')}
                  disabled={!deviceCompatibility.face || isProcessing}
                >
                  <User className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Face Recognition Enrollment</div>
                    <div className="text-sm text-gray-500">Use your device&apos;s camera</div>
                  </div>
                </Button>
              </div>

              {isProcessing && (
                <div className="space-y-3">
                  <Progress value={progress} className="w-full" />
                  <div className="text-center text-sm text-gray-500">
                    {progress < 40 && 'Preparing enrollment...'}
                    {progress >= 40 && progress < 80 && 'Follow device prompts for biometric capture'}
                    {progress >= 80 && 'Storing enrollment data...'}
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={performRealEnrollment}
                disabled={isProcessing || !deviceCompatibility.webauthn}
                className="w-full"
              >
                {isProcessing ? 'Enrolling...' : 'Start Real Enrollment'}
              </Button>
            </div>
          </div>
        )

      case 'verification':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold">Enrollment Complete!</h3>
              <p className="text-gray-500">
                Now let&apos;s test the verification with real biometric authentication
              </p>
            </div>
            
            {enrollmentData && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Enrollment Data</h4>
                <div className="text-sm space-y-1">
                  <div><span className="font-medium">Credential ID:</span> {enrollmentData.credentialId.substring(0, 16)}...</div>
                  <div><span className="font-medium">Type:</span> {selectedType}</div>
                  <div><span className="font-medium">Status:</span> <Badge variant="default">Enrolled</Badge></div>
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-3">
                <Progress value={progress} className="w-full" />
                <div className="text-center text-sm text-gray-500">
                  {progress < 50 && 'Preparing verification...'}
                  {progress >= 50 && progress < 80 && 'Follow device prompts for biometric verification'}
                  {progress >= 80 && 'Processing verification...'}
                </div>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <Shield className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={performRealVerification}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Verifying...' : 'Test Real Verification'}
            </Button>
          </div>
        )

      case 'complete':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold">Test Complete!</h3>
              <p className="text-gray-500">
                Real WebAuthn biometric authentication is working successfully
              </p>
            </div>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Both enrollment and verification using real device biometrics completed successfully!
              </AlertDescription>
            </Alert>

            {verificationData && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2">Verification Data</h4>
                <div className="text-sm space-y-1">
                  <div><span className="font-medium">Credential ID:</span> {verificationData.credentialId.substring(0, 16)}...</div>
                  <div><span className="font-medium">Signature:</span> {verificationData.signature.substring(0, 16)}...</div>
                  <div><span className="font-medium">Status:</span> <Badge variant="default">Verified</Badge></div>
                </div>
              </div>
            )}

            <div className="text-center">
              <Button 
                onClick={() => {
                  setCurrentStep('enrollment')
                  setEnrollmentData(null)
                  setVerificationData(null)
                  setError(null)
                  setProgress(0)
                }}
                className="w-full"
              >
                Test Again
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
          <Zap className="h-5 w-5" />
          <span>Real WebAuthn Test</span>
        </CardTitle>
        <CardDescription>
          Test real biometric authentication with {workerName}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {getStepContent()}
      </CardContent>
    </Card>
  )
} 