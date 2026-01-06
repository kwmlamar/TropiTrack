import { ProjectsPageClient } from "@/components/projects/projects-page-client"
import { createClient } from "@/utils/supabase/server"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { redirect } from "next/navigation"

/**
 * Projects Page
 *
 * Responsive page that adapts to mobile and desktop layouts:
 * - Mobile/PWA: Shows Assets hub (default) or Projects list (?view=list)
 * - Desktop: Standard dashboard layout with projects table
 */
export default async function ProjectsPage() {
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

  return <ProjectsPageClient profile={profile} user={user} />
}
