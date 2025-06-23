import { createSystemNotification } from '@/lib/data/notifications'

export interface NotificationData {
  userId: string
  companyId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  category?: 'general' | 'timesheet' | 'payroll' | 'project' | 'worker' | 'client' | 'system'
  actionUrl?: string
  actionText?: string
  metadata?: Record<string, string | number | boolean | null | undefined>
}

// Company-wide notification functions
export async function createCompanyNotification(
  excludeUserId: string,
  companyId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  category: 'general' | 'timesheet' | 'payroll' | 'project' | 'worker' | 'client' | 'system' = 'general',
  actionUrl?: string,
  actionText?: string,
  metadata?: Record<string, string | number | boolean | null | undefined>
) {
  const { supabase } = await import('@/lib/supabaseClient')
  
  // Get all users in the company except the excluded user
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('company_id', companyId)
    .neq('id', excludeUserId)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching company users:', error)
    throw new Error('Failed to fetch company users')
  }

  // Create notifications for all users
  const notifications = users?.map(user => ({
    user_id: user.id,
    company_id: companyId,
    title,
    message,
    type,
    category,
    is_read: false,
    action_url: actionUrl,
    action_text: actionText,
    metadata
  })) || []

  if (notifications.length > 0) {
    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (insertError) {
      console.error('Error creating company notifications:', insertError)
      throw new Error('Failed to create company notifications')
    }
  }

  return notifications.length
}

// Enhanced notification functions that can create company-wide notifications
export async function createTimesheetSubmittedNotificationCompanyWide(data: {
  excludeUserId: string
  companyId: string
  workerName: string
  projectName: string
  totalHours: number
  date: string
  actionUrl?: string
}) {
  return createCompanyNotification(
    data.excludeUserId,
    data.companyId,
    'Timesheet Submitted',
    `${data.workerName} submitted a timesheet for ${data.projectName} (${data.totalHours} hours on ${data.date})`,
    'info',
    'timesheet',
    data.actionUrl,
    'Review Timesheet',
    {
      workerName: data.workerName,
      projectName: data.projectName,
      totalHours: data.totalHours,
      date: data.date
    }
  )
}

export async function createTimesheetApprovedNotificationCompanyWide(data: {
  excludeUserId: string
  companyId: string
  workerName: string
  projectName: string
  approvedBy: string
  actionUrl?: string
}) {
  return createCompanyNotification(
    data.excludeUserId,
    data.companyId,
    'Timesheet Approved',
    `Timesheet for ${data.projectName} has been approved by ${data.approvedBy}`,
    'success',
    'timesheet',
    data.actionUrl,
    'View Timesheet',
    {
      workerName: data.workerName,
      projectName: data.projectName,
      approvedBy: data.approvedBy
    }
  )
}

export async function createTimesheetRejectedNotificationCompanyWide(data: {
  excludeUserId: string
  companyId: string
  workerName: string
  projectName: string
  rejectedBy: string
  reason?: string
  actionUrl?: string
}) {
  return createCompanyNotification(
    data.excludeUserId,
    data.companyId,
    'Timesheet Rejected',
    `Timesheet for ${data.projectName} has been rejected by ${data.rejectedBy}${data.reason ? `: ${data.reason}` : ''}`,
    'error',
    'timesheet',
    data.actionUrl,
    'View Timesheet',
    {
      workerName: data.workerName,
      projectName: data.projectName,
      rejectedBy: data.rejectedBy,
      reason: data.reason
    }
  )
}

export async function createPayrollGeneratedNotificationCompanyWide(data: {
  excludeUserId: string
  companyId: string
  period: string
  workerCount: number
  totalAmount: number
  actionUrl?: string
}) {
  return createCompanyNotification(
    data.excludeUserId,
    data.companyId,
    'Payroll Generated',
    `Payroll for ${data.period} has been generated for ${data.workerCount} workers ($${data.totalAmount.toLocaleString()})`,
    'success',
    'payroll',
    data.actionUrl,
    'View Payroll',
    {
      period: data.period,
      workerCount: data.workerCount,
      totalAmount: data.totalAmount
    }
  )
}

export async function createProjectCreatedNotificationCompanyWide(data: {
  excludeUserId: string
  companyId: string
  projectName: string
  clientName: string
  createdBy: string
  actionUrl?: string
}) {
  return createCompanyNotification(
    data.excludeUserId,
    data.companyId,
    'New Project Created',
    `Project "${data.projectName}" has been created for ${data.clientName} by ${data.createdBy}`,
    'info',
    'project',
    data.actionUrl,
    'View Project',
    {
      projectName: data.projectName,
      clientName: data.clientName,
      createdBy: data.createdBy
    }
  )
}

