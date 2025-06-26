"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, FileText, Plus, UserPlus, DollarSign } from "lucide-react"
import { useState, useEffect } from "react"
import { AddWorkerDialog } from "@/components/workers/add-worker-dialog"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"

export function QuickActions() {
  const [userId, setUserId] = useState<string>("")
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return
        setUserId(user.id)
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()
  }, [])

  const handleWorkerSuccess = () => {
    // Optionally refresh data or show success message
    console.log("Worker added successfully")
  }

  return (
    <>
      <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/80 dark:from-background dark:via-background dark:to-muted/20 backdrop-blur-sm shadow-sm">
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
            <Button 
              variant="outline" 
              className="group h-auto flex-col gap-2 p-4 transition-all duration-200 hover:bg-muted/30 text-foreground"
              onClick={() => setIsAddWorkerOpen(true)}
            >
              <div className="p-2.5 transition-all duration-200 group-hover:scale-105">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">Add Worker</span>
            </Button>
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

      {/* Add Worker Dialog */}
      <AddWorkerDialog
        open={isAddWorkerOpen}
        onOpenChange={setIsAddWorkerOpen}
        userId={userId}
        onSuccess={handleWorkerSuccess}
      />
    </>
  )
}
