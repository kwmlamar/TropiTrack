"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { PaymentSchedule } from "@/lib/types/payroll-settings"
import { getPaymentSchedule, updatePaymentSchedule, createPaymentSchedule } from "@/lib/data/payroll-settings"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"
import { validatePayDay, validatePeriodStartDay } from "@/lib/utils/payroll"
import { NextPayDates } from "./next-pay-dates"

const paymentScheduleSchema = z.object({
  pay_period_type: z.enum(["weekly", "bi-weekly", "monthly", "custom"]),
  pay_day: z.coerce.number().min(1).max(31),
  pay_day_type: z.enum(["day_of_month", "day_of_week"]),
  period_start_day: z.coerce.number().min(1).max(31),
  period_start_type: z.enum(["day_of_month", "day_of_week"]),
})

type PaymentScheduleFormData = z.infer<typeof paymentScheduleSchema>

export function PaymentScheduleForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [currentSchedule, setCurrentSchedule] = useState<PaymentSchedule | null>(null)
  const [validationWarnings, setValidationWarnings] = useState<{
    payDay: string | null
    periodStartDay: string | null
  }>({
    payDay: null,
    periodStartDay: null,
  })

  const form = useForm<PaymentScheduleFormData>({
    resolver: zodResolver(paymentScheduleSchema),
    defaultValues: {
      pay_period_type: "bi-weekly",
      pay_day: 5, // Friday
      pay_day_type: "day_of_week",
      period_start_day: 1, // Monday
      period_start_type: "day_of_week",
    },
  })

  const payPeriodType = form.watch("pay_period_type")
  const payDayType = form.watch("pay_day_type")
  const payDay = form.watch("pay_day")
  const periodStartType = form.watch("period_start_type")
  const periodStartDay = form.watch("period_start_day")

  // Validate pay day and period start day whenever relevant fields change
  useEffect(() => {
    const payDayWarning = validatePayDay(payDay, payDayType, payPeriodType)
    const periodStartDayWarning = validatePeriodStartDay(
      periodStartDay,
      periodStartType,
      payDay,
      payDayType,
      payPeriodType
    )

    setValidationWarnings({
      payDay: payDayWarning,
      periodStartDay: periodStartDayWarning,
    })
  }, [payDay, payDayType, periodStartDay, periodStartType, payPeriodType])

  useEffect(() => {
    loadUserProfile()
    loadPaymentSchedule()
  }, [])

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfileWithCompany()
      if (profile?.company_id) {
        setCompanyId(profile.company_id)
      } else {
        toast.error("Company profile not found")
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
      toast.error("Failed to load user profile")
    }
  }

  const loadPaymentSchedule = async () => {
    try {
      const result = await getPaymentSchedule()
      if (result.success && result.data) {
        const schedule = result.data
        setCurrentSchedule(schedule)
        form.reset({
          pay_period_type: schedule.pay_period_type,
          pay_day: schedule.pay_day,
          pay_day_type: schedule.pay_day_type,
          period_start_day: schedule.period_start_day,
          period_start_type: schedule.period_start_type,
        })
      }
    } catch (error) {
      console.error("Error loading payment schedule:", error)
      toast.error("Failed to load payment schedule")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: PaymentScheduleFormData) => {
    if (!companyId) {
      toast.error("Company ID not found")
      return
    }

    // Check for validation warnings
    if (validationWarnings.payDay?.startsWith("Error:") || validationWarnings.periodStartDay?.startsWith("Error:")) {
      toast.error("Please fix validation errors before saving")
      return
    }

    setSaving(true)
    try {
      const result = await getPaymentSchedule()
      let saveResult

      if (result.success && result.data) {
        // Update existing schedule
        saveResult = await updatePaymentSchedule({
          id: result.data.id,
          ...data,
        })
      } else {
        // Create new schedule
        saveResult = await createPaymentSchedule({
          ...data,
          company_id: companyId,
        })
      }

      if (saveResult.success) {
        setCurrentSchedule(saveResult.data)
        toast.success("Payment schedule saved successfully")
        if (validationWarnings.payDay || validationWarnings.periodStartDay) {
          toast.warning("Schedule saved with warnings", {
            description: [validationWarnings.payDay, validationWarnings.periodStartDay]
              .filter(Boolean)
              .join(". "),
          })
        }
      } else {
        toast.error("Failed to save payment schedule", {
          description: saveResult.error,
        })
      }
    } catch (error) {
      console.error("Error saving payment schedule:", error)
      toast.error("Failed to save payment schedule")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="pay_period_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pay Period Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a pay period type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The frequency of your payroll processing
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="pay_day_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pay Day Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={payPeriodType === "custom"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pay day type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="day_of_month">Day of Month</SelectItem>
                      <SelectItem value="day_of_week">Day of Week</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How to specify the pay day
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pay_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pay Day</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value.toString()}
                    disabled={payPeriodType === "custom"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pay day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {payDayType === "day_of_week" ? (
                        <>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                          <SelectItem value="7">Sunday</SelectItem>
                        </>
                      ) : (
                        Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {payDayType === "day_of_week"
                      ? "The day of the week when employees are paid"
                      : "The day of the month when employees are paid"}
                  </FormDescription>
                  <FormMessage />
                  {validationWarnings.payDay && (
                    <p className={`text-sm mt-2 ${validationWarnings.payDay.startsWith("Warning") ? "text-yellow-600" : "text-destructive"}`}>
                      {validationWarnings.payDay}
                    </p>
                  )}
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="period_start_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period Start Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={payPeriodType === "custom"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period start type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="day_of_month">Day of Month</SelectItem>
                      <SelectItem value="day_of_week">Day of Week</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How to specify the period start day
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="period_start_day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period Start Day</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value.toString()}
                    disabled={payPeriodType === "custom"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period start day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {periodStartType === "day_of_week" ? (
                        <>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                          <SelectItem value="7">Sunday</SelectItem>
                        </>
                      ) : (
                        Array.from({ length: 31 }, (_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            {i + 1}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {periodStartType === "day_of_week"
                      ? "The day of the week when the pay period starts"
                      : "The day of the month when the pay period starts"}
                  </FormDescription>
                  <FormMessage />
                  {validationWarnings.periodStartDay && (
                    <p className={`text-sm mt-2 ${validationWarnings.periodStartDay.startsWith("Warning") ? "text-yellow-600" : "text-destructive"}`}>
                      {validationWarnings.periodStartDay}
                    </p>
                  )}
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Schedule
          </Button>
        </form>
      </Form>

      {currentSchedule && (
        <div className="space-y-6">
          <NextPayDates schedule={currentSchedule} />
        </div>
      )}
    </div>
  )
} 