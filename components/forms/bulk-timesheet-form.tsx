"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Clock, Building2, Loader2, Plus, Trash2, User, Calculator } from "lucide-react"
import { format } from "date-fns"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { createTimesheet } from "@/lib/data/timesheets"
import type { Worker, Project, CreateTimesheetInput } from "@/lib/types"
import { cn } from "@/lib/utils"

// Schema for a single timesheet entry
const timesheetEntrySchema = z.object({
  worker_id: z.string().min(1, "Worker is required"),
  clock_in: z.string().min(1, "Clock in time is required"),
  clock_out: z.string().min(1, "Clock out time is required"),
  break_duration: z.number().min(0, "Break duration must be positive").max(480, "Break cannot exceed 8 hours"),
  hourly_rate: z.number().min(0, "Hourly rate must be positive"),
  task_description: z.string().min(1, "Task description is required"),
  notes: z.string().optional(),
})

// Schema for the bulk timesheet form
const bulkTimesheetSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  date: z.string().min(1, "Date is required"),
  entries: z.array(timesheetEntrySchema).min(1, "At least one worker entry is required"),
})

type BulkTimesheetFormData = z.infer<typeof bulkTimesheetSchema>

interface BulkTimesheetFormProps {
  workers: Worker[]
  projects: Project[]
  onSuccess?: (timesheets: any[]) => void
  onCancel?: () => void
}

