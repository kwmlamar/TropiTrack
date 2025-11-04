import { useEffect, useCallback } from "react";
import { UseFormGetValues, UseFormSetValue, FieldArrayWithId } from "react-hook-form";
import type { Worker } from "@/lib/types/worker";
import { getDefaultTimesheetValues } from "@/lib/timesheets/defaults";

interface UseSyncSelectedWorkersParams<TFormData extends { entries: any[] }> {
  selectedWorkers?: Set<string>;
  workers: Worker[];
  fields: FieldArrayWithId<TFormData, "entries", "id">[];
  getValues: UseFormGetValues<TFormData>;
  setValue: UseFormSetValue<TFormData>;
  append: (value: any) => void;
  remove: (index: number) => void;
  settings?: {
    work_day_start?: string;
    work_day_end?: string;
    break_time?: number;
  };
}

/**
 * Hook to sync selected workers with form entries
 * Automatically adds/removes workers from the table when selection changes
 */
export function useSyncSelectedWorkers<TFormData extends { entries: any[] }>({
  selectedWorkers,
  workers,
  fields,
  getValues,
  setValue,
  append,
  remove,
  settings,
}: UseSyncSelectedWorkersParams<TFormData>) {
  
  const addSelectedWorkers = useCallback(() => {
    const selectedWorkersArray = Array.from(selectedWorkers || new Set());
    
    if (selectedWorkersArray.length === 0) {
      return;
    }

    // Get list of workers already in the form
    const existingWorkerIds = new Set(
      fields.map((_, index) => getValues(`entries.${index}.worker_id` as any)).filter(Boolean)
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
      const currentWorkerId = getValues(`entries.${index}.worker_id` as any);
      if (!currentWorkerId && remainingWorkers.length > 0) {
        // Fill empty card with next available worker
        const workerId = remainingWorkers.shift()!;
        const worker = workers.find(w => w.id === workerId);
        
        if (worker) {
          setValue(`entries.${index}.worker_id` as any, worker.id);
          setValue(`entries.${index}.hourly_rate` as any, Number(worker.hourly_rate) || 0);
        }
      }
    });

    // Then add new cards for any remaining selected workers
    const defaults = getDefaultTimesheetValues(settings);
    
    remainingWorkers.forEach((workerId) => {
      const worker = workers.find(w => w.id === workerId);
      
      if (worker) {
        append({
          worker_id: worker.id,
          clock_in: defaults.clock_in,
          clock_out: defaults.clock_out,
          break_duration: defaults.break_duration,
          hourly_rate: Number(worker.hourly_rate) || 0,
          task_description: "",
          notes: "",
        });
      }
    });
  }, [selectedWorkers, fields, getValues, setValue, workers, append, settings]);

  // Sync workers when selection changes
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
        const currentWorkerId = getValues(`entries.${index}.worker_id` as any);
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

  return { addSelectedWorkers };
}

