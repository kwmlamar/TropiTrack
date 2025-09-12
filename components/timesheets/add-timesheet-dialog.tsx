"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Clock, Building2, User, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

import { createTimesheet } from "@/lib/data/timesheets"
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"
import { useTimesheetSettings } from "@/lib/hooks/use-timesheet-settings"
import { processTimesheetApproval } from "@/lib/utils/timesheet-approval"

const timesheetSchema = z.object({
  worker_id: z.string().min(1, "Worker is required"),
  project_id: z.string().min(1, "Project is required"),
  clock_in: z.string().min(1, "Clock in time is required"),
  clock_out: z.string().min(1, "Clock out time is required"),
  break_duration: z
    .number()
    .min(0, "Break duration must be positive")
    .max(480, "Break cannot exceed 8 hours"),
  task_description: z.string().optional(),
  notes: z.string().optional(),
})

type TimesheetFormData = z.infer<typeof timesheetSchema>

interface AddTimesheetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  workers: Worker[]
  projects: Project[]
  userId: string
  selectedWorker?: Worker
  onSuccess?: () => void
}

export function AddTimesheetDialog({
  open,
  onOpenChange,
  date,
  workers,
  projects,
  userId,
  selectedWorker,
  onSuccess,
}: AddTimesheetDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { requireApproval, settings } = useTimesheetSettings()

  const form = useForm<TimesheetFormData>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      worker_id: selectedWorker?.id || "",
      project_id: "",
      clock_in: settings?.work_day_start || "07:00",
      clock_out: settings?.work_day_end || "16:00",
      break_duration: settings?.break_time || 60,
      task_description: "",
      notes: "",
    },
  })

  // Update form when selectedWorker changes
  useEffect(() => {
    if (selectedWorker) {
      form.setValue("worker_id", selectedWorker.id)
    }
  }, [selectedWorker, form])

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      form.setValue("clock_in", settings.work_day_start)
      form.setValue("clock_out", settings.work_day_end)
      form.setValue("break_duration", settings.break_time)
    }
  }, [settings, form])

  const onSubmit = async (data: TimesheetFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createTimesheet(userId, {
        ...data,
        date: format(date, "yyyy-MM-dd"),
        task_description: data.task_description || "",
        notes: data.notes || "",
        regular_hours: 0,
        overtime_hours: 0,
        total_hours: 0,
        total_pay: 0,
        supervisor_approval: requireApproval ? "pending" : "approved",
      })

      if (result.success) {
        // If approval is not required, auto-approve and generate payroll
        if (!requireApproval && result.data) {
          try {
            console.log('[AddTimesheetDialog] Auto-approving timesheet and generating payroll...');
            const approvalResult = await processTimesheetApproval(
              result.data.id,
              userId,
              result.data.worker_id,
              result.data.date,
              6 // Default to Saturday for week start
            );
            
            if (!approvalResult.success) {
              console.warn('[AddTimesheetDialog] Failed to auto-approve timesheet:', approvalResult.error);
              toast.warning("Timesheet created but auto-approval failed");
            } else {
              toast.success("Timesheet entry created and approved successfully")
            }
          } catch (error) {
            console.error('[AddTimesheetDialog] Error processing auto-approval:', error);
            toast.warning("Timesheet created but auto-approval failed");
          }
        } else {
          toast.success("Timesheet entry created successfully")
        }
        
        onSuccess?.()
        onOpenChange(false)
        form.reset()
      } else {
        toast.error(result.error || "Failed to create timesheet entry")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Error creating timesheet:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Timesheet Entry</DialogTitle>
          <DialogDescription>
            Add a timesheet entry for {format(date, "EEEE, MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="worker_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Worker
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a worker" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name} - {worker.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Project
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clock_in"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Clock In
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clock_out"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Clock Out
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="break_duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Break Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      min="0"
                      max="480"
                      step="15"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="task_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the work performed..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Entry
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 