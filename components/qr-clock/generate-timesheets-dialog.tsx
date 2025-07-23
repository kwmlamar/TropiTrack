"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Calendar, Clock, Building2, User, Loader2, CheckCircle, AlertCircle, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import type { Project } from "@/lib/types/project"
import type { Worker } from "@/lib/types/worker"

const generateTimesheetSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  project_id: z.string().min(1, "Project is required"),
  worker_id: z.string().optional(), // Optional - if not provided, generate for all workers
  rounding_strategy: z.enum(["standard", "exact", "quarter_hour", "no_rounding"]),
  round_to_standard: z.boolean(),
})

type GenerateTimesheetFormData = z.infer<typeof generateTimesheetSchema>

interface GenerateTimesheetsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projects: Project[]
  workers: Worker[]
  onSuccess?: () => void
}

export function GenerateTimesheetsDialog({
  open,
  onOpenChange,
  projects,
  workers,
  onSuccess,
}: GenerateTimesheetsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    created?: number
    errors?: string[]
  } | null>(null)

  const form = useForm<GenerateTimesheetFormData>({
    resolver: zodResolver(generateTimesheetSchema),
    defaultValues: {
      date: new Date(),
      project_id: "",
      worker_id: "all",
      rounding_strategy: "standard",
      round_to_standard: true,
    },
  })

  const onSubmit = async (data: GenerateTimesheetFormData) => {
    setIsSubmitting(true)
    setResult(null)

    try {
      const response = await fetch("/api/qr-clock/generate-timesheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: format(data.date, "yyyy-MM-dd"),
          project_id: data.project_id,
          worker_id: data.worker_id === "all" ? undefined : data.worker_id,
          rounding_strategy: data.rounding_strategy,
          round_to_standard: data.round_to_standard,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setResult({
          success: true,
          message: result.message,
          created: result.data?.created,
          errors: result.data?.errors,
        })
        toast.success(result.message)
        onSuccess?.()
      } else {
        setResult({
          success: false,
          message: result.message,
        })
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error generating timesheets:", error)
      setResult({
        success: false,
        message: "An unexpected error occurred",
      })
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setResult(null)
      form.reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Generate Timesheets from QR Clock Events
          </DialogTitle>
          <DialogDescription>
            Automatically create timesheet entries from QR clock in/out events for the selected date and project.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-gray-500"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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

            <FormField
              control={form.control}
              name="worker_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Worker (Optional)
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="All workers (leave empty for all)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All workers</SelectItem>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id}>
                          {worker.name}
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
              name="rounding_strategy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Rounding Strategy
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a rounding strategy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="standard">Standard (Recommended)</SelectItem>
                      <SelectItem value="exact">Exact (No Rounding)</SelectItem>
                      <SelectItem value="quarter_hour">Quarter Hour</SelectItem>
                      <SelectItem value="no_rounding">No Rounding</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {field.value === "standard" && "Rounds to 8 hours if within 9 minutes, otherwise to nearest 15 minutes"}
                    {field.value === "exact" && "Rounds to nearest minute for precise time tracking"}
                    {field.value === "quarter_hour" && "Rounds to nearest 15-minute increment"}
                    {field.value === "no_rounding" && "Uses exact clock in/out times without any rounding"}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="round_to_standard"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Round to Standard 8-Hour Day</FormLabel>
                    <p className="text-sm text-gray-500">
                      Automatically adjust hours to 8 hours when close to standard work day
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {result && (
              <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                  {result.message}
                  {result.created !== undefined && (
                    <div className="mt-2">
                      <p className="font-medium">Created: {result.created} timesheets</p>
                      {result.errors && result.errors.length > 0 && (
                        <div className="mt-1">
                          <p className="font-medium text-red-700">Errors:</p>
                          <ul className="list-disc list-inside text-sm">
                            {result.errors.slice(0, 3).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {result.errors.length > 3 && (
                              <li>... and {result.errors.length - 3} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Timesheets
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 