"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import {
  Timesheet,
  clockInOutColumns,
  totalHoursColumns,
} from "@/components/timesheets/timesheets-columns";
import EntryModeToggle from "./entry-mode-toggle";
import { User } from "@supabase/supabase-js";
import { updateEntryMode, fetchPreferences } from "@/lib/data";
import { TimesheetForm } from "@/components/timesheets/timesheet-form";


async function getData(): Promise<Timesheet[]> {
  return [
    {
      id: "ts-001",
      date: "2025-05-12",
      worker_id: "emp-001",
      project_id: "proj-001",
      task_description: "Concrete pouring for foundation",
      clock_in: "2025-05-12T07:00:00-04:00",
      clock_out: "2025-05-12T15:30:00-04:00",
      break_duration: 30,
      regular_hours: 8,
      overtime_hours: 0.5,
      total_hours: 8.5,
      hourly_rate: 20.0,
      total_pay: 170.0,
      supervisor_approval: true,
      notes: "Completed ahead of schedule",
    },
    {
      id: "ts-002",
      date: "2025-05-13",
      worker_id: "emp-002",
      project_id: "proj-002",
      task_description: "Electrical wiring installation",
      clock_in: "2025-05-13T08:00:00-04:00",
      clock_out: "2025-05-13T17:00:00-04:00",
      break_duration: 60,
      regular_hours: 8,
      overtime_hours: 0,
      total_hours: 8,
      hourly_rate: 25.0,
      total_pay: 200.0,
      supervisor_approval: false,
      notes: "Awaiting inspection",
    },
    {
      id: "ts-003",
      date: "2025-05-14",
      worker_id: "emp-003",
      project_id: "proj-003",
      task_description: "Site cleanup and debris removal",
      clock_in: "2025-05-14T09:00:00-04:00",
      clock_out: "2025-05-14T17:00:00-04:00",
      break_duration: 45,
      regular_hours: 7.25,
      overtime_hours: 0,
      total_hours: 7.25,
      hourly_rate: 18.0,
      total_pay: 130.5,
      supervisor_approval: true,
    },
  ];
}

type EntryMode = "clock-in-out" | "total hours";

export default function TimesheetsTable({ user }: { user: User }) {
  const [entryMode, setEntryMode] = useState<EntryMode>("clock-in-out");
  const [data, setData] = useState<Timesheet[]>([]);

  const selectedColumns =
    entryMode === "clock-in-out" ? clockInOutColumns : totalHoursColumns;

  useEffect(() => {
    getData().then(setData);
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await fetchPreferences(user.id);
    setEntryMode(prefs.entry_mode);

    if (!prefs) {
      console.log("Failed to load preferences.");
    }
  };

  const handleSetEntryMode = async (entryMode: EntryMode) => {
    const new_mode = await updateEntryMode(user.id, entryMode);
    setEntryMode(new_mode);
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

        <TimesheetForm />
      </div>
      <div className="container mx-auto py-10">
        <DataTable columns={selectedColumns} data={data} />
      </div>
    </DashboardLayout>
  );
}
