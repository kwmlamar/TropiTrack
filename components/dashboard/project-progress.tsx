import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function ProjectProgress() {
  // Mock data
  const projects = [
    {
      name: "Paradise Resort Phase 2",
      progress: 75,
      status: "On Track",
      dueDate: "Dec 15, 2023",
    },
    {
      name: "Cable Beach Condos",
      progress: 45,
      status: "At Risk",
      dueDate: "Jan 30, 2024",
    },
    {
      name: "Downtown Office Complex",
      progress: 90,
      status: "On Track",
      dueDate: "Dec 5, 2023",
    },
    {
      name: "Atlantis Expansion",
      progress: 20,
      status: "Delayed",
      dueDate: "Mar 15, 2024",
    },
  ]

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle>Project Progress</CardTitle>
        <CardDescription>Current status of active projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">{project.name}</p>
                <span
                  className={`text-xs font-medium ${
                    project.status === "On Track"
                      ? "text-green-600"
                      : project.status === "At Risk"
                        ? "text-orange-600"
                        : "text-red-600"
                  }`}
                >
                  {project.status}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={project.progress}
                  className={`h-2 ${
                    project.status === "On Track"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : project.status === "At Risk"
                        ? "bg-orange-100 dark:bg-orange-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                  }`}
                  indicatorClassName={
                    project.status === "On Track"
                      ? "bg-green-600 dark:bg-green-400"
                      : project.status === "At Risk"
                        ? "bg-orange-600 dark:bg-orange-400"
                        : "bg-red-600 dark:bg-red-400"
                  }
                />
                <span className="text-sm font-medium">{project.progress}%</span>
              </div>
              <p className="text-xs text-muted-foreground">Due: {project.dueDate}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
