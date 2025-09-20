/**
 * Offline Storage Utility for TropiTrack
 * Provides IndexedDB operations for offline clock event storage
 */

import { useState, useEffect } from 'react'

export interface ClockEventRequestData {
  event_type: 'clock_in' | 'clock_out'
  worker_id: string
  project_id?: string
  location?: {
    latitude: number
    longitude: number
  }
  timestamp?: string
  [key: string]: unknown
}

export interface OfflineClockEvent {
  id: string
  timestamp: string
  requestData: ClockEventRequestData
  url: string
}

export class OfflineStorage {
  private static dbName = 'TropiTrackOffline'
  private static version = 1
  private static storeName = 'offline_events'

  /**
   * Open IndexedDB connection
   */
  static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Create offline events store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('url', 'url', { unique: false })
        }
      }
    })
  }

  /**
   * Store a clock event offline
   */
  static async storeClockEvent(requestData: ClockEventRequestData, url: string): Promise<string> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const event: OfflineClockEvent = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        requestData,
        url
      }
      
      await store.add(event)
      console.log('Stored offline clock event:', event.id)
      
      // Register background sync
      await this.registerBackgroundSync()
      
      return event.id
    } catch (error) {
      console.error('Error storing offline clock event:', error)
      throw error
    }
  }

  /**
   * Get all pending offline events
   */
  static async getPendingEvents(): Promise<OfflineClockEvent[]> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      return new Promise((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Error getting pending events:', error)
      return []
    }
  }

  /**
   * Remove a specific offline event
   */
  static async removeEvent(eventId: string): Promise<void> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      await store.delete(eventId)
      console.log('Removed offline clock event:', eventId)
    } catch (error) {
      console.error('Error removing offline event:', error)
      throw error
    }
  }

  /**
   * Clear all offline events
   */
  static async clearAllEvents(): Promise<void> {
    try {
      const db = await this.openDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      await store.clear()
      console.log('Cleared all offline clock events')
    } catch (error) {
      console.error('Error clearing offline events:', error)
      throw error
    }
  }

  /**
   * Sync all pending events to the server
   */
  static async syncPendingEvents(): Promise<{ success: number; failed: number }> {
    const events = await this.getPendingEvents()
    let success = 0
    let failed = 0

    console.log(`Syncing ${events.length} offline clock events`)

    for (const event of events) {
      try {
        const response = await fetch(event.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event.requestData)
        })
        
        if (response.ok) {
          await this.removeEvent(event.id)
          success++
          console.log('Synced offline clock event:', event.id)
        } else {
          failed++
          console.error('Failed to sync offline clock event:', event.id, response.status)
        }
      } catch (error) {
        failed++
        console.error('Error syncing offline clock event:', event.id, error)
      }
    }

    return { success, failed }
  }

  /**
   * Register background sync for offline events
   */
  private static async registerBackgroundSync(): Promise<void> {
    try {
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register('sync-offline-clock-events')
        console.log('Registered background sync for offline clock events')
      }
    } catch (error) {
      console.error('Error registering background sync:', error)
    }
  }

  /**
   * Get the count of pending events
   */
  static async getPendingEventCount(): Promise<number> {
    const events = await this.getPendingEvents()
    return events.length
  }

  /**
   * Check if the browser supports offline storage
   */
  static isSupported(): boolean {
    return 'indexedDB' in window && 'serviceWorker' in navigator
  }

  /**
   * Get offline storage status info
   */
  static async getStatus(): Promise<{
    supported: boolean
    pendingEvents: number
    lastEventTime: string | null
  }> {
    const supported = this.isSupported()
    let pendingEvents = 0
    let lastEventTime: string | null = null

    if (supported) {
      try {
        const events = await this.getPendingEvents()
        pendingEvents = events.length
        if (events.length > 0) {
          lastEventTime = events[events.length - 1].timestamp
        }
      } catch (error) {
        console.error('Error getting offline storage status:', error)
      }
    }

    return {
      supported,
      pendingEvents,
      lastEventTime
    }
  }
}

/**
 * Hook for monitoring offline status and pending events
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingEvents, setPendingEvents] = useState(0)

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

  return {
    isOnline,
    pendingEvents,
    syncPendingEvents: OfflineStorage.syncPendingEvents,
    getStatus: OfflineStorage.getStatus
  }
}
