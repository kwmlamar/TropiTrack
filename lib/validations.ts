import { z } from "zod"

// Timesheet validation schema
export const timesheetSchema = z.object({
  date: z.string().min(1, "Date is required"),
  worker_id: z.string().min(1, "Worker is required"),
  project_id: z.string().min(1, "Project is required"),
  task_description: z.string().optional(),
  clock_in: z.string().min(1, "Clock in time is required"),
  clock_out: z.string().min(1, "Clock out time is required"),
  break_duration: z.number().min(0, "Break duration must be positive").max(480, "Break cannot exceed 8 hours"),
  hourly_rate: z.number().min(0, "Hourly rate must be positive"),
  supervisor_approval: z.boolean().optional().default(false),
  notes: z.string().optional(),
})

// Worker validation schema
export const workerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")).nullable(),
  phone: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  hourly_rate: z.number().min(0, "Hourly rate must be positive"),
  hire_date: z.string().min(1, "Hire date is required"),
  is_active: z.boolean().default(true),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
})

// Project validation schema
export const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  description: z.string().optional(),
  client_id: z.string().min(1, "Client is required"),
  location: z.string().optional(),
  start_date: z.string().min(1, "Start date is required").nullable(),
  end_date: z.string().optional().nullable(),
  budget: z.number().min(0, "Budget must be positive").optional(),
  status: z.enum(["not_started", "in_progress", "paused", "completed", "cancelled"]).default("not_started"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
})

// Client validation schema
export const clientSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
})

// Type exports
export type TimesheetFormData = z.infer<typeof timesheetSchema>
export type WorkerFormData = z.infer<typeof workerSchema>
export type ProjectFormData = z.infer<typeof projectSchema>
export type ClientFormData = z.infer<typeof clientSchema>
