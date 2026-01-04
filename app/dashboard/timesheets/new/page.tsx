import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { fetchWorkersForCompany, fetchProjectsForCompany } from "@/lib/data/data"
import { redirect } from "next/navigation"
import { LogHoursForm } from "@/components/timesheets/log-hours-form"
import { createClient } from "@/utils/supabase/server"

/**
 * Log Hours Page
 *
 * Mobile-optimized page for admins/foremen to log hours on behalf of workers.
 * Prioritizes speed, clarity, and error prevention for field conditions.
 */
export default async function LogHoursPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfileWithCompany()

  if (!profile) {
    redirect("/login")
  }

  // Fetch workers and projects for selection
  const [workers, projects] = await Promise.all([
    fetchWorkersForCompany(user.id),
    fetchProjectsForCompany(user.id),
  ])

  // Filter to only active projects
  const activeProjects = projects.filter(
    (p) => p.status === "in_progress" || p.status === "planning"
  )

  return (
    <LogHoursForm
      userId={user.id}
      workers={workers}
      projects={activeProjects}
      companyId={profile.company_id}
    />
  )
}
