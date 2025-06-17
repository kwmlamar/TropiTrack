import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarClock } from "lucide-react"

export function UpcomingDeadlines() {
  // Mock data
  const deadlines = [
    {
      title: "NIB Remittance",
      date: "Dec 15, 2023",
      daysLeft: 5,
      priority: "high",
    },
    {
      title: "Payroll Processing",
      date: "Dec 10, 2023",
      daysLeft: 0,
      priority: "urgent",
    },
    {
      title: "Project Milestone",
      date: "Dec 20, 2023",
      daysLeft: 10,
      priority: "medium",
    },
  ]

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle>Upcoming Deadlines</CardTitle>
        <CardDescription>Important dates and reminders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deadlines.map((deadline, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`rounded-full p-2 ${
                  deadline.priority === "urgent"
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : deadline.priority === "high"
                      ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                      : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                }`}
              >
                <CalendarClock className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{deadline.title}</p>
                <p className="text-xs text-muted-foreground">{deadline.date}</p>
              </div>
              <Badge
                variant={deadline.daysLeft === 0 ? "destructive" : deadline.daysLeft <= 5 ? "default" : "outline"}
                className={
                  deadline.daysLeft === 0
                    ? ""
                    : deadline.daysLeft <= 5
                      ? "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400"
                      : ""
                }
              >
                {deadline.daysLeft === 0 ? "Today" : deadline.daysLeft === 1 ? "Tomorrow" : `${deadline.daysLeft} days`}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
