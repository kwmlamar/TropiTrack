"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { User, Mail, Phone, MapPin, Building2, Loader2, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { toast } from "sonner"

import { insertClient, updateClient } from "@/lib/data/clients"
import type { Client } from "@/lib/types/client"

// Client schema for the dialog
const clientSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters"),
  company: z.string().optional(),
  contact_person: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  client?: Client // Optional client for editing mode
  onSuccess?: (client: Client) => void
}

export function ClientDialog({
  open,
  onOpenChange,
  userId,
  client,
  onSuccess,
}: ClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!client

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      company: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  })

  // Reset form when client changes (for editing mode)
  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name || "",
        company: client.company || "",
        contact_person: client.contact_person || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        notes: client.notes || "",
      })
    } else {
      form.reset({
        name: "",
        company: "",
        contact_person: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      })
    }
  }, [client, form])

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true)
    try {
      let result

      if (isEditing && client) {
        // Update existing client
        result = await updateClient(userId, client.id, {
          ...data,
          // Convert empty strings to undefined for optional fields
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
          contact_person: data.contact_person || undefined,
          company: data.company || undefined,
          notes: data.notes || undefined,
        })
      } else {
        // Create new client
        result = await insertClient(userId, {
          ...data,
          is_active: true,
          // Convert empty strings to undefined for optional fields
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
          contact_person: data.contact_person || undefined,
          company: data.company || undefined,
          notes: data.notes || undefined,
        })
      }

      if (result.success && result.data) {
        toast.success(isEditing ? "Client updated successfully" : "Client added successfully")
        onSuccess?.(result.data)
        onOpenChange(false)
        if (!isEditing) {
          form.reset()
        }
      } else {
        toast.error(result.error || (isEditing ? "Failed to update client" : "Failed to add client"))
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
      console.error("Error saving client:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? <Edit className="h-5 w-5" /> : <User className="h-5 w-5" />}
            {isEditing ? "Edit Client" : "Add New Client"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update client information and contact details."
              : "Add a new client to your portfolio with their contact information."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input placeholder="ABC Construction Corp" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="contact_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input placeholder="Primary contact if different from client name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input placeholder="john@example.com" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                        <Input placeholder="+1 (555) 123-4567" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input placeholder="123 Main St, City, State 12345" className="pl-10" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the client, preferences, or special requirements..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isEditing ? "Update Client" : "Add Client"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 