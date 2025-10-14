"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock,
  Building2,
  Loader2,
  Plus,
  Trash2,
  User,
  Calculator,
  Copy,
} from "lucide-react";
import { startOfWeek, endOfWeek, addDays, format } from "date-fns";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiDatePicker } from "@/components/ui/multi-date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";

import { createTimesheet } from "@/lib/data/timesheets";
import type { CreateTimesheetInput, TimesheetWithDetails } from "@/lib/types";
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings";
import { useTimesheetSettings } from "@/lib/hooks/use-timesheet-settings";
import { processTimesheetApproval } from "@/lib/utils/timesheet-approval";

// Schema for a single timesheet entry
const timesheetEntrySchema = z.object({
  worker_id: z.string().min(1, "Worker is required"),
  clock_in: z.string().min(1, "Clock in time is required"),
  clock_out: z.string().min(1, "Clock out time is required"),
  break_duration: z
    .number()
    .min(0, "Break duration must be positive")
    .max(480, "Break cannot exceed 8 hours"),
  hourly_rate: z.number().min(0, "Hourly rate must be positive"),
  task_description: z.string().optional(),
  notes: z.string().optional(),
});

// Schema for the bulk timesheet form
const bulkTimesheetSchema = z.object({
  project_id: z.string().min(1, "Project is required"),
  selected_dates: z
    .array(z.date())
    .min(1, "At least one date must be selected"),
  entries: z
    .array(timesheetEntrySchema)
    .min(1, "At least one worker entry is required"),
});

type BulkTimesheetFormData = z.infer<typeof bulkTimesheetSchema>;

interface BulkTimesheetFormProps {
  userId: string;
  workers: Worker[];
  projects: Project[];
  onSuccess?: (timesheets: TimesheetWithDetails[]) => void;
  onCancel?: () => void;
}

