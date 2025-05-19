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