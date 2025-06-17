"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, FileText, Plus, UserPlus, DollarSign } from "lucide-react"
import { useState, useEffect } from "react"
import { BulkTimesheetDialog } from "@/components/forms/form-dialogs"
import { WorkerSheet } from "@/components/forms/form-dialogs"
import { createClient } from "@/utils/supabase/client"
import { fetchWorkersForCompany, fetchProjectsForCompany } from "@/lib/data/data"
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"

export function QuickActions() {
  const [userId, setUserId] = useState<string>("")
  const [workers, setWorkers] = useState<Worker[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return
        setUserId(user.id)

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('company_id')
          .eq('user_id', user.id)
          .single()

        if (!profile) return

        const [workersData, projectsData] = await Promise.all([
          fetchWorkersForCompany(profile.company_id),
          fetchProjectsForCompany(profile.company_id)
        ])

        setWorkers(workersData)
        setProjects(projectsData)
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()
  }, [])

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <BulkTimesheetDialog
            userId={userId}
            workers={workers}
            projects={projects}
            trigger={
              <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                <Clock className="h-5 w-5" />
                <span className="text-xs font-medium">Add Timesheet</span>
              </Button>
            }
          />
          <WorkerSheet
            userId={userId}
            trigger={
              <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                <UserPlus className="h-5 w-5" />
                <span className="text-xs font-medium">Add Worker</span>
              </Button>
            }
          />
          <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
            <a href="#">
              <FileText className="h-5 w-5" />
              <span className="text-xs font-medium">New Report</span>
            </a>
          </Button>
          <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
            <a href="#">
              <DollarSign className="h-5 w-5" />
              <span className="text-xs font-medium">Process Payroll</span>
            </a>
          </Button>
        </div>
        <Button variant="ghost" className="mt-4 w-full justify-start text-muted-foreground">
          <Plus className="mr-2 h-4 w-4" />
          <span>More Actions</span>
        </Button>
      </CardContent>
    </Card>
  )
}
