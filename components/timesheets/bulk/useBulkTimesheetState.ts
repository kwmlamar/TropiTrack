import { useState, useCallback } from "react";
import type { Worker } from "@/lib/types/worker";

/**
 * Custom hook for managing bulk timesheet selection state
 * Handles project, dates, and workers selection with granular callbacks
 */
export function useBulkTimesheetState() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(() => new Set());

  // Worker selection callbacks - granular API to prevent Set mutations
  const handleToggleWorker = useCallback((workerId: string) => {
    setSelectedWorkers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workerId)) {
        newSet.delete(workerId);
      } else {
        newSet.add(workerId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAllWorkers = useCallback((workers: Worker[]) => {
    setSelectedWorkers(new Set(workers.map(w => w.id)));
  }, []);

  const handleClearWorkers = useCallback(() => {
    setSelectedWorkers(new Set());
  }, []);

  // Date selection callbacks
  const handleDatesChange = useCallback((dates: Date[]) => {
    setSelectedDates(dates);
  }, []);

  // Project selection callback
  const handleProjectChange = useCallback((projectId: string) => {
    setSelectedProject(projectId);
  }, []);

  return {
    // State
    selectedProject,
    selectedDates,
    selectedWorkers,
    
    // Worker callbacks
    onToggleWorker: handleToggleWorker,
    onSelectAllWorkers: handleSelectAllWorkers,
    onClearWorkers: handleClearWorkers,
    
    // Other callbacks
    setSelectedProject: handleProjectChange,
    setSelectedDates: handleDatesChange,
  };
}

