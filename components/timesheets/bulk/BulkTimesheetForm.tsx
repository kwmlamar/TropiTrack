"use client";

import { useEffect, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

import { Form } from "@/components/ui/form";
import { WorkerRowsTable } from "./WorkerRowsTable";
import { TotalsBar } from "./TotalsBar";

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
  const { paymentSchedule } = usePayrollSettings();
  const { requireApproval, settings } = useTimesheetSettings();

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

  // Calculate totals reactively
  const totals = useMemo(() => {
    return calculateBulkTimesheetTotals(
      watchedEntries || [],
      (watchedSelectedDates || []).length
    );
  }, [watchedEntries, watchedSelectedDates]);

  // Handle form submission
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
                getPeriodStartDay(paymentSchedule)
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="overflow-hidden">
        <WorkerRowsTable
          control={form.control}
          fields={fields}
          workers={workers}
          onWorkerChange={handleWorkerChange}
          onCopyToAll={copyFieldToAll}
          onCopyFromPrevious={copyFromPrevious}
          onRemove={remove}
        />

        <TotalsBar totals={totals} />
      </form>
    </Form>
  );
}

