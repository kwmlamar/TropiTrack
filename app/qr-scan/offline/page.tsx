"use client"

import { useState, useEffect, useCallback } from "react"
import { OfflineClockEvent } from "@/lib/offline-storage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  WifiOff, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function OfflineQRScanPage() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingEvents, setPendingEvents] = useState<OfflineClockEvent[]>([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Load pending offline events
    loadPendingEvents()

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [loadPendingEvents])

  const loadPendingEvents = useCallback(async () => {
    try {
      const db = await openDB()
      const transaction = db.transaction(['offline_events'], 'readonly')
      const store = transaction.objectStore('offline_events')
      const events = await store.getAll()
      setPendingEvents(events)
    } catch (error) {
      console.error('Error loading pending events:', error)
    }
  }, [])

  const openDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('TropiTrackOffline', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains('offline_events')) {
          const store = db.createObjectStore('offline_events', { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  const syncPendingEvents = async () => {
    if (!isOnline) {
      toast.error("You need to be online to sync events")
      return
    }

    setSyncing(true)
    try {
      for (const event of pendingEvents) {
        try {
          const response = await fetch(event.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(event.requestData)
          })
          
          if (response.ok) {
            // Remove successful event from offline storage
            const db = await openDB()
            const deleteTransaction = db.transaction(['offline_events'], 'readwrite')
            const deleteStore = deleteTransaction.objectStore('offline_events')
            await deleteStore.delete(event.id)
            console.log('Synced offline clock event:', event.id)
          }
        } catch (error) {
          console.error('Failed to sync offline clock event:', event.id, error)
        }
      }
      
      await loadPendingEvents()
      toast.success("Successfully synced all pending events!")
    } catch (error) {
      console.error('Error syncing events:', error)
      toast.error("Failed to sync some events")
    } finally {
      setSyncing(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <WifiOff className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">
            {isOnline ? "Connection Restored" : "Offline Mode"}
          </CardTitle>
          <div className="flex justify-center mt-2">
            <Badge variant={isOnline ? "default" : "secondary"}>
              {isOnline ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 mr-1" />
                  Offline
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!isOnline ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                You&apos;re currently offline. QR code scanning is available, but clock events will be stored locally and synced when you&apos;re back online.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    <strong>Offline Mode:</strong> Clock events will be saved locally and automatically synced when connection is restored.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Your connection has been restored. Any pending offline events can now be synced.
              </p>
            </div>
          )}

          {pendingEvents.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Pending Clock Events ({pendingEvents.length})
                </h3>
                {isOnline && (
                  <Button 
                    onClick={syncPendingEvents}
                    disabled={syncing}
                    size="sm"
                  >
                    {syncing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Sync All
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingEvents.map((event) => (
                  <div key={event.id} className="bg-gray-50 border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {event.requestData.event_type === 'clock_in' ? 'Clock In' : 'Clock Out'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Worker: {event.requestData.worker_id?.substring(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(event.timestamp)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Pending
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            {isOnline && pendingEvents.length === 0 && (
              <Button className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                All Events Synced
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>Offline events are automatically synced when you&apos;re back online.</p>
            <p>Your data is safely stored locally until sync is complete.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

