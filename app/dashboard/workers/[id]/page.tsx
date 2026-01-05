import { WorkerDetailPageClient } from "@/components/workers/worker-detail-page-client"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { redirect } from "next/navigation"

/**
 * Worker Details Page
 *
 * Responsive worker detail page that adapts to mobile and desktop layouts:
 * - Mobile/PWA: Native app-like detail view with quick actions
 * - Desktop: Standard dashboard layout with tabs
 */
export default async function WorkerDetailsPage() {
  const profile = await getUserProfileWithCompany()

  if (!profile) {
    redirect("/login")
  }

  return <WorkerDetailPageClient profile={profile} />
} 