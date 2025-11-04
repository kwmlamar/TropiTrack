"use client";

import { useTheme } from "next-themes";
import {
  Clock,
  Trash2,
  User,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Control, FieldArrayWithId } from "react-hook-form";
import type { Worker } from "@/lib/types/worker";

interface BulkTimesheetFormData {
  entries: Array<{
    worker_id: string;
    clock_in: string;
    clock_out: string;
    break_duration: number;
    hourly_rate: number;
    task_description?: string;
    notes?: string;
  }>;
}

interface WorkerRowsTableProps {
  control: Control<BulkTimesheetFormData>;
  fields: FieldArrayWithId<BulkTimesheetFormData, "entries", "id">[];
  workers: Worker[];
  onWorkerChange: (index: number, workerId: string) => void;
  onCopyToAll: (fieldName: "clock_in" | "clock_out" | "break_duration" | "task_description", sourceIndex: number) => void;
  onCopyFromPrevious: (index: number) => void;
  onRemove: (index: number) => void;
}

/**
 * Table displaying worker timesheet entry rows
 * Each row contains worker selection, times, rates, and descriptions
 */
export function WorkerRowsTable({
  control,
  fields,
  workers,
  onWorkerChange,
  onCopyToAll,
  onCopyFromPrevious,
  onRemove,
}: WorkerRowsTableProps) {
  const { theme } = useTheme();

  return (
    <div className="space-y-4 overflow-hidden">
      <div
        className="border-t border-b flex-1 flex flex-col"
        style={{
          backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
          borderColor: theme === 'dark' ? '#262626' : 'rgb(226 232 240 / 0.5)',
        }}
      >
        <div className="px-0 flex-1 flex flex-col">
          <div
            className="overflow-x-auto flex-1 overflow-y-auto"
            style={{
              maxHeight: 'calc(100vh - 185px)' // Account for header, selection section, and summary
            }}
          >
            <table className="w-full border-collapse border-spacing-0">
              <thead
                className="sticky top-0 z-50 shadow-sm"
                style={{
                  backgroundColor: theme === 'dark' ? '#171717' : '#ffffff',
                  borderBottom: theme === 'dark' ? '2px solid #262626' : '2px solid rgb(226 232 240 / 0.5)'
                }}
              >
                <tr style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}>
                  <th
                    className="text-left p-4 pl-8 pb-4 font-medium text-sm text-gray-500"
                    style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                  >
                    Worker
                  </th>
                  <th
                    className="text-center p-4 pb-4 font-medium text-sm text-gray-500"
                    style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                  >
                    Clock In
                  </th>
                  <th
                    className="text-center p-4 pb-4 font-medium text-sm text-gray-500"
                    style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                  >
                    Clock Out
                  </th>
                  <th
                    className="text-center p-4 pb-4 font-medium text-sm text-gray-500"
                    style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                  >
                    Break (min)
                  </th>
                  <th
                    className="text-center p-4 pb-4 font-medium text-sm text-gray-500"
                    style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                  >
                    Hourly Rate
                  </th>
                  <th
                    className="text-left p-4 pb-4 font-medium text-sm text-gray-500"
                    style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                  >
                    Task Description
                  </th>
                  <th
                    className="text-left p-4 pb-4 font-medium text-sm text-gray-500"
                    style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                  >
                    Notes
                  </th>
                  <th
                    className="w-12"
                    style={{ backgroundColor: theme === 'dark' ? '#171717' : '#ffffff' }}
                  ></th>
                </tr>
              </thead>
              <tbody>
                {fields.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-0">
                      <div className="flex flex-col items-center justify-center py-16 px-6">
                        <div
                          className="flex items-center justify-center w-16 h-16 rounded-full mb-4"
                          style={{ backgroundColor: theme === 'dark' ? '#262626' : 'rgb(243 244 246 / 0.5)' }}
                        >
                          <User
                            className="h-8 w-8"
                            style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                          />
                        </div>
                        <h3
                          className="text-lg font-semibold mb-2"
                          style={{ color: theme === 'dark' ? '#9ca3af' : '#111827' }}
                        >
                          No workers selected
                        </h3>
                        <p
                          className="text-sm text-center max-w-sm"
                          style={{ color: theme === 'dark' ? '#6b7280' : '#6b7280' }}
                        >
                          Select workers from the dropdown above to add them to the timesheet.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  fields.map((field, index) => (
                    <tr
                      key={field.id}
                      className="border-b last:border-b-0 transition-all duration-200 group"
                      style={{
                        borderColor: theme === 'dark' ? '#262626' : 'rgb(229 231 235 / 0.2)',
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(243 244 246 / 0.4)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <td className="p-4 pl-8">
                        <FormField
                          control={control}
                          name={`entries.${index}.worker_id`}
                          render={({ field: workerField }) => (
                            <FormItem>
                              <Select
                                onValueChange={(value) => {
                                  workerField.onChange(value);
                                  onWorkerChange(index, value);
                                }}
                                value={workerField.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select worker" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {workers.map((worker) => (
                                    <SelectItem key={worker.id} value={worker.id}>
                                      <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <span>{worker.name}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <FormField
                          control={control}
                          name={`entries.${index}.clock_in`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                  className="w-full h-10 text-center border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                  style={{
                                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                                    backgroundColor: 'transparent'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(249 250 251)'
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent'
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <FormField
                          control={control}
                          name={`entries.${index}.clock_out`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                  className="w-full h-10 text-center border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                  style={{
                                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                                    backgroundColor: 'transparent'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(249 250 251)'
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent'
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <FormField
                          control={control}
                          name={`entries.${index}.break_duration`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max="480"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className="w-full h-10 text-center border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                  style={{
                                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                                    backgroundColor: 'transparent'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(249 250 251)'
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent'
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <FormField
                          control={control}
                          name={`entries.${index}.hourly_rate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value))
                                  }
                                  className="w-full h-10 text-center border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                  style={{
                                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                                    backgroundColor: 'transparent'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(249 250 251)'
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent'
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="p-4">
                        <FormField
                          control={control}
                          name={`entries.${index}.task_description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe work..."
                                  className="resize-none w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                  rows={2}
                                  {...field}
                                  style={{
                                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                                    backgroundColor: 'transparent'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(249 250 251)'
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent'
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="p-4">
                        <FormField
                          control={control}
                          name={`entries.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  placeholder="Notes..."
                                  className="resize-none w-full border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/20 rounded"
                                  rows={2}
                                  {...field}
                                  style={{
                                    color: theme === 'dark' ? '#e5e7eb' : '#111827',
                                    backgroundColor: 'transparent'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = theme === 'dark' ? '#262626' : 'rgb(249 250 251)'
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent'
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    onCopyToAll("clock_in", index);
                                    onCopyToAll("clock_out", index);
                                    onCopyToAll("break_duration", index);
                                  }}
                                  className="h-8 w-8"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy time settings to all entries</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {index > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onCopyFromPrevious(index)}
                                    className="h-8 w-8"
                                  >
                                    <Clock className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy time from previous entry</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemove(index)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

