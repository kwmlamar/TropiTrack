"use client";

import { useState, useEffect } from "react";
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
  hourly_rate: number
  total_pay: number;
  supervisor_approval: boolean;
  notes?: string;
};

export const columns: ColumnDef<Timesheet>[] = [
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
    id: "date",
    accessorKey: "date",
    header: "Date",
  },
  {
    id: "worker_id",
    accessorKey: "worker_id",
    header: "Worker",
  },
  {
    id: "project_id",
    accessorKey: "project_id",
    header: "Project",
  },
  {
    id: "task_description",
    accessorKey: "task_description",
    header: "Task Description",
  },
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
  
  
  {
    id: "break_duration",
    accessorKey: "break_duration",
    header: "Break",
  },
  {
    id: "regular_hours",
    accessorKey: "regular_hours",
    header: "Regular Hours",
  },
  {
    id: "overtime_hours",
    accessorKey: "overtime_hours",
    header: "Overtime Hours",
  },
  {
    id: "total_hours",
    accessorKey: "total_hours",
    header: "Total Hours",
  },
  {
    id: "hourly_rate",
    accessorKey: "hourly_rate",
    header: "Hourly Rate",
  },
  {
    id: "total_pay",
    accessorKey: "total_pay",
    header: "Total Pay",
  },
  {
    id: "supervisor_approval",
    accessorKey: "supervisor_approval",
    header: "Supervisor Approval",
  },
  {
    id: "notes",
    accessorKey: "notes",
    header: "Notes",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;

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
                onClick={() => navigator.clipboard.writeText(payment.id)}
              >
                Copy payment ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View customer</DropdownMenuItem>
              <DropdownMenuItem>View payment details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
