"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Eye, 
  EyeOff, 
  Loader2,
  Key
} from "lucide-react"
import { toast } from "sonner"
import { setWorkerPin, getWorkerPinStatus } from "@/lib/data/worker-pins"

interface WorkerPinSetupProps {
  workerId: string
  workerName: string
  onPinSet?: () => void
  onCancel?: () => void
}

export function WorkerPinSetup({ 
  workerId, 
  workerName, 
  onPinSet, 
  onCancel 
}: WorkerPinSetupProps) {
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pinStatus, setPinStatus] = useState<{
    hasPin: boolean
    pinSetAt?: string
    pinLastUsed?: string
    isLocked: boolean
    attempts: number
  } | null>(null)

  // Load PIN status on mount
  useEffect(() => {
    loadPinStatus()
  }, [])

  const loadPinStatus = async () => {
    try {
      const result = await getWorkerPinStatus(workerId)
      if (result.success && result.data) {
        setPinStatus(result.data)
      }
    } catch (error) {
      console.error("Error loading PIN status:", error)
    }
  }

  const handleSetPin = async () => {
    if (!pin || !confirmPin) {
      toast.error("Please enter and confirm your PIN")
      return
    }

    if (pin.length < 4 || pin.length > 8) {
      toast.error("PIN must be 4-8 digits")
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

    setIsLoading(true)
    try {
      const result = await setWorkerPin("", workerId, pin) // Empty userId for now
      
      if (result.success && result.data) {
        toast.success("PIN set successfully!")
        setPin("")
        setConfirmPin("")
        await loadPinStatus()
        onPinSet?.()
      } else {
        toast.error(result.error || "Failed to set PIN")
      }
    } catch (error) {
      console.error("Error setting PIN:", error)
      toast.error("Failed to set PIN")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never"
    return new Date(dateString).toLocaleString()
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl">Set Up PIN</CardTitle>
        <p className="text-sm text-muted-foreground">
          Create a secure PIN for {workerName}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* PIN Status */}
        {pinStatus && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Status</Label>
            <div className="flex items-center gap-2">
              {pinStatus.hasPin ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  PIN Set
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  No PIN
                </Badge>
              )}
              
              {pinStatus.isLocked && (
                <Badge variant="destructive">
                  Locked
                </Badge>
              )}
            </div>
            
            {pinStatus.hasPin && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Set: {formatDate(pinStatus.pinSetAt)}</div>
                <div>Last used: {formatDate(pinStatus.pinLastUsed)}</div>
                {pinStatus.attempts > 0 && (
                  <div>Failed attempts: {pinStatus.attempts}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PIN Setup Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">Enter PIN (4-8 digits)</Label>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                  setPin(value)
                }}
                placeholder="Enter PIN"
                className="pr-10 text-center font-mono tracking-widest"
                maxLength={8}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPin(!showPin)}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((digit) => (
                <div
                  key={digit}
                  className={`w-2 h-2 rounded-full ${
                    digit <= pin.length ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm PIN</Label>
            <div className="relative">
              <Input
                id="confirmPin"
                type={showConfirmPin ? "text" : "password"}
                value={confirmPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                  setConfirmPin(value)
                }}
                placeholder="Confirm PIN"
                className="pr-10 text-center font-mono tracking-widest"
                maxLength={8}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
              >
                {showConfirmPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((digit) => (
                <div
                  key={digit}
                  className={`w-2 h-2 rounded-full ${
                    digit <= confirmPin.length ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* PIN Requirements */}
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>PIN Requirements:</strong>
              <ul className="mt-1 space-y-1">
                <li>• 4-8 digits only</li>
                <li>• Numbers only (no letters or symbols)</li>
                <li>• Keep it secure and memorable</li>
                <li>• Used for clock in/out verification</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSetPin}
            disabled={isLoading || pin.length < 4 || pin !== confirmPin}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting PIN...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Set PIN
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
