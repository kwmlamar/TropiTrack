import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { MigratePayrollTransactions } from "@/components/admin/migrate-payroll-transactions"

export default async function AdminPage() {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/login')
  }

  // Get the user's profile to check if they're an admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
          .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    redirect('/dashboard')
  }

  // For now, allow any authenticated user to access admin page
  // You can add role-based checks here later
  // if (profile.role !== 'admin') {
  //   redirect('/dashboard')
  // }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">
            Administrative tools and utilities
          </p>
        </div>

        <div className="grid gap-6">
          <MigratePayrollTransactions />
        </div>
      </div>
    </div>
  )
} 