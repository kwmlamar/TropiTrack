"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useTheme } from "next-themes";

import { Form } from "@/components/ui/form";
import { WorkerRowsTable } from "./WorkerRowsTable";
import { TotalsBar } from "./TotalsBar";
import { toast } from "sonner";

import { createTimesheet } from "@/lib/data/timesheets";
import type { CreateTimesheetInput, TimesheetWithDetails } from "@/lib/types";
import type { Worker } from "@/lib/types/worker";
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings";
import { useTimesheetSettings } from "@/lib/hooks/use-timesheet-settings";
import { processTimesheetApproval } from "@/lib/utils/timesheet-approval";

import { calculateBulkTimesheetTotals } from "@/lib/timesheets/calc";
import { getPeriodStartDay } from "@/lib/timesheets/payrollRules";
import { useSyncSelectedWorkers } from "@/hooks/timesheets/useSyncSelectedWorkers";
import { useCopyToAll } from "@/hooks/timesheets/useCopyToAll";
import { useCarryDown } from "@/hooks/timesheets/useCarryDown";
import { useSidebarCollapse } from "@/context/sidebar-context";

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

/**
 * Main bulk timesheet form component
 * Handles form initialization, submission, and orchestrates extracted modules
 */
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
  const { requireApproval, settings } = useTimesheetSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionProgress, setSubmissionProgress] = useState(0);
  const { isSecondarySidebarCollapsed } = useSidebarCollapse();
  const [isMobile, setIsMobile] = useState(false);

  // Track mobile state
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize form
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

  // Watch form fields for reactive calculations
  const watchedEntries = useWatch({
    control: form.control,
    name: "entries",
  });

  const watchedSelectedDates = useWatch({
    control: form.control,
    name: "selected_dates",
  });

  // Use extracted hooks
  const { copyFieldToAll } = useCopyToAll(form.getValues, form.setValue);
  const { copyFromPrevious } = useCarryDown(form.getValues, form.setValue);
  
  useSyncSelectedWorkers({
    selectedWorkers,
    workers,
    fields,
    getValues: form.getValues,
    setValue: form.setValue,
    append,
    remove,
    settings,
  });

  // Auto-fill hourly rate when worker changes
  const handleWorkerChange = (index: number, workerId: string) => {
    const worker = workers.find((w) => w.id === workerId);
    if (worker) {
      form.setValue(`entries.${index}.hourly_rate`, worker.hourly_rate);
    }
  };

  // Sync form with external project selection
  useEffect(() => {
    if (selectedProject) {
      form.setValue("project_id", selectedProject);
    }
  }, [selectedProject, form]);

  // Sync form with external date selection
  useEffect(() => {
    if (selectedDates) {
      form.setValue("selected_dates", selectedDates);
    }
  }, [selectedDates, form]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
      
      // Ctrl/Cmd + Enter to submit (alternative)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Calculate totals reactively
  const totals = useMemo(() => {
    return calculateBulkTimesheetTotals(
      watchedEntries || [],
      (watchedSelectedDates || []).length
    );
  }, [watchedEntries, watchedSelectedDates]);

  // Optimized batch processing with controlled concurrency
  const processBatch = async <T, R>(
    items: T[],
    batchSize: number,
    processFn: (item: T) => Promise<R>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<R[]> => {
    const results: R[] = [];
    
    // Process in batches to prevent overwhelming server and browser
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processFn));
      results.push(...batchResults);
      
      // Update progress
      if (onProgress) {
        const completed = Math.min(i + batchSize, items.length);
        onProgress(completed, items.length);
      }
      
      // Small delay between batches to prevent rate limiting (only if more batches remaining)
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return results;
  };

  // Handle form submission with optimized batching
  const onSubmit = async (data: BulkTimesheetFormData) => {
    setIsSubmitting(true);
    setSubmissionProgress(0);
    
    try {
      // Prepare all timesheet data
      const timesheetDataArray: CreateTimesheetInput[] = [];
      
      data.entries.forEach((entry) => {
        data.selected_dates.forEach((date) => {
          timesheetDataArray.push({
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
            hourly_rate: entry.hourly_rate,
            supervisor_approval: requireApproval ? "pending" : "approved",
            notes: entry.notes || "",
          });
        });
      });

      const totalEntries = timesheetDataArray.length;
      
      toast.info(`Creating ${totalEntries} timesheet entries...`, {
        duration: 2000
      });

      // Process timesheets in batches of 25 - optimal for most servers
      const BATCH_SIZE = 25;
      const results = await processBatch(
        timesheetDataArray,
        BATCH_SIZE,
        (timesheetData) => createTimesheet(userId, timesheetData),
        (completed, total) => {
          const progress = Math.round((completed / total) * 100);
          setSubmissionProgress(progress);
        }
      );

      const failures = results.filter((result) => !result.success);
      
      if (failures.length > 0) {
        console.error(`${failures.length} out of ${results.length} entries failed to submit.`);
        toast.error(`${failures.length} entries failed. ${results.length - failures.length} created successfully.`);
      } else {
        toast.success(`Successfully created ${results.length} timesheet entries!`);
      }
      
      // If approval is not required, auto-approve with batching
      if (!requireApproval && failures.length < results.length) {
        console.log('[BulkTimesheetForm] Auto-approving timesheets...');

        const successfulTimesheets = results
          .filter((result) => result.success && result.data)
          .map((result) => result.data);

        // Process approvals in batches of 20
        const APPROVAL_BATCH_SIZE = 20;
        await processBatch(
          successfulTimesheets,
          APPROVAL_BATCH_SIZE,
          async (timesheet) => {
            try {
              return await processTimesheetApproval(
                timesheet.id,
                userId,
                timesheet.worker_id,
                timesheet.date,
                getPeriodStartDay(paymentSchedule)
              );
            } catch (error) {
              console.error(`Error auto-approving timesheet ${timesheet.id}:`, error);
              return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            }
          }
        );
      }

      const successData = results.filter(r => r.success).map((result) => result.data);
      onSuccess?.(successData);
    } catch (error) {
      console.error("Error submitting timesheets:", error);
      toast.error("Failed to create timesheets. Please try again.");
    } finally {
      setIsSubmitting(false);
      setSubmissionProgress(0);
    }
  };

  return (
    <Form {...form}>
      <form 
        onSubmit={form.handleSubmit(onSubmit)} 
        className="flex flex-col h-full overflow-hidden relative"
      >
        {/* Submission Loading Overlay */}
        {isSubmitting && (
          <div 
            className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm"
            role="status"
            aria-live="polite"
            aria-label="Creating timesheet entries"
          >
            <div 
              className="rounded-xl p-8 shadow-2xl space-y-4 max-w-md mx-4"
              style={{
                backgroundColor: theme === 'dark' ? '#0E141A' : '#FFFFFF',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div 
                    className="h-12 w-12 rounded-full border-4 animate-spin"
                    style={{
                      borderColor: 'rgba(37, 150, 190, 0.2)',
                      borderTopColor: '#2596be'
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">Creating Timesheets</h3>
                  <p className="text-sm text-muted-foreground">
                    Processing {fields.length * (watchedSelectedDates?.length || 0)} entries...
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progress</span>
                  <span className="font-bold">{submissionProgress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300" 
                    style={{ width: `${submissionProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Table Container */}
        <div className="flex-1 min-h-0 overflow-hidden pb-12">
          <WorkerRowsTable
            control={form.control}
            fields={fields}
            workers={workers}
            onWorkerChange={handleWorkerChange}
            onCopyToAll={copyFieldToAll}
            onCopyFromPrevious={copyFromPrevious}
            onRemove={remove}
          />
        </div>

        {/* Fixed Summary Bar */}
        <div 
          className="fixed bottom-0 right-0 z-50 transition-all duration-300"
          style={{
            left: isMobile ? '0' : (isSecondarySidebarCollapsed ? '64px' : '272px')
          }}
        >
          <TotalsBar 
            totals={totals} 
            isSubmitting={isSubmitting}
            onSubmit={form.handleSubmit(onSubmit)}
            entriesCount={fields.length}
            datesCount={watchedSelectedDates?.length || 0}
          />
        </div>
        
        {/* Keyboard shortcut hint */}
        <div 
          className="sr-only" 
          role="status" 
          aria-live="polite"
        >
          Press Ctrl+S or Cmd+S to submit the form
        </div>
      </form>
    </Form>
  );
}


