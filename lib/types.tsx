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
  total_pay: number
  supervisor_approval: "pending" | "approved" | "rejected"
  notes?: string
  created_at?: string
  updated_at?: string
  total_hours: number
}

// Input type for creating new timesheets (without id and timestamps)
export type CreateTimesheetInput = Omit<Timesheet, "id" | "created_at" | "updated_at" | "supervisor_approval"> & {supervisor_approval?: "pending" | "approved" | "rejected"}

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
  supervisor_approval?: "pending" | "approved" | "rejected"
  limit?: number
  offset?: number
}

// Extended timesheet with related data for display
export type TimesheetWithDetails = Timesheet & {
  worker?: {
    id: string
    name: string
    role?: string
    hourly_rate?: number
    position?: string
    department?: string
  }
  project?: {
    id: string
    name: string
    location?: string
  }
}

export type PayrollRecord = {
  id: string;
  worker_id: string;
  worker_name: string;
  total_hours: number;
  overtime_hours: number;
  hourly_rate: number;
  gross_pay: number;
  nib_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  position?: string;
  department?: string;
  status: "pending" | "confirmed" | "paid" | "void";
  company_id: string;
  project_id?: string;
  project_name?: string;
  created_at: string;
  updated_at?: string;
  pay_period_start: string;
  pay_period_end: string;
  created_by?: string;
};

export type CreatePayrollInput = Omit<PayrollRecord, "id" | "created_at" | "updated_at" | "total_deductions" | "net_pay">;
export type UpdatePayrollInput = Partial<Omit<PayrollRecord, "id" | "created_at" | "updated_at" | "total_deductions" | "net_pay">> & { id: string };

// Transaction types
export type Transaction = {
  id: string;
  company_id: string;
  transaction_id: string;
  date: string;
  description: string;
  category: string;
  type: "income" | "expense" | "liability";
  amount: number;
  status: "completed" | "pending" | "failed" | "cancelled";
  account: string;
  reference?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
};

export type CreateTransactionInput = Omit<Transaction, "id" | "created_at" | "updated_at">;
export type UpdateTransactionInput = Partial<Omit<Transaction, "id" | "created_at" | "updated_at">> & { id: string };

// Transaction filters
export type TransactionFilters = {
  date_from?: string;
  date_to?: string;
  type?: "income" | "expense" | "liability";
  status?: "completed" | "pending" | "failed" | "cancelled";
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
};
