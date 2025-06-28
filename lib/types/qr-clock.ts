// QR Code Clock System Types

export interface ProjectLocation {
  id: string
  project_id: string
  company_id: string
  name: string
  description?: string
  address?: string
  latitude?: number
  longitude?: number
  radius_meters?: number // Acceptable scanning radius in meters
  qr_code_id?: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  project?: {
    id: string
    name: string
  }
  qr_code?: QRCode
}

export interface QRCode {
  id: string
  company_id: string
  project_location_id: string
  code_hash: string
  name: string
  description?: string
  qr_type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end'
  is_active: boolean
  expires_at?: string
  created_by: string
  created_at: string
  updated_at: string
  project_location?: ProjectLocation
}

export interface ClockEvent {
  id: string
  worker_id: string
  project_id: string
  project_location_id?: string
  qr_code_id?: string
  event_type: 'clock_in' | 'clock_out'
  event_time: string
  device_info?: Record<string, unknown>
  notes?: string
  created_at: string
  worker?: {
    id: string
    name: string
  }
  project?: {
    id: string
    name: string
  }
  project_location?: ProjectLocation
  qr_code?: QRCode
}

export interface DeviceInfo {
  userAgent?: string
  platform?: string
  language?: string
  timezone?: string
  gps?: {
    latitude: number
    longitude: number
    accuracy?: number
  }
  ip?: string
  screen?: {
    width: number
    height: number
  }
  fingerprint?: string
}

export interface WorkerClockStatus {
  last_event_type: 'clock_in' | 'clock_out'
  last_event_time: string
  is_clocked_in: boolean
}

// Form types
export interface NewProjectLocation {
  project_id: string
  name: string
  description?: string
  address?: string
  latitude?: number
  longitude?: number
  radius_meters?: number
}

export interface NewQRCode {
  project_location_id: string
  name: string
  description?: string
  qr_type?: 'clock_in' | 'clock_out' | 'break_start' | 'break_end'
  expires_at?: string
  is_active?: boolean
}

export interface ClockEventInput {
  worker_id: string
  project_id: string
  qr_code_hash: string
  event_type: 'clock_in' | 'clock_out'
  device_info?: Record<string, unknown>
  notes?: string
}

// API Response types
export interface QRCodeScanResponse {
  success: boolean
  message: string
  worker_status?: WorkerClockStatus
  error?: string
}

export interface QRCodeGenerateResponse {
  success: boolean
  qr_code?: QRCode
  qr_code_url?: string
  error?: string
}

// Timesheet type for auto-generation from clock events
export interface Timesheet {
  id?: string
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
  total_pay: number
  hourly_rate: number
  supervisor_approval: "pending" | "approved" | "rejected"
  notes?: string
  company_id?: string
  created_at?: string
  updated_at?: string
} 