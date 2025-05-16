"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { SearchableCombobox } from "../searchable-combobox";
import type { Project, Client } from "@/lib/types";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button as ShadButton } from "@/components/ui/button";

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (project: Project | Omit<Project, "id">) => void;
  onCancel: () => void;
  clients: Client[];
}

export function ProjectForm({
  project,
  onSubmit,
  onCancel,
  clients,
}: ProjectFormProps) {
  const [name, setName] = useState(project?.name || "");
  const [client, setClient] = useState<Client | null>(
    clients.find((c) => c.id === project?.client_id) || null
  );
  const [startDate, setStartDate] = useState(
    project?.start_date || new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState(project?.status || "not_started");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!client) newErrors.client = "Client is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const projectData = project
        ? {
            ...project,
            name,
            client_id: client!.id,
            start_date: startDate,
            status,
          }
        : {
            name,
            client_id: client!.id,
            start_date: startDate,
            status,
          };

      await onSubmit(projectData);
    } catch (error) {
      console.error("Error submitting project form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bay Breeze Estates"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="client">Client</Label>
        <SearchableCombobox
          items={clients}
          selectedItem={client}
          onSelect={setClient}
          displayKey="name"
          placeholder="Select a client"
        />
        {errors.client && (
          <p className="text-sm text-destructive">{errors.client}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <ShadButton
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? (
                format(new Date(startDate), "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </ShadButton>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={new Date(startDate)}
              onSelect={(date) =>
                date && setStartDate(date.toISOString().split("T")[0])
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Project"}
        </Button>
      </div>
    </form>
  );
}
