"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  Timesheet,
  getTimesheetColumns
} from "@/components/timesheets/timesheets-columns";
import EntryModeToggle from "./entry-mode-toggle";
import { User } from "@supabase/supabase-js";
import { updateEntryMode, fetchPreferences, fetchTimesheets, fetchWorkersForCompany, fetchProjectsForCompany } from "@/lib/data";
import { ClockInOutCreateTimesheetForm, TotalHoursCreateTimesheetForm } from "@/components/timesheets/timesheet-form";
import { Worker, Project } from "@/lib/types"

type EntryMode = "clock-in-out" | "total hours";

export default function TimesheetsTable({ user }: { user: User }) {
  const [entryMode, setEntryMode] = useState<EntryMode>("total hours");
  const [data, setData] = useState<Timesheet[]>([]);
  const [columns, setColumns] = useState<ColumnDef<Timesheet>[]>([]);
  
  useEffect(() => {
    loadTimesheets();
    loadPreferences();
  }, []);

  const loadTimesheets = async () => {
    const data = await fetchTimesheets({ user });
    setData(data);
  };

  const loadPreferences = async () => {
    const prefs = await fetchPreferences(user.id);
    if (prefs) {
      setEntryMode(prefs.entry_mode);
      await loadWorkersAndProjects(prefs.entry_mode); 
    } else {
      await loadWorkersAndProjects(entryMode);
    }
  };
  

  const loadWorkersAndProjects = async (mode: EntryMode) => {
    const workers: Worker[] = await fetchWorkersForCompany({ user });
    const workerMap = new Map(workers.map(w => [w.id, w]));

    const projects: Project[] = await fetchProjectsForCompany({ user });
    const projectMap = new Map(projects.map(p => [p.id, p.name]))

    const { clockInOutColumns, totalHoursColumns } = getTimesheetColumns(workerMap, projectMap);
    setColumns(mode === "clock-in-out" ? clockInOutColumns : totalHoursColumns);
  };

  

  const handleSetEntryMode = async (entryMode: EntryMode) => {
    const new_mode = await updateEntryMode(user.id, entryMode);
    setEntryMode(new_mode);
    await loadWorkersAndProjects(new_mode); // refresh columns on toggle
  };
  return (
    <DashboardLayout title="Timesheets">
      <h1 className="text-2xl font-bold">Timesheets</h1>
      {/* Your page-specific content goes here */}
      <div className="flex space-y-2 mt-4 justify-between">
        <EntryModeToggle mode={entryMode} onChange={handleSetEntryMode} />

        {entryMode === "clock-in-out" ? (
          <div>{/* Render clock in/out inputs */}</div>
        ) : (
          <div>{/* Render total hours inputs */}</div>
        )}

        <TotalHoursCreateTimesheetForm />
      </div>
      <div className="container mx-auto py-10">
        {columns.length > 0 && <DataTable columns={columns} data={data} />}
      </div>
    </DashboardLayout>
  );
}
