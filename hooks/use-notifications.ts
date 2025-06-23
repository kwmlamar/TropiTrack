import { useState, useEffect, useCallback } from 'react'
import { useUser } from '../lib/hooks/use-user'
import { 
  getNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  createSystemNotification
} from '@/lib/data/notifications'
import { Notification, NewNotification } from '@/lib/types/notification'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseNotificationsOptions {
  autoSubscribe?: boolean
  limit?: number
  includeRead?: boolean
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { autoSubscribe = true, limit = 50, includeRead = true } = options
  const { user, loading: userLoading, initialized } = useUser()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)
      
      const filters = {
        user_id: user.id,
        limit,
        ...(includeRead ? {} : { is_read: false })
      }
      
      const data = await getNotifications(filters)
      setNotifications(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [user?.id, limit, includeRead])

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return

    try {
      const count = await getUnreadNotificationCount(user.id)
      setUnreadCount(count)
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
    }
  }, [user?.id])

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await markNotificationAsRead(id)
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read')
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    try {
      await markAllNotificationsAsRead(user.id)
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      )
      setUnreadCount(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read')
    }
  }, [user?.id])

  // Delete notification
  const removeNotification = useCallback(async (id: string) => {
    try {
      await deleteNotification(id)
      setNotifications(prev => prev.filter(notification => notification.id !== id))
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n.id === id)
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification')
    }
  }, [notifications])

  // Create notification
  const createNotification = useCallback(async (notification: Omit<NewNotification, 'user_id' | 'company_id'>) => {
    if (!user?.id) {
      throw new Error('User not available')
    }

    // Use the company_id from the user profile
    const companyId = user.company_id || 'placeholder-company-id'

    try {
      const newNotification = await createSystemNotification(
        user.id,
        companyId,
        notification.title,
        notification.message,
        notification.type,
        notification.category,
        notification.action_url,
        notification.action_text,
        notification.metadata
      )
      
      setNotifications(prev => [newNotification, ...prev])
      if (!newNotification.is_read) {
        setUnreadCount(prev => prev + 1)
      }
      
      return newNotification
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create notification')
      throw err
    }
  }, [user?.id, user?.company_id])

  // Handle real-time updates
  const handleNotificationUpdate = useCallback((notification: Notification) => {
    setNotifications(prev => {
      const existingIndex = prev.findIndex(n => n.id === notification.id)
      
      if (existingIndex >= 0) {
        // Update existing notification
        const updated = [...prev]
        const oldNotification = updated[existingIndex]
        updated[existingIndex] = notification
        
        // Update unread count
        if (oldNotification.is_read !== notification.is_read) {
          setUnreadCount(prev => 
            notification.is_read ? Math.max(0, prev - 1) : prev + 1
          )
        }
        
        return updated
      } else {
        // Add new notification
        if (!notification.is_read) {
          setUnreadCount(prev => prev + 1)
        }
        return [notification, ...prev]
      }
    })
  }, [])

  // Subscribe to real-time updates
  const subscribe = useCallback(() => {
    if (!user?.id || subscription) return

    const channel = subscribeToNotifications(user.id, handleNotificationUpdate)
    setSubscription(channel)
  }, [user?.id, subscription, handleNotificationUpdate])

  // Unsubscribe from real-time updates
  const unsubscribe = useCallback(() => {
    if (subscription) {
      unsubscribeFromNotifications(subscription)
      setSubscription(null)
    }
  }, [subscription])

  // Initial data fetch - only when user is loaded and available
  useEffect(() => {
    if (initialized && !userLoading && user?.id) {
      fetchNotifications()
      fetchUnreadCount()
    } else if (initialized && !userLoading && !user) {
      // User is not authenticated, set loading to false
      setLoading(false)
    }
  }, [initialized, userLoading, user?.id, fetchNotifications, fetchUnreadCount])

  // Auto-subscribe to real-time updates - only when user is loaded and available
  useEffect(() => {
    if (autoSubscribe && initialized && !userLoading && user?.id) {
      subscribe()
    }

    return () => {
      unsubscribe()
    }
  }, [autoSubscribe, initialized, userLoading, user?.id, subscribe, unsubscribe])

  return {
    notifications,
    unreadCount,
    loading: loading || userLoading || !initialized,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    createNotification,
    subscribe,
    unsubscribe
  }
} 