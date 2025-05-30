"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarIcon,
  Building2,
  DollarSign,
  MapPin,
  User,
  Loader2,
} from "lucide-react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { projectSchema, type ProjectFormData } from "@/lib/validations";
import { createProject, updateProject } from "@/lib/data/projects";
import type { Project, UpdateProject, NewProject } from "@/lib/types/project";
import type { Client } from "@/lib/types/client";
import type { Worker } from "@/lib/types/worker";
import { cn } from "@/lib/utils";
import {
  assignWorkersToProject,
  unassignWorkerFromProject,
  fetchProjectAssignments,
} from "@/lib/data/project-assignments";

interface ProjectFormProps {
  userId: string;
  project?: Project & { assigned_worker_ids?: (string | number)[] };
  clients: Client[];
  workers: Worker[];
  onSuccess?: (project: Project) => void;
  onCancel?: () => void;
}

const projectStatuses = [
  {
    value: "not_started",
    label: "Not Started",
    color: "bg-gray-100 text-gray-800",
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "bg-blue-100 text-blue-800",
  },
  { value: "paused", label: "Paused", color: "bg-yellow-100 text-yellow-800" },
  {
    value: "completed",
    label: "Completed",
    color: "bg-green-100 text-green-800",
  },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

export function ProjectForm({
  userId,
  project,
  clients,
  workers,
  onSuccess,
  onCancel,
}: ProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(
    project?.start_date ? new Date(project.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    project?.end_date ? new Date(project.end_date) : undefined
  );
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>(
    project?.assigned_worker_ids?.map(String) || []
  );

  const isEditing = !!project;

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      client_id: project?.client_id ?? "",
      location: project?.location ?? "",
      start_date: project?.start_date ?? null, // null is valid for dates
      end_date: project?.end_date ?? null,
      budget: project?.budget ?? undefined, // ok if you know it's optional
      status: project?.status ?? "not_started",
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      const projectData = {
        ...data,
        assigned_worker_ids: selectedWorkers,
      };

      let result;
      if (isEditing) {
        const updateData: UpdateProject = {
          name: data.name,
          description: data.description,
          client_id: data.client_id,
          location: data.location,
          start_date: data.start_date,
          end_date: data.end_date || null,
          budget: data.budget,
          status: data.status,
        };
        result = await updateProject(userId, project.id, updateData);
        if (result.data) {
          // 1. Fetch current assigned workers (active only)
          const existingAssignments = await fetchProjectAssignments(
            userId,
            project.id
          );

          const existingWorkerIds =
            existingAssignments?.map((a) => a.worker_id) || [];

          // 2. Find removed and newly added workers
          const removedWorkerIds = existingWorkerIds.filter(
            (id) => !selectedWorkers.includes(id)
          );
          const addedWorkerIds = selectedWorkers.filter(
            (id) => !existingWorkerIds.includes(id)
          );

          // 3. Unassign removed workers
          for (const workerId of removedWorkerIds) {
            await unassignWorkerFromProject(userId, project.id, workerId);
          }

          // 4. Assign new workers
          if (addedWorkerIds.length > 0) {
            await assignWorkersToProject(userId, project.id, addedWorkerIds);
          }

          onSuccess?.(result.data);
        }
      } else {
        const newProject: NewProject = {
          name: data.name,
          description: data.description,
          client_id: data.client_id,
          location: data.location,
          start_date: data.start_date,
          end_date: data.end_date || null,
          budget: data.budget,
          status: data.status || "not_started",
          priority: data.priority || "medium",
          is_active: true,
        };

        console.log("🆕 Creating project with:", newProject);

        result = await createProject(userId, newProject);
        console.log("✅ Create result:", result);

        if (result.success && result.data) {
          await assignWorkersToProject(userId, result.data.id, selectedWorkers);
          onSuccess?.(result.data);
        } else {
          throw new Error(result.error || "Project creation failed");
        }
      }

      if (!result) {
        throw new Error("Failed to save project");
      }
    } catch (error) {
      console.error("Error saving project:", error);
      // You could add toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleWorker = (workerId: string) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId]
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {isEditing ? "Edit Project" : "New Project"}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? "Update project information"
                : "Create a new construction project"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Paradise Resort Phase 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{client.name}</span>
                              {client.company && (
                                <span className="text-muted-foreground">
                                  ({client.company})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the project scope and objectives..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Nassau, Bahamas"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Timeline and Budget */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value && typeof field.value === "string" ? (
                              format(parseISO(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onSelect={(date) => {
                            setStartDate(date ?? undefined);
                            field.onChange(
                              date ? date.toISOString().split("T")[0] : null
                            );
                          }}
                          disabled={(date) => date < new Date("1900-01-01")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(parseISO(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date);
                            field.onChange(
                              date ? date.toISOString().split("T")[0] : null
                            );
                          }}
                          disabled={(date) => {
                            if (startDate) {
                              return date < startDate;
                            }
                            return date < new Date("1900-01-01");
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="100000.00"
                          className="pl-10"
                          {...field}
                          value={field.value ?? ""} // ✅ control it
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projectStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={status.color}>
                              {status.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Worker Assignment */}
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Assign Workers (Optional)
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Select workers to assign to this project
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {workers.map((worker) => (
                  <div
                    key={worker.id}
                    className={cn(
                      "flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedWorkers.includes(worker.id)
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/50 border-border hover:bg-muted"
                    )}
                    onClick={() => toggleWorker(worker.id)}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{worker.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {worker.role}
                      </p>
                    </div>
                    {selectedWorkers.includes(worker.id) && (
                      <Badge variant="secondary" className="text-xs">
                        Assigned
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {selectedWorkers.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedWorkers.length} worker
                  {selectedWorkers.length !== 1 ? "s" : ""} selected
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Update Project" : "Create Project"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
