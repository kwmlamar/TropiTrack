import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"

export function RecentActivity() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions from your team</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-purple-100 p-3 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <Activity className="h-6 w-6" />
          </div>
          <p className="mt-4 text-lg font-medium">Coming Soon</p>
          <p className="mt-2 text-sm text-muted-foreground">
            We&apos;re working on bringing you real-time activity updates.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