export async function createProjectCompletedNotificationCompanyWide(data: {
  excludeUserId: string
  companyId: string
  projectName: string
  completedBy: string
  actionUrl?: string
}) {
  return createCompanyNotification(
    data.excludeUserId,
    data.companyId,
    'Project Completed',
    `Project "${data.projectName}" has been marked as completed by ${data.completedBy}`,
    'success',
    'project',
    data.actionUrl,
    'View Project',
    {
      projectName: data.projectName,
      completedBy: data.completedBy
    }
  )
}

export async function createWorkerAddedNotificationCompanyWide(data: {
  excludeUserId: string
  companyId: string
  workerName: string
  addedBy: string
  projectName?: string
  actionUrl?: string
}) {
  return createCompanyNotification(
    data.excludeUserId,
    data.companyId,
    'New Worker Added',
    `${data.workerName} has been added to the team by ${data.addedBy}${data.projectName ? ` and assigned to ${data.projectName}` : ''}`,
    'info',
    'worker',
    data.actionUrl,
    'View Worker',
    {
      workerName: data.workerName,
      addedBy: data.addedBy,
      projectName: data.projectName
    }
  )
}

export async function createWorkerRemovedNotificationCompanyWide(data: {
  excludeUserId: string
  companyId: string
  workerName: string
  removedBy: string
  actionUrl?: string
}) {
  return createCompanyNotification(
    data.excludeUserId,
    data.companyId,
    'Worker Removed',
    `${data.workerName} has been removed from the team by ${data.removedBy}`,
    'warning',
    'worker',
    data.actionUrl,
    'View Workers',
    {
      workerName: data.workerName,
      removedBy: data.removedBy
    }
  )
}

export async function createClientAddedNotificationCompanyWide(data: {
  excludeUserId: string
  companyId: string
  clientName: string
  addedBy: string
  actionUrl?: string
}) {
  return createCompanyNotification(
    data.excludeUserId,
    data.companyId,
    'New Client Added',
    `Client "${data.clientName}" has been added by ${data.addedBy}`,
    'info',
    'client',
    data.actionUrl,
    'View Client',
    {
      clientName: data.clientName,
      addedBy: data.addedBy
    }
  )
}

// Timesheet notifications
export async function createTimesheetSubmittedNotification(data: {
  userId: string
  companyId: string
  workerName: string
  projectName: string
  totalHours: number
  date: string
  actionUrl?: string
}) {
  return createSystemNotification(
    data.userId,
    data.companyId,
    'Timesheet Submitted',
    `${data.workerName} submitted a timesheet for ${data.projectName} (${data.totalHours} hours on ${data.date})`,
    'info',
    'timesheet',
    data.actionUrl,
    'Review Timesheet'
  )
}

export async function createTimesheetApprovedNotification(data: {
  userId: string
  companyId: string
  workerName: string
  projectName: string
  actionUrl?: string
}) {
  return createSystemNotification(
    data.userId,
    data.companyId,
    'Timesheet Approved',
    `Your timesheet for ${data.projectName} has been approved`,
    'success',
    'timesheet',
    data.actionUrl,
    'View Timesheet'
  )
}

export async function createTimesheetRejectedNotification(data: {
  userId: string
  companyId: string
  workerName: string
  projectName: string
  reason?: string
  actionUrl?: string
}) {
  return createSystemNotification(
    data.userId,
    data.companyId,
    'Timesheet Rejected',
    `Your timesheet for ${data.projectName} has been rejected${data.reason ? `: ${data.reason}` : ''}`,
    'error',
    'timesheet',
    data.actionUrl,
    'View Timesheet'
  )
}

// Payroll notifications
export async function createPayrollGeneratedNotification(data: {
  userId: string
  companyId: string
  period: string
  workerCount: number
  totalAmount: number
  actionUrl?: string
}) {
  return createSystemNotification(
    data.userId,
    data.companyId,
    'Payroll Generated',
    `Payroll for ${data.period} has been generated for ${data.workerCount} workers ($${data.totalAmount.toLocaleString()})`,
    'success',
    'payroll',
    data.actionUrl,
    'View Payroll'
  )
}

export async function createPayrollErrorNotification(data: {
  userId: string
  companyId: string
  error: string
  actionUrl?: string
}) {
  return createSystemNotification(
    data.userId,
    data.companyId,
    'Payroll Error',
    `There was an error generating payroll: ${data.error}`,
    'error',
    'payroll',
    data.actionUrl,
    'Review Payroll'
  )
}

