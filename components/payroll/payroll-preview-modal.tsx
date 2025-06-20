"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { X, ChevronDown, ChevronRight, DollarSign, Users, Calendar, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { PayrollRecord } from "@/lib/types"
import { updatePayrollStatus } from "@/lib/data/payroll"
import { supabase } from "@/lib/supabaseClient"
import type { User } from "@supabase/supabase-js"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"

interface PayrollPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPayrolls: PayrollRecord[]
  user: User
  onSuccess: () => void
}

export function PayrollPreviewDialog({
  isOpen,
  onClose,
  selectedPayrolls,
  user,
  onSuccess
}: PayrollPreviewModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [adjustments, setAdjustments] = useState<Record<string, { bonus: number; deduction: number }>>({})

  // Calculate summary data
  const totalHours = selectedPayrolls.reduce((sum, payroll) => sum + payroll.total_hours, 0)
  const totalGross = selectedPayrolls.reduce((sum, payroll) => sum + payroll.gross_pay, 0)
  const totalWorkers = selectedPayrolls.length

  // Get pay period from first payroll (assuming all are from same period)
  const payPeriodStart = selectedPayrolls[0]?.pay_period_start
  const payPeriodEnd = selectedPayrolls[0]?.pay_period_end

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-BS", {
      style: "currency",
      currency: "BSD",
    }).format(amount)
  }

  const toggleRowExpansion = (payrollId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(payrollId)) {
      newExpanded.delete(payrollId)
    } else {
      newExpanded.add(payrollId)
    }
    setExpandedRows(newExpanded)
  }

  const handleAdjustmentChange = (payrollId: string, type: 'bonus' | 'deduction', value: string) => {
    const numValue = parseFloat(value) || 0
    setAdjustments(prev => ({
      ...prev,
      [payrollId]: {
        ...prev[payrollId],
        [type]: numValue
      }
    }))
  }

  const getAdjustedNetPay = (payroll: PayrollRecord) => {
    const adjustment = adjustments[payroll.id] || { bonus: 0, deduction: 0 }
    return payroll.net_pay + adjustment.bonus - adjustment.deduction
  }

  const handleConfirmPayroll = async () => {
    if (selectedPayrolls.length === 0) {
      toast.error("No payroll entries to confirm.")
      return
    }

    setIsProcessing(true)
    try {
      // Step 1: Create Accounting Transactions for each payroll entry
      const transactionPromises = selectedPayrolls.map(async (payroll) => {
        // Validate required fields
        if (!payroll.company_id) {
          throw new Error(`Payroll ${payroll.id} is missing company_id`)
        }
        if (!user.id) {
          throw new Error('User ID is missing')
        }
        // Get adjustments for this payroll
        const adjustment = adjustments[payroll.id] || { bonus: 0, deduction: 0 }
        const adjustedGrossPay = payroll.gross_pay + adjustment.bonus - adjustment.deduction
        // Create expense transaction for payroll cost
        const expenseTransaction = {
          company_id: payroll.company_id,
          transaction_id: `TXN-PAYROLL-${payroll.id}`,
          date: new Date().toISOString().split('T')[0],
          description: `Payroll - ${payroll.worker_name}`,
          category: "Payroll",
          type: "expense" as const,
          amount: adjustedGrossPay,
          status: "pending" as const,
          account: "Business Account",
          reference: `PAYROLL-${payroll.id}`,
          notes: `Payroll expense for ${payroll.worker_name} - Period: ${payroll.pay_period_start} to ${payroll.pay_period_end}`,
          created_by: user.id
        }
        // Create liability transaction for wages payable
        const liabilityTransaction = {
          company_id: payroll.company_id,
          transaction_id: `TXN-LIABILITY-${payroll.id}`,
          date: new Date().toISOString().split('T')[0],
          description: `Wages Payable - ${payroll.worker_name}`,
          category: "Wages Payable",
          type: "liability" as const,
          amount: adjustedGrossPay,
          status: "pending" as const,
          account: "Business Account",
          reference: `LIABILITY-${payroll.id}`,
          notes: `Wages payable for ${payroll.worker_name} - Period: ${payroll.pay_period_start} to ${payroll.pay_period_end}`,
          created_by: user.id
        }
        // Insert both transactions into the database
        const { error: expenseError } = await supabase
          .from('transactions')
          .insert([expenseTransaction])
          .select()
        if (expenseError) {
          throw new Error(`Failed to create expense transaction for ${payroll.worker_name}: ${expenseError.message}`)
        }
        const { error: liabilityError } = await supabase
          .from('transactions')
          .insert([liabilityTransaction])
          .select()
        if (liabilityError) {
          throw new Error(`Failed to create liability transaction for ${payroll.worker_name}: ${liabilityError.message}`)
        }
      })
      await Promise.all(transactionPromises)
      // Step 2: Update payroll status to "confirmed"
      const payrollIdsToUpdate = selectedPayrolls.map(p => p.id)
      const updateResult = await updatePayrollStatus(payrollIdsToUpdate, "confirmed")
      if (updateResult.success) {
        toast.success(`Successfully confirmed ${selectedPayrolls.length} payroll entries and created accounting transactions.`)
        onSuccess()
        onClose()
      } else {
        toast.error("Failed to update payroll status.", {
          description: updateResult.error || "An unknown error occurred.",
        })
      }
    } catch (error) {
      toast.error("Failed to confirm payroll entries.", {
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[calc(100vh-8rem)] w-[calc(100vw-8rem)] !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 !right-auto !bottom-auto p-6 sm:p-8 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Payroll Preview</h1>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="text-muted-foreground mb-6">Review and confirm payroll entries</div>
        <div className="space-y-8">
          {/* Summary Section */}
          <Card className="border border-border/30 rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Pay Period</Label>
                  <p className="font-semibold">
                    {payPeriodStart && payPeriodEnd 
                      ? `${format(parseISO(payPeriodStart), 'MMM d')}–${format(parseISO(payPeriodEnd), 'MMM d, yyyy')}`
                      : 'N/A'
                    }
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Total Hours</Label>
                  <p className="font-semibold">{totalHours} hrs</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Total Gross</Label>
                  <p className="font-semibold">{formatCurrency(totalGross)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Total Workers</Label>
                  <p className="font-semibold">{totalWorkers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employee Breakdown */}
          <Card className="border border-border/30 rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Employee Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedPayrolls.map((payroll) => {
                  const isExpanded = expandedRows.has(payroll.id)
                  const adjustment = adjustments[payroll.id] || { bonus: 0, deduction: 0 }
                  const adjustedNetPay = getAdjustedNetPay(payroll)
                  return (
                    <div key={payroll.id} className="border rounded-lg bg-muted/10">
                      {/* Main Row */}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(payroll.id)}
                              className="h-8 w-8 p-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            <div>
                              <h4 className="font-semibold">{payroll.worker_name}</h4>
                              <p className="text-sm text-muted-foreground">{payroll.position || 'Worker'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Net Pay</p>
                              <p className="font-semibold">{formatCurrency(adjustedNetPay)}</p>
                            </div>
                            <Badge variant="outline">{payroll.status}</Badge>
                          </div>
                        </div>
                      </div>
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t bg-muted/30">
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <Label className="text-sm text-muted-foreground">Approved Hours</Label>
                                <p className="font-medium">{payroll.total_hours} hrs</p>
                              </div>
                              <div>
                                <Label className="text-sm text-muted-foreground">Hourly Rate</Label>
                                <p className="font-medium">{formatCurrency(payroll.hourly_rate)}</p>
                              </div>
                              <div>
                                <Label className="text-sm text-muted-foreground">Gross Pay</Label>
                                <p className="font-medium">{formatCurrency(payroll.gross_pay)}</p>
                              </div>
                              <div>
                                <Label className="text-sm text-muted-foreground">NIB Deduction</Label>
                                <p className="font-medium">{formatCurrency(payroll.nib_deduction)}</p>
                              </div>
                            </div>
                            {/* Adjustments Section */}
                            <div className="space-y-3">
                              <h5 className="font-medium">Adjustments</h5>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`bonus-${payroll.id}`} className="text-sm">Bonus</Label>
                                  <Input
                                    id={`bonus-${payroll.id}`}
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={adjustment.bonus || ''}
                                    onChange={(e) => handleAdjustmentChange(payroll.id, 'bonus', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`deduction-${payroll.id}`} className="text-sm">Additional Deduction</Label>
                                  <Input
                                    id={`deduction-${payroll.id}`}
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={adjustment.deduction || ''}
                                    onChange={(e) => handleAdjustmentChange(payroll.id, 'deduction', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            </div>
                            <Separator />
                            {/* Final Calculation */}
                            <div className="flex justify-between items-center">
                              <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Original Net Pay</p>
                                <p className="font-medium">{formatCurrency(payroll.net_pay)}</p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-sm text-muted-foreground">Final Net Pay</p>
                                <p className="font-semibold text-lg">{formatCurrency(adjustedNetPay)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter className="mt-8">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmPayroll} 
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90"
          >
            {isProcessing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Payroll
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 