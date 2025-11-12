"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Clock,
  Trash2,
  User,
  Copy,
  DollarSign,
  Coffee,
  FileText,
  StickyNote,
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
import { WorkerRowsMobile } from "./WorkerRowsMobile";
import { toast } from "sonner";

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
 * Includes desktop table view and mobile card view
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
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const toggleRowSelection = (index: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const toggleAllRows = () => {
    if (selectedRows.size === fields.length && fields.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(fields.map((_, i) => i)));
    }
  };

  return (
    <>
      {/* Mobile Card View */}
      <WorkerRowsMobile
        control={control}
        fields={fields}
        workers={workers}
        onWorkerChange={onWorkerChange}
        onCopyToAll={onCopyToAll}
        onCopyFromPrevious={onCopyFromPrevious}
        onRemove={onRemove}
      />

      {/* Desktop Table View */}
      <div 
        className="hidden lg:block h-full overflow-y-auto overflow-x-auto"
        style={{
          backgroundColor: theme === 'dark' ? '#0A0F14' : '#F9FAFB'
        }}
      >
        <div className="px-4 lg:px-6 pt-4 pb-0">
          <table className="w-full border-separate" style={{ borderSpacing: '0 10px' }}>
            <thead
              className="sticky z-50"
              style={{
                top: '-1rem',
                backgroundColor: theme === 'dark' ? '#0A0F14' : '#F9FAFB',
                boxShadow: theme === 'dark' 
                  ? '0 2px 8px 0 rgba(0, 0, 0, 0.3)' 
                  : '0 2px 8px 0 rgba(0, 0, 0, 0.08)'
              }}
            >
            <tr>
              <th className="w-12 px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedRows.size === fields.length && fields.length > 0}
                  onChange={toggleAllRows}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                  aria-label="Select all rows"
                />
              </th>
              <th className="text-left px-6 py-4 font-bold text-xs uppercase tracking-wider" style={{
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                  }}>
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Worker
                    </div>
                  </th>
                  <th className="text-center px-4 py-4 font-bold text-xs uppercase tracking-wider" style={{
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                  }}>
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      Clock In
                    </div>
                  </th>
                  <th className="text-center px-4 py-4 font-bold text-xs uppercase tracking-wider" style={{
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                  }}>
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      Clock Out
                    </div>
                  </th>
                  <th className="text-center px-4 py-4 font-bold text-xs uppercase tracking-wider" style={{
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                  }}>
                    <div className="flex items-center justify-center gap-2">
                      <Coffee className="h-3.5 w-3.5 text-primary" />
                      Break
                    </div>
                  </th>
                  <th className="text-center px-4 py-4 font-bold text-xs uppercase tracking-wider" style={{
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                  }}>
                    <div className="flex items-center justify-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-primary" />
                      Rate
                    </div>
                  </th>
                  <th className="text-left px-4 py-4 font-bold text-xs uppercase tracking-wider hidden xl:table-cell" style={{
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                  }}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Task
                    </div>
                  </th>
                  <th className="text-left px-4 py-4 font-bold text-xs uppercase tracking-wider hidden 2xl:table-cell" style={{
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                  }}>
                    <div className="flex items-center gap-2">
                      <StickyNote className="h-3.5 w-3.5 text-primary" />
                      Notes
                    </div>
                  </th>
                  <th className="w-32 px-4 py-4 font-bold text-xs uppercase tracking-wider" style={{
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-0">
                      <div className="flex flex-col items-center justify-center py-12 px-6">
                        <div
                          className="flex items-center justify-center w-16 h-16 rounded-full mb-4"
                          style={{ 
                            backgroundColor: theme === 'dark' ? '#1A2332' : '#F3F4F6'
                          }}
                        >
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2" style={{
                          color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
                        }}>
                          No workers selected
                        </h3>
                        <p className="text-sm text-center max-w-sm text-muted-foreground">
                          Select workers from the dropdown above to add them to the timesheet.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  fields.map((field, index) => {
                    const isSelected = selectedRows.has(index);
                    
                    return (
                      <tr
                        key={field.id}
                        role="row"
                        aria-rowindex={index + 1}
                        aria-selected={isSelected}
                        className="transition-all duration-200 group animate-in fade-in slide-in-from-left-4"
                        style={{
                          backgroundColor: theme === 'dark' ? '#0E141A' : '#FFFFFF',
                          boxShadow: theme === 'dark' 
                            ? '0 2px 4px 0 rgba(0, 0, 0, 0.3)' 
                            : '0 2px 4px 0 rgba(0, 0, 0, 0.08)',
                          borderRadius: '12px',
                          animationDelay: `${index * 50}ms`,
                          outline: isSelected ? `2px solid #2596be` : 'none',
                          outlineOffset: isSelected ? '-2px' : '0'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' 
                            ? 'rgba(37, 150, 190, 0.1)' 
                            : 'rgba(37, 150, 190, 0.05)'
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = theme === 'dark'
                            ? '0 8px 12px -2px rgba(0, 0, 0, 0.4)'
                            : '0 8px 12px -2px rgba(0, 0, 0, 0.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = theme === 'dark' ? '#0E141A' : '#FFFFFF'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = theme === 'dark' 
                            ? '0 2px 4px 0 rgba(0, 0, 0, 0.3)' 
                            : '0 2px 4px 0 rgba(0, 0, 0, 0.08)'
                        }}
                      >
                      {/* Checkbox cell */}
                      <td className="px-4 rounded-l-xl">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(index)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                          aria-label={`Select worker row ${index + 1}`}
                        />
                      </td>
                      
                      {/* Worker cell */}
                      <td className="p-5 pl-6">
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
                                  <SelectTrigger 
                                    className="w-full border-0 shadow-none focus:ring-2 focus:ring-primary/30 rounded-lg transition-all hover:bg-muted/50 min-w-[200px]"
                                    aria-label={`Select worker for row ${index + 1}`}
                                  >
                                    <SelectValue placeholder="Select worker" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {workers.map((worker) => (
                                    <SelectItem 
                                      key={worker.id} 
                                      value={worker.id}
                                      className="cursor-pointer hover:bg-primary/10"
                                    >
                                      <div className="flex items-center gap-3 py-1">
                                        <div 
                                          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                          style={{
                                            backgroundColor: 'rgba(37, 150, 190, 0.15)',
                                            color: '#2596be'
                                          }}
                                        >
                                          {worker.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-semibold text-sm">{worker.name}</div>
                                          <div className="text-xs text-muted-foreground truncate">{worker.position}</div>
                                        </div>
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
                      {/* Clock In */}
                      <td className="p-3 text-center">
                        <FormField
                          control={control}
                          name={`entries.${index}.clock_in`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                  className="w-full h-11 text-center font-semibold border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg transition-all"
                                  style={{
                                    color: theme === 'dark' ? '#F3F4F6' : '#111827',
                                    backgroundColor: 'transparent'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = theme === 'dark' 
                                      ? 'rgba(37, 150, 190, 0.1)' 
                                      : 'rgba(37, 150, 190, 0.05)'
                                    e.target.style.outline = '2px solid rgba(37, 150, 190, 0.3)'
                                    e.target.style.outlineOffset = '2px'
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent'
                                    e.target.style.outline = 'none'
                                  }}
                                  aria-label={`Clock in time for row ${index + 1}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      
                      {/* Clock Out */}
                      <td className="p-3 text-center">
                        <FormField
                          control={control}
                          name={`entries.${index}.clock_out`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                  className="w-full h-11 text-center font-semibold border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg transition-all"
                                  style={{
                                    color: theme === 'dark' ? '#F3F4F6' : '#111827',
                                    backgroundColor: 'transparent'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = theme === 'dark' 
                                      ? 'rgba(37, 150, 190, 0.1)' 
                                      : 'rgba(37, 150, 190, 0.05)'
                                    e.target.style.outline = '2px solid rgba(37, 150, 190, 0.3)'
                                    e.target.style.outlineOffset = '2px'
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent'
                                    e.target.style.outline = 'none'
                                  }}
                                  aria-label={`Clock out time for row ${index + 1}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      
                      {/* Break Duration */}
                      <td className="p-3 text-center">
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
                                  className="w-full h-11 text-center font-semibold border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg transition-all"
                                  style={{
                                    color: theme === 'dark' ? '#F3F4F6' : '#111827',
                                    backgroundColor: 'transparent'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = theme === 'dark' 
                                      ? 'rgba(37, 150, 190, 0.1)' 
                                      : 'rgba(37, 150, 190, 0.05)'
                                    e.target.style.outline = '2px solid rgba(37, 150, 190, 0.3)'
                                    e.target.style.outlineOffset = '2px'
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent'
                                    e.target.style.outline = 'none'
                                  }}
                                  aria-label={`Break duration for row ${index + 1}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      
                      {/* Hourly Rate */}
                      <td className="p-3 text-center">
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
                                  className="w-full h-11 text-center font-semibold border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg transition-all"
                                  style={{
                                    color: theme === 'dark' ? '#F3F4F6' : '#111827',
                                    backgroundColor: 'transparent'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = theme === 'dark' 
                                      ? 'rgba(37, 150, 190, 0.1)' 
                                      : 'rgba(37, 150, 190, 0.05)'
                                    e.target.style.outline = '2px solid rgba(37, 150, 190, 0.3)'
                                    e.target.style.outlineOffset = '2px'
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent'
                                    e.target.style.outline = 'none'
                                  }}
                                  aria-label={`Hourly rate for row ${index + 1}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      {/* Task Description - hidden on small screens */}
                      <td className="p-4 hidden xl:table-cell">
                        <FormField
                          control={control}
                          name={`entries.${index}.task_description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe work..."
                                  className="resize-none w-full min-w-[200px] border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg transition-all"
                                  rows={2}
                                  {...field}
                                  style={{
                                    color: theme === 'dark' ? '#F3F4F6' : '#111827',
                                    backgroundColor: 'transparent'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = theme === 'dark' 
                                      ? 'rgba(37, 150, 190, 0.08)' 
                                      : 'rgba(37, 150, 190, 0.05)'
                                    e.target.style.outline = '2px solid rgba(37, 150, 190, 0.3)'
                                    e.target.style.outlineOffset = '2px'
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent'
                                    e.target.style.outline = 'none'
                                  }}
                                  aria-label={`Task description for row ${index + 1}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      
                      {/* Notes - hidden on smaller screens */}
                      <td className="p-4 hidden 2xl:table-cell">
                        <FormField
                          control={control}
                          name={`entries.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  placeholder="Additional notes..."
                                  className="resize-none w-full min-w-[200px] border-0 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg transition-all"
                                  rows={2}
                                  {...field}
                                  style={{
                                    color: theme === 'dark' ? '#F3F4F6' : '#111827',
                                    backgroundColor: 'transparent'
                                  }}
                                  onFocus={(e) => {
                                    e.target.style.backgroundColor = theme === 'dark' 
                                      ? 'rgba(37, 150, 190, 0.08)' 
                                      : 'rgba(37, 150, 190, 0.05)'
                                    e.target.style.outline = '2px solid rgba(37, 150, 190, 0.3)'
                                    e.target.style.outlineOffset = '2px'
                                  }}
                                  onBlur={(e) => {
                                    e.target.style.backgroundColor = 'transparent'
                                    e.target.style.outline = 'none'
                                  }}
                                  aria-label={`Notes for row ${index + 1}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </td>
                      {/* Actions - show on hover */}
                      <td className="p-5 pr-6 text-center rounded-r-xl">
                        <div className="flex items-center justify-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    onCopyToAll("clock_in", index);
                                    onCopyToAll("clock_out", index);
                                    onCopyToAll("break_duration", index);
                                    toast.success("Time settings copied to all workers");
                                  }}
                                  className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-all"
                                  aria-label="Copy time settings to all workers"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="left">
                                <p className="font-medium">Copy to All</p>
                                <p className="text-xs text-muted-foreground">Apply times to all workers</p>
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
                                    size="sm"
                                    onClick={() => {
                                      onCopyFromPrevious(index);
                                      toast.info("Copied time from previous worker");
                                    }}
                                    className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-all"
                                    aria-label="Copy time from previous entry"
                                  >
                                    <Clock className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  <p className="font-medium">Copy from Previous</p>
                                  <p className="text-xs text-muted-foreground">Use worker above&apos;s times</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          {fields.length > 1 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      onRemove(index);
                                      toast.info("Worker removed from bulk entry");
                                    }}
                                    className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10 transition-all"
                                    aria-label={`Remove worker from row ${index + 1}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                  <p className="font-medium">Remove</p>
                                  <p className="text-xs text-muted-foreground">Delete this worker entry</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
    </>
  );
}

