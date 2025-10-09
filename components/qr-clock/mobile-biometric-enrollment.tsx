'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Fingerprint, Camera, Smartphone, AlertTriangle } from 'lucide-react';
import { checkDeviceCompatibility, generateDeviceId, generateTemplateHash } from '@/lib/data/biometric';


interface MobileBiometricEnrollmentProps {
  workerId: string;
  workerName: string;
  onEnrollmentComplete?: (success: boolean) => void;
  onCancel?: () => void;
  language?: 'en' | 'cr';
}

const translations = {
  en: {
    title: 'Biometric Enrollment',
    subtitle: 'Set up secure authentication for clock-in',
    fingerprint: 'Fingerprint',
    face: 'Face Recognition',
    both: 'Both',
    none: 'None',
    step1: 'Device Check',
    step2: 'Biometric Setup',
    step3: 'Verification',
    step4: 'Complete',
    deviceCheck: 'Checking device compatibility...',
    fingerprintSetup: 'Place your finger on the sensor',
    faceSetup: 'Position your face in the camera',
    bothSetup: 'Complete both fingerprint and face setup',
    verifying: 'Verifying biometric data...',
    success: 'Enrollment successful!',
    error: 'Enrollment failed',
    retry: 'Retry',
    cancel: 'Cancel',
    next: 'Next',
    back: 'Back',
    compatible: 'Compatible',
    notCompatible: 'Not Compatible',
    ready: 'Ready to proceed',
    notReady: 'Device not ready',
    enrollmentType: 'Enrollment Type',
    selectType: 'Select biometric type',
    deviceId: 'Device ID',
    templateHash: 'Template Hash',
    enrollmentError: 'Failed to create enrollment',
    deviceError: 'Device compatibility check failed',
    biometricError: 'Biometric setup failed',
    verificationError: 'Verification failed'
  },
  cr: {
    title: 'Enwòlman Biyometrik',
    subtitle: 'Konfigire otantifikasyon an pou antre',
    fingerprint: 'Anprent Dijital',
    face: 'Rekonèsans Figi',
    both: 'Tou De',
    none: 'Okenn',
    step1: 'Tchèk Aparèy',
    step2: 'Konfigirasyon Biyometrik',
    step3: 'Verifikasyon',
    step4: 'Konplete',
    deviceCheck: 'Tcheke konpatibilite aparèy...',
    fingerprintSetup: 'Mete dwèt ou sou sansè a',
    faceSetup: 'Pozisyon figi ou nan kamera a',
    bothSetup: 'Konplete tou de anprent dijital ak figi',
    verifying: 'Verifye done biyometrik...',
    success: 'Enwòlman reyisi!',
    error: 'Enwòlman echwe',
    retry: 'Eseye Ankò',
    cancel: 'Anile',
    next: 'Apre',
    back: 'Retounen',
    compatible: 'Konpatib',
    notCompatible: 'Pa Konpatib',
    ready: 'Pare pou kontinye',
    notReady: 'Aparèy pa pare',
    enrollmentType: 'Tip Enwòlman',
    selectType: 'Chwazi tip biyometrik',
    deviceId: 'ID Aparèy',
    templateHash: 'Hash Modèl',
    enrollmentError: 'Echwe pou kreye enwòlman',
    deviceError: 'Tchèk konpatibilite aparèy echwe',
    biometricError: 'Konfigirasyon biyometrik echwe',
    verificationError: 'Verifikasyon echwe'
  }
};

