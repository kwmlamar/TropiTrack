import DashboardLayout from "@/components/layouts/dashboard-layout"
import { QRCodeManager } from "@/components/qr-clock/qr-code-manager"
import { createClient } from "@/utils/supabase/server"

export default async function QRCodesPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error("User not found")

  return (
    <DashboardLayout title="QR Code Management">
      <div className="container mx-auto p-6">
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-1000">
          <QRCodeManager userId={user.id} />
        </div>
      </div>
    </DashboardLayout>
  )
} 