export function BulkTimesheetForm({
  userId,
  workers,
  projects,
  onSuccess,
  onCancel,
}: BulkTimesheetFormProps) {
  const { theme } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(new Set());
  const [workerSelectOpen, setWorkerSelectOpen] = useState(false);
  
  const { paymentSchedule } = usePayrollSettings();
  const { 
    requireApproval, 
    settings
  } = useTimesheetSettings();

  const getWeekStartsOn = (day: number): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
    const dayMap: Record<number, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
      1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 0,
    };
    return dayMap[day] || 1;
  };

  const getPeriodStartDay = (): 0 | 1 | 2 | 3 | 4 | 5 | 6 => {
    if (paymentSchedule?.period_start_type === "day_of_week") {
      return getWeekStartsOn(paymentSchedule.period_start_day);
    }
    return 6; // Default to Saturday for construction industry in Bahamas
  };

  const form = useForm<BulkTimesheetFormData>({
    resolver: zodResolver(bulkTimesheetSchema),
    defaultValues: {
      project_id: "",
      selected_dates: [],
      entries: [
        {
          worker_id: "",
          clock_in: settings?.work_day_start || "07:00",
          clock_out: settings?.work_day_end || "16:00",
          break_duration: settings?.break_time || 60,
          hourly_rate: 0,
          task_description: "",
          notes: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  });

  // Update form defaults when settings are loaded
  useEffect(() => {
    if (settings && fields.length > 0) {
      // Update all existing entries with the new default times
      fields.forEach((_, index) => {
        form.setValue(`entries.${index}.clock_in`, settings.work_day_start || "07:00");
        form.setValue(`entries.${index}.clock_out`, settings.work_day_end || "16:00");
        form.setValue(`entries.${index}.break_duration`, settings.break_time || 60);
      });
    }
  }, [settings, fields, form]);

  // Watch form fields for reactive calculations
  const watchedEntries = useWatch({
    control: form.control,
    name: "entries",
  });
  
  const watchedSelectedDates = useWatch({
    control: form.control,
    name: "selected_dates",
  });

  // Calculate totals reactively based on watched form values
  const calculateTotals = () => {
    const entries = watchedEntries || [];
    const selectedDates = watchedSelectedDates || [];

    // Calculate number of days
    const numberOfDays = selectedDates.length;

    let totalHours = 0;
    let totalCost = 0;

    entries.forEach((entry) => {
      if (entry && entry.clock_in && entry.clock_out) {
        const clockIn = new Date(`2000-01-01T${entry.clock_in}:00`);
        const clockOut = new Date(`2000-01-01T${entry.clock_out}:00`);

        let diffMs = clockOut.getTime() - clockIn.getTime();
        if (diffMs < 0) {
          diffMs += 24 * 60 * 60 * 1000;
        }

        const breakMs = (entry.break_duration || 0) * 60 * 1000;
        const hours = Math.max(0, (diffMs - breakMs) / (1000 * 60 * 60));
        const hourlyRate = Number(entry.hourly_rate) || 0;

        totalHours += hours * numberOfDays;
        totalCost += hours * numberOfDays * hourlyRate;
      }
    });

    return {
      hours: isNaN(totalHours) ? "0.00" : totalHours.toFixed(2),
      cost: isNaN(totalCost) ? "0.00" : totalCost.toFixed(2),
      days: numberOfDays,
      workers: entries.length,
    };
  };

  const totals = calculateTotals();

  const onSubmit = async (data: BulkTimesheetFormData) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setSubmissionSuccess(false);

    try {
      // Create timesheet entries for each worker × each date combination
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const timesheetPromises: Promise<any>[] = [];

      data.entries.forEach((entry) => {
        data.selected_dates.forEach((date) => {
          const timesheetData: CreateTimesheetInput = {
            date: format(date, "yyyy-MM-dd"),
            project_id: data.project_id,
            worker_id: entry.worker_id,
            task_description: entry.task_description || "",
            clock_in: entry.clock_in,
            clock_out: entry.clock_out,
            break_duration: entry.break_duration,
            regular_hours: 0,
            overtime_hours: 0,
            total_hours: 0,
            total_pay: 0,
            supervisor_approval: requireApproval ? "pending" : "approved",
            notes: entry.notes || "",
          };

          timesheetPromises.push(createTimesheet(userId, timesheetData));
        });
      });

      const results = await Promise.all(timesheetPromises);

      const failures = results.filter((result) => !result.success);
      if (failures.length > 0) {
        setSubmissionError(
          `${failures.length} out of ${results.length} entries failed to submit.`
        );
      } else {
        // If approval is not required, auto-approve and generate payroll
        if (!requireApproval) {
          console.log('[BulkTimesheetForm] Auto-approving timesheets and generating payroll...');
          
          const successfulTimesheets = results
            .filter((result) => result.success && result.data)
            .map((result) => result.data);
          
          // Process auto-approval for each timesheet
          const approvalPromises = successfulTimesheets.map(async (timesheet) => {
            try {
              const approvalResult = await processTimesheetApproval(
                timesheet.id,
                userId,
                timesheet.worker_id,
                timesheet.date,
                getPeriodStartDay()
              );
              
              if (!approvalResult.success) {
                console.warn(`[BulkTimesheetForm] Failed to auto-approve timesheet ${timesheet.id}:`, approvalResult.error);
              }
              
              return approvalResult;
            } catch (error) {
              console.error(`[BulkTimesheetForm] Error processing auto-approval for timesheet ${timesheet.id}:`, error);
              return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
          });
          
          const approvalResults = await Promise.all(approvalPromises);
          const approvalFailures = approvalResults.filter((result) => !result.success);
          
          if (approvalFailures.length > 0) {
            console.warn(`[BulkTimesheetForm] ${approvalFailures.length} timesheets failed auto-approval`);
          }
        }
        
        setSubmissionSuccess(true);
        const successData = results.map((result) => result.data);
        onSuccess?.(successData);
      }
    } catch (error) {
      console.error("Error submitting timesheets:", error);
      setSubmissionError(
        "An unexpected error occurred while submitting timesheets."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-fill hourly rate when worker changes
  const handleWorkerChange = (index: number, workerId: string) => {
    const worker = workers.find((w) => w.id === workerId);
    if (worker) {
      form.setValue(`entries.${index}.hourly_rate`, worker.hourly_rate);
    }
  };

  // Add a new empty row
  const addRow = () => {
    append({
      worker_id: "",
      clock_in: settings?.work_day_start || "07:00",
      clock_out: settings?.work_day_end || "16:00",
      break_duration: settings?.break_time || 60,
      hourly_rate: 0,
      task_description: "",
      notes: "",
    });
  };

  // Copy values from the previous row
  const copyFromPrevious = (index: number) => {
    if (index > 0) {
      const previousEntry = form.getValues().entries[index - 1];
      form.setValue(`entries.${index}.clock_in`, previousEntry.clock_in);
      form.setValue(`entries.${index}.clock_out`, previousEntry.clock_out);
      form.setValue(
        `entries.${index}.break_duration`,
        previousEntry.break_duration
      );
      form.setValue(
        `entries.${index}.task_description`,
        previousEntry.task_description
      );
    }
  };

  // Function to apply quick date range
  const applyQuickDateRange = (range: "today" | "thisWeek" | "nextWeek") => {
    const today = new Date();
    const weekStartsOn = getPeriodStartDay();
    let dates: Date[] = [];

    switch (range) {
      case "today":
        dates = [today];
        break;
      case "thisWeek":
        const thisWeekStart = startOfWeek(today, { weekStartsOn });
        const thisWeekEnd = endOfWeek(today, { weekStartsOn });
        dates = [];
        const currentDate = new Date(thisWeekStart);
        while (currentDate <= thisWeekEnd) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        break;
      case "nextWeek":
        const nextWeekStart = addDays(startOfWeek(today, { weekStartsOn }), 7);
        const nextWeekEnd = addDays(endOfWeek(today, { weekStartsOn }), 7);
        dates = [];
        const nextCurrentDate = new Date(nextWeekStart);
        while (nextCurrentDate <= nextWeekEnd) {
          dates.push(new Date(nextCurrentDate));
          nextCurrentDate.setDate(nextCurrentDate.getDate() + 1);
        }
        break;
    }

    form.setValue("selected_dates", dates);
  };

  // Function to copy a field to all entries
  const copyFieldToAll = (fieldName: "clock_in" | "clock_out" | "break_duration" | "task_description", sourceIndex: number) => {
    const value = form.getValues().entries[sourceIndex][fieldName];
    form.getValues().entries.forEach((_, index) => {
      if (index !== sourceIndex) {
        form.setValue(`entries.${index}.${fieldName}`, value);
      }
    });
  };

  // Add selected workers to the form
  const addSelectedWorkers = () => {
    const selectedWorkersArray = Array.from(selectedWorkers);
    
    if (selectedWorkersArray.length === 0) {
      return;
    }

    // First, fill empty worker cards with selected workers
    const remainingWorkers = [...selectedWorkersArray];
    
    fields.forEach((field, index) => {
      const currentWorkerId = form.getValues(`entries.${index}.worker_id`);
      if (!currentWorkerId && remainingWorkers.length > 0) {
        // Fill empty card with next available worker
        const workerId = remainingWorkers.shift()!;
        const worker = workers.find(w => w.id === workerId);
        
        if (worker) {
          form.setValue(`entries.${index}.worker_id`, worker.id);
          form.setValue(`entries.${index}.hourly_rate`, Number(worker.hourly_rate) || 0);
        }
      }
    });

    // Then add new cards for any remaining selected workers
    remainingWorkers.forEach((workerId) => {
      const worker = workers.find(w => w.id === workerId);
      
      if (worker) {
        append({
          worker_id: worker.id,
          clock_in: "07:00",
          clock_out: "16:00",
          break_duration: 60,
          hourly_rate: Number(worker.hourly_rate) || 0,
          task_description: "",
          notes: "",
        });
      }
    });
    
    setSelectedWorkers(new Set());
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          {/* Common Fields: Project and Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <div className="space-y-0">
                  <FormItem className="space-y-0" style={{ margin: 0, padding: 0 }}>
                    <FormLabel className="mb-0" style={{ marginBottom: '2px' }}>Project</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
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
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="selected_dates"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Select Dates</FormLabel>
                    <div className="flex flex-col space-y-2">
                      <MultiDatePicker
                        selectedDates={field.value}
                        onDatesChange={field.onChange}
                        placeholder="Choose individual dates"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => applyQuickDateRange("today")}
                          style={{
                            backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
                            borderColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240)',
                            color: theme === 'dark' ? '#d1d5db' : '#374151'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#404040' : 'rgb(243 244 246)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : '#ffffff'
                          }}
                        >
                          Today
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => applyQuickDateRange("thisWeek")}
                          style={{
                            backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
                            borderColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240)',
                            color: theme === 'dark' ? '#d1d5db' : '#374151'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#404040' : 'rgb(243 244 246)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : '#ffffff'
                          }}
                        >
                          This Week
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => applyQuickDateRange("nextWeek")}
                          style={{
                            backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
                            borderColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240)',
                            color: theme === 'dark' ? '#d1d5db' : '#374151'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#404040' : 'rgb(243 244 246)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : '#ffffff'
                          }}
                        >
                          Next Week
                        </Button>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Worker Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 
                className="text-lg font-medium"
                style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
              >Select Workers</h3>
              <div className="flex gap-2">
                <Popover open={workerSelectOpen} onOpenChange={setWorkerSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="min-w-[140px]"
                      style={{
                        backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
                        borderColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240)',
                        color: theme === 'dark' ? '#d1d5db' : '#374151'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? '#404040' : 'rgb(243 244 246)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : '#ffffff'
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Select Workers
                      {selectedWorkers.size > 0 && (
                        <span className="ml-2 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium">
                          {selectedWorkers.size}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-0" align="end">
                    <Command className="rounded-lg">
                      <CommandEmpty className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No workers found.
                      </CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-y-auto">
                        {workers.map((worker) => (
                          <CommandItem
                            key={worker.id}
                            onSelect={() => {
                              setSelectedWorkers(prev => {
                                const next = new Set(prev);
                                if (next.has(worker.id)) {
                                  next.delete(worker.id);
                                } else {
                                  next.add(worker.id);
                                }
                                return next;
                              });
                            }}
                            className="cursor-pointer hover:bg-accent/50 transition-all duration-200 group"
                          >
                            <div className="flex items-center gap-3 w-full py-1">
                              <Checkbox
                                color="var(--muted-foreground)"
                                checked={selectedWorkers.has(worker.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedWorkers(prev => {
                                    const next = new Set(prev);
                                    if (checked) {
                                      next.add(worker.id);
                                    } else {
                                      next.delete(worker.id);
                                    }
                                    return next;
                                  });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`Select ${worker.name}`}
                                className="data-[state=checked]:text-white [&[data-state=checked]>div]:text-white [&[data-state=checked] svg]:text-white"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate dark:text-gray-200">
                                  {worker.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {worker.position}
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  type="button"
                  onClick={addSelectedWorkers}
                  disabled={selectedWorkers.size === 0}
                >
                  Add Selected Workers
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Worker Entries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 
                className="text-lg font-medium"
                style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
              >Worker Entries</h3>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card
                  key={field.id}
                  className="border-border/50"
                  style={{
                    backgroundColor: index % 2 === 0 
                      ? (theme === 'dark' ? '#1f1f1f' : 'rgb(248 250 252 / 0.5)')
                      : (theme === 'dark' ? '#171717' : 'rgb(243 244 246 / 0.3)'),
                    border: theme === 'dark' ? '1px solid #404040' : '1px solid rgb(226 232 240 / 0.5)'
                  }}
                >
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`entries.${index}.worker_id`}
                          render={({ field: workerField }) => (
                            <FormItem>
                              <Select
                                onValueChange={(value) => {
                                  workerField.onChange(value);
                                  handleWorkerChange(index, value);
                                }}
                                value={workerField.value}
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  copyFieldToAll("clock_in", index);
                                  copyFieldToAll("clock_out", index);
                                  copyFieldToAll("break_duration", index);
                                }}
                                className="h-8 w-8"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy time settings to all entries</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
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
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
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
                            <FormLabel>Task Description (Optional)</FormLabel>
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

              {fields.length === 0 && (
                <div 
                  className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg"
                  style={{
                    borderColor: theme === 'dark' ? '#404040' : 'rgb(229 231 235)',
                  }}
                >
                  <p 
                    className="mb-4"
                    style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
                  >
                    No worker entries added yet
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addRow}
                    style={{
                      backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
                      borderColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240)',
                      color: theme === 'dark' ? '#d1d5db' : '#374151'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#404040' : 'rgb(243 244 246)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : '#ffffff'
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Worker
                  </Button>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRow}
                  style={{
                    backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
                    borderColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240)',
                    color: theme === 'dark' ? '#d1d5db' : '#374151'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'dark' ? '#404040' : 'rgb(243 244 246)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : '#ffffff'
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Worker
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Summary */}
        <div 
          className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-lg"
          style={{
            backgroundColor: theme === 'dark' ? '#262626' : 'rgb(243 244 246 / 0.5)'
          }}
        >
          <div className="flex items-center gap-2">
            <Calculator 
              className="h-5 w-5"
              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
            >Summary:</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <span 
                className="text-sm"
                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                Workers:
              </span>{" "}
              <span 
                className="font-medium"
                style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
              >{totals.workers}</span>
            </div>
            <div>
              <span 
                className="text-sm"
                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >Days:</span>{" "}
              <span 
                className="font-medium"
                style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
              >{totals.days}</span>
            </div>
            <div>
              <span 
                className="text-sm"
                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                Total Entries:
              </span>{" "}
              <span 
                className="font-medium"
                style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
              >
                {totals.workers * totals.days}
              </span>
            </div>
            <div>
              <span 
                className="text-sm"
                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                Total Hours:
              </span>{" "}
              <span 
                className="font-medium"
                style={{ color: theme === 'dark' ? '#e5e7eb' : '#111827' }}
              >{totals.hours}h</span>
            </div>
            <div>
              <span 
                className="text-sm"
                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                Total Cost:
              </span>{" "}
              <span className="font-medium text-green-600">
                ${totals.cost}
              </span>
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
          <Alert
            variant="default"
            className="bg-green-50 text-green-800 border-green-200"
          >
            <AlertDescription>
              All timesheet entries were successfully submitted!
            </AlertDescription>
          </Alert>
        )}

        {/* Form Actions */}
        <div className="w-full flex justify-start space-x-2">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-[#E8EDF5] hover:bg-[#E8EDF5]/90 text-primary shadow-lg dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isSubmitting ? "Submitting..." : "Submit All Entries"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            style={{
              backgroundColor: theme === 'dark' ? '#262626' : '#ffffff',
              borderColor: theme === 'dark' ? '#404040' : 'rgb(226 232 240)',
              color: theme === 'dark' ? '#d1d5db' : '#374151'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#404040' : 'rgb(243 244 246)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : '#ffffff'
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
