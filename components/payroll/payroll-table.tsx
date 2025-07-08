"use client"

import React from "react"
import { useState, useEffect } from "react"
import { ArrowUpDown } from "lucide-react"
import { type ColumnDef, useReactTable, getCoreRowModel, getSortedRowModel, flexRender, type SortingState, type VisibilityState, type Table } from "@tanstack/react-table"
import type { PayrollRecord } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getPayrollPayments, addPayrollPayment } from "@/lib/data/payroll";

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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalPayroll, setModalPayroll] = useState<PayrollRecord | null>(null);
  const [payments, setPayments] = useState<Array<{
    id: string;
    payroll_id: string;
    amount: number;
    payment_date: string;
    status: string;
    notes?: string;
    created_by?: string;
    created_at: string;
  }>>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [adding, setAdding] = useState(false);

  const openPaymentsModal = async (payroll: PayrollRecord) => {
    setModalPayroll(payroll);
    setModalOpen(true);
    setLoadingPayments(true);
    const result = await getPayrollPayments(payroll.id);
    setPayments(result);
    setLoadingPayments(false);
  };

  const handleAddPayment = async () => {
    if (!modalPayroll || !newAmount) return;
    setAdding(true);
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      setAdding(false);
      return;
    }
    if (amount > (modalPayroll.net_pay - payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0))) {
      toast.error("Amount exceeds remaining balance");
      setAdding(false);
      return;
    }
    const res = await addPayrollPayment({
      payroll_id: modalPayroll.id,
      amount,
      payment_date: new Date().toISOString().slice(0, 10),
      status: "completed",
      notes: undefined,
      created_by: undefined,
    });
    if (res.success) {
      toast.success("Payment added");
      setNewAmount("");
      // Refresh payments
      const result = await getPayrollPayments(modalPayroll.id);
      setPayments(result);
    } else {
      toast.error(res.error || "Failed to add payment");
    }
    setAdding(false);
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
    {
      id: "partial_payments",
      header: () => <span>Partial Payments</span>,
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => openPaymentsModal(row.original)}>
          Partial Payments
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
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
    <>
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
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partial Payments for {modalPayroll?.worker_name}</DialogTitle>
          </DialogHeader>
          {modalPayroll && (
            <div>
              <div className="mb-2">
                <b>Net Pay:</b> {modalPayroll.net_pay?.toLocaleString("en-BS", { style: "currency", currency: "BSD" })}<br />
                <b>Total Paid:</b> {payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString("en-BS", { style: "currency", currency: "BSD" })}<br />
                <b>Remaining:</b> {(modalPayroll.net_pay - payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0)).toLocaleString("en-BS", { style: "currency", currency: "BSD" })}
              </div>
              <div className="mb-4">
                <b>Payments:</b>
                {loadingPayments ? (
                  <div>Loading...</div>
                ) : payments.length === 0 ? (
                  <div className="text-muted-foreground">No payments yet.</div>
                ) : (
                  <table className="w-full text-sm mt-2">
                    <thead>
                      <tr>
                        <th className="text-left">Date</th>
                        <th className="text-left">Amount</th>
                        <th className="text-left">Status</th>
                        <th className="text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(p => (
                        <tr key={p.id}>
                          <td>{p.payment_date}</td>
                          <td>{Number(p.amount).toLocaleString("en-BS", { style: "currency", currency: "BSD" })}</td>
                          <td>{p.status}</td>
                          <td>{p.notes || ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="flex gap-2 items-end">
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Amount"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  className="w-32"
                />
                <Button onClick={handleAddPayment} disabled={adding || !newAmount}>
                  {adding ? "Adding..." : "Add Payment"}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