// Project notifications
export async function createProjectCreatedNotification(data: {
  userId: string
  companyId: string
  projectName: string
  clientName: string
  actionUrl?: string
}) {
  return createSystemNotification(
    data.userId,
    data.companyId,
    'New Project Created',
    `Project "${data.projectName}" has been created for ${data.clientName}`,
    'info',
    'project',
    data.actionUrl,
    'View Project'
  )
}

export async function createProjectCompletedNotification(data: {
  userId: string
  companyId: string
  projectName: string
  actionUrl?: string
}) {
  return createSystemNotification(
    data.userId,
    data.companyId,
    'Project Completed',
    `Project "${data.projectName}" has been marked as completed`,
    'success',
    'project',
    data.actionUrl,
    'View Project'
  )
}

// Worker notifications
export async function createWorkerAddedNotification(data: {
  userId: string
  companyId: string
  workerName: string
  projectName?: string
  actionUrl?: string
}) {
  return createSystemNotification(
    data.userId,
    data.companyId,
    'New Worker Added',
    `${data.workerName} has been added to the team${data.projectName ? ` and assigned to ${data.projectName}` : ''}`,
    'info',
    'worker',
    data.actionUrl,
    'View Worker'
  )
}

export async function createWorkerRemovedNotification(data: {
  userId: string
  companyId: string
  workerName: string
  actionUrl?: string
}) {
  return createSystemNotification(
    data.userId,
    data.companyId,
    'Worker Removed',
    `${data.workerName} has been removed from the team`,
    'warning',
    'worker',
    data.actionUrl,
    'View Workers'
  )
}

// Client notifications
export async function createClientAddedNotification(data: {
  userId: string
  companyId: string
  clientName: string
  actionUrl?: string
}) {
  return createSystemNotification(
    data.userId,
    data.companyId,
    'New Client Added',
    `Client "${data.clientName}" has been added to the system`,
    'info',
    'client',
    data.actionUrl,
    'View Client'
  )
}

// System notifications
export async function createSystemMaintenanceNotification(data: {
  userId: string
  companyId: string
  message: string
  actionUrl?: string
}) {
  return createSystemNotification(
    data.userId,
    data.companyId,
    'System Maintenance',
    data.message,
    'warning',
    'system',
    data.actionUrl,
    'Learn More'
  )
}

export async function createWelcomeNotification(data: {
  userId: string
  companyId: string
  userName: string
}) {
  return createSystemNotification(
    data.userId,
    data.companyId,
    'Welcome to TropiTrack!',
    `Welcome ${data.userName}! We're excited to help you manage your workforce efficiently.`,
    'success',
    'general',
    '/dashboard',
    'Get Started'
  )
}

export async function createPayrollConfirmedNotificationCompanyWide(data: {
  excludeUserId: string
  companyId: string
  workerName: string
  period: string
  grossPay: number
  actionUrl?: string
}) {
  return createCompanyNotification(
    data.excludeUserId,
    data.companyId,
    'Payroll Confirmed',
    `Payroll for ${data.workerName} has been confirmed for ${data.period} ($${data.grossPay.toLocaleString()})`,
    'success',
    'payroll',
    data.actionUrl,
    'View Payroll',
    {
      workerName: data.workerName,
      period: data.period,
      grossPay: data.grossPay
    }
  )
}

export async function createPayrollPaidNotificationCompanyWide(data: {
  excludeUserId: string
  companyId: string
  workerName: string
  period: string
  grossPay: number
  actionUrl?: string
}) {
  return createCompanyNotification(
    data.excludeUserId,
    data.companyId,
    'Payroll Paid',
    `Payroll for ${data.workerName} has been marked as paid for ${data.period} ($${data.grossPay.toLocaleString()})`,
    'success',
    'payroll',
    data.actionUrl,
    'View Payroll',
    {
      workerName: data.workerName,
      period: data.period,
      grossPay: data.grossPay
    }
  )
}

export async function createPayrollVoidedNotificationCompanyWide(data: {
  excludeUserId: string
  companyId: string
  workerName: string
  period: string
  actionUrl?: string
}) {
  return createCompanyNotification(
    data.excludeUserId,
    data.companyId,
    'Payroll Voided',
    `Payroll for ${data.workerName} has been voided for ${data.period}`,
    'warning',
    'payroll',
    data.actionUrl,
    'View Payroll',
    {
      workerName: data.workerName,
      period: data.period
    }
  )
} 