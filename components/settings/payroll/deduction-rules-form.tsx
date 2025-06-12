"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Loader2, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { DeductionRule } from "@/lib/types/payroll-settings"
import {
  getDeductionRules,
  createDeductionRule,
  updateDeductionRule,
  deleteDeductionRule,
} from "@/lib/data/payroll-settings"
import { getUserProfileWithCompany } from "@/lib/data/userProfiles"

const deductionRuleSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  description: z.string().optional(),
  type: z.enum(["percentage", "fixed"]),
  value: z.coerce
    .number()
    .min(0, "Value cannot be negative")
    .max(100, "Value cannot exceed 100 for percentage or $100,000 for fixed amount"),
  is_active: z.boolean(),
  applies_to_overtime: z.boolean(),
})

type DeductionRuleFormData = z.infer<typeof deductionRuleSchema>

export function DeductionRulesForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [deductionRules, setDeductionRules] = useState<DeductionRule[]>([])
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)

  const form = useForm<DeductionRuleFormData>({
    resolver: zodResolver(deductionRuleSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "percentage",
      value: 0,
      is_active: true,
      applies_to_overtime: false,
    },
  })

  const deductionType = form.watch("type")

  useEffect(() => {
    loadUserProfile()
    loadDeductionRules()
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

  const loadDeductionRules = async () => {
    try {
      const result = await getDeductionRules()
      if (result.success && result.data) {
        setDeductionRules(result.data)
      }
    } catch (error) {
      console.error("Error loading deduction rules:", error)
      toast.error("Failed to load deduction rules")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: DeductionRuleFormData) => {
    if (!companyId) {
      toast.error("Company ID not found")
      return
    }

    setSaving(true)
    try {
      let saveResult

      if (editingRuleId) {
        // Update existing rule
        saveResult = await updateDeductionRule({
          id: editingRuleId,
          ...data,
        })
      } else {
        // Create new rule
        saveResult = await createDeductionRule({
          ...data,
          company_id: companyId,
        })
      }

      if (saveResult.success) {
        toast.success(
          `Deduction rule ${editingRuleId ? "updated" : "created"} successfully`
        )
        await loadDeductionRules()
        resetForm()
      } else {
        toast.error(`Failed to ${editingRuleId ? "update" : "create"} deduction rule`, {
          description: saveResult.error,
        })
      }
    } catch (error) {
      console.error("Error saving deduction rule:", error)
      toast.error(`Failed to ${editingRuleId ? "update" : "create"} deduction rule`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteDeductionRule(id)
      if (result.success) {
        toast.success("Deduction rule deleted successfully")
        await loadDeductionRules()
        if (editingRuleId === id) {
          resetForm()
        }
      } else {
        toast.error("Failed to delete deduction rule", {
          description: result.error,
        })
      }
    } catch (error) {
      console.error("Error deleting deduction rule:", error)
      toast.error("Failed to delete deduction rule")
    }
  }

  const handleEdit = (rule: DeductionRule) => {
    setEditingRuleId(rule.id)
    form.reset({
      name: rule.name,
      description: rule.description || "",
      type: rule.type as "percentage" | "fixed",
      value: rule.value,
      is_active: rule.is_active,
      applies_to_overtime: rule.applies_to_overtime,
    })
  }

  const resetForm = () => {
    setEditingRuleId(null)
    form.reset({
      name: "",
      description: "",
      type: "percentage",
      value: 0,
      is_active: true,
      applies_to_overtime: false,
    })
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
      <div className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deduction Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Health Insurance" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for the deduction
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional description of the deduction"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional details about the deduction (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deduction Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select deduction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How the deduction is calculated
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step={deductionType === "percentage" ? "0.01" : "1"}
                          placeholder={deductionType === "percentage" ? "0.00" : "0"}
                          {...field}
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          {deductionType === "percentage" ? "%" : "$"}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      {deductionType === "percentage"
                        ? "Percentage of gross pay"
                        : "Fixed amount in dollars"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Enable or disable this deduction
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
                name="applies_to_overtime"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Apply to Overtime</FormLabel>
                      <FormDescription>
                        Include overtime pay in calculation
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
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRuleId ? "Update" : "Add"} Deduction
              </Button>
              {editingRuleId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Deduction Rules</CardTitle>
            <CardDescription>
              Manage your payroll deduction rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deductionRules.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No deduction rules configured yet
              </div>
            ) : (
              deductionRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-start justify-between gap-4 rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{rule.name}</p>
                      {!rule.is_active && (
                        <span className="text-xs text-muted-foreground">(Inactive)</span>
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground">
                        {rule.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {rule.type === "percentage"
                          ? `${rule.value}%`
                          : `$${rule.value.toFixed(2)}`}
                      </span>
                      {rule.applies_to_overtime && (
                        <span className="text-xs text-muted-foreground">
                          (Includes overtime)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(rule)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 