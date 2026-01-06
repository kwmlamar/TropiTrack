import { createClient } from "@/utils/supabase/server"
import { ClientsPageClient } from "@/components/clients/clients-page-client"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { redirect } from "next/navigation"

/**
 * Clients Page
 *
 * Responsive page that adapts to mobile and desktop layouts:
 * - Mobile/PWA: Native app-like list with search and avatars
 * - Desktop: Standard dashboard layout with data table
 */
export default async function ClientPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (!user || userError) {
    redirect("/login")
  }

  const profile = await getUserProfileWithCompany()
  if (!profile) {
    redirect("/login")
  }

  return <ClientsPageClient profile={profile} user={user} />
}