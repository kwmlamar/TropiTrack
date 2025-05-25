"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  Timesheet,
  getTimesheetColumns,
} from "@/components/timesheets/timesheets-columns";
import EntryModeToggle from "./entry-mode-toggle";
import { User } from "@supabase/supabase-js";
import {
  updateEntryMode,
  fetchPreferences,
  fetchTimesheets,
  fetchWorkersForCompany,
  fetchProjectsForCompany,
} from "@/lib/data/data";
import {
  CreateBulkTimesheetForm,
  TotalHoursCreateTimesheetForm,
  TotalHoursEditTimesheetForm,
} from "@/components/timesheets/timesheet-forms";
import { Worker, Project, WeeklyTimesheetRow } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import TimesheetViewControls from "./timesheets-view-controls";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { groupToWeeklyRows } from "@/lib/data/transformers";

type EntryMode = "clock-in-out" | "total hours";

export default function TimesheetsTable({ user }: { user: User }) {
  const [entryMode, setEntryMode] = useState<EntryMode>("total hours");
  const [timesheets, setTimesheets] = useState<
    Timesheet[] | WeeklyTimesheetRow[]
  >([]);
  const [columns, setColumns] = useState<
    ColumnDef<Timesheet | WeeklyTimesheetRow>[]
  >([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editTimesheet, setEditTimesheet] = useState<Timesheet | null>(null);
  //const [editWeeklyTimesheet, setEditWeeklyTimesheet] =
    //useState<WeeklyTimesheetRow | null>(null);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("weekly");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );

  useEffect(() => {
    loadTimesheets();
    loadPreferences();
  }, [selectedDate, viewMode]);

  const loadTimesheets = async () => {
    const raw = await fetchTimesheets({
      user,
      date: selectedDate ?? new Date(),
      viewMode,
    });

    const data = viewMode === "weekly" ? groupToWeeklyRows(raw) : raw;

    setTimesheets(data);
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
    const workerMap = new Map(workers.map((w) => [w.id, w]));
    setWorkers(workers);

    const projects: Project[] = await fetchProjectsForCompany({ user });
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    setProjects(projects);

    const {
      clockInOutColumns,
      totalHoursColumns,
      weeklyColumns: generatedWeeklyColumns,
    } = getTimesheetColumns(
      user,
      workerMap,
      projectMap,
      async () => await loadTimesheets(),
      (timesheet) => setEditTimesheet(timesheet),
      selectedDate ?? new Date()
    );

    setColumns(
      viewMode === "weekly"
        ? (generatedWeeklyColumns as ColumnDef<
            Timesheet | WeeklyTimesheetRow
          >[])
        : mode === "clock-in-out"
        ? (clockInOutColumns as ColumnDef<Timesheet | WeeklyTimesheetRow>[])
        : (totalHoursColumns as ColumnDef<Timesheet | WeeklyTimesheetRow>[])
    );
  };

  const handleSetEntryMode = async (newMode: EntryMode) => {
    const updatedMode = await updateEntryMode(user.id, newMode);
    setEntryMode(updatedMode);
    await loadWorkersAndProjects(updatedMode); // refresh columns on toggle
  };

  const formattedDateLabel =
    viewMode === "daily"
      ? format(selectedDate ?? new Date(), "EEEE, MMMM d, yyyy")
      : `${format(
          startOfWeek(selectedDate ?? new Date(), { weekStartsOn: 1 }),
          "MMM d"
        )} - ${format(
          endOfWeek(selectedDate ?? new Date(), { weekStartsOn: 1 }),
          "MMM d, yyyy"
        )}`;
  return (
    <DashboardLayout title="Timesheets">
      <h1 className="text-2xl font-bold">Timesheets</h1>
      <h2 className="text-sm text-muted-foreground mt-4">
        {viewMode === "daily" ? "Viewing day:" : "Viewing week:"}{" "}
        {formattedDateLabel}
      </h2>

      {/* View Toggle */}
      <div className="flex justify-between items-center mt-4"></div>
      {/* Your page-specific content goes here */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
        <EntryModeToggle mode={entryMode} onChange={handleSetEntryMode} />
        <TimesheetViewControls
          viewMode={viewMode}
          setViewMode={setViewMode}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        {entryMode === "clock-in-out" ? (
          <div>{/* Render clock in/out inputs */}</div>
        ) : (
          <div>{/* Render total hours inputs */}</div>
        )}

        {viewMode === "weekly" ? (
          <CreateBulkTimesheetForm
            user={user}
            workers={workers}
            projects={projects}
            onRefresh={loadTimesheets}
          />
        ) : (
          <TotalHoursCreateTimesheetForm
            user={user}
            workers={workers}
            projects={projects}
            onRefresh={loadTimesheets}
          />
        )}
      </div>
      <div>
        {columns.length > 0 && (
          <DataTable columns={columns} data={timesheets} />
        )}
      </div>
      <Sheet open={!!editTimesheet} onOpenChange={() => setEditTimesheet(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Timesheet</SheetTitle>
            <SheetDescription>
              Update the timesheet details below. Changes will be saved once you
              click &apos;Save Timesheet&apos;.
            </SheetDescription>
          </SheetHeader>
          {editTimesheet && (
            <TotalHoursEditTimesheetForm
              user={user}
              workers={workers}
              projects={projects}
              timesheet={editTimesheet}
              onRefresh={loadTimesheets}
              onClose={() => setEditTimesheet(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}