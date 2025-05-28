export interface Worker {
    id: string;
    name: string;
    role: 'employee' | 'contractor' | 'subcontractor';
    hourly_rate: number;
    active: boolean;
  };

  export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    projects: number;
    address: string;
    created_at: string;
  }
  export interface Project {
    id: string
    name: string
    client_id: string
    start_date: string
    status: "not_started" | "in_progress" | "paused" | "completed" | "cancelled"
}

export interface ProjectAssignment {
  id: string
  worker_id: string
  project_id: string
}

export type EntryMode = "clock-in-out" | "total hours";

// Core timesheet type
export type Timesheet = {
  id: string
  date: string
  worker_id: string
  project_id: string
  task_description: string
  clock_in: string
  clock_out: string
  break_duration: number
  regular_hours: number
  overtime_hours: number
  total_hours: number
  hourly_rate: number
  total_pay: number
  supervisor_approval: boolean
  notes?: string
  created_at?: string
  updated_at?: string
}

// Input type for creating new timesheets (without id and timestamps)
export type CreateTimesheetInput = Omit<Timesheet, "id" | "created_at" | "updated_at">

// Input type for updating timesheets (partial fields except id)
export type UpdateTimesheetInput = Partial<Omit<Timesheet, "id" | "created_at" | "updated_at">> & {
  id: string
}

// Response wrapper for consistent API responses
export type ApiResponse<T> = {
  data: T | null
  error: string | null
  success: boolean
}

// Filters for querying timesheets
export type TimesheetFilters = {
  worker_id?: string
  project_id?: string
  date_from?: string
  date_to?: string
  supervisor_approval?: boolean
  limit?: number
  offset?: number
}

// Extended timesheet with related data for display
export type TimesheetWithDetails = Timesheet & {
  worker?: {
    id: string
    name: string
    role?: string
  }
  project?: {
    id: string
    name: string
    location?: string
  }
}