export function BulkTimesheetForm({ workers, projects, onSuccess, onCancel }: BulkTimesheetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false)

  const form = useForm<BulkTimesheetFormData>({
    resolver: zodResolver(bulkTimesheetSchema),
    defaultValues: {
      project_id: "",
      date: format(new Date(), "yyyy-MM-dd"),
      entries: [
        {
          worker_id: "",
          clock_in: "08:00",
          clock_out: "17:00",
          break_duration: 30,
          hourly_rate: 0,
          task_description: "",
          notes: "",
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  })

  // Calculate total hours and cost
  const calculateTotals = () => {
    const entries = form.getValues().entries
    let totalHours = 0
    let totalCost = 0

    entries.forEach((entry) => {
      if (entry.clock_in && entry.clock_out) {
        const clockIn = new Date(`2000-01-01T${entry.clock_in}:00`)
        const clockOut = new Date(`2000-01-01T${entry.clock_out}:00`)

        // Handle clock out after midnight
        let diffMs = clockOut.getTime() - clockIn.getTime()
        if (diffMs < 0) {
          diffMs += 24 * 60 * 60 * 1000 // Add 24 hours
        }

        const breakMs = (entry.break_duration || 0) * 60 * 1000
        const hours = Math.max(0, (diffMs - breakMs) / (1000 * 60 * 60))

        totalHours += hours
        totalCost += hours * (entry.hourly_rate || 0)
      }
    })

    return {
      hours: totalHours.toFixed(2),
      cost: totalCost.toFixed(2),
    }
  }

  const totals = calculateTotals()

  const onSubmit = async (data: BulkTimesheetFormData) => {
    setIsSubmitting(true)
    setSubmissionError(null)
    setSubmissionSuccess(false)

    try {
      const timesheetPromises = data.entries.map((entry) => {
        const timesheetData: CreateTimesheetInput = {
          date: data.date,
          project_id: data.project_id,
          worker_id: entry.worker_id,
          task_description: entry.task_description,
          clock_in: entry.clock_in,
          clock_out: entry.clock_out,
          break_duration: entry.break_duration,
          hourly_rate: entry.hourly_rate,
          regular_hours: 0, // Will be calculated by the backend
          overtime_hours: 0, // Will be calculated by the backend
          total_hours: 0, // Will be calculated by the backend
          total_pay: 0, // Will be calculated by the backend
          supervisor_approval: false,
          notes: entry.notes,
        }

        return createTimesheet(timesheetData)
      })

      const results = await Promise.all(timesheetPromises)

      // Check if any submissions failed
      const failures = results.filter((result) => !result.success)
      if (failures.length > 0) {
        setSubmissionError(`${failures.length} out of ${results.length} entries failed to submit.`)
      } else {
        setSubmissionSuccess(true)
        const successData = results.map((result) => result.data)
        onSuccess?.(successData)
      }
    } catch (error) {
      console.error("Error submitting timesheets:", error)
      setSubmissionError("An unexpected error occurred while submitting timesheets.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-fill hourly rate when worker changes
  const handleWorkerChange = (index: number, workerId: string) => {
    const worker = workers.find((w) => w.id === workerId)
    if (worker) {
      form.setValue(`entries.${index}.hourly_rate`, worker.hourly_rate)
    }
  }

  // Add a new empty row
  const addRow = () => {
    append({
      worker_id: "",
      clock_in: "08:00",
      clock_out: "17:00",
      break_duration: 30,
      hourly_rate: 0,
      task_description: "",
      notes: "",
    })
  }

  // Copy values from the previous row
  const copyFromPrevious = (index: number) => {
    if (index > 0) {
      const previousEntry = form.getValues().entries[index - 1]
      form.setValue(`entries.${index}.clock_in`, previousEntry.clock_in)
      form.setValue(`entries.${index}.clock_out`, previousEntry.clock_out)
      form.setValue(`entries.${index}.break_duration`, previousEntry.break_duration)
      form.setValue(`entries.${index}.task_description`, previousEntry.task_description)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Bulk Timesheet Entry
            </CardTitle>
            <CardDescription>Create multiple timesheet entries for the same project and date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Common Fields: Project and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <span>{project.name}</span>
                              {project.location && <span className="text-muted-foreground">({project.location})</span>}
                            </div>
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
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date || new Date())
                            field.onChange(date ? format(date, "yyyy-MM-dd") : "")
                          }}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Worker Entries */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Worker Entries</h3>
                <Button type="button" variant="outline" size="sm" onClick={addRow} className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Add Worker
                </Button>
              </div>

              <ScrollArea className="max-h-[500px] pr-4">
                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <Card
                      key={field.id}
                      className={cn("border-border/50", index % 2 === 0 ? "bg-card/50" : "bg-muted/30")}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-primary/10 text-primary">
                              #{index + 1}
                            </Badge>
                            <FormField
                              control={form.control}
                              name={`entries.${index}.worker_id`}
                              render={({ field: workerField }) => (
                                <FormItem className="flex-1">
                                  <Select
                                    onValueChange={(value) => {
                                      workerField.onChange(value)
                                      handleWorkerChange(index, value)
                                    }}
                                    defaultValue={workerField.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select a worker" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {workers.map((worker) => (
                                        <SelectItem key={worker.id} value={worker.id}>
                                          <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            <span>{worker.name}</span>
                                            <span className="text-muted-foreground">({worker.role})</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            {index > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => copyFromPrevious(index)}
                                      className="h-8 w-8"
                                    >
                                      <Clock className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Copy time from previous entry</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name={`entries.${index}.clock_in`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Clock In</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`entries.${index}.clock_out`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Clock Out</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`entries.${index}.break_duration`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Break (minutes)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="480"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`entries.${index}.hourly_rate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hourly Rate ($)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name={`entries.${index}.task_description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Task Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe the work performed..."
                                    className="resize-none h-20"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`entries.${index}.notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Additional notes or comments..."
                                    className="resize-none h-20"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>

              {fields.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-4">No worker entries added yet</p>
                  <Button type="button" variant="outline" onClick={addRow}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Worker
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {/* Summary */}
            <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Summary:</span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Workers:</span>{" "}
                  <span className="font-medium">{fields.length}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Total Hours:</span>{" "}
                  <span className="font-medium">{totals.hours}h</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Total Cost:</span>{" "}
                  <span className="font-medium text-green-600">${totals.cost}</span>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {submissionError && (
              <Alert variant="destructive">
                <AlertDescription>{submissionError}</AlertDescription>
              </Alert>
            )}

            {submissionSuccess && (
              <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <AlertDescription>All timesheet entries were successfully submitted!</AlertDescription>
              </Alert>
            )}
          </CardFooter>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Submitting..." : "Submit All Entries"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
