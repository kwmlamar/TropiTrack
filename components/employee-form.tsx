"use client"

import type React from "react";

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { Employee } from "@/lib/types"

interface Project {
    id: number
    name: string
}

interface EmployeeFormProps {
    employee?: Employee | null
    onSubmit: (employee: Employee | Omit<Employee, "id">) => void
    onCancel: () => void
    projects?: Project[]
}

export function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
    const [name, setName] = useState(employee?.name || "")
    const [hourlyRate, setHourlyRate] = useState(employee?.hourly_rate?.toString() || "")
    const [active, setActive] = useState(employee?.active ?? true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] =  useState<Record<string, string>>({})

    const validate = () => {
        const newErrors: Record<string, string> = {}

        if (!name.trim()) {
            newErrors.name = "Name is required"
        }

        if (!hourlyRate.trim()) {
            newErrors.hourlyRate = "Hourly rate is required"
        } else if (isNaN(Number.parseFloat(hourlyRate)) || Number.parseFloat(hourlyRate) <= 0) {
            newErrors.hourlyRate = "Hourly rate must be a positive number"
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
            const employeeData = employee
            ? {
                ...employee,
                name,
                hourl_rate: Number.parseFloat(hourlyRate),
                active,
            }
            : {
                name,
                hourly_rate: Number.parseFloat(hourlyRate),
                active,
            }

            await onSubmit(employeeData)
        } catch (error) {
            console.log("Error submitting employee form:", error)
        } finally {
            setIsSubmitting(false)
        }
    }
    return (
       <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
            <Label htmlFor="email">Hourly Rate</Label>
            <Input
            id="hourlRate"
            type="number"
            min="0"
            step="1"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="25.00"
            required
            />
            {errors.hourlRate && <p className="text-sm text-destructive">{errors.hourlyRate}</p>}
        </div>

        <div className="flex items-center space-x-2">
            <Switch id="active" checked={active} onCheckedChange={setActive} />
            <Label htmlFor="active">Active</Label>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : employee ? "Update Employee" : "Add Employee"}
            </Button>
        </div>
       </form>
    )
}