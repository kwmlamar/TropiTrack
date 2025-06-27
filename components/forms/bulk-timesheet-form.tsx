"use client";

import { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarIcon,
  Clock,
  Building2,
  Loader2,
  Plus,
  Trash2,
  User,
  Calculator,
  Copy,
  Check,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
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

import { createTimesheet } from "@/lib/data/timesheets";
import type { CreateTimesheetInput, TimesheetWithDetails } from "@/lib/types";
import type { Worker } from "@/lib/types/worker"
import type { Project } from "@/lib/types/project"
import { cn } from "@/lib/utils";
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings";

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
  date_range: z
    .object({
      from: z.date(),
      to: z.date().optional(),
    })
    .refine((data) => data.from, {
      message: "Start date is required",
    }),
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(new Set());
  const [workerSelectOpen, setWorkerSelectOpen] = useState(false);
  
  const { paymentSchedule } = usePayrollSettings();

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
    return 1; // Default to Monday if no payment schedule
  };

  const form = useForm<BulkTimesheetFormData>({
    resolver: zodResolver(bulkTimesheetSchema),
    defaultValues: {
      project_id: "",
      date_range: {
        from: new Date(),
        to: undefined,
      },
      entries: [
        {
          worker_id: "",
          clock_in: "07:00",
          clock_out: "16:00",
          break_duration: 60,
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

  // Watch form fields for reactive calculations
  const watchedEntries = useWatch({
    control: form.control,
    name: "entries",
  });
  
  const watchedDateRange = useWatch({
    control: form.control,
    name: "date_range",
  });

  // Calculate totals reactively based on watched form values
  const calculateTotals = () => {
    const entries = watchedEntries || [];
    const dateRange = watchedDateRange;

    // Calculate number of days
    let numberOfDays = 1;
    if (dateRange && dateRange.from && dateRange.to) {
      const diffTime = Math.abs(
        dateRange.to.getTime() - dateRange.from.getTime()
      );
      numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

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

        totalHours += hours * numberOfDays;
        totalCost += hours * numberOfDays * (entry.hourly_rate || 0);
      }
    });

    return {
      hours: totalHours.toFixed(2),
      cost: totalCost.toFixed(2),
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
      // Generate array of dates from the range
      const dates: string[] = [];
      const startDate = data.date_range.from;
      const endDate = data.date_range.to || data.date_range.from;

      const currentDate = new Date(startDate);
      const finalDate = new Date(endDate);

      while (currentDate <= finalDate) {
        dates.push(format(currentDate, "yyyy-MM-dd"));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Create timesheet entries for each worker × each date combination
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const timesheetPromises: Promise<any>[] = [];

      data.entries.forEach((entry) => {
        dates.forEach((date) => {
          const timesheetData: CreateTimesheetInput = {
            date: date,
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
            supervisor_approval: "pending",
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
      clock_in: "07:00",
      clock_out: "16:00",
      break_duration: 60,
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
    let from: Date, to: Date;
    const weekStartsOn = getPeriodStartDay();

    switch (range) {
      case "today":
        from = to = today;
        break;
      case "thisWeek":
        from = startOfWeek(today, { weekStartsOn });
        to = endOfWeek(today, { weekStartsOn });
        break;
      case "nextWeek":
        from = addDays(startOfWeek(today, { weekStartsOn }), 7);
        to = addDays(endOfWeek(today, { weekStartsOn }), 7);
        break;
    }

    form.setValue("date_range", { from, to });
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
                name="date_range"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Range</FormLabel>
                    <div className="flex flex-col space-y-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value?.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value?.from ? (
                              field.value.to ? (
                                <>
                                  {format(field.value.from, "LLL dd, y")} -{" "}
                                  {format(field.value.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(field.value.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            defaultMonth={field.value?.from ?? new Date()}
                            selected={field.value}
                            onSelect={(range) => {
                              if (!range) {
                                field.onChange(null);
                                return;
                              }
                              
                              // If the same date is selected twice, treat it as a single day selection
                              if (range.from && range.to && 
                                  range.from.getTime() === range.to.getTime()) {
                                field.onChange({ from: range.from, to: range.from });
                                return;
                              }
                              
                              field.onChange(range);
                            }}
                            numberOfMonths={2}
                            weekStartsOn={getPeriodStartDay()}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => applyQuickDateRange("today")}
                        >
                          Today
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => applyQuickDateRange("thisWeek")}
                        >
                          This Week
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => applyQuickDateRange("nextWeek")}
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
              <h3 className="text-lg font-medium">Select Workers</h3>
              <div className="flex gap-2">
                <Popover open={workerSelectOpen} onOpenChange={setWorkerSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="min-w-[140px]">
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
                      <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
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
                              <div className={cn(
                                "relative h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shadow-sm",
                                "group-hover:border-secondary/60 group-hover:shadow-md",
                                selectedWorkers.has(worker.id) 
                                  ? "bg-[#E8EDF5] border-secondary text-secondary-foreground shadow-md scale-105" 
                                  : "border-muted-foreground/40 bg-background hover:border-secondary/40"
                              )}>
                                {selectedWorkers.has(worker.id) && (
                                  <Check className="h-3 w-3 animate-in zoom-in-50 duration-200 text-secondary" />
                                )}
                                <div className={cn(
                                  "absolute inset-0 rounded-md transition-opacity duration-200",
                                  selectedWorkers.has(worker.id) 
                                    ? "bg-[#E8EDF5]/20 opacity-0" 
                                    : "bg-[#E8EDF5]/10 opacity-0 group-hover:opacity-100"
                                )} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate group-hover:text-secondary transition-colors">
                                  {worker.name}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {worker.position}
                                </div>
                              </div>
                              {selectedWorkers.has(worker.id) && (
                                <div className="flex-shrink-0">
                                  <div className="h-2 w-2 rounded-full bg-[#E8EDF5] animate-pulse" />
                                </div>
                              )}
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
              <h3 className="text-lg font-medium">Worker Entries</h3>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card
                  key={field.id}
                  className={cn(
                    "border-border/50",
                    index % 2 === 0 ? "bg-card/50" : "bg-muted/30"
                  )}
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
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    No worker entries added yet
                  </p>
                  <Button type="button" variant="outline" onClick={addRow}>
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
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Summary:</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <span className="text-sm text-muted-foreground">
                Workers:
              </span>{" "}
              <span className="font-medium">{totals.workers}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Days:</span>{" "}
              <span className="font-medium">{totals.days}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">
                Total Entries:
              </span>{" "}
              <span className="font-medium">
                {totals.workers * totals.days}
              </span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">
                Total Hours:
              </span>{" "}
              <span className="font-medium">{totals.hours}h</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">
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
        <div className="w-full flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
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
        </div>
      </form>
    </Form>
  );
}
