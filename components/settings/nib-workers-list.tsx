"use client"

import { useEffect, useState, useCallback } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Loader2, User } from "lucide-react"
import type { Worker } from "@/lib/types/worker"

export function NibWorkersList() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingWorker, setUpdatingWorker] = useState<string | null>(null)

  const fetchWorkers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workers')
      const data = await response.json()
      
      if (data.success) {
        setWorkers(data.data || [])
      } else {
        toast.error("Failed to load workers")
      }
    } catch (error) {
      console.error('Error fetching workers:', error)
      toast.error("Failed to load workers")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkers()
  }, [fetchWorkers])

  const handleToggleNib = async (workerId: string, currentExemptStatus: boolean) => {
    try {
      setUpdatingWorker(workerId)
      
      const response = await fetch(`/api/workers/${workerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nib_exempt: !currentExemptStatus
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update local state
        setWorkers(workers.map(w => 
          w.id === workerId 
            ? { ...w, nib_exempt: !currentExemptStatus }
            : w
        ))
        
        toast.success(`NIB deductions ${!currentExemptStatus ? 'disabled' : 'enabled'} for worker`)
      } else {
        toast.error(data.error || "Failed to update worker")
      }
    } catch (error) {
      console.error('Error updating worker:', error)
      toast.error("Failed to update worker NIB settings")
    } finally {
      setUpdatingWorker(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (workers.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No workers found</h3>
        <p className="text-sm text-muted-foreground">
          Add workers to your company to manage NIB settings
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {workers.map((worker) => (
          <div
            key={worker.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3">
                <Label htmlFor={`nib-${worker.id}`} className="text-base font-medium cursor-pointer">
                  {worker.name}
                </Label>
                {!worker.is_active && (
                  <Badge variant="outline" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{worker.position}</span>
                {worker.nib_number && (
                  <>
                    <span>•</span>
                    <span className="text-xs">NIB #{worker.nib_number}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right mr-2">
                <p className="text-sm font-medium">
                  {worker.nib_exempt ? (
                    <span className="text-muted-foreground">NIB Exempt</span>
                  ) : (
                    <span className="text-primary">NIB Applied</span>
                  )}
                </p>
              </div>
              <Switch
                id={`nib-${worker.id}`}
                checked={!worker.nib_exempt}
                onCheckedChange={() => handleToggleNib(worker.id, worker.nib_exempt || false)}
                disabled={updatingWorker === worker.id}
                aria-label={`Toggle NIB deductions for ${worker.name}`}
              />
              {updatingWorker === worker.id && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> Workers with NIB deductions enabled will have the configured NIB rates 
          automatically applied during payroll processing. Workers marked as exempt will not have NIB deductions applied.
        </p>
      </div>
    </div>
  )
}

