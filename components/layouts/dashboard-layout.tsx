import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { redirect } from 'next/navigation'
import { DashboardLayoutClient } from "./dashboard-layout-client"

type DashboardLayoutProps = {
  children: React.ReactNode
  title?: string
}

export default async function DashboardLayout({ 
  children,
  title = "Dashboard",
}: DashboardLayoutProps) {
  const profile = await getUserProfileWithCompany()

  if (!profile) {
    redirect('/login')
  }

  return <DashboardLayoutClient profile={profile} title={title}>{children}</DashboardLayoutClient>
}
