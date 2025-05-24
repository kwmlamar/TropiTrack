"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Worker, Project, Timesheet } from "@/lib/types";
import { SearchableCombobox } from "../searchable-combobox";
import {
  generateTimesheet,
  generateWeeklyTimesheet,
  updateTimesheet,
} from "@/lib/data/data";

export function ClockInOutCreateTimesheetForm() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Add Timesheet
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Timesheet</SheetTitle>
          <SheetDescription>
            Fill out the timesheet details. Nothing will actually be saved yet.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-4 h-screen w-full max-w-[700px] overflow-y-auto will-change-auto">
          {/* Date */}
          <div className="mb-4">
            <Label htmlFor="date" className="block mb-2">
              Date
            </Label>
            <Input id="date" type="date" className="w-full" />
          </div>

          {/* Worker ID */}
          <div className="mb-4">
            <Label htmlFor="worker_id" className="block mb-2">
              Worker
            </Label>
            <Input id="worker_id" className="w-full" />
          </div>

          {/* Project ID */}
          <div className="mb-4">
            <Label htmlFor="project_id" className="block mb-2">
              Project
            </Label>
            <Input id="project_id" className="w-full" />
          </div>

          {/* Clock In */}
          <div className="mb-4">
            <Label htmlFor="clock_in" className="block mb-2">
              Clock In
            </Label>
            <Input id="clock_in" type="datetime-local" className="w-full" />
          </div>

          {/* Clock Out */}
          <div className="mb-4">
            <Label htmlFor="clock_out" className="block mb-2">
              Clock Out
            </Label>
            <Input id="clock_out" type="datetime-local" className="w-full" />
          </div>

          {/* Break Duration */}
          <div className="mb-4">
            <Label htmlFor="break_duration" className="block mb-2">
              Break (mins)
            </Label>
            <Input id="break_duration" type="number" className="w-full" />
          </div>

          {/* Regular Hours */}
          <div className="mb-4">
            <Label htmlFor="regular_hours" className="block mb-2">
              Regular Hours
            </Label>
            <Input id="regular_hours" type="number" className="w-full" />
          </div>

          {/* Overtime Hours */}
          <div className="mb-4">
            <Label htmlFor="overtime_hours" className="block mb-2">
              Overtime Hours
            </Label>
            <Input id="overtime_hours" type="number" className="w-full" />
          </div>

          {/* Supervisor Approval */}
          <div className="flex items-center space-x-2">
            <Checkbox id="supervisor_approval" />
            <Label htmlFor="supervisor_approval">Supervisor Approval</Label>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="block mb-2 mt-2">
              Notes
            </Label>
            <Textarea id="notes" className="w-full" />
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button type="button">Save Timesheet</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function TotalHoursCreateTimesheetForm({
  user,
  workers,
  projects,
  onRefresh,
}: {
  user: User;
  workers: Worker[];
  projects: Project[];
  onRefresh: () => void;
}) {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [date, setDate] = useState("");
  const [regularHours, setRegularHours] = useState("");
  const [overtimeHours, setOvertimeHours] = useState("");
  const [supervisorApproval, setSupervisorApproval] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    if (!selectedWorker || !selectedProject || !date.trim()) {
      alert("Please fill out all required fields.");
      return;
    }
    try {
      await generateTimesheet({
        user,
        selectedWorker,
        selectedProject,
        date,
        regularHours: Number(regularHours) || 0,
        overtimeHours: Number(overtimeHours) || 0,
        supervisorApproval,
        notes,
      });
    } catch (error) {
      console.error(error);
      alert("Failed to save timesheet. Try again.");
    }
    onRefresh();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Add Timesheet
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Timesheet</SheetTitle>
          <SheetDescription>
            Fill out the timesheet details. Nothing will actually be saved yet.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-4 h-screen w-full max-w-[700px] overflow-y-auto will-change-auto">
          {/* Date */}
          <div className="mb-4">
            <Label htmlFor="date" className="block mb-2">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Worker ID */}
          <div className="mb-4">
            <Label htmlFor="worker_id" className="block mb-2">
              Worker
            </Label>
            <SearchableCombobox
              items={workers}
              selectedItem={selectedWorker}
              onSelect={setSelectedWorker}
              displayKey="name"
              placeholder="Select a worker"
            />
          </div>

          {/* Project ID */}
          <div className="mb-4">
            <Label htmlFor="project_id" className="block mb-2">
              Project
            </Label>
            <SearchableCombobox
              items={projects}
              selectedItem={selectedProject}
              onSelect={setSelectedProject}
              displayKey="name"
              placeholder="Select a project"
            />
          </div>

          {/* Regular Hours */}
          <div className="mb-4">
            <Label htmlFor="regular_hours" className="block mb-2">
              Regular Hours
            </Label>
            <Input
              id="regular_hours"
              type="number"
              value={regularHours}
              onChange={(e) => setRegularHours(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Overtime Hours */}
          <div className="mb-4">
            <Label htmlFor="overtime_hours" className="block mb-2">
              Overtime Hours
            </Label>
            <Input
              id="overtime_hours"
              type="number"
              value={overtimeHours}
              onChange={(e) => setOvertimeHours(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Supervisor Approval */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="supervisor_approval"
              checked={supervisorApproval}
              onCheckedChange={(v) => setSupervisorApproval(!!v)}
            />
            <Label htmlFor="supervisor_approval">Supervisor Approval</Label>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes" className="mt-4">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" onClick={handleSave}>
              Save Timesheet
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function TotalHoursEditTimesheetForm({
  user,
  workers,
  projects,
  timesheet,
  onRefresh,
  onClose,
}: {
  user: User;
  workers: Worker[];
  projects: Project[];
  timesheet: Timesheet;
  onRefresh: () => void;
  onClose?: () => void;
}) {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [date, setDate] = useState("");
  const [regularHours, setRegularHours] = useState("");
  const [overtimeHours, setOvertimeHours] = useState("");
  const [supervisorApproval, setSupervisorApproval] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (timesheet) {
      const worker = workers.find((w) => w.id === timesheet.worker_id);
      const project = projects.find((p) => p.id === timesheet.project_id);
      setSelectedWorker(worker ?? null);
      setSelectedProject(project ?? null);
      setDate(timesheet.date ?? "");
      setRegularHours(timesheet.regular_hours?.toString() ?? "");
      setOvertimeHours(timesheet.overtime_hours?.toString() ?? "");
      setSupervisorApproval(!!timesheet.supervisor_approval);
      setNotes(timesheet.notes ?? "");
    }
  }, [timesheet, workers, projects]);

  const handleSave = async () => {
    if (!selectedWorker || !selectedProject || !date.trim()) {
      alert("Please fill out all required fields.");
      return;
    }
    try {
      await updateTimesheet(timesheet.id, {
        user,
        selectedWorker,
        selectedProject,
        date,
        regularHours: Number(regularHours) || 0,
        overtimeHours: Number(overtimeHours) || 0,
        supervisorApproval,
        notes,
      });
      onRefresh();
      onClose?.();
    } catch (error) {
      console.error(error);
      alert("Failed to save timesheet. Try again.");
    }
  };

  return (
    <>
      <div className="px-4 py-4 h-screen w-full max-w-[700px] overflow-y-auto will-change-auto">
        {/* Date */}
        <div className="mb-4">
          <Label htmlFor="date" className="block mb-2">
            Date
          </Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Worker */}
        <div className="mb-4">
          <Label htmlFor="worker_id" className="block mb-2">
            Worker
          </Label>
          <SearchableCombobox
            items={workers}
            selectedItem={selectedWorker}
            onSelect={setSelectedWorker}
            displayKey="name"
            placeholder="Select a worker"
          />
        </div>

        {/* Project */}
        <div className="mb-4">
          <Label htmlFor="project_id" className="block mb-2">
            Project
          </Label>
          <SearchableCombobox
            items={projects}
            selectedItem={selectedProject}
            onSelect={setSelectedProject}
            displayKey="name"
            placeholder="Select a project"
          />
        </div>

        {/* Regular Hours */}
        <div className="mb-4">
          <Label htmlFor="regular_hours" className="block mb-2">
            Regular Hours
          </Label>
          <Input
            id="regular_hours"
            type="number"
            value={regularHours}
            onChange={(e) => setRegularHours(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Overtime Hours */}
        <div className="mb-4">
          <Label htmlFor="overtime_hours" className="block mb-2">
            Overtime Hours
          </Label>
          <Input
            id="overtime_hours"
            type="number"
            value={overtimeHours}
            onChange={(e) => setOvertimeHours(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Supervisor Approval */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="supervisor_approval"
            checked={supervisorApproval}
            onCheckedChange={(v) => setSupervisorApproval(!!v)}
          />
          <Label htmlFor="supervisor_approval">Supervisor Approval</Label>
        </div>

        {/* Notes */}
        <div className="grid gap-2">
          <Label htmlFor="notes" className="mt-4">
            Notes
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="px-4 pb-4">
        <SheetClose asChild>
          <Button type="button" className="w-full mb-4" onClick={handleSave}>
            Save Timesheet
          </Button>
        </SheetClose>
      </div>
    </>
  );
}

export function CreateBulkTimesheetForm({
  user,
  workers,
  projects,
  onRefresh,
}: {
  user: User;
  workers: Worker[];
  projects: Project[];
  onRefresh: () => void;
}) {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [startDate, setStartDate] = useState("");
  const [regularHours, setRegularHours] = useState("");
  const [overtimeHours, setOvertimeHours] = useState("");
  const [supervisorApproval, setSupervisorApproval] = useState(false);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function getStartOfWeek(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  const handleSave = async () => {
    if (!selectedWorker || !selectedProject || !startDate.trim()) {
      alert("Please fill out all required fields.");
      return;
    }

    setIsLoading(true);
    try {
      await generateWeeklyTimesheet({
        user,
        selectedWorker,
        selectedProject,
        startDate: startDate,
        regularHours: Number(regularHours) || 0,
        overtimeHours: Number(overtimeHours) || 0,
        supervisorApproval,
        notes,
      });
    } catch (error) {
      console.error(error);
      alert("Failed to save timesheet. Try again.");
    } finally {
      setIsLoading(false);
    }
    onRefresh();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Add Timesheet
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Generate Weekly Timesheet</SheetTitle>
          <SheetDescription>
            Create timesheets in bulk for a selected week. Choose a worker,
            project, and enter default hours to apply across all days.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-4 h-screen w-full max-w-[700px] overflow-y-auto will-change-auto">
          {/* Date */}
          <div className="mb-4">
            <Label htmlFor="week" className="block mb-2">
              Week
            </Label>
            <Input
              id="week"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(getStartOfWeek(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Worker ID */}
          <div className="mb-4">
            <Label htmlFor="worker_id" className="block mb-2">
              Worker
            </Label>
            <SearchableCombobox
              items={workers}
              selectedItem={selectedWorker}
              onSelect={setSelectedWorker}
              displayKey="name"
              placeholder="Select a worker"
            />
          </div>

          {/* Project ID */}
          <div className="mb-4">
            <Label htmlFor="project_id" className="block mb-2">
              Project
            </Label>
            <SearchableCombobox
              items={projects}
              selectedItem={selectedProject}
              onSelect={setSelectedProject}
              displayKey="name"
              placeholder="Select a project"
            />
          </div>

          {/* Regular Hours */}
          <div className="mb-4">
            <Label htmlFor="regular_hours" className="block mb-2">
              Regular Hours
            </Label>
            <Input
              id="regular_hours"
              type="number"
              value={regularHours}
              onChange={(e) => setRegularHours(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Overtime Hours */}
          <div className="mb-4">
            <Label htmlFor="overtime_hours" className="block mb-2">
              Overtime Hours
            </Label>
            <Input
              id="overtime_hours"
              type="number"
              value={overtimeHours}
              onChange={(e) => setOvertimeHours(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Supervisor Approval */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="supervisor_approval"
              checked={supervisorApproval}
              onCheckedChange={(v) => setSupervisorApproval(!!v)}
            />
            <Label htmlFor="supervisor_approval">Supervisor Approval</Label>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes" className="mt-4">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button type="button" onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Timesheet"}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function EditWeeklyTimesheetForm({
  user,
  workers,
  projects,
  timesheet,
  onRefresh,
  onClose,
}: {
  user: User;
  workers: Worker[];
  projects: Project[];
  timesheet: Timesheet;
  onRefresh: () => void;
  onClose?: () => void;
}) {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [date, setDate] = useState("");
  const [regularHours, setRegularHours] = useState("");
  const [overtimeHours, setOvertimeHours] = useState("");
  const [supervisorApproval, setSupervisorApproval] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (timesheet) {
      const worker = workers.find((w) => w.id === timesheet.worker_id);
      const project = projects.find((p) => p.id === timesheet.project_id);
      setSelectedWorker(worker ?? null);
      setSelectedProject(project ?? null);
      setDate(timesheet.date ?? "");
      setRegularHours(timesheet.regular_hours?.toString() ?? "");
      setOvertimeHours(timesheet.overtime_hours?.toString() ?? "");
      setSupervisorApproval(!!timesheet.supervisor_approval);
      setNotes(timesheet.notes ?? "");
    }
  }, [timesheet, workers, projects]);

  const handleSave = async () => {
    if (!selectedWorker || !selectedProject || !date.trim()) {
      alert("Please fill out all required fields.");
      return;
    }
    try {
      await updateTimesheet(timesheet.id, {
        user,
        selectedWorker,
        selectedProject,
        date,
        regularHours: Number(regularHours) || 0,
        overtimeHours: Number(overtimeHours) || 0,
        supervisorApproval,
        notes,
      });
      onRefresh();
      onClose?.();
    } catch (error) {
      console.error(error);
      alert("Failed to save timesheet. Try again.");
    }
  };

  return (
    <>
      <div className="px-4 py-4 h-screen w-full max-w-[700px] overflow-y-auto will-change-auto">
        {/* Date */}
        <div className="mb-4">
          <Label htmlFor="date" className="block mb-2">
            Date
          </Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Worker */}
        <div className="mb-4">
          <Label htmlFor="worker_id" className="block mb-2">
            Worker
          </Label>
          <SearchableCombobox
            items={workers}
            selectedItem={selectedWorker}
            onSelect={setSelectedWorker}
            displayKey="name"
            placeholder="Select a worker"
          />
        </div>

        {/* Project */}
        <div className="mb-4">
          <Label htmlFor="project_id" className="block mb-2">
            Project
          </Label>
          <SearchableCombobox
            items={projects}
            selectedItem={selectedProject}
            onSelect={setSelectedProject}
            displayKey="name"
            placeholder="Select a project"
          />
        </div>

        {/* Regular Hours */}
        <div className="mb-4">
          <Label htmlFor="regular_hours" className="block mb-2">
            Regular Hours
          </Label>
          <Input
            id="regular_hours"
            type="number"
            value={regularHours}
            onChange={(e) => setRegularHours(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Overtime Hours */}
        <div className="mb-4">
          <Label htmlFor="overtime_hours" className="block mb-2">
            Overtime Hours
          </Label>
          <Input
            id="overtime_hours"
            type="number"
            value={overtimeHours}
            onChange={(e) => setOvertimeHours(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Supervisor Approval */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="supervisor_approval"
            checked={supervisorApproval}
            onCheckedChange={(v) => setSupervisorApproval(!!v)}
          />
          <Label htmlFor="supervisor_approval">Supervisor Approval</Label>
        </div>

        {/* Notes */}
        <div className="grid gap-2">
          <Label htmlFor="notes" className="mt-4">
            Notes
          </Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <div className="px-4 pb-4">
        <SheetClose asChild>
          <Button type="button" className="w-full mb-4" onClick={handleSave}>
            Save Timesheet
          </Button>
        </SheetClose>
      </div>
    </>
  );
}
