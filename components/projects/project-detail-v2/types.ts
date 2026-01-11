// Types for Project Details v2 components

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked'

export interface TimelineTask {
  id: string
  name: string
  startDate: string
  endDate: string
  progress: number
  status: TaskStatus
  phase: string
  color?: string
}

export interface TimelinePhase {
  id: string
  name: string
  tasks: TimelineTask[]
}

export interface TaskItem {
  id: string
  name: string
  status: TaskStatus
  assignedWorkers: { id: string; name: string }[]
  percentComplete: number
  dueDate?: string
  priority: 'low' | 'medium' | 'high'
}

export interface PhaseGroup {
  id: string
  name: string
  tasks: TaskItem[]
  overallProgress: number
}

export interface FinancialData {
  estimatedLabor: number
  actualLabor: number
  invoicedAmount: number
  paidAmount: number
  outstandingBalance: number
  invoiceCount: number
  unpaidInvoiceCount: number
}

export interface ProjectProgress {
  percentage: number
  daysRemaining: number | null
  isOverdue: boolean
}

export interface ActivityItem {
  id: string
  type: 'timesheet' | 'approval' | 'invoice' | 'task' | 'team'
  description: string
  workerName?: string
  timestamp: Date
  metadata?: Record<string, unknown>
}
