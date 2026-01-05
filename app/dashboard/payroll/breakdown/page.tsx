import { MobilePayrollBreakdown } from "@/components/payroll/mobile-payroll-breakdown"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { redirect } from "next/navigation"

/**
 * Payroll Breakdown Page
 *
 * Shows detailed payroll breakdown for a specific worker and pay period.
 * Mobile-only page accessed from the mobile payroll overview.
 */
export default async function PayrollBreakdownPage() {
  const profile = await getUserProfileWithCompany()

  if (!profile) {
    redirect("/login")
  }

  return <MobilePayrollBreakdown />
}
