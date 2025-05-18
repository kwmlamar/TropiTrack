"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { SearchableCombobox } from "../searchable-combobox";
import type { Project, Client, Worker } from "@/lib/types";
import { MultiSelect } from "../multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "../date-picker";
import { format, parse } from "date-fns";

interface ProjectFormProps {
  project?: Project | null;
  onSubmit: (project: (Project | Omit<Project, "id">) & { assigned_worker_ids: (string | number)[]}) => void;
  onCancel: () => void;
  clients: Client[];
  workers: Worker[];
}

export function ProjectForm({
  project,
  onSubmit,
  onCancel,
  clients,
  workers,
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
  const [assignedWorkerIds, setAssignedWorkerIds] = useState<
    (string | number)[]
  >([]);

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
            assigned_worker_ids: assignedWorkerIds,
          }
        : {
            name,
            client_id: client!.id,
            start_date: startDate,
            status,
            assigned_worker_ids: assignedWorkerIds,
          };

      await onSubmit(projectData);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error submitting project form:", error.message);
      } else {
        console.error(
          "Error submitting project form:",
          JSON.stringify(error, null, 2)
        );
      }
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
        <Label htmlFor="projectAssingments">Assign Workers</Label>
        <MultiSelect
          options={workers.map((w) => ({ label: w.name, value: w.id }))}
          value={assignedWorkerIds}
          onChange={setAssignedWorkerIds}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={status}
          onValueChange={(val) => setStatus(val as Project["status"])}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Start Date</Label>
        <DatePicker
          date={parse(startDate, "yyyy-MM-dd", new Date())}
          setDate={(date) => {
            if (date) {
              setStartDate(format(date, "yyyy-MM-dd"));
            }
          }}
        />
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
