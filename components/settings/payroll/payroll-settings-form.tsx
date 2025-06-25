"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { getPayrollSettings, updatePayrollSettings, createPayrollSettings } from "@/lib/data/payroll-settings"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"

const payrollSettingsSchema = z.object({
  overtime_rate: z.coerce
    .number()
    .min(1, "Overtime rate must be at least 1x")
    .max(3, "Overtime rate cannot exceed 3x"),
})

type PayrollSettingsFormData = z.infer<typeof payrollSettingsSchema>

export function PayrollSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)

  const form = useForm<PayrollSettingsFormData>({
    resolver: zodResolver(payrollSettingsSchema),
    defaultValues: {
      overtime_rate: 1.5,
    },
  })

  useEffect(() => {
    loadUserProfile()
    loadPayrollSettings()
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

  const loadPayrollSettings = async () => {
    try {
      const result = await getPayrollSettings()
      if (result.success && result.data) {
        form.reset({
          overtime_rate: result.data.overtime_rate,
        })
      }
    } catch (error) {
      console.error("Error loading payroll settings:", error)
      toast.error("Failed to load payroll settings")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: PayrollSettingsFormData) => {
    if (!companyId) {
      toast.error("Company ID not found")
      return
    }

    setSaving(true)
    try {
      const settingsData = {
        company_id: companyId,
        overtime_rate: data.overtime_rate,
        nib_rate: 4.65, // Hardcoded NIB rate
        column_settings: {}, // Default empty column settings
      }

      // Check if settings exist
      const existingSettings = await getPayrollSettings()
      let result

      if (existingSettings.success && existingSettings.data) {
        // Update existing settings
        result = await updatePayrollSettings({
          id: existingSettings.data.id,
          ...settingsData,
        })
      } else {
        // Create new settings
        result = await createPayrollSettings(settingsData)
      }

      if (result.success) {
        toast.success("Payroll settings saved successfully")
      } else {
        toast.error(result.error || "Failed to save payroll settings")
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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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