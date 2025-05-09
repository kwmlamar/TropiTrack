"use client"

import type React from "react";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Client, Project } from "@/lib/types";

interface ClientFormProps {
    client?: Client | null
    onSubmit: (client: Client | Omit<Client, "id">) => void
    onCancel: () => void
    projects?: Project[]
}

export function ClientForm({client, onSubmit, onCancel}: ClientFormProps) {
    const [name, setName] = useState(client?.name || "");
    const [email, setEmail] = useState(client?.email || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({})

    const validate = () => {
        const newErrors: Record<string, string> = {}

        if (!name.trim()) {
            newErrors.name = "Name is required"
        }

        if (!email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email is invalid"
          }
        
          setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) {
            return
        }

        setIsSubmitting(true)

        try {
            const clientData = client? {
                ...client,
                name,
                email,
            }
            : {
                name,
                email,
            }

        await onSubmit(clientData)
        } catch (error) {
            console.error("Error submitting client form:", error)
        } finally {
            setIsSubmitting(false)
        }
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(c) => setName(c.target.value)} placeholder="John Doe" required />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                value={email}
                onChange={(c) => setEmail(c.target.value)}
                placeholder="john@example.com"
                required
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : client ? "Update Client" : "Add Client"}
                </Button>
            </div>

        </form>
    )
}