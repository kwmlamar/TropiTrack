"use client"

import { useEffect, useState, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"
import { getPayrollSettings, updatePayrollSettings, createPayrollSettings } from "@/lib/data/payroll-settings"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"

const payrollSettingsSchema = z.object({
  nib_enabled: z.boolean(),
  nib_rate: z.coerce
    .number()
    .min(0, "NIB rate cannot be negative")
    .max(15, "NIB rate cannot exceed 15%"),
  overtime_rate: z.coerce
    .number()
    .min(1, "Overtime rate must be at least 1x")
    .max(3, "Overtime rate cannot exceed 3x"),
})

type PayrollSettingsFormData = z.infer<typeof payrollSettingsSchema>

export function PayrollSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)

  const form = useForm<PayrollSettingsFormData>({
    resolver: zodResolver(payrollSettingsSchema),
    defaultValues: {
      nib_enabled: true,
      nib_rate: 4.65,
      overtime_rate: 1.5,
    },
  })

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await getUserProfileWithCompany()
      if (profile && profile.company_id) {
        setCompanyId(profile.company_id)
      } else {
        toast.error("Company profile not found")
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
      toast.error("Failed to load user profile")
    }
  }, [])

  const loadPayrollSettings = useCallback(async () => {
    try {
      const result = await getPayrollSettings()
      
      if (result.success && result.data) {
        // Load existing settings
        setSettingsId(result.data.id)
        form.reset({
          nib_enabled: result.data.nib_enabled ?? true,
          nib_rate: result.data.nib_rate ?? 4.65,
          overtime_rate: result.data.overtime_rate ?? 1.5,
        })
      } else {
        // Use default values if no settings found
        form.reset({
          nib_enabled: true,
          nib_rate: 4.65,
          overtime_rate: 1.5,
        })
      }
    } catch (error) {
      console.error("Error loading payroll settings:", error)
      toast.error("Failed to load payroll settings")
    } finally {
      setLoading(false)
    }
  }, [form])

  useEffect(() => {
    loadUserProfile()
    loadPayrollSettings()
  }, [loadUserProfile, loadPayrollSettings])

  const onSubmit = async (data: PayrollSettingsFormData) => {
    if (!companyId) {
      toast.error("Company ID not found. Please try refreshing the page.")
      return
    }

    setSaving(true)
    try {
      let result

      if (settingsId) {
        // Update existing settings
        result = await updatePayrollSettings({
          id: settingsId,
          nib_enabled: data.nib_enabled,
          nib_rate: data.nib_rate,
          overtime_rate: data.overtime_rate,
        })
      } else {
        // Create new settings
        result = await createPayrollSettings({
          company_id: companyId,
          nib_enabled: data.nib_enabled,
          nib_rate: data.nib_rate,
          overtime_rate: data.overtime_rate,
          column_settings: {
            worker_name: true,
            hours_worked: true,
            overtime_hours: true,
            regular_pay: true,
            overtime_pay: true,
            total_pay: true,
            deductions: true,
            net_pay: true
          }
        })

        if (result.success && result.data) {
          setSettingsId(result.data.id)
        }
      }

      if (result.success) {
        toast.success("Payroll settings saved successfully", {
          description: "Changes will apply to future payroll generations"
        })
      } else {
        toast.error("Failed to save payroll settings", {
          description: result.error || "An unknown error occurred"
        })
      }
    } catch (error) {
      console.error("Error saving payroll settings:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="nib_enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Enable NIB Deductions
                </FormLabel>
                <FormDescription>
                  Toggle NIB (National Insurance Board) deductions for payroll calculations. When disabled, NIB rate will be set to 0%.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nib_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIB Rate (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="4.65"
                  disabled={!form.watch("nib_enabled")}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The employee NIB contribution rate as a percentage (e.g., 4.65 for 4.65%). This field is disabled when NIB deductions are turned off.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="overtime_rate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overtime Rate Multiplier</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="1.5"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The multiplier applied to regular hourly rate for overtime hours (e.g., 1.5 for time-and-a-half)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </form>
    </Form>
  )
} 