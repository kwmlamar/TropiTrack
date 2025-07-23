"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"

interface ProfileInfo {
  id: string
  company_id: string
  company?: {
    id: string
    name: string
  }
}

export function DebugPayrollSettings() {
  const { loading, error, paymentSchedule, payrollSettings, deductionRules, refresh } = usePayrollSettings()
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const checkProfile = async () => {
    try {
      setProfileError(null)
      const profile = await getUserProfileWithCompany()
      setProfileInfo(profile)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Unknown error")
    }
  }

  useEffect(() => {
    checkProfile()
  }, [])

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Payroll Settings Debug
          <Badge variant={error ? "destructive" : loading ? "secondary" : "default"}>
            {error ? "Error" : loading ? "Loading" : "Ready"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert>
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h4 className="font-medium">Profile Information</h4>
          {profileError ? (
            <Alert>
              <AlertDescription>
                <strong>Profile Error:</strong> {profileError}
              </AlertDescription>
            </Alert>
          ) : profileInfo ? (
            <div className="text-sm space-y-1">
              <p><strong>User ID:</strong> {profileInfo.id}</p>
              <p><strong>Company ID:</strong> {profileInfo.company_id}</p>
              <p><strong>Company Name:</strong> {profileInfo.company?.name || "N/A"}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading profile...</p>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Settings Status</h4>
          <div className="text-sm space-y-1">
            <p><strong>Payment Schedule:</strong> {paymentSchedule ? "Loaded" : "Not found"}</p>
            <p><strong>Payroll Settings:</strong> {payrollSettings ? "Loaded" : "Not found"}</p>
            <p><strong>Deduction Rules:</strong> {deductionRules.length} active rules</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={refresh} disabled={loading}>
            Refresh Settings
          </Button>
          <Button onClick={checkProfile} variant="outline">
            Check Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 