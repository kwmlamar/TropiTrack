"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Clock, User, Building2, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

import { timesheetSchema, type TimesheetFormData } from "@/lib/validations";
import { createTimesheet, updateTimesheet } from "@/lib/data/timesheets";
import type { TimesheetWithDetails } from "@/lib/types";
import type { Project } from "@/lib/types/project"
import type { Worker } from "@/lib/types/worker";
import { cn } from "@/lib/utils";

interface TimesheetFormProps {
  userId: string;
  timesheet?: TimesheetWithDetails;
  workers: Worker[];
  projects: Project[];
  onSuccess?: (timesheet: TimesheetWithDetails) => void;
  onCancel?: () => void;
}

export function TimesheetForm({
  userId,
  timesheet,
  workers,
  projects,
  onSuccess,
  onCancel,
}: TimesheetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    timesheet ? new Date(timesheet.date) : new Date()
  );

  const isEditing = !!timesheet;

  const form = useForm<TimesheetFormData>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      date: timesheet?.date || format(new Date(), "yyyy-MM-dd"),
      worker_id: timesheet?.worker_id || "",
      project_id: timesheet?.project_id || "",
      task_description: timesheet?.task_description || "",
      clock_in: timesheet?.clock_in || "08:00",
      clock_out: timesheet?.clock_out || "17:00",
      break_duration: timesheet?.break_duration || 30,
      hourly_rate: timesheet?.hourly_rate || 20,
      supervisor_approval: timesheet?.supervisor_approval || false,
      notes: timesheet?.notes || "",
    },
  });

  // Update hourly rate when worker changes
  const selectedWorkerId = form.watch("worker_id");
  useEffect(() => {
    if (selectedWorkerId && !isEditing) {
      const worker = workers.find((w) => w.id === selectedWorkerId);
      if (worker) {
        form.setValue("hourly_rate", worker.hourly_rate);
      }
    }
  }, [selectedWorkerId, workers, form, isEditing]);

  const onSubmit = async (data: TimesheetFormData) => {
    setIsSubmitting(true);
    try {
      let result;
      if (isEditing) {
        result = await updateTimesheet({ id: timesheet.id, ...data });
      } else {
        result = await createTimesheet(userId, data);
      }

      if (result.success && result.data) {
        onSuccess?.(result.data);
      } else {
        throw new Error(result.error || "Failed to save timesheet");
      }
    } catch (error) {
      console.error("Error saving timesheet:", error);
      // You could add toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {isEditing ? "Edit Timesheet" : "New Timesheet"}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? "Update timesheet information"
                : "Create a new timesheet entry"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date and Worker Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
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
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            field.onChange(
                              date ? date.toISOString().split("T")[0] : null
                            );
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="worker_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Worker</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a worker" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{worker.name}</span>
                              <span className="text-muted-foreground">
                                ({worker.role})
                              </span>
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

            {/* Project and Task */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <span>{project.name}</span>
                              {project.location && (
                                <span className="text-muted-foreground">
                                  ({project.location})
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

              <FormField
                control={form.control}
                name="task_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the work performed..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Time and Rate Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="clock_in"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clock In</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clock_out"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clock Out</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="break_duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Break (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="480"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
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
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="supervisor_approval"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Supervisor Approval</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Mark as approved by supervisor
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes or comments..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            {isEditing ? "Update Timesheet" : "Create Timesheet"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
