"use client";

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
    accessorKey: "date",
    header: "Date",
  },
  {
    accessorKey: "worker_id",
    header: "Worker",
  },
  {
    accessorKey: "project_id",
    header: "Project",
  },
  {
    accessorKey: "task_description",
    header: "Task Description",
  },
  {
    accessorKey: "clock_in",
    header: "Clock In",
  },
  {
    accessorKey: "clock_out",
    header: "Clock Out",
  },
  {
    accessorKey: "break_duration",
    header: "Break",
  },
  {
    accessorKey: "regular_hours",
    header: "Regular Hours",
  },
  {
    accessorKey: "overtime_hours",
    header: "Overtime Hours",
  },
  {
    accessorKey: "total_hours",
    header: "Total Hours",
  },
  {
    accessorKey: "hourly_rate",
    header: "Hourly Rate",
  },
  {
    accessorKey: "total_pay",
    header: "Total Pay",
  },
  {
    accessorKey: "supervisor_approval",
    header: "Supervisor Approval",
  },
  {
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