export default function MobileBiometricEnrollment({
  workerId,
  workerName,
  onEnrollmentComplete,
  onCancel,
  language = 'en'
}: MobileBiometricEnrollmentProps) {
  const t = translations[language];
  const [currentStep, setCurrentStep] = useState(1);
  const [enrollmentType, setEnrollmentType] = useState<'fingerprint' | 'face' | 'both'>('fingerprint');
  const [deviceCompatibility, setDeviceCompatibility] = useState<{
    fingerprint: boolean;
    face: boolean;
    webauthn: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<unknown>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [templateHash, setTemplateHash] = useState<string>('');

  const checkDevice = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const compatibility = checkDeviceCompatibility();
      setDeviceCompatibility(compatibility);
      
      // Generate device ID
      const id = generateDeviceId();
      setDeviceId(id);
      
      // Generate a sample template hash
      const hash = await generateTemplateHash(`sample_${workerId}_${Date.now()}`);
      setTemplateHash(hash);
      
    } catch (err) {
      console.error('Device check error:', err);
      setError(t.deviceError);
    } finally {
      setIsLoading(false);
    }
  }, [workerId, t.deviceError]);

  useEffect(() => {
    checkDevice();
  }, [checkDevice]);

  const handleBiometricSetup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Phase 1: Prepare for capture
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Phase 2: Simulate biometric capture process
      // In a real implementation, this would involve actual biometric capture
      // The device would prompt the user to place their finger on the sensor
      // or position their face in front of the camera
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setCurrentStep(3);
    } catch (err) {
      console.error('Biometric setup error:', err);
      setError(t.biometricError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create the enrollment via API route
      const response = await fetch('/api/biometric-enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          worker_id: workerId,
          enrollment_type: enrollmentType,
          device_id: deviceId,
          template_hash: templateHash
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || t.enrollmentError);
      }
      
      setEnrollmentData(result.enrollment || null);
      setCurrentStep(4);
      
      // Call completion callback
      if (onEnrollmentComplete) {
        onEnrollmentComplete(true);
      }
      
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : t.verificationError);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (step: number) => {
    const status = getStepStatus(step);
    if (status === 'completed') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'current') return <div className="h-5 w-5 rounded-full bg-blue-500" />;
    return <div className="h-5 w-5 rounded-full bg-gray-300" />;
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">{t.step1}</h3>
        <p className="text-sm text-gray-600">{t.deviceCheck}</p>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          <Progress value={33} className="w-full" />
          <p className="text-sm text-center">{t.deviceCheck}</p>
        </div>
      ) : deviceCompatibility ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Fingerprint className="h-5 w-5" />
                <span>{t.fingerprint}</span>
              </div>
              <Badge variant={deviceCompatibility.fingerprint ? "default" : "secondary"}>
                {deviceCompatibility.fingerprint ? t.compatible : t.notCompatible}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Camera className="h-5 w-5" />
                <span>{t.face}</span>
              </div>
              <Badge variant={deviceCompatibility.face ? "default" : "secondary"}>
                {deviceCompatibility.face ? t.compatible : t.notCompatible}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>WebAuthn</span>
              </div>
              <Badge variant={deviceCompatibility.webauthn ? "default" : "secondary"}>
                {deviceCompatibility.webauthn ? t.compatible : t.notCompatible}
              </Badge>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              {t.cancel}
            </Button>
            <Button 
              onClick={() => setCurrentStep(2)} 
              disabled={!deviceCompatibility.webauthn}
              className="flex-1"
            >
              {t.next}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">{t.step2}</h3>
        <p className="text-sm text-gray-600">{t.selectType}</p>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        <Button
          variant={enrollmentType === 'fingerprint' ? 'default' : 'outline'}
          onClick={() => setEnrollmentType('fingerprint')}
          className="h-16 justify-start"
          disabled={!deviceCompatibility?.fingerprint}
        >
          <Fingerprint className="h-5 w-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">{t.fingerprint}</div>
            <div className="text-sm opacity-70">{t.fingerprintSetup}</div>
          </div>
        </Button>
        
        <Button
          variant={enrollmentType === 'face' ? 'default' : 'outline'}
          onClick={() => setEnrollmentType('face')}
          className="h-16 justify-start"
          disabled={!deviceCompatibility?.face}
        >
          <Camera className="h-5 w-5 mr-3" />
          <div className="text-left">
            <div className="font-medium">{t.face}</div>
            <div className="text-sm opacity-70">{t.faceSetup}</div>
          </div>
        </Button>
        
        <Button
          variant={enrollmentType === 'both' ? 'default' : 'outline'}
          onClick={() => setEnrollmentType('both')}
          className="h-16 justify-start"
          disabled={!deviceCompatibility?.fingerprint || !deviceCompatibility?.face}
        >
          <div className="flex items-center mr-3">
            <Fingerprint className="h-4 w-4" />
            <Camera className="h-4 w-4 ml-1" />
          </div>
          <div className="text-left">
            <div className="font-medium">{t.both}</div>
            <div className="text-sm opacity-70">{t.bothSetup}</div>
          </div>
        </Button>
      </div>
      
      <div className="flex space-x-2">
        <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
          {t.back}
        </Button>
        <Button 
          onClick={handleBiometricSetup}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? t.verifying : t.next}
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">{t.step3}</h3>
        <p className="text-sm text-gray-600">{t.verifying}</p>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          <Progress value={66} className="w-full" />
          <p className="text-sm text-center">{t.verifying}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">{t.enrollmentType}:</span>
              <span className="text-sm">{t[enrollmentType]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">{t.deviceId}:</span>
              <span className="text-sm font-mono text-xs">{deviceId.substring(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">{t.templateHash}:</span>
              <span className="text-sm font-mono text-xs">{templateHash.substring(0, 8)}...</span>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
              {t.back}
            </Button>
            <Button 
              onClick={handleVerification}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? t.verifying : t.next}
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold">{t.success}</h3>
        <p className="text-sm text-gray-600">
          {workerName} {language === 'en' ? 'has been enrolled for' : 'te enwòlman pou'} {t[enrollmentType]} {language === 'en' ? 'authentication' : 'otantifikasyon'}
        </p>
      </div>
      
      {enrollmentData && typeof enrollmentData === 'object' && enrollmentData !== null && (
        <div className="p-4 border rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">ID:</span>
            <span className="text-sm font-mono">{(enrollmentData as { id: string }).id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">{t.enrollmentType}:</span>
            <span className="text-sm">{t[(enrollmentData as { enrollment_type: string }).enrollment_type as keyof typeof t]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant="default">Active</Badge>
          </div>
        </div>
      )}
      
      <Button onClick={onCancel} className="w-full">
        {language === 'en' ? 'Done' : 'Fè'}
      </Button>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{t.title}</CardTitle>
        <CardDescription className="text-center">
          {workerName} - {t.subtitle}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center space-y-1">
              {getStepIcon(step)}
              <span className="text-xs text-gray-500">
                {t[`step${step}` as keyof typeof t]}
              </span>
            </div>
          ))}
        </div>
        
        {/* Step Content */}
        {renderCurrentStep()}
      </CardContent>
    </Card>
  );
} 