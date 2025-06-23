import { supabase } from '@/lib/supabaseClient'
import { Notification, NewNotification, UpdateNotification, NotificationFilters } from '@/lib/types/notification'
import { RealtimeChannel } from '@supabase/supabase-js'

export async function getNotifications(filters: NotificationFilters = {}): Promise<Notification[]> {
  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id)
  }

  if (filters.company_id) {
    query = query.eq('company_id', filters.company_id)
  }

  if (filters.type) {
    query = query.eq('type', filters.type)
  }

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.is_read !== undefined) {
    query = query.eq('is_read', filters.is_read)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching notifications:', error)
    throw new Error('Failed to fetch notifications')
  }

  return data || []
}

export async function getNotificationById(id: string): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching notification:', error)
    throw new Error('Failed to fetch notification')
  }

  return data
}

export async function createNotification(notification: NewNotification): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single()

  if (error) {
    console.error('Error creating notification:', error)
    throw new Error('Failed to create notification')
  }

  return data
}

export async function updateNotification(id: string, updates: UpdateNotification): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating notification:', error)
    throw new Error('Failed to update notification')
  }

  return data
}

export async function markNotificationAsRead(id: string): Promise<Notification> {
  return updateNotification(id, { is_read: true })
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking notifications as read:', error)
    throw new Error('Failed to mark notifications as read')
  }
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting notification:', error)
    throw new Error('Failed to delete notification')
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_unread_notification_count', { user_uuid: userId })

  if (error) {
    console.error('Error getting unread notification count:', error)
    throw new Error('Failed to get unread notification count')
  }

  return data || 0
}

// Real-time subscription functions
export function subscribeToNotifications(userId: string, callback: (notification: Notification) => void): RealtimeChannel {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload: { new: Notification }) => {
        callback(payload.new)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload: { new: Notification }) => {
        callback(payload.new)
      }
    )
    .subscribe()
}

export function unsubscribeFromNotifications(subscription: RealtimeChannel | null): void {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
}

// Helper function to create system notifications
export async function createSystemNotification(
  userId: string,
  companyId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  category: 'general' | 'timesheet' | 'payroll' | 'project' | 'worker' | 'client' | 'system' = 'system',
  actionUrl?: string,
  actionText?: string,
  metadata?: Record<string, string | number | boolean | null | undefined>
): Promise<Notification> {
  return createNotification({
    user_id: userId,
    company_id: companyId,
    title,
    message,
    type,
    category,
    is_read: false,
    action_url: actionUrl,
    action_text: actionText,
    metadata
  })
}

// Manual cleanup function for testing and manual cleanup
export async function cleanupOldNotifications(): Promise<number> {
  const { data, error } = await supabase.rpc('cleanup_old_notifications_manual')
  
  if (error) {
    throw new Error(`Failed to cleanup old notifications: ${error.message}`)
  }
  
  return data || 0
} 