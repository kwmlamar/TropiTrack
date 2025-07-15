import DashboardLayout from "@/components/layouts/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Construction } from "lucide-react"

export default function ReportsPage() {
  return (
    <DashboardLayout title="Reports">
      <div className="container mx-auto space-y-2 pt-2 pb-6 px-6">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 fill-mode-forwards">
          {/* Coming Soon Section */}
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="border-border/50 bg-sidebar backdrop-blur-sm shadow-none max-w-md">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Construction className="h-10 w-10 text-muted-foreground" />
                </div>
                <h1 className="text-4xl font-bold text-gray-500 dark:text-gray-500 mb-4">
                  Coming Soon
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                  Reports & Analytics
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  🚧 Under Construction 🚧
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  We&apos;re working hard to bring you comprehensive reporting and analytics features.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 