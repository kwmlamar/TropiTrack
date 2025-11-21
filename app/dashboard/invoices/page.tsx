import DashboardLayout from "@/components/layouts/dashboard-layout"
import { createClient } from "@/utils/supabase/server"
import { InvoicesHeaderActions } from "@/components/invoices/invoices-header-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Wrench } from "lucide-react"

export default async function DashboardInvoicesPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("User not found")
  }

  return (
    <DashboardLayout title="Invoices" fullWidth headerActions={<InvoicesHeaderActions />}>
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Wrench className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">In Development</h2>
            <p className="text-muted-foreground">
              The invoices feature is currently under development. Check back soon!
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}



