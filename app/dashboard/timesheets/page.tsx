import { TimesheetsPageClient } from "@/components/timesheets/timesheets-page-client"
import { createClient } from "@/utils/supabase/server"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { redirect } from "next/navigation"

/**
 * Timesheets Page
 *
 * Responsive timesheets page that adapts to mobile and desktop layouts:
 * - Mobile/PWA: Native app-like card view with expandable workers
 * - Desktop: Standard dashboard layout with weekly data table
 */
export default async function Page() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  const profile = await getUserProfileWithCompany()
  if (!profile) {
    redirect("/login")
  }

  return <TimesheetsPageClient profile={profile} user={user} />
}