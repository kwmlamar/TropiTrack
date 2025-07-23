'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Fingerprint, 
  User, 
  Shield,
  RotateCcw,
  Info
} from 'lucide-react';

import { WebAuthnManager } from '@/lib/utils/webauthn';
import type { Worker } from '@/lib/types/worker';
import type { BiometricEnrollment } from '@/lib/types/worker';

interface BiometricAuthProps {
  worker: Worker;
  onAuthSuccess: (workerId: string) => void;
  onAuthError: (error: string) => void;
}

type AuthStep = 'check' | 'select' | 'verify' | 'success' | 'error';
type AuthType = 'fingerprint' | 'face' | 'both';

interface WorkerClockStatus {
  isClockedIn: boolean;
  lastClockTime?: string;
  currentShift?: string;
}

export function BiometricAuth({ worker, onAuthSuccess, onAuthError }: BiometricAuthProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('check');
  const [selectedType, setSelectedType] = useState<AuthType | null>(null);
  const [deviceCompatibility, setDeviceCompatibility] = useState({
    fingerprint: false,
    face: false,
    webauthn: false
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [workerStatus] = useState<WorkerClockStatus | null>(null);
  const [webauthnManager] = useState(() => WebAuthnManager.getInstance());

  useEffect(() => {
    // Check device compatibility on mount
    if (worker) {
      checkDeviceCompatibility();
    }
  }, [worker]);

  // Handle case where worker is undefined
  if (!worker) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Biometric Authentication</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Worker information not available. Please try again.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const checkDeviceCompatibility = async () => {
    try {
      const compatibility = await webauthnManager.isBiometricAvailable();
      setDeviceCompatibility(compatibility);
      
      if (!compatibility.webauthn) {
        setError('This device does not support biometric authentication.');
        setCurrentStep('error');
      } else if (!worker?.biometric_enrolled) {
        setError('Worker is not enrolled for biometric authentication.');
        setCurrentStep('error');
      } else {
        setCurrentStep('select');
      }
    } catch (err) {
      console.error('Device compatibility check failed:', err);
      setError('Failed to check device compatibility.');
      setCurrentStep('error');
    }
  };

  const handleTypeSelection = (type: AuthType) => {
    setSelectedType(type);
    setCurrentStep('verify');
  };

  const performRealVerification = async () => {
    if (!selectedType) return;
    
    setIsVerifying(true);
    setVerificationProgress(0);
    setError(null);

    try {
      // Phase 1: Prepare for verification
      setVerificationProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Phase 2: Get worker's enrollment data
      setVerificationProgress(20);
      const enrollmentResponse = await fetch(`/api/test-worker?worker_id=${worker?.id}`);
      const enrollmentData = await enrollmentResponse.json();
      
      if (!enrollmentData.enrollments || enrollmentData.enrollments.length === 0) {
        throw new Error('No biometric enrollment found for this worker');
      }
      
      // Find the enrollment for the selected type
      const enrollment = enrollmentData.enrollments.find((e: unknown) => {
        const enrollment = e as BiometricEnrollment;
        return enrollment.enrollment_type === selectedType || 
          (selectedType === 'both' && (enrollment.enrollment_type === 'fingerprint' || enrollment.enrollment_type === 'face'));
      });
      
      if (!enrollment) {
        throw new Error(`No ${selectedType} enrollment found for this worker`);
      }
      
      // Extract the actual WebAuthn credential ID
      let credentialId = enrollment.template_hash; // fallback to template_hash
      
      if (enrollment.webauthn_data && enrollment.webauthn_data.credentialId) {
        credentialId = enrollment.webauthn_data.credentialId;
        console.log('Using WebAuthn credential ID:', credentialId);
      } else {
        console.log('Using template_hash as credential ID:', credentialId);
      }
      
      // Phase 3: Generate WebAuthn verification options
      setVerificationProgress(30);
      const verificationOptions = await webauthnManager.generateVerificationOptions([credentialId]);
      
      // Phase 4: Perform real biometric verification
      setVerificationProgress(50);
      setVerificationProgress(60);
      
      // This will trigger the device's biometric prompt
      const verificationResult = await webauthnManager.verify(verificationOptions);
      
      setVerificationProgress(80);
      
      // Phase 5: Send verification to API
      const response = await fetch('/api/qr-clock/biometric-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_id: worker?.id,
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
      
      setVerificationProgress(100);
      setCurrentStep('success');
      
      // Call success callback
      setTimeout(() => {
        onAuthSuccess(worker?.id || '');
      }, 2000);
      
    } catch (err) {
      console.error('Real verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setCurrentStep('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const getVerificationInstructions = () => {
    switch (selectedType) {
      case 'fingerprint':
        return 'Place your finger on the fingerprint sensor to verify your identity.';
      case 'face':
        return 'Position your face in front of the camera to verify your identity.';
      case 'both':
        return 'Follow the device prompts to verify your identity using fingerprint or face recognition.';
      default:
        return '';
    }
  };

  const getVerificationIcon = () => {
    switch (selectedType) {
      case 'fingerprint':
        return <Fingerprint className="h-12 w-12 text-blue-600" />;
      case 'face':
        return <User className="h-12 w-12 text-blue-600" />;
      case 'both':
        return (
          <div className="flex space-x-2">
            <Fingerprint className="h-12 w-12 text-blue-600" />
            <User className="h-12 w-12 text-blue-600" />
          </div>
        );
      default:
        return <Shield className="h-12 w-12 text-blue-600" />;
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 'check':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold">Checking Device Compatibility</h3>
              <p className="text-gray-500">Verifying biometric authentication support...</p>
            </div>
            
            <div className="flex justify-center">
              <RotateCcw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          </div>
        );

      case 'select':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Choose Verification Method</h3>
              <p className="text-gray-500">Select how you&apos;d like to verify your identity</p>
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
                    <div className="text-sm text-gray-500">Use your fingerprint to verify</div>
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
                    <div className="text-sm text-gray-500">Use your face to verify</div>
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
                    <div className="font-medium">Either Method</div>
                    <div className="text-sm text-gray-500">Use fingerprint or face recognition</div>
                  </div>
                </Button>
              )}
            </div>
          </div>
        );

      case 'verify':
        return (
          <div className="space-y-4">
            <div className="text-center">
              {getVerificationIcon()}
              <h3 className="text-lg font-semibold mt-4">Biometric Verification</h3>
              <p className="text-gray-500">{getVerificationInstructions()}</p>
            </div>
            
            <div className="space-y-4">
              <Progress value={verificationProgress} className="w-full" />
              
              <div className="text-center">
                {verificationProgress < 50 && (
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <Info className="h-4 w-4" />
                    <span>Preparing verification...</span>
                  </div>
                )}
                
                {verificationProgress >= 50 && verificationProgress < 80 && (
                  <div className="flex items-center justify-center space-x-2 text-orange-600">
                    <Fingerprint className="h-4 w-4 animate-pulse" />
                    <span>Follow device prompts for biometric verification</span>
                  </div>
                )}
                
                {verificationProgress >= 80 && (
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Processing verification...</span>
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
                onClick={() => setCurrentStep('select')} 
                disabled={isVerifying}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={performRealVerification}
                disabled={isVerifying}
                className="flex-1"
              >
                {isVerifying ? 'Verifying...' : 'Start Verification'}
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold">Verification Successful!</h3>
              <p className="text-gray-500">
                Welcome, {worker?.name || 'Worker'}! Your identity has been verified.
              </p>
            </div>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You have successfully clocked in/out using biometric authentication.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
              <h3 className="text-lg font-semibold">Verification Failed</h3>
              <p className="text-gray-500">
                {error || 'An error occurred during verification'}
              </p>
            </div>
            
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please try again or contact your administrator for assistance.
              </AlertDescription>
            </Alert>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('select')} 
                className="flex-1"
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onAuthError(error || 'Verification failed')} 
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStatusBadge = (status: WorkerClockStatus | null) => {
    if (!status) {
      return <Badge variant="secondary">No Status</Badge>;
    }

    if (status.isClockedIn) {
      return <Badge className="bg-green-100 text-green-800">Clocked In</Badge>;
    } else {
      return <Badge variant="secondary">Clocked Out</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Biometric Authentication</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Worker Info */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{worker?.name || 'Unknown Worker'}</p>
              <p className="text-sm text-gray-500">Worker ID: {worker?.id ? `${worker.id.slice(0, 8)}...` : 'Unknown'}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Status</p>
              {getStatusBadge(workerStatus)}
            </div>
          </div>
        </div>

        {/* Authentication Flow */}
        {getStepContent()}
      </CardContent>
    </Card>
  );
} 