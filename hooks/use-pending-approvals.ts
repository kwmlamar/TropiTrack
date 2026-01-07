"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"

interface PendingApprovals {
  count: number
  enabled: boolean
}

/**
 * Hook to fetch pending approvals count for mobile navigation badge
 */
export function usePendingApprovals(): PendingApprovals {
  const [approvals, setApprovals] = useState<PendingApprovals>({
    count: 0,
    enabled: false,
  })

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const supabase = createClient()

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          return
        }

        // Get user profile to get company_id
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("company_id")
          .eq("id", user.id)
          .single()

        if (profileError || !profile?.company_id) {
          return
        }

        // Check if approval workflow is enabled
        const { data: settings } = await supabase
          .from("timesheet_settings")
          .select("require_approval")
          .eq("company_id", profile.company_id)
          .single()

        const approvalEnabled = settings?.require_approval ?? false

        if (!approvalEnabled) {
          setApprovals({ count: 0, enabled: false })
          return
        }

        // Count pending approvals
        const { data: pending, error: pendingError } = await supabase
          .from("timesheets")
          .select("id", { count: "exact" })
          .eq("company_id", profile.company_id)
          .eq("supervisor_approval", "pending")

        if (pendingError) {
          console.error("Error fetching pending approvals:", pendingError)
          return
        }

        setApprovals({
          count: pending?.length || 0,
          enabled: true,
        })
      } catch (error) {
        console.error("Error in usePendingApprovals:", error)
      }
    }

    fetchApprovals()

    // Refresh every 30 seconds to keep count updated
    const interval = setInterval(fetchApprovals, 30000)

    return () => clearInterval(interval)
  }, [])

  return approvals
}

