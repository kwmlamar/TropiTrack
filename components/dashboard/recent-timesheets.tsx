import { MoreHorizontal, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function RecentTimesheets() {
  // Mock data
  const timesheets = [
    {
      id: "TS-1234",
      worker: {
        name: "Marcus Johnson",
        avatar: "/avatars/marcus.jpg",
        initials: "MJ",
      },
      project: "Paradise Resort Phase 2",
      date: "Today, 2:30 PM",
      hours: 8.5,
      status: "approved",
    },
    {
      id: "TS-1233",
      worker: {
        name: "Sarah Williams",
        avatar: "/avatars/sarah.jpg",
        initials: "SW",
      },
      project: "Cable Beach Condos",
      date: "Today, 1:15 PM",
      hours: 7.0,
      status: "pending",
    },
    {
      id: "TS-1232",
      worker: {
        name: "David Thompson",
        avatar: "/avatars/david.jpg",
        initials: "DT",
      },
      project: "Downtown Office Complex",
      date: "Today, 11:45 AM",
      hours: 4.5,
      status: "approved",
    },
    {
      id: "TS-1231",
      worker: {
        name: "Lisa Rodriguez",
        avatar: "/avatars/lisa.jpg",
        initials: "LR",
      },
      project: "Paradise Resort Phase 2",
      date: "Yesterday, 4:20 PM",
      hours: 9.0,
      status: "rejected",
    },
    {
      id: "TS-1230",
      worker: {
        name: "James Mitchell",
        avatar: "/avatars/james.jpg",
        initials: "JM",
      },
      project: "Cable Beach Condos",
      date: "Yesterday, 3:10 PM",
      hours: 8.0,
      status: "approved",
    },
  ]

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Recent Timesheets</CardTitle>
          <CardDescription>Latest time entries from your team</CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search timesheets..." className="w-full bg-background pl-8" />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4">
          {timesheets.map((timesheet) => (
            <div key={timesheet.id} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={timesheet.worker.avatar || "/placeholder.svg"} alt={timesheet.worker.name} />
                  <AvatarFallback>{timesheet.worker.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{timesheet.worker.name}</p>
                  <p className="text-sm text-muted-foreground">{timesheet.project}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{timesheet.hours} hrs</p>
                  <p className="text-xs text-muted-foreground">{timesheet.date}</p>
                </div>
                <Badge
                  variant={
                    timesheet.status === "approved"
                      ? "default"
                      : timesheet.status === "pending"
                        ? "outline"
                        : "destructive"
                  }
                  className={
                    timesheet.status === "approved"
                      ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                      : timesheet.status === "pending"
                        ? "border-orange-200 text-orange-800 hover:bg-orange-100 dark:border-orange-800/30 dark:text-orange-400"
                        : ""
                  }
                >
                  {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
