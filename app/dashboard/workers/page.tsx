import { WorkersPageClient } from "@/components/workers/workers-page-client"
import { createClient } from "@/utils/supabase/server"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { redirect } from "next/navigation"

/**
 * Workers Page
 *
 * Responsive workers page that adapts to mobile and desktop layouts:
 * - Mobile/PWA: Native app-like list with search
 * - Desktop: Standard dashboard layout with data table
 */
export default async function WorkerPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/login")
  }

  const profile = await getUserProfileWithCompany()
  if (!profile) {
    redirect("/login")
  }

  return <WorkersPageClient profile={profile} user={user} />
}