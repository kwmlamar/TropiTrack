import { Clock, DollarSign, HardHat, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function DashboardStats() {
  // Mock data
  const stats = [
    {
      title: "Total Hours",
      value: "1,248",
      change: "+12.5%",
      trend: "up",
      icon: Clock,
      color: "blue",
    },
    {
      title: "Active Workers",
      value: "32",
      change: "+2",
      trend: "up",
      icon: HardHat,
      color: "green",
    },
    {
      title: "Payroll This Month",
      value: "$24,560",
      change: "+5.2%",
      trend: "up",
      icon: DollarSign,
      color: "orange",
    },
    {
      title: "Project Completion",
      value: "68%",
      change: "+3.1%",
      trend: "up",
      icon: TrendingUp,
      color: "purple",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <span className={`text-xs font-medium ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div
                className={`rounded-full p-2 ${
                  stat.color === "blue"
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : stat.color === "green"
                      ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      : stat.color === "orange"
                        ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                        : "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                }`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
