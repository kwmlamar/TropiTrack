import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentActivity() {
  // Mock data
  const activities = [
    {
      user: {
        name: "John Smith",
        avatar: "/avatars/john.jpg",
        initials: "JS",
      },
      action: "approved timesheet for",
      target: "Marcus Johnson",
      time: "5 minutes ago",
    },
    {
      user: {
        name: "Sarah Williams",
        avatar: "/avatars/sarah.jpg",
        initials: "SW",
      },
      action: "submitted timesheet for",
      target: "Cable Beach Condos",
      time: "15 minutes ago",
    },
    {
      user: {
        name: "David Thompson",
        avatar: "/avatars/david.jpg",
        initials: "DT",
      },
      action: "updated project status for",
      target: "Paradise Resort Phase 2",
      time: "1 hour ago",
    },
    {
      user: {
        name: "Lisa Rodriguez",
        avatar: "/avatars/lisa.jpg",
        initials: "LR",
      },
      action: "processed payroll for",
      target: "Nov 27 - Dec 3",
      time: "2 hours ago",
    },
    {
      user: {
        name: "James Mitchell",
        avatar: "/avatars/james.jpg",
        initials: "JM",
      },
      action: "added new worker",
      target: "Robert Davis",
      time: "3 hours ago",
    },
  ]

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions from your team</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                <AvatarFallback className="text-xs">{activity.user.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm">
                  <span className="font-medium">{activity.user.name}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>{" "}
                  <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
