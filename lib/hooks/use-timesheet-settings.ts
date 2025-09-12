"use client"

import { useState, useEffect } from 'react'
import { getTimesheetSettings, type TimesheetSettings } from '@/lib/data/timesheet-settings'

export function useTimesheetSettings() {
  const [settings, setSettings] = useState<TimesheetSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getTimesheetSettings()
        
        if (result.success && result.data) {
          setSettings(result.data)
        } else {
          setError(result.error || 'Failed to load timesheet settings')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const refresh = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getTimesheetSettings()
      
      if (result.success && result.data) {
        setSettings(result.data)
      } else {
        setError(result.error || 'Failed to load timesheet settings')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return {
    settings,
    loading,
    error,
    refresh,
    requireApproval: settings?.require_approval ?? true, // Default to true if not loaded
    autoClockout: settings?.auto_clockout ?? true,
    allowOvertime: settings?.allow_overtime ?? true,
  }
}
