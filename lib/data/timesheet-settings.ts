// import { createClient } from '@/utils/supabase/client';
// import { getCurrentUserCompany } from './companies';
import type { ApiResponse } from '@/lib/types';

export interface TimesheetSettings {
  id: string;
  company_id: string;
  work_day_start: string;
  work_day_end: string;
  break_time: number;
  overtime_threshold: number;
  rounding_method: 'nearest_15' | 'nearest_30' | 'exact';
  auto_clockout: boolean;
  require_approval: boolean;
  allow_overtime: boolean;
  created_at: string;
  updated_at: string;
}

export async function getTimesheetSettings(): Promise<ApiResponse<TimesheetSettings>> {
  try {
    const response = await fetch('/api/timesheet-settings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to fetch timesheet settings',
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('Error fetching timesheet settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function updateTimesheetSettings(settings: Partial<TimesheetSettings>): Promise<ApiResponse<TimesheetSettings>> {
  try {
    const response = await fetch('/api/timesheet-settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to update timesheet settings',
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('Error updating timesheet settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getTimesheetSettingsRequireApproval(): Promise<boolean> {
  try {
    const result = await getTimesheetSettings();
    if (result.success && result.data) {
      return result.data.require_approval;
    }
    // Default to true if settings not found
    return true;
  } catch (error) {
    console.error('Error checking approval requirement:', error);
    // Default to true on error
    return true;
  }
}
