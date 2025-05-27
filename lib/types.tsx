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

export type Timesheet = {
  id: string;
  date: string;
  worker_id: string;
  project_id: string;
  task_description: string;
  clock_in: string;
  clock_out: string;
  break_duration: number;
  regular_hours: number;
  overtime_hours: number;
  total_hours: number;
  hourly_rate: number;
  total_pay: number;
  supervisor_approval: boolean;
  notes?: string;
};

export type WeeklyTimesheetRow = {
  worker_id: string;
  worker_name?: string;
  mon?: number;
  tue?: number;
  wed?: number;
  thu?: number;
  fri?: number;
  sat?: number;
  sun?: number;
  approved?: boolean;
};