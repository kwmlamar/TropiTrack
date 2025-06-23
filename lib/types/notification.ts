export interface Notification {
  id: string
  user_id: string
  company_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'general' | 'timesheet' | 'payroll' | 'project' | 'worker' | 'client' | 'system'
  is_read: boolean
  action_url?: string
  action_text?: string
  metadata?: Record<string, string | number | boolean | null | undefined>
  created_at: string
  updated_at: string
}

export type NewNotification = Omit<Notification, 'id' | 'created_at' | 'updated_at'> & {
  type?: 'info' | 'success' | 'warning' | 'error'
  category?: 'general' | 'timesheet' | 'payroll' | 'project' | 'worker' | 'client' | 'system'
  is_read?: boolean
  metadata?: Record<string, string | number | boolean | null | undefined>
}

export type UpdateNotification = Partial<Omit<Notification, 'id' | 'created_at' | 'updated_at'>>

export type NotificationFilters = {
  user_id?: string
  company_id?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  category?: 'general' | 'timesheet' | 'payroll' | 'project' | 'worker' | 'client' | 'system'
  is_read?: boolean
  limit?: number
  offset?: number
}

export interface NotificationWithUser extends Notification {
  user?: {
    id: string
    first_name?: string
    last_name?: string
    email: string
  }
} 