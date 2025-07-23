import DashboardLayout from "@/components/layouts/dashboard-layout"
import { ProfileForm } from "@/components/profile/profile-form"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const profile = await getUserProfileWithCompany()

  if (!profile) {
    redirect('/login')
  }

  return (
    <DashboardLayout title="Profile">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-gray-500">
            Manage your personal information and account settings.
          </p>
        </div>

        <ProfileForm initialProfile={profile} />
      </div>
    </DashboardLayout>
  )
}
