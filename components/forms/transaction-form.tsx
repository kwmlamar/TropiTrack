"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createTransaction, updateTransaction } from "@/lib/data/transactions"
import type { Transaction, UpdateTransactionInput, CreateTransactionInput } from "@/lib/types"
import { toast } from "sonner"

const transactionSchema = z.object({
  date: z.date({
    required_error: "Transaction date is required",
  }),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  type: z.enum(["income", "expense", "liability"]),
  amount: z.number().positive("Amount must be positive"),
  status: z.enum(["completed", "pending", "failed", "cancelled"]),
  account: z.string().min(1, "Account is required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  transaction?: Transaction
  onSuccess?: (transaction: Transaction) => void
  onCancel?: () => void
}

const categories = [
  "Income",
  "Expenses",
  "Equipment",
  "Materials",
  "Labor",
  "Payroll",
  "Insurance",
  "Utilities",
  "Wages Payable",
  "Subcontractors",
  "Overhead",
  "Marketing",
  "Travel",
  "Office Supplies",
  "Software",
  "Maintenance",
  "Other"
]

const accounts = [
  "Cash",
  "Bank Account",
  "Credit Card",
  "Accounts Receivable",
  "Accounts Payable",
  "Equipment",
  "Prepaid Expenses",
  "Accumulated Depreciation",
  "Other Assets",
  "Other Liabilities"
]

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: transaction ? new Date(transaction.date) : new Date(),
      description: transaction?.description || "",
      category: transaction?.category || "",
      type: transaction?.type || "expense",
      amount: transaction?.amount || 0,
      status: transaction?.status || "pending",
      account: transaction?.account || "",
      reference: transaction?.reference || "",
      notes: transaction?.notes || "",
    },
  })

  const onSubmit = async (data: TransactionFormData) => {
    setIsLoading(true)
    try {
      const transactionData = {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
        amount: Number(data.amount),
      }

      let response
      if (transaction) {
        // Update existing transaction
        const updateData: UpdateTransactionInput = {
          id: transaction.id,
          ...transactionData,
        }
        response = await updateTransaction(updateData)
      } else {
        // Create new transaction - backend handles company_id and transaction_id
        response = await createTransaction(transactionData as CreateTransactionInput)
      }

      if (response.success && response.data) {
        toast.success(
          transaction 
            ? "Transaction updated successfully" 
            : "Transaction created successfully"
        )
        onSuccess?.(response.data)
      } else {
        toast.error(response.error || "Failed to save transaction")
      }
    } catch (error) {
      console.error("Error saving transaction:", error)
      toast.error("An error occurred while saving the transaction")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date">Transaction Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch("date") && "text-gray-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("date") ? (
                  format(form.watch("date"), "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={form.watch("date")}
                onSelect={(date) => {
                  if (date) {
                    // Create a new date object with just the date components to avoid timezone issues
                    const year = date.getFullYear()
                    const month = date.getMonth()
                    const day = date.getDate()
                    const newDate = new Date(year, month, day)
                    form.setValue("date", newDate)
                  } else {
                    form.setValue("date", new Date())
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.date && (
            <p className="text-sm text-red-600">{form.formState.errors.date.message}</p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Transaction Type</Label>
          <Select
            value={form.watch("type")}
            onValueChange={(value) => form.setValue("type", value as "income" | "expense" | "liability")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="liability">Liability</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.type && (
            <p className="text-sm text-red-600">{form.formState.errors.type.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            placeholder="Enter transaction description"
            {...form.register("description")}
          />
          {form.formState.errors.description && (
            <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={form.watch("category")}
            onValueChange={(value) => form.setValue("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.category && (
            <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...form.register("amount", { valueAsNumber: true })}
          />
          {form.formState.errors.amount && (
            <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(value) => form.setValue("status", value as "completed" | "pending" | "failed" | "cancelled")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.status && (
            <p className="text-sm text-red-600">{form.formState.errors.status.message}</p>
          )}
        </div>

        {/* Account */}
        <div className="space-y-2">
          <Label htmlFor="account">Account</Label>
          <Select
            value={form.watch("account")}
            onValueChange={(value) => form.setValue("account", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account} value={account}>
                  {account}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.account && (
            <p className="text-sm text-red-600">{form.formState.errors.account.message}</p>
          )}
        </div>

        {/* Reference */}
        <div className="space-y-2">
          <Label htmlFor="reference">Reference (Optional)</Label>
          <Input
            id="reference"
            placeholder="Enter reference number or code"
            {...form.register("reference")}
          />
          {form.formState.errors.reference && (
            <p className="text-sm text-red-600">{form.formState.errors.reference.message}</p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="Enter additional notes or comments"
            rows={3}
            {...form.register("notes")}
          />
          {form.formState.errors.notes && (
            <p className="text-sm text-red-600">{form.formState.errors.notes.message}</p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {transaction ? "Update Transaction" : "Create Transaction"}
        </Button>
      </div>
    </form>
  )
} 