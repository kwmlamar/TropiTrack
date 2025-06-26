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
  onSelectAll?: (checked: boolean) => void
  onSelectPayroll?: (id: string, checked: boolean) => void
}

export function PayrollTable({ data, selectedPayrollIds, setSelectedPayrollIds, onTableInit, onSelectAll, onSelectPayroll }: PayrollTableProps) {
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
    if (onSelectAll) {
      onSelectAll(checked);
    } else {
      if (checked) {
        const allPayrollIds = new Set(data.map(payroll => payroll.id));
        setSelectedPayrollIds(allPayrollIds);
      } else {
        setSelectedPayrollIds(new Set());
      }
    }
  };

  const handleSelectPayroll = (id: string, checked: boolean) => {
    if (onSelectPayroll) {
      onSelectPayroll(id, checked);
    } else {
      setSelectedPayrollIds(prev => {
        const newSelection = new Set(prev);
        if (checked) {
          newSelection.add(id);
        } else {
          newSelection.delete(id);
        }
        return newSelection;
      });
    }
  };

  const getStatusBadge = (status: PayrollRecord['status']) => {
    const labels = {
      paid: "Paid",
      pending: "Pending",
      confirmed: "Confirmed",
      void: "Void",
    };

    const getBadgeClassName = (status: PayrollRecord['status']) => {
      switch (status) {
        case "paid":
          return "bg-success/10 text-success border-success/20 hover:bg-success/20 dark:bg-success/20 dark:text-success-foreground dark:border-success/30 px-6 py-1 text-sm font-medium";
        case "pending":
          return "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 dark:bg-warning/20 dark:text-warning-foreground dark:border-warning/30 px-6 py-1 text-sm font-medium";
        case "confirmed":
          return "bg-info/10 text-info border-info/20 hover:bg-info/20 dark:bg-info/20 dark:text-info-foreground dark:border-info/30 px-6 py-1 text-sm font-medium";
        case "void":
          return "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20 dark:bg-destructive/20 dark:text-destructive-foreground dark:border-destructive/30 px-6 py-1 text-sm font-medium";
        default:
          return "px-6 py-1 text-sm font-medium";
      }
    };

    return (
      <Badge className={getBadgeClassName(status)}>
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
    <div className="overflow-x-auto" style={{ scrollBehavior: 'auto' }}>
      <TableComponent className="min-w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-muted/30 bg-muted/20 hover:bg-muted/20">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="py-4 px-6 text-sm font-semibold text-muted-foreground text-left"
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
            <TableRow 
              key={row.id} 
              className="border-b border-muted/20 last:border-b-0 hover:bg-muted/40 transition-all duration-200 group"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell 
                  key={cell.id} 
                  className="py-4 px-6 whitespace-nowrap text-sm text-left"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </TableComponent>
      
      {/* Empty State */}
      {table.getRowModel().rows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">No payroll records found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            No payroll records match your current filters. Try adjusting your search or date range.
          </p>
        </div>
      )}
    </div>
  );
}
