import { Suspense } from "react"
import { InvitesList } from "@/components/invites/invites-list"
import { InvitesHeader } from "@/components/invites/invites-header"
import  DashboardLayout  from "@/components/layouts/dashboard-layout"
import { getUserProfile as getUserProfileWithCompany } from "@/lib/data/userProfiles"

export const metadata = {
  title: "Invites | Construction Timesheets",
}

export default async function InvitesPage() {
  const profile = await getUserProfileWithCompany();

  return (
    <DashboardLayout title="Invites">
      <div className="container mx-auto p-6 space-y-6">
        <InvitesHeader profile={profile}/>
        <Suspense fallback={<div>Loading invites...</div>}>
          <InvitesList userId={profile.id}/>
        </Suspense>
      </div>
    </DashboardLayout>
  )
}
