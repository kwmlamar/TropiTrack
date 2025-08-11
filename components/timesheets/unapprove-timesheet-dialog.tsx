"use client"

import { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { unapproveTimesheet } from "@/lib/data/timesheets"
import { generatePayrollForWorkerAndPeriod } from "@/lib/data/payroll"
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns"

interface UnapproveTimesheetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timesheetId: string
  workerName: string
  date: string
  displayDate: string
  workerId: string
  userId: string
  onSuccess: () => void
}

export function UnapproveTimesheetDialog({
  open,
  onOpenChange,
  timesheetId,
  workerName,
  date,
  displayDate,
  workerId,
  userId,
  onSuccess,
}: UnapproveTimesheetDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUnapprove = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // First unapprove the timesheet
      const result = await unapproveTimesheet(timesheetId)

      if (result.success) {
        // Then regenerate payroll for the affected period
        const weekStart = format(startOfWeek(parseISO(date), { weekStartsOn: 6 }), 'yyyy-MM-dd')
        const weekEnd = format(endOfWeek(parseISO(date), { weekStartsOn: 6 }), 'yyyy-MM-dd')
        
        console.log(`[Unapprove] Regenerating payroll for worker ${workerId}, period ${weekStart} to ${weekEnd}`)
        const payrollResult = await generatePayrollForWorkerAndPeriod(userId, workerId, weekStart, weekEnd)
        
        if (!payrollResult.success) {
          console.warn(`[Unapprove] Payroll regeneration failed:`, payrollResult.error)
          toast.warning("Timesheet unapproved but payroll regeneration failed")
        } else {
          console.log(`[Unapprove] Payroll regenerated successfully`)
          toast.success("Timesheet unapproved and payroll updated")
        }
        
        onSuccess()
        onOpenChange(false)
      } else {
        setError(result.error || "Failed to unapprove timesheet")
        toast.error("Failed to unapprove timesheet")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      toast.error("Failed to unapprove timesheet")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent 
        className="sm:max-w-[425px] bg-white border-0" 
        style={{ 
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
          backgroundColor: 'white'
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Unapprove Timesheet
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Unapprove this timesheet to edit it again?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg bg-muted/50 p-2 text-xs">
            <p className="font-medium">Worker: {workerName}</p>
            <p className="text-muted-foreground">Date: {displayDate}</p>
          </div>

          {error && (
            <Alert variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnapprove}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Unapproving...
              </>
            ) : (
              "Unapprove"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      
      {/* Custom CSS to override AlertDialog overlay */}
      <style jsx>{`
        [data-slot="alert-dialog-overlay"] {
          background-color: rgba(75, 85, 99, 0.5) !important;
        }
      `}</style>
    </AlertDialog>
  )
}
