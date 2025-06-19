"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, FileText, Plus, UserPlus, DollarSign } from "lucide-react"
import { useState, useEffect } from "react"
import { WorkerSheet } from "@/components/forms/form-dialogs"
import { createClient } from "@/utils/supabase/client"
import { fetchWorkersForCompany, fetchProjectsForCompany } from "@/lib/data/data"
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"
import Link from "next/link"

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
    <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Common tasks and shortcuts</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/timesheets/bulk">
            <Button 
              variant="outline" 
              className="group h-auto flex-col gap-2 p-4 transition-all duration-200 hover:bg-muted/30 text-foreground w-full"
            >
              <div className="p-2.5 transition-all duration-200 group-hover:scale-105">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">Add Timesheet</span>
            </Button>
          </Link>
          <WorkerSheet
            userId={userId}
            trigger={
              <Button 
                variant="outline" 
                className="group h-auto flex-col gap-2 p-4 transition-all duration-200 hover:bg-muted/30 text-foreground"
              >
                <div className="p-2.5 transition-all duration-200 group-hover:scale-105">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">Add Worker</span>
              </Button>
            }
          />
          <Button 
            variant="outline" 
            className="group h-auto flex-col gap-2 p-4 transition-all duration-200 hover:bg-muted/30 text-foreground" 
            asChild
          >
            <a href="#">
              <div className="p-2.5 transition-all duration-200 group-hover:scale-105">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">New Report</span>
            </a>
          </Button>
          <Button 
            variant="outline" 
            className="group h-auto flex-col gap-2 p-4 transition-all duration-200 hover:bg-muted/30 text-foreground" 
            asChild
          >
            <a href="#">
              <div className="p-2.5 transition-all duration-200 group-hover:scale-105">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">Process Payroll</span>
            </a>
          </Button>
        </div>
        <Button 
          variant="ghost" 
          className="mt-4 w-full justify-start text-muted-foreground transition-all duration-200 hover:text-foreground hover:shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span>More Actions</span>
        </Button>
      </CardContent>
    </Card>
  )
}
