"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Fingerprint, 
  Camera, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Loader2
} from "lucide-react"
import { format, parseISO } from "date-fns"
import type { Worker } from "@/lib/types/worker"
import { TestBiometricVerification } from '../test-biometric-verification'

interface BiometricStatusProps {
  worker: Worker
  onStartEnrollment: () => void
  onRefreshStatus: () => void
}

interface EnrollmentData {
  status: unknown
  enrollments: Array<{
    id: string
    enrollment_type: string
    created_at: string
    device_id: string
  }>
}

export default function BiometricStatus({ worker, onStartEnrollment, onRefreshStatus }: BiometricStatusProps) {
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTestVerification, setShowTestVerification] = useState(false)

  const fetchEnrollmentStatus = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/biometric-enrollment?worker_id=${worker.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setEnrollmentData(data)
      } else {
        setError(data.error || 'Failed to fetch enrollment status')
      }
    } catch {
      setError('Failed to fetch enrollment status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnrollmentStatus()
  }, [worker.id])

  const handleRefresh = () => {
    fetchEnrollmentStatus()
    onRefreshStatus()
  }

  const isEnrolled = enrollmentData?.enrollments && enrollmentData.enrollments.length > 0
  const enrollmentType = enrollmentData?.enrollments?.[0]?.enrollment_type || worker.biometric_type

  const getStatusIcon = () => {
    if (isEnrolled) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    return <XCircle className="h-5 w-5 text-red-600" />
  }

  const getStatusBadge = () => {
    if (isEnrolled) {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800">
          Enrolled
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800">
        Not Enrolled
      </Badge>
    )
  }

  const getBiometricTypeIcon = () => {
    switch (enrollmentType) {
      case 'fingerprint':
        return <Fingerprint className="h-4 w-4" />
      case 'face':
        return <Camera className="h-4 w-4" />
      case 'both':
        return (
          <div className="flex gap-1">
            <Fingerprint className="h-4 w-4" />
            <Camera className="h-4 w-4" />
          </div>
        )
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getBiometricTypeLabel = () => {
    switch (enrollmentType) {
      case 'fingerprint':
        return 'Fingerprint'
      case 'face':
        return 'Face ID'
      case 'both':
        return 'Fingerprint & Face ID'
      default:
        return 'None'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Biometric Status
            </div>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Status Overview */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium">Enrollment Status</p>
                <p className="text-sm text-muted-foreground">
                  {isEnrolled ? 'Biometric verification enabled' : 'Biometric verification not set up'}
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Enrollment Details */}
          {isEnrolled && enrollmentData?.enrollments && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  {getBiometricTypeIcon()}
                  <span className="font-medium">Enrollment Type</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {getBiometricTypeLabel()}
                </span>
              </div>

              {enrollmentData.enrollments[0]?.created_at && (
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Enrollment Date</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(enrollmentData.enrollments[0].created_at), "PPP")}
                  </span>
                </div>
              )}

              {enrollmentData.enrollments[0]?.device_id && (
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Device ID</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {enrollmentData.enrollments[0].device_id.slice(0, 8)}...
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Enrollment ID</span>
                </div>
                <span className="text-sm text-muted-foreground font-mono">
                  {enrollmentData.enrollments[0].id.slice(0, 8)}...
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {isEnrolled ? (
              <>
                <Button variant="outline" className="flex-1">
                  Re-enroll Biometrics
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowTestVerification(!showTestVerification)}
                >
                  {showTestVerification ? 'Hide Test' : 'Test Verification'}
                </Button>
              </>
            ) : (
              <Button onClick={onStartEnrollment} className="flex-1">
                Enroll Biometrics
              </Button>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Security:</strong> Biometric data is encrypted and stored securely. 
              Your biometric information is never shared and is only used for identity verification.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Verification Component */}
      {showTestVerification && isEnrolled && (
        <TestBiometricVerification 
          workerId={worker.id}
          workerName={worker.name}
        />
      )}
    </div>
  )
} 