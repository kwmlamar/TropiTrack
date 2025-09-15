"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { User, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

import { createWorker } from "@/lib/data/workers"
import { setWorkerPin } from "@/lib/data/worker-pins"
import type { Worker } from "@/lib/types/worker"

// Simplified schema for quick worker creation
const quickWorkerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  position: z.string().min(1, "Position is required"),
  hourly_rate: z.number().min(0, "Hourly rate must be positive"),
  pin: z.string().optional(),
  setPin: z.boolean().optional(),
})

type QuickWorkerFormData = z.infer<typeof quickWorkerSchema>

interface AddWorkerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess?: (worker: Worker) => void
}

const workerPositions = [
  "Foreman",
  "Carpenter",
  "Electrician",
  "Plumber",
  "Mason",
  "Laborer",
  "Heavy Equipment Operator",
  "Roofer",
  "Painter",
  "Welder",
  "HVAC Technician",
  "Concrete Worker",
  "Other",
]

export function AddWorkerDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: AddWorkerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<QuickWorkerFormData>({
    resolver: zodResolver(quickWorkerSchema),
    defaultValues: {
      name: "",
      position: "",
      hourly_rate: 20,
    },
  })

  const onSubmit = async (data: QuickWorkerFormData) => {
    setIsSubmitting(true)
    try {
      const result = await createWorker(userId, {
        name: data.name,
        position: data.position,
        hourly_rate: data.hourly_rate,
        hire_date: new Date().toISOString().split("T")[0], // Today's date
        is_active: true,
        email: undefined, // Use undefined instead of empty string
        phone: undefined, // Use undefined instead of empty string
        address: undefined, // Use undefined instead of empty string
        emergency_contact: undefined, // Use undefined instead of empty string
        emergency_phone: undefined, // Use undefined instead of empty string
        nib_number: undefined, // Use undefined instead of empty string
      })

      if (result.success && result.data) {
        // Set PIN if provided
        if (data.setPin && data.pin) {
          const pinResult = await setWorkerPin(userId, result.data.id, data.pin)
          if (pinResult.success) {
            toast.success("Worker added successfully with PIN set")
          } else {
            toast.success("Worker added successfully, but PIN setup failed")
            console.error("PIN setup error:", pinResult.error)
          }
        } else {
          toast.success("Worker added successfully")
        }
        
        onSuccess?.(result.data)
        onOpenChange(false)
        form.reset()
      } else {
        toast.error(result.error || "Failed to add worker")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Error creating worker:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Worker
          </DialogTitle>
          <DialogDescription>
            Add a new worker to your team with basic information.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workerPositions.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hourly_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="20.00"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number(e.target.value)
                        field.onChange(value)
                      }}
                      value={field.value || 0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="setPin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value || false}
                      onChange={field.onChange}
                      className="h-4 w-4"
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">
                    Set up PIN for clock in/out
                  </FormLabel>
                </FormItem>
              )}
            />

            {form.watch("setPin") && (
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN (4-8 digits)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter PIN"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 8)
                          field.onChange(value)
                        }}
                        maxLength={8}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Worker will use this PIN to verify their identity when clocking in/out
                    </p>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Worker
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 