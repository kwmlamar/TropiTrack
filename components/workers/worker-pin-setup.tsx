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
  Key,
  AlertTriangle
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <Card className="w-full max-w-2xl mx-auto border-border/50 bg-sidebar">
      <CardHeader className="text-center pb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-10 w-10 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">PIN Setup</CardTitle>
        <p className="text-muted-foreground mt-2">
          Create a secure 4-digit PIN for <span className="font-medium text-foreground">{workerName}</span>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* PIN Status */}
        {pinStatus && (
          <Card className="p-4 border-border/30 bg-background/50">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Current Status</Label>
              <div className="flex items-center gap-3">
                {pinStatus.hasPin ? (
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 flex items-center gap-1.5 px-3 py-1">
                    <CheckCircle className="h-3 w-3" />
                    PIN Configured
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 flex items-center gap-1.5 px-3 py-1">
                    <XCircle className="h-3 w-3" />
                    No PIN Set
                  </Badge>
                )}
                
                {pinStatus.isLocked && (
                  <Badge variant="destructive" className="flex items-center gap-1.5 px-3 py-1">
                    <AlertTriangle className="h-3 w-3" />
                    Account Locked
                  </Badge>
                )}
              </div>
              
              {pinStatus.hasPin && (
                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/30">
                  <div className="flex justify-between">
                    <span>Set:</span>
                    <span className="font-medium">{formatDate(pinStatus.pinSetAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last used:</span>
                    <span className="font-medium">{formatDate(pinStatus.pinLastUsed)}</span>
                  </div>
                  {pinStatus.attempts > 0 && (
                    <div className="flex justify-between">
                      <span>Failed attempts:</span>
                      <span className="font-medium text-orange-600">{pinStatus.attempts}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* PIN Setup Form */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="pin" className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Enter PIN</Label>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setPin(value)
                }}
                placeholder="Enter 4-digit PIN"
                className="pr-12 text-center font-mono tracking-[0.5em] text-lg h-12 border-border/50 focus:border-primary"
                maxLength={4}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPin(!showPin)}
              >
                {showPin ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4].map((digit) => (
                <div
                  key={digit}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    digit <= pin.length ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="confirmPin" className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Confirm PIN</Label>
            <div className="relative">
              <Input
                id="confirmPin"
                type={showConfirmPin ? "text" : "password"}
                value={confirmPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setConfirmPin(value)
                }}
                placeholder="Confirm 4-digit PIN"
                className="pr-12 text-center font-mono tracking-[0.5em] text-lg h-12 border-border/50 focus:border-primary"
                maxLength={4}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
              >
                {showConfirmPin ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4].map((digit) => (
                <div
                  key={digit}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    digit <= confirmPin.length ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* PIN Requirements */}
          <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <Key className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-sm">
              <div className="space-y-2">
                <strong className="text-blue-800 dark:text-blue-200">PIN Requirements:</strong>
                <ul className="text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Exactly 4 digits (numbers only)</li>
                  <li>• No letters, symbols, or spaces</li>
                  <li>• Keep it secure and memorable</li>
                  <li>• Used for QR code clock-in/out verification</li>
                  <li>• Cannot be retrieved once set (for security)</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border/50">
          <Button
            onClick={handleSetPin}
            disabled={isLoading || pin.length !== 4 || pin !== confirmPin}
            className="flex-1 h-11"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting PIN...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                {pinStatus?.hasPin ? 'Update PIN' : 'Set PIN'}
              </>
            )}
          </Button>
          
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="h-11"
              size="lg"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
