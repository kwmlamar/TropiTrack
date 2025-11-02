"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useTheme } from "next-themes";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock,
  Trash2,
  User,
  Calculator,
  Copy,
} from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { createTimesheet } from "@/lib/data/timesheets";
import type { CreateTimesheetInput, TimesheetWithDetails } from "@/lib/types";
import type { Worker } from "@/lib/types/worker"
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
  selectedProject?: string;
  selectedDates?: Date[];
  selectedWorkers?: Set<string>;
  onSuccess?: (timesheets: TimesheetWithDetails[]) => void;
}

export function BulkTimesheetForm({
  userId,
  workers,
  selectedProject,
  selectedDates,
  selectedWorkers,
  onSuccess,
}: BulkTimesheetFormProps) {
  const { theme } = useTheme();
  
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
      project_id: selectedProject || "",
      selected_dates: selectedDates || [],
      entries: [],
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
  const calculateTotals = useMemo(() => {
    const entries = watchedEntries || [];
    const selectedDates = watchedSelectedDates || [];

    // Calculate number of days
    const numberOfDays = selectedDates.length;

    let totalHours = 0;
    let totalCost = 0;

    // Each worker works for each selected day
    entries.forEach((entry) => {
      if (entry && entry.clock_in && entry.clock_out && entry.worker_id) {
        // Parse time strings properly (handle both HH:MM and HH:MM:SS formats)
        const parseTime = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes; // Convert to minutes
        };

        const clockInMinutes = parseTime(entry.clock_in);
        const clockOutMinutes = parseTime(entry.clock_out);

        // Calculate difference in minutes, handling overnight shifts
        let diffMinutes = clockOutMinutes - clockInMinutes;
        if (diffMinutes < 0) {
          diffMinutes += 24 * 60; // Add 24 hours in minutes
        }

        // Subtract break duration (in minutes)
        const breakMinutes = entry.break_duration || 0;
        const workMinutes = Math.max(0, diffMinutes - breakMinutes);
        const hours = workMinutes / 60; // Convert to hours
        const hourlyRate = Number(entry.hourly_rate) || 0;

        // Each worker works for each selected day
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
  }, [watchedEntries, watchedSelectedDates]);

  const totals = calculateTotals;

  const onSubmit = async (data: BulkTimesheetFormData) => {
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
        console.error(`${failures.length} out of ${results.length} entries failed to submit.`);
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
        
        const successData = results.map((result) => result.data);
        onSuccess?.(successData);
      }
    } catch (error) {
      console.error("Error submitting timesheets:", error);
    }
  };

  // Auto-fill hourly rate when worker changes
  const handleWorkerChange = (index: number, workerId: string) => {
    const worker = workers.find((w) => w.id === workerId);
    if (worker) {
      form.setValue(`entries.${index}.hourly_rate`, worker.hourly_rate);
    }
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
  const addSelectedWorkers = useCallback(() => {
    const selectedWorkersArray = Array.from(selectedWorkers || new Set());
    
    if (selectedWorkersArray.length === 0) {
      return;
    }

    // Get list of workers already in the form
    const existingWorkerIds = new Set(
      fields.map((_, index) => form.getValues(`entries.${index}.worker_id`)).filter(Boolean)
    );

    // Filter out workers that are already in the form
    const workersToAdd = selectedWorkersArray.filter(
      workerId => !existingWorkerIds.has(workerId)
    );

    if (workersToAdd.length === 0) {
      return;
    }

    // First, fill empty worker cards with selected workers
    const remainingWorkers = [...workersToAdd];
    
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
          clock_in: settings?.work_day_start || "07:00",
          clock_out: settings?.work_day_end || "16:00",
          break_duration: settings?.break_time || 60,
          hourly_rate: Number(worker.hourly_rate) || 0,
          task_description: "",
          notes: "",
        });
      }
    });
  }, [selectedWorkers, fields, form, workers, append, settings]);

  // Auto-populate workers when selectedWorkers prop changes
  useEffect(() => {
    if (selectedWorkers) {
      // Add newly selected workers
      if (selectedWorkers.size > 0) {
        addSelectedWorkers();
      }
      
      // Remove deselected workers
      const selectedWorkersArray = Array.from(selectedWorkers);
      const indicesToRemove: number[] = [];
      
      fields.forEach((field, index) => {
        const currentWorkerId = form.getValues(`entries.${index}.worker_id`);
        if (currentWorkerId && !selectedWorkersArray.includes(currentWorkerId)) {
          // Worker was deselected, mark for removal
          indicesToRemove.push(index);
        }
      });
      
      // Remove in reverse order to avoid index shifting issues
      indicesToRemove.reverse().forEach(index => remove(index));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkers]);

  // Monitor secondary sidebar state for summary positioning
  useEffect(() => {
    const updateSummaryPosition = () => {
      const summaryElement = document.querySelector('.summary-fixed-bottom');
      if (!summaryElement) return;

      // Check if secondary sidebar is collapsed by looking for elements with w-0 class
      const secondarySidebar = document.querySelector('[class*="w-0 overflow-hidden"]');
      if (secondarySidebar) {
        summaryElement.classList.add('sidebar-collapsed');
      } else {
        summaryElement.classList.remove('sidebar-collapsed');
      }
    };

    // Initial check
    updateSummaryPosition();

    // Set up observer to watch for sidebar changes
    const observer = new MutationObserver(updateSummaryPosition);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="overflow-hidden">
        {/* Worker Entries Table - Full Width */}
        <div className="space-y-4 overflow-hidden">

              <div 
                className="border-t border-b flex-1 flex flex-col"
                style={{
                  backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                  borderColor: theme === 'dark' ? '#262626' : 'rgb(226 232 240 / 0.5)',
                }}
              >
                <div className="px-0 flex-1 flex flex-col">
                  <div 
                    className="overflow-x-auto flex-1 overflow-y-auto"
                    style={{
                      maxHeight: 'calc(100vh - 185px)' // Account for header, selection section, and summary
                    }}
                  >
                    <table className="w-full border-collapse border-spacing-0">
                      <thead 
                        className="sticky top-0 z-50 shadow-sm"
                        style={{
                          backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                          borderBottom: theme === 'dark' ? '2px solid #262626' : '2px solid rgb(226 232 240 / 0.5)'
                        }}
                      >
                        <tr style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}>
                          <th 
                            className="text-left p-4 pl-8 pb-4 font-medium text-sm text-gray-500"
                            style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                          >
                            Worker
                          </th>
                          <th 
                            className="text-center p-4 pb-4 font-medium text-sm text-gray-500"
                            style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                          >
                            Clock In
                          </th>
                          <th 
                            className="text-center p-4 pb-4 font-medium text-sm text-gray-500"
                            style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                          >
                            Clock Out
                          </th>
                          <th 
                            className="text-center p-4 pb-4 font-medium text-sm text-gray-500"
                            style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                          >
                            Break (min)
                          </th>
                          <th 
                            className="text-center p-4 pb-4 font-medium text-sm text-gray-500"
                            style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                          >
                            Hourly Rate
                          </th>
                          <th 
                            className="text-left p-4 pb-4 font-medium text-sm text-gray-500"
                            style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                          >
                            Task Description
                          </th>
                          <th 
                            className="text-left p-4 pb-4 font-medium text-sm text-gray-500"
                            style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                          >
                            Notes
                          </th>
                          <th 
                            className="w-12"
                            style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                          ></th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-0">
                              <div className="flex flex-col items-center justify-center py-16 px-6">
                                <div 
                                  className="flex items-center justify-center w-16 h-16 rounded-full mb-4"
                                  style={{ backgroundColor: theme === 'dark' ? '#262626' : 'rgb(243 244 246 / 0.5)' }}
                                >
                                  <User 
                                    className="h-8 w-8"
                                    style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                                  />
                                </div>
                                <h3 
                                  className="text-lg font-semibold mb-2"
                                  style={{ color: theme === 'dark' ? '#9ca3af' : '#111827' }}
                                >
                                  No workers selected
                                </h3>
                                <p 
                                  className="text-sm text-center max-w-sm"
                                  style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                                >
                                  Select workers from the dropdown above to add them to the timesheet.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          fields.map((field, index) => (
                          <tr 
                            key={field.id}
                            className="border-b last:border-b-0 transition-all duration-200 group"
                            style={{
                              borderColor: theme === 'dark' ? '#262626' : 'rgb(229 231 235 / 0.2)',
                              backgroundColor: 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(243 244 246 / 0.4)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <td className="p-4 pl-8">
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
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Select worker" />
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
                            </td>
                            <td className="p-2 text-center">
                              <FormField
                                control={form.control}
                                name={`entries.${index}.clock_in`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        type="time" 
                                        {...field} 
                                        className="w-full h-10 text-center border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                        style={{
                                          color: theme === 'dark' ? '#e5e7eb' : '#111827',
                                          backgroundColor: 'transparent'
                                        }}
                                        onFocus={(e) => {
                                          e.target.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(249 250 251)'
                                        }}
                                        onBlur={(e) => {
                                          e.target.style.backgroundColor = 'transparent'
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-2 text-center">
                              <FormField
                                control={form.control}
                                name={`entries.${index}.clock_out`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        type="time" 
                                        {...field} 
                                        className="w-full h-10 text-center border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                        style={{
                                          color: theme === 'dark' ? '#e5e7eb' : '#111827',
                                          backgroundColor: 'transparent'
                                        }}
                                        onFocus={(e) => {
                                          e.target.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(249 250 251)'
                                        }}
                                        onBlur={(e) => {
                                          e.target.style.backgroundColor = 'transparent'
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-2 text-center">
                              <FormField
                                control={form.control}
                                name={`entries.${index}.break_duration`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        max="480"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(Number(e.target.value))
                                        }
                                        className="w-full h-10 text-center border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                        style={{
                                          color: theme === 'dark' ? '#e5e7eb' : '#111827',
                                          backgroundColor: 'transparent'
                                        }}
                                        onFocus={(e) => {
                                          e.target.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(249 250 251)'
                                        }}
                                        onBlur={(e) => {
                                          e.target.style.backgroundColor = 'transparent'
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-2 text-center">
                              <FormField
                                control={form.control}
                                name={`entries.${index}.hourly_rate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(Number(e.target.value))
                                        }
                                        className="w-full h-10 text-center border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                        style={{
                                          color: theme === 'dark' ? '#e5e7eb' : '#111827',
                                          backgroundColor: 'transparent'
                                        }}
                                        onFocus={(e) => {
                                          e.target.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(249 250 251)'
                                        }}
                                        onBlur={(e) => {
                                          e.target.style.backgroundColor = 'transparent'
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-4">
                              <FormField
                                control={form.control}
                                name={`entries.${index}.task_description`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Describe work..."
                                        className="resize-none w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                        rows={2}
                                        {...field}
                                        style={{
                                          color: theme === 'dark' ? '#e5e7eb' : '#111827',
                                          backgroundColor: 'transparent'
                                        }}
                                        onFocus={(e) => {
                                          e.target.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(249 250 251)'
                                        }}
                                        onBlur={(e) => {
                                          e.target.style.backgroundColor = 'transparent'
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-4">
                              <FormField
                                control={form.control}
                                name={`entries.${index}.notes`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Notes..."
                                        className="resize-none w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                        rows={2}
                                        {...field}
                                        style={{
                                          color: theme === 'dark' ? '#e5e7eb' : '#111827',
                                          backgroundColor: 'transparent'
                                        }}
                                        onFocus={(e) => {
                                          e.target.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(249 250 251)'
                                        }}
                                        onBlur={(e) => {
                                          e.target.style.backgroundColor = 'transparent'
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-1">
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
                            </td>
                          </tr>
                        ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
          </div>

        {/* Summary - Sticky to bottom of content area */}
        <div 
          className="summary-fixed-bottom flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4"
          style={{
            backgroundColor: theme === 'dark' ? '#0f0f0f' : 'rgb(243 244 246 / 0.98)', // Match secondary sidebar background
            backdropFilter: 'blur(8px)',
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            borderTopColor: theme === 'dark' ? '#262626' : 'rgb(226 232 240 / 0.5)'
          }}
        >
          <div className="flex items-center gap-2">
            <Calculator 
              className="h-5 w-5"
              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
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
                style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
              >{totals.workers}</span>
            </div>
            <div>
              <span 
                className="text-sm"
                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >Days:</span>{" "}
              <span 
                className="font-medium"
                style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
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
                style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
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
                style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
              >{totals.hours}h</span>
            </div>
            <div>
              <span 
                className="text-sm"
                style={{ color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}
              >
                Total Cost:
              </span>{" "}
              <span 
                className="font-medium"
                style={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
              >
                ${totals.cost}
              </span>
            </div>
          </div>
        </div>

      </form>
    </Form>
  );
}
