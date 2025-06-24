"use client"

import { useState } from "react"
import { Edit, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { TransactionForm } from "./transaction-form"
import type { Transaction } from "@/lib/types"

interface TransactionSheetProps {
  transaction?: Transaction
  onSuccess?: (transaction: Transaction) => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TransactionSheet({
  transaction,
  onSuccess,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TransactionSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const open = controlledOpen ?? internalOpen
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen

  const handleSuccess = async (data: Transaction) => {
    setIsLoading(true)
    try {
      await onSuccess?.(data)
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}

      <SheetContent
        side="right"
        className="w-full sm:w-1/2 overflow-y-auto px-4 sm:px-6"
      >
        <SheetHeader className="sr-only">
          <SheetTitle className="text-xl font-semibold">
            {transaction ? "Edit Transaction" : "New Transaction"}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {transaction 
              ? "Update the transaction details and information." 
              : "Create a new transaction and add it to your records."}
          </SheetDescription>
        </SheetHeader>
        <div className="pt-8 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <TransactionForm
            transaction={transaction}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface NewTransactionButtonProps {
  onSuccess?: (transaction: Transaction) => void
}

interface EditTransactionButtonProps {
  transaction: Transaction
  onSuccess?: (transaction: Transaction) => void
}

export function NewTransactionButton({ onSuccess }: NewTransactionButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        New Transaction
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[50%]">
          <SheetHeader>
            <SheetTitle>New Transaction</SheetTitle>
            <SheetDescription>
              Create a new transaction for your company.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-0">
            <TransactionForm
              onSuccess={(transaction) => {
                onSuccess?.(transaction)
                setOpen(false)
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function EditTransactionButton({ transaction, onSuccess }: EditTransactionButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[50%]">
          <SheetHeader>
            <SheetTitle>Edit Transaction</SheetTitle>
            <SheetDescription>
              Update the transaction details.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <TransactionForm
              transaction={transaction}
              onSuccess={(updatedTransaction) => {
                onSuccess?.(updatedTransaction)
                setOpen(false)
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
} 