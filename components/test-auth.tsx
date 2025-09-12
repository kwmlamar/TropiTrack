'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Fingerprint, Shield, Globe, CheckCircle, XCircle } from 'lucide-react';
import { BiometricEnrollment } from '@/components/workers/biometric-enrollment';
import CrossDeviceBiometricEnrollment from '@/components/qr-clock/cross-device-biometric-enrollment';
import { BiometricAuth } from '@/components/qr-clock/biometric-auth';
import { TestBiometricVerification } from '@/components/test-biometric-verification';
import { Worker } from '@/lib/types/worker';

interface Enrollment {
  id: string;
  worker_id: string;
  enrollment_type: string;
  device_id: string;
  template_hash: string;
  enrollment_date: string;
  is_active: boolean;
}

export default function TestAuth() {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    isVerified: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    loadTestData();
  }, []);

  // Add debugging for selectedWorker
  useEffect(() => {
    console.log('TestAuth: selectedWorker changed:', selectedWorker);
  }, [selectedWorker]);

  // Add debugging for cross-device tab
  useEffect(() => {
    console.log('TestAuth: Cross-device tab component mounted, selectedWorker:', selectedWorker);
  }, [selectedWorker]);

  // Add debugging for when the component renders
  useEffect(() => {
    console.log('TestAuth: Component rendered, selectedWorker:', selectedWorker, 'isLoading:', isLoading);
  });

  const loadTestData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load test worker
      const workerResponse = await fetch('/api/test-worker');
      const workerData = await workerResponse.json();

      if (workerData.error || !workerData.worker) {
        throw new Error(workerData.error || 'No worker found');
      }

      // Create a proper Worker object with required fields
      const worker: Worker = {
        id: workerData.worker.id,
        name: workerData.worker.name,
        company_id: workerData.worker.company_id,
        position: 'Test Worker',
        hourly_rate: 0,
        hire_date: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setSelectedWorker(worker);
      
      console.log('TestAuth: Worker loaded and set:', worker);

      // Load enrollments for the worker
      const enrollmentsResponse = await fetch(`/api/test-worker?worker_id=${worker.id}&include_enrollments=true`);
      const enrollmentsData = await enrollmentsResponse.json();

      if (enrollmentsData.enrollments) {
        setEnrollments(enrollmentsData.enrollments);
      }

    } catch (err) {
      console.error('Error loading test data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load test data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollmentComplete = () => {
    // Reload enrollments to show the new one
    loadTestData();
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!selectedWorker) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>No test worker found. Please check the API configuration.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Biometric Authentication Test</h1>
        <p className="text-gray-500">
          Test both WebAuthn and cross-device biometric authentication systems
        </p>
      </div>

      {/* Test Worker Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Test Worker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>Name:</strong> {selectedWorker.name}</div>
            <div><strong>ID:</strong> {selectedWorker.id}</div>
            <div><strong>Company ID:</strong> {selectedWorker.company_id}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">
                {enrollments.length} Enrollment{enrollments.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline">
                {enrollments.filter(e => e.is_active).length} Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Test Interface */}
      <Tabs defaultValue="webauthn" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="webauthn" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            WebAuthn (Device-Bound)
          </TabsTrigger>
          <TabsTrigger value="cross-device" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Cross-Device
          </TabsTrigger>
          <TabsTrigger value="real-device" className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4" />
            Real Device Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webauthn" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WebAuthn Biometric Enrollment</CardTitle>
              <CardDescription>
                Device-bound biometric enrollment using WebAuthn. This creates credentials 
                that are tied to the specific device and cannot be used on other devices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BiometricEnrollment
                workerId={selectedWorker.id}
                workerName={selectedWorker.name}
                onEnrollmentComplete={handleEnrollmentComplete}
                onCancel={() => {}}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>WebAuthn Biometric Verification</CardTitle>
              <CardDescription>
                Verify biometric authentication using WebAuthn credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BiometricAuth
                worker={selectedWorker}
                onAuthSuccess={() => {
                  setVerificationResult({
                    success: true,
                    isVerified: true
                  });
                }}
                onAuthError={(error) => {
                  setVerificationResult({
                    success: false,
                    isVerified: false,
                    error
                  });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cross-device" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Device Biometric Enrollment</CardTitle>
              <CardDescription>
                Store biometric templates in the database for cross-device authentication. 
                Workers can authenticate on any device using their fingerprint or face recognition.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedWorker ? (
                <CrossDeviceBiometricEnrollment
                  workerId={selectedWorker.id}
                  workerName={selectedWorker.name}
                  onEnrollmentComplete={handleEnrollmentComplete}
                />
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading worker data...</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cross-Device Biometric Verification</CardTitle>
              <CardDescription>
                Verify biometric authentication using stored templates from the database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/biometric-templates/verify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            worker_id: selectedWorker.id,
                            template_type: 'fingerprint',
                            device_id: navigator.platform
                          })
                        });
                        
                        const result = await response.json();
                        setVerificationResult({
                          success: response.ok,
                          isVerified: result.is_verified || false,
                          error: result.error
                        });
                      } catch (error) {
                        setVerificationResult({
                          success: false,
                          isVerified: false,
                          error: error instanceof Error ? error.message : 'Verification failed'
                        });
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Fingerprint className="h-4 w-4" />
                    Test Fingerprint Verification
                  </Button>
                  
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/biometric-templates/verify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            worker_id: selectedWorker.id,
                            template_type: 'face',
                            device_id: navigator.platform
                          })
                        });
                        
                        const result = await response.json();
                        setVerificationResult({
                          success: response.ok,
                          isVerified: result.is_verified || false,
                          error: result.error
                        });
                      } catch (error) {
                        setVerificationResult({
                          success: false,
                          isVerified: false,
                          error: error instanceof Error ? error.message : 'Verification failed'
                        });
                      }
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4" />
                    Test Face Verification
                  </Button>
                </div>

                {verificationResult && (
                  <Alert variant={verificationResult.success && verificationResult.isVerified ? "default" : "destructive"}>
                    {verificationResult.success && verificationResult.isVerified ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      {verificationResult.success && verificationResult.isVerified
                        ? 'Cross-device biometric verification successful!'
                        : `Verification failed: ${verificationResult.error || 'Unknown error'}`
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="real-device" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real Device Biometric Testing</CardTitle>
              <CardDescription>
                Test real device biometric enrollment and verification using WebAuthn. 
                This will use your device&apos;s actual fingerprint sensor or face recognition camera.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedWorker ? (
                <TestBiometricVerification
                  workerId={selectedWorker.id}
                  workerName={selectedWorker.name}
                />
              ) : (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading worker data...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Display */}
      {verificationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {verificationResult && (
              <div>
                <h4 className="font-medium mb-2">Verification Result</h4>
                <Alert variant={verificationResult.success && verificationResult.isVerified ? "default" : "destructive"}>
                  {verificationResult.success && verificationResult.isVerified ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {verificationResult.success && verificationResult.isVerified
                      ? 'Biometric verification successful!'
                      : `Verification failed: ${verificationResult.error || 'Unknown error'}`
                    }
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Enrollments */}
      {enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{enrollment.enrollment_type}</div>
                    <div className="text-sm text-gray-500">
                      Device: {enrollment.device_id} | 
                      Date: {new Date(enrollment.enrollment_date).toLocaleDateString()} |
                      Status: {enrollment.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  <Badge variant={enrollment.is_active ? "default" : "secondary"}>
                    {enrollment.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}