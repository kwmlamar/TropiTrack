"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  WifiOff, 
  CheckCircle, 
  RefreshCw,
  Clock,
  AlertTriangle,
  Wifi
} from "lucide-react"
import { toast } from "sonner"
import { OfflineStorage } from "@/lib/offline-storage"

interface OfflineSyncBannerProps {
  className?: string
}

export function OfflineSyncBanner({ className = "" }: OfflineSyncBannerProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingEvents, setPendingEvents] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    const checkPendingEvents = async () => {
      if (OfflineStorage.isSupported()) {
        try {
          const count = await OfflineStorage.getPendingEventCount()
          setPendingEvents(count)
        } catch (error) {
          console.error('Error checking pending events:', error)
        }
      }
    }

    updateOnlineStatus()
    checkPendingEvents()
    
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    window.addEventListener('online', checkPendingEvents)

    // Check for pending events periodically
    const interval = setInterval(checkPendingEvents, 5000)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      window.removeEventListener('online', checkPendingEvents)
      clearInterval(interval)
    }
  }, [])

  const handleSync = async () => {
    if (!isOnline) {
      toast.error("You need to be online to sync events")
      return
    }

    setSyncing(true)
    try {
      const result = await OfflineStorage.syncPendingEvents()
      
      if (result.success > 0) {
        toast.success(`Successfully synced ${result.success} events`)
        setPendingEvents(0)
      }
      
      if (result.failed > 0) {
        toast.error(`Failed to sync ${result.failed} events`)
      }
      
      if (result.success === 0 && result.failed === 0) {
        toast.info("No pending events to sync")
      }
    } catch (error) {
      console.error('Error syncing events:', error)
      toast.error("Failed to sync events")
    } finally {
      setSyncing(false)
    }
  }

  // Don't show banner if online and no pending events
  if (isOnline && pendingEvents === 0) {
    return null
  }

  return (
    <Card className={`border-l-4 ${isOnline ? 'border-l-yellow-500 bg-yellow-50' : 'border-l-red-500 bg-red-50'} ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-yellow-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            
            <div>
              <h3 className="font-semibold text-sm">
                {isOnline ? "Pending Sync" : "Offline Mode"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isOnline 
                  ? `${pendingEvents} clock event${pendingEvents !== 1 ? 's' : ''} waiting to sync`
                  : "Clock events are being stored locally"
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingEvents > 0 && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {pendingEvents}
              </Badge>
            )}
            
            {isOnline && pendingEvents > 0 && (
              <Button
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="h-8"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Sync
                  </>
                )}
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="h-8 px-2"
            >
              {showDetails ? "Hide" : "Details"}
            </Button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3" />
                <span>
                  {isOnline 
                    ? "Events are queued for sync. Click 'Sync' to upload them to the server."
                    : "Your clock events are safely stored locally and will sync automatically when you're back online."
                  }
                </span>
              </div>
              
              {!isOnline && (
                <div className="flex items-center gap-2">
                  <WifiOff className="h-3 w-3" />
                  <span>Background sync will trigger when connection is restored.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

