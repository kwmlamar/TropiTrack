import { ProfilePageClient } from "@/components/profile/profile-page-client"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { redirect } from "next/navigation"

/**
 * Profile Page
 *
 * Responsive profile page that adapts to mobile and desktop layouts:
 * - Mobile/PWA: Native app-like experience with vertical stacking
 * - Desktop: Standard dashboard layout with sidebar
 */
export default async function ProfilePage() {
  const profile = await getUserProfileWithCompany()

  if (!profile) {
    redirect('/login')
  }

  return <ProfilePageClient profile={profile} />
}
