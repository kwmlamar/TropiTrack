"use client"

import { useTheme } from "next-themes"
import { Clock, Trash2, User, Copy, DollarSign, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Control, FieldArrayWithId } from "react-hook-form"
import type { Worker } from "@/lib/types/worker"
import { toast } from "sonner"

interface BulkTimesheetFormData {
  entries: Array<{
    worker_id: string
    clock_in: string
    clock_out: string
    break_duration: number
    hourly_rate: number
    task_description?: string
    notes?: string
  }>
}

interface WorkerRowsMobileProps {
  control: Control<BulkTimesheetFormData>
  fields: FieldArrayWithId<BulkTimesheetFormData, "entries", "id">[]
  workers: Worker[]
  onWorkerChange: (index: number, workerId: string) => void
  onCopyToAll: (fieldName: "clock_in" | "clock_out" | "break_duration" | "task_description", sourceIndex: number) => void
  onCopyFromPrevious: (index: number) => void
  onRemove: (index: number) => void
}

export function WorkerRowsMobile({
  control,
  fields,
  workers,
  onWorkerChange,
  onCopyToAll,
  onCopyFromPrevious,
  onRemove,
}: WorkerRowsMobileProps) {
  const { theme } = useTheme()

  if (fields.length === 0) {
    return null // Desktop view handles empty state
  }

  return (
    <div 
      className="lg:hidden h-full overflow-y-auto space-y-4 px-4 pt-4 pb-0"
      style={{
        backgroundColor: theme === 'dark' ? '#0A0F14' : '#F9FAFB'
      }}
    >
      {fields.map((field, index) => {
        const selectedWorker = workers.find(w => w.id === field.worker_id)
        
        return (
          <div
            key={field.id}
            className="rounded-xl p-5 shadow-lg border-0 space-y-4 animate-in fade-in slide-in-from-bottom-2"
            style={{
              backgroundColor: theme === 'dark' ? '#0E141A' : '#FFFFFF',
              boxShadow: theme === 'dark' 
                ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
                : '0 4px 6px rgba(0, 0, 0, 0.1)',
              animationDelay: `${index * 50}ms`
            }}
          >
            {/* Header with worker number and actions */}
            <div className="flex items-center justify-between pb-3 border-b" style={{
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }}>
              <div className="flex items-center gap-2">
                <div 
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: 'rgba(37, 150, 190, 0.15)',
                    color: '#2596be'
                  }}
                >
                  {index + 1}
                </div>
                <h4 className="font-bold text-base text-foreground">
                  {selectedWorker?.name || `Worker #${index + 1}`}
                </h4>
              </div>
              <div className="flex gap-1">
                <Button 
                  type="button"
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    onCopyToAll("clock_in", index)
                    onCopyToAll("clock_out", index)
                    onCopyToAll("break_duration", index)
                    toast.success("Time settings copied to all workers")
                  }}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {fields.length > 1 && (
                  <Button 
                    type="button"
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" 
                    onClick={() => {
                      onRemove(index)
                      toast.info("Worker removed from bulk entry")
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Worker Select */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block flex items-center gap-1">
                <User className="h-3 w-3" />
                Worker
              </label>
              <FormField
                control={control}
                name={`entries.${index}.worker_id`}
                render={({ field: workerField }) => (
                  <FormItem>
                    <Select
                      onValueChange={(value) => {
                        workerField.onChange(value)
                        onWorkerChange(index, value)
                      }}
                      value={workerField.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full h-12">
                          <SelectValue placeholder="Select worker" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{
                                  backgroundColor: 'rgba(37, 150, 190, 0.1)',
                                  color: '#2596be'
                                }}
                              >
                                {worker.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{worker.name}</div>
                                <div className="text-xs text-muted-foreground">{worker.position}</div>
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
            </div>

            {/* Time Fields Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  Clock In
                </label>
                <FormField
                  control={control}
                  name={`entries.${index}.clock_in`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          className="h-11 text-center font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  Clock Out
                </label>
                <FormField
                  control={control}
                  name={`entries.${index}.clock_out`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          className="h-11 text-center font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Break and Rate Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1">
                  <Coffee className="h-3 w-3 text-primary" />
                  Break (min)
                </label>
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
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="h-11 text-center font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-primary" />
                  Hourly Rate
                </label>
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
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="h-11 text-center font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Task Description */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Task Description
              </label>
              <FormField
                control={control}
                name={`entries.${index}.task_description`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the work performed..."
                        className="resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Notes (Optional)
              </label>
              <FormField
                control={control}
                name={`entries.${index}.notes`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes..."
                        className="resize-none min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Copy from previous button */}
            {index > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onCopyFromPrevious(index)}
                className="w-full"
              >
                <Clock className="h-4 w-4 mr-2" />
                Copy from previous worker
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}

