"use client"

import { useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react"
import type { PayrollRecord } from "@/lib/types"
import { setPayrollPaymentAmount } from "@/lib/data/payroll"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PayrollTableProps {
  data: PayrollRecord[]
  selectedPayrollIds: Set<string>
  onSelectAll: (checked: boolean) => void
  onSelectPayroll: (id: string, checked: boolean) => void
  onOpenPaymentsModal: (payroll: PayrollRecord) => void
  getStatusBadge: (status: PayrollRecord['status']) => React.ReactNode
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  startIndex: number
  endIndex: number
  totalRecords: number
  itemsPerPage: number
}

export function PayrollTable({
  data,
  selectedPayrollIds,
  onSelectAll,
  onSelectPayroll,
  onOpenPaymentsModal,
  getStatusBadge,
  currentPage,
  totalPages,
  onPageChange,
  startIndex,
  endIndex,
  totalRecords,
  itemsPerPage,
}: PayrollTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [editingPaymentAmount, setEditingPaymentAmount] = useState<string | null>(null)
  const [paymentAmountValue, setPaymentAmountValue] = useState("")

  const handlePaymentAmountEdit = (payrollId: string, currentValue: string) => {
    setEditingPaymentAmount(payrollId)
    setPaymentAmountValue(currentValue)
  }

  const handlePaymentAmountSave = async (payrollId: string) => {
    const amount = parseFloat(paymentAmountValue)
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount")
      return
    }

    // Note: This component doesn't have direct access to the payrolls state
    // so we'll still need to trigger a refresh, but we can make it smoother
    setEditingPaymentAmount(null)
    setPaymentAmountValue("")
    toast.success("Payment amount updated successfully")

    try {
      const res = await setPayrollPaymentAmount(payrollId, amount, undefined)

      if (!res.success) {
        toast.error(res.error || "Failed to update payment amount")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Error updating payment amount:", error)
    }
  }

  const handlePaymentAmountCancel = () => {
    setEditingPaymentAmount(null)
    setPaymentAmountValue("")
  }

  const columns: ColumnDef<PayrollRecord>[] = [
    {
      id: "select",
      header: () => (
        <Checkbox
          color="var(--muted-foreground)"
          checked={selectedPayrollIds.size === data.length && data.length > 0}
          onCheckedChange={(checked) => onSelectAll(checked === true)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          color="var(--muted-foreground)"
          checked={selectedPayrollIds.has(row.original.id)}
          onCheckedChange={(checked) => onSelectPayroll(row.original.id, checked === true)}
          aria-label="Select payroll"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 100,
    },
    {
      accessorKey: "worker_name",
      header: "Worker",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("worker_name")}</div>
          <div className="text-sm text-gray-500">{row.original.position}</div>
        </div>
      ),
    },
    {
      accessorKey: "gross_pay",
      header: "Gross Pay",
      cell: ({ row }) => (
        <div className="font-medium text-gray-500">
          {new Intl.NumberFormat("en-BS", {
            style: "currency",
            currency: "BSD",
            minimumFractionDigits: 2,
          }).format(row.getValue("gross_pay"))}
        </div>
      ),
    },
    {
      accessorKey: "nib_deduction",
      header: "NIB Deduction",
      cell: ({ row }) => (
        <div className="font-medium text-gray-500">
          {new Intl.NumberFormat("en-BS", {
            style: "currency",
            currency: "BSD",
            minimumFractionDigits: 2,
          }).format(row.getValue("nib_deduction"))}
        </div>
      ),
    },
    {
      accessorKey: "net_pay",
      header: "Net Pay",
      cell: ({ row }) => (
        <div className="font-medium text-gray-500">
          {new Intl.NumberFormat("en-BS", {
            style: "currency",
            currency: "BSD",
            minimumFractionDigits: 2,
          }).format(row.getValue("net_pay"))}
        </div>
      ),
    },
    {
      accessorKey: "remaining_balance",
      header: "Payment Amount",
      cell: ({ row }) => {
        const totalPaid = row.original.total_paid || 0
        const isEditing = editingPaymentAmount === row.original.id

        if (isEditing) {
          return (
            <div className="space-y-2">
              <Input
                type="number"
                value={paymentAmountValue}
                onChange={(e) => setPaymentAmountValue(e.target.value)}
                className="w-20 h-8 text-center text-sm border-muted/50 focus:border-primary"
                step="0.01"
                min="0"
                placeholder="0.00"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handlePaymentAmountSave(row.original.id)
                  } else if (e.key === "Escape") {
                    handlePaymentAmountCancel()
                  }
                }}
                autoFocus
              />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePaymentAmountSave(row.original.id)}
                  className="h-6 px-2 text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePaymentAmountCancel}
                  className="h-6 px-2 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )
        }

        return (
          <div>
            {totalPaid === 0 ? (
              <button
                onClick={() => handlePaymentAmountEdit(row.original.id, "0")}
                className="font-medium text-gray-500 hover:text-foreground cursor-pointer"
              >
                -
              </button>
            ) : (
              <button
                onClick={() => handlePaymentAmountEdit(row.original.id, totalPaid.toString())}
                className="font-medium text-gray-500 hover:text-foreground cursor-pointer"
              >
                {new Intl.NumberFormat("en-BS", {
                  style: "currency",
                  currency: "BSD",
                  minimumFractionDigits: 2,
                }).format(totalPaid)}
              </button>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="font-medium text-gray-500">
          {getStatusBadge(row.getValue("status"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-muted"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={() => onOpenPaymentsModal(row.original)}
            >
              Payment History
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      size: 60,
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    manualPagination: true,
    pageCount: totalPages,
  })

  return (
    <div className="rounded-md border bg-sidebar">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="px-4 text-gray-500">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell 
                    key={cell.id} 
                    className={`px-4 ${cell.column.id === 'actions' ? 'w-16' : ''}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center px-4">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {/* Pagination Controls */}
      {totalRecords > itemsPerPage && (
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, totalRecords)} of {totalRecords} payroll records
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className={`h-8 w-8 p-0 ${currentPage === page
                      ? "bg-[#E8EDF5] text-primary border-[#E8EDF5] dark:bg-primary dark:text-primary-foreground dark:border-primary"
                      : "hover:bg-[#E8EDF5]/70 dark:hover:bg-primary dark:hover:text-primary-foreground"
                    }`}
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
