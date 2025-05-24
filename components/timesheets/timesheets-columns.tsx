"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteTimesheet } from "@/lib/data/data";
import { Worker } from "@/lib/types";

export type Timesheet = {
  id: string;
  date: string;
  worker_id: string;
  project_id: string;
  task_description: string;
  clock_in: string;
  clock_out: string;
  break_duration: number;
  regular_hours: number;
  overtime_hours: number;
  total_hours: number;
  hourly_rate: number;
  total_pay: number;
  supervisor_approval: boolean;
  notes?: string;
};

export type WeeklyTimesheetRow = {
  id: string,
  worker_id: string;
  worker_name?: string;
  mon?: number;
  tue?: number;
  wed?: number;
  thu?: number;
  fri?: number;
  sat?: number;
  sun?: number;
  approved?: boolean;
};

export function getTimesheetColumns(
  user: User,
  workerMap: Map<string, Worker>,
  projectMap: Map<string, string>,
  onRefresh: () => void,
  onEditTimesheet: (t: Timesheet) => void
) {
  const sharedColumnsBeginning: ColumnDef<Timesheet>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "worker_id",
      header: "Worker",
      cell: ({ row }) => {
        const workerId = row.getValue("worker_id") as string;
        const worker = workerMap.get(workerId);
        return worker ? `${worker.name}` : workerId;
      },
    },

    {
      accessorKey: "project_id",
      header: "Project",
      cell: ({ row }) => {
        const projectId = row.getValue("project_id") as string;
        return projectMap.get(projectId) ?? projectId;
      },
    },
  ];

  const sharedColumnsEnd: ColumnDef<Timesheet>[] = [
    {
      id: "supervisor_approval",
      header: "Approved",
      cell: ({ row }) => {
        const approved = row.getValue("supervisor_approval");
        return approved ? "Approved" : "Pending";
      },
    },
    {
      id: "notes",
      accessorKey: "notes",
      header: "Notes",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const timesheet = row.original;

        return (
          <div className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(timesheet.id)}
                >
                  Copy Timesheet ID
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // stub: replace with your edit modal logic
                    onEditTimesheet(timesheet)
                  }}
                >
                  Edit Timesheet
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await deleteTimesheet({
                        userId: user.id,
                        timesheetId: timesheet.id,
                      });
                      console.log("Deleted timesheet, now refreshing...");
                      await onRefresh?.();
                    } catch (err) {
                      console.error("Error during delete or refresh:", err);
                    }
                  }}
                >
                  Delete Timesheet
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    // stub: replace with your approve logic
                    console.log("Approve timesheet", timesheet.id);
                  }}
                >
                  Approve Timesheet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const clockSpecific: ColumnDef<Timesheet>[] = [
    {
      id: "clock_in",
      accessorKey: "clock_in",
      header: "Clock In",
      cell: ({ row }) => {
        const [formattedTime, setFormattedTime] = useState("");

        useEffect(() => {
          const value = row.getValue("clock_in") as string;
          const date = new Date(value);
          setFormattedTime(
            date.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: "America/Nassau",
            })
          );
        }, [row]);

        return <span>{formattedTime}</span>;
      },
    },
    {
      id: "clock_out",
      accessorKey: "clock_out",
      header: "Clock Out",
      cell: ({ row }) => {
        const [formattedTime, setFormattedTime] = useState("");

        useEffect(() => {
          const value = row.getValue("clock_out") as string;
          const date = new Date(value);
          setFormattedTime(
            date.toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZone: "America/Nassau",
            })
          );
        }, [row]);

        return <span>{formattedTime}</span>;
      },
    },
    { accessorKey: "break_duration", header: "Break (min)" },
    { accessorKey: "regular_hours", header: "Reg Hrs" },
    { accessorKey: "overtime_hours", header: "OT Hrs" },
    {
      accessorKey: "total_hours",
      header: "Total Hours",
      cell: ({ row }) =>
        (row.original.regular_hours ?? 0) + (row.original.overtime_hours ?? 0),
    },
    { accessorKey: "total_pay", header: "Pay" },
  ];

  const totalHoursSpecific: ColumnDef<Timesheet>[] = [
    { accessorKey: "regular_hours", header: "Reg Hrs" },
    { accessorKey: "overtime_hours", header: "OT Hrs" },
    {
      accessorKey: "total_hours",
      header: "Total Hours",
    },
    {
      accessorKey: "hourly_rate",
      header: "Rate",
      cell: ({ row }) => {
        const rate = row.getValue<number>("hourly_rate");
        return rate ? `$${rate}/hr` : "-";
      },
    },
    { accessorKey: "total_pay", header: "Pay" },
  ];

  const clockInOutColumns = [
    ...sharedColumnsBeginning,
    ...clockSpecific,
    ...sharedColumnsEnd,
  ];
  const totalHoursColumns = [
    ...sharedColumnsBeginning,
    ...totalHoursSpecific,
    ...sharedColumnsEnd,
  ];

  const weeklyColumns: ColumnDef<WeeklyTimesheetRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "worker_id",
      header: "Worker",
      cell: ({ row }) => {
        const workerId = row.getValue("worker_id") as string;
        const worker = workerMap.get(workerId);
        return worker ? `${worker.name}` : workerId;
      },
    },
    {
      accessorKey: "mon",
      header: "Mon",
    },
    {
      accessorKey: "tue",
      header: "Tue",
    },
    {
      accessorKey: "wed",
      header: "Wed",
    },
    {
      accessorKey: "thu",
      header: "Thu",
    },
    {
      accessorKey: "fri",
      header: "Fri",
    },
    {
      accessorKey: "sat",
      header: "Sat",
    },
    {
      accessorKey: "sun",
      header: "Sun",
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
        const { mon, tue, wed, thu, fri, sat, sun } = row.original;
        const total =
          Number(mon || 0) +
          Number(tue || 0) +
          Number(wed || 0) +
          Number(thu || 0) +
          Number(fri || 0) +
          Number(sat || 0) +
          Number(sun || 0);
        return total.toFixed(2);
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const timesheet = row.original;

        return (
          <div className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() =>
                    navigator.clipboard.writeText(timesheet.id)
                  }
                >
                  Copy Timesheet ID
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => console.log("Editing Weekly Timesheet")}
                >
                  Edit Timesheet
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await deleteTimesheet({
                        userId: user.id,
                        timesheetId: timesheet.id,
                      });
                      await onRefresh?.();
                    } catch (err) {
                      console.error("Delete failed", err);
                    }
                  }}
                >
                  Delete Timesheet
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    console.log("Approve timesheet", timesheet.id);
                  }}
                >
                  Approve Timesheet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
  return { clockInOutColumns, totalHoursColumns, weeklyColumns };
}
