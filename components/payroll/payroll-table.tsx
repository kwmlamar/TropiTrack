"use client"

import React from "react"
import { useState, useEffect } from "react"
import { ArrowUpDown } from "lucide-react"
import { type ColumnDef, useReactTable, getCoreRowModel, getSortedRowModel, flexRender, type SortingState, type VisibilityState, type Table } from "@tanstack/react-table"
import type { PayrollRecord } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

import {
  Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { usePayrollSettings } from "@/lib/hooks/use-payroll-settings"
import { updatePayrollSettings } from "@/lib/data/payroll-settings"

interface PayrollTableProps {
  data: PayrollRecord[]
  selectedPayrollIds: Set<string>
  setSelectedPayrollIds: React.Dispatch<React.SetStateAction<Set<string>>>
  onTableInit?: (table: Table<PayrollRecord>) => void
}

export function PayrollTable({ data, selectedPayrollIds, setSelectedPayrollIds, onTableInit }: PayrollTableProps) {
  const { payrollSettings, refresh: refreshSettings } = usePayrollSettings()
  
  const [sorting, setSorting] = useState<SortingState>([
    { id: "worker_id", desc: false }
  ]);

  // Initialize column visibility from database settings
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    payrollSettings?.column_settings || {}
  )

  // Update column visibility when settings change
  useEffect(() => {
    if (payrollSettings?.column_settings) {
      setColumnVisibility(payrollSettings.column_settings)
    }
  }, [payrollSettings])

  // Save column visibility to database
  const saveColumnVisibility = async (updatedVisibility: Record<string, boolean>) => {
    if (!payrollSettings?.id) return;
    
    try {
      await updatePayrollSettings({
        id: payrollSettings.id,
        column_settings: updatedVisibility,
      });
      await refreshSettings();
    } catch (error) {
      console.error('Error saving column visibility:', error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allPayrollIds = new Set(data.map(payroll => payroll.id));
      setSelectedPayrollIds(allPayrollIds);
    } else {
      setSelectedPayrollIds(new Set());
    }
  };

  const handleSelectPayroll = (id: string, checked: boolean) => {
    setSelectedPayrollIds(prev => {
      const newSelection = new Set(prev);
      if (checked) {
        newSelection.add(id);
      } else {
        newSelection.delete(id);
      }
      return newSelection;
    });
  };

  const getStatusBadge = (status: PayrollRecord['status']) => {
    const labels = {
      paid: "Paid",
      pending: "Pending",
      void: "Void",
    };

    return (
      <Badge className="bg-[#E8EDF5] text-primary border-[#E8EDF5] px-6 py-1 text-sm font-medium">
        {labels[status]}
      </Badge>
    );
  };

  const columns: ColumnDef<PayrollRecord>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          checked={selectedPayrollIds.size === data.length && data.length > 0}
          onCheckedChange={(value: boolean) => handleSelectAll(value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedPayrollIds.has(row.original.id)}
          onCheckedChange={(value: boolean) => handleSelectPayroll(row.original.id, value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "worker_id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Worker
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex items-left pl-3 gap-2">
            <div>
              <div className="font-bold">
                {record.worker_name || record.worker_id}
              </div>
              <div className="text-sm text-muted-foreground">
                {record.position || "Worker"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "gross_pay",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Gross Pay
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const record = row.original;
        return <div className="text-left pl-3">
          {new Intl.NumberFormat("en-BS", {
            style: "currency",
            currency: "BSD",
          }).format(record.gross_pay)}
        </div>;
      },
    },
    {
      accessorKey: "nib_deduction",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            NIB Deduction
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const record = row.original;
        return <div className="text-left pl-3">
          {new Intl.NumberFormat("en-BS", {
            style: "currency",
            currency: "BSD",
          }).format(record.nib_deduction)}
        </div>;
      },
    },
    {
      accessorKey: "other_deductions",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Other Deductions
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const record = row.original;
        return <div className="text-left pl-3">
          {new Intl.NumberFormat("en-BS", {
            style: "currency",
            currency: "BSD",
          }).format(record.other_deductions)}
        </div>;
      },
    },
    {
      accessorKey: "total_deductions",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Deductions
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const record = row.original;
        return <div className="text-left pl-3">
          {new Intl.NumberFormat("en-BS", {
            style: "currency",
            currency: "BSD",
          }).format(record.total_deductions)}
        </div>;
      },
    },
    {
      accessorKey: "net_pay",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Net Pay
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const record = row.original;
        return <div className="text-left pl-3">
          {new Intl.NumberFormat("en-BS", {
            style: "currency",
            currency: "BSD",
          }).format(record.net_pay)}
        </div>;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="text-left pl-3">
            {getStatusBadge(record.status)}
          </div>
        );
      },
    },
    {
      accessorKey: "total_hours",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Hours
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const record = row.original;
        return <div className="text-left pl-3">{`${record.total_hours} hrs`}</div>;
      },
    },
    {
      accessorKey: "overtime_hours",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Overtime Hours
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const record = row.original;
        return <div className="text-left pl-3">{`${record.overtime_hours} hrs`}</div>;
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: (updatedVisibility) => {
      setColumnVisibility(updatedVisibility)
      saveColumnVisibility(updatedVisibility as Record<string, boolean>)
    },
    state: {
      sorting,
      columnVisibility,
    },
    enableHiding: true,
    defaultColumn: {
      enableHiding: true,
    },
  });

  // Initialize table instance
  useEffect(() => {
    if (onTableInit) {
      onTableInit(table);
    }
  }, [table, onTableInit]);

  return (
    <div className="overflow-x-auto">
      <TableComponent className="min-w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="text-sm">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={`py-2.5 px-4 text-xs font-medium text-muted-foreground text-left pl-3`}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="text-xs md:text-sm">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="py-2.5 px-4 whitespace-nowrap text-sm text-left pl-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </TableComponent>
    </div>
  );
}
