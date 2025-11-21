"use client"

import { useEffect, useMemo, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, parseISO, subDays } from "date-fns"
import { getApprovedTimesheetsForProject } from "@/lib/data/invoices"
import type { InvoiceLineItemMetadata, InvoiceLineItemType } from "@/lib/types/invoice"
import { cn } from "@/lib/utils"

interface DrawerTimesheet {
  id: string
  worker_id: string
  worker_name: string
  date: string
  total_hours: number
  hourly_rate: number
  total_pay: number
}

interface InvoiceTimesheetDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId?: string
  userId: string
  onImport: (
    items: Array<{
      description: string
      type: InvoiceLineItemType
      quantity: number
      unit_price: number
      metadata?: InvoiceLineItemMetadata
    }>
  ) => void
}

export function InvoiceTimesheetDrawer({
  open,
  onOpenChange,
  projectId,
  userId,
  onImport,
}: InvoiceTimesheetDrawerProps) {
  const [timesheets, setTimesheets] = useState<DrawerTimesheet[]>([])
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && projectId) {
      fetchTimesheets()
    }
  }, [open, projectId])

  const fetchTimesheets = async () => {
    setLoading(true)
    setError(null)
    try {
      const sixtyDaysAgo = format(subDays(new Date(), 60), "yyyy-MM-dd")
      const { data, error } = await getApprovedTimesheetsForProject(userId, projectId!, {
        date_from: sixtyDaysAgo,
      })

      if (error) {
        setError(error)
        return
      }

      setTimesheets(data || [])
      setSelectedIds({})
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timesheets")
    } finally {
      setLoading(false)
    }
  }

  const selectedTimesheets = useMemo(
    () => timesheets.filter((timesheet) => selectedIds[timesheet.id]),
    [timesheets, selectedIds]
  )

  const toggleAll = (checked: boolean) => {
    if (checked) {
      const allSelected: Record<string, boolean> = {}
      timesheets.forEach((ts) => {
        allSelected[ts.id] = true
      })
      setSelectedIds(allSelected)
    } else {
      setSelectedIds({})
    }
  }

  const handleImport = () => {
    if (selectedTimesheets.length === 0) {
      onOpenChange(false)
      return
    }

    const grouped = selectedTimesheets.reduce<
      Record<
        string,
        {
          worker: string
          hours: number
          rate: number
          ids: string[]
          earliest: string
          latest: string
        }
      >
    >((acc, ts) => {
      const current = acc[ts.worker_id] || {
        worker: ts.worker_name,
        hours: 0,
        rate: ts.hourly_rate,
        ids: [],
        earliest: ts.date,
        latest: ts.date,
      }
      current.hours += ts.total_hours
      current.ids.push(ts.id)
      current.earliest = ts.date < current.earliest ? ts.date : current.earliest
      current.latest = ts.date > current.latest ? ts.date : current.latest
      acc[ts.worker_id] = current
      return acc
    }, {})

    const items = Object.values(grouped).map((entry) => {
      const range =
        entry.earliest === entry.latest
          ? format(parseISO(entry.earliest), "MMM d, yyyy")
          : `${format(parseISO(entry.earliest), "MMM d")} - ${format(parseISO(entry.latest), "MMM d, yyyy")}`

      return {
        type: "service" as InvoiceLineItemType,
        description: `${entry.worker} labor (${range})`,
        quantity: Number(entry.hours.toFixed(2)),
        unit_price: entry.rate,
        metadata: {
          source: "timesheet",
          timesheet_ids: entry.ids,
          worker_name: entry.worker,
        } satisfies InvoiceLineItemMetadata,
      }
    })

    onImport(items)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[480px]">
        <SheetHeader>
          <SheetTitle>Import approved timesheets</SheetTitle>
          <SheetDescription>Select approved entries to convert into service line items.</SheetDescription>
        </SheetHeader>

        {projectId ? (
          <div className="mt-4 flex flex-col h-[calc(100%-5rem)]">
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedTimesheets.length === timesheets.length && timesheets.length > 0}
                  onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                />
                <span className="text-muted-foreground">
                  {selectedTimesheets.length} selected
                </span>
              </div>
              <Button size="sm" variant="secondary" onClick={fetchTimesheets} disabled={loading}>
                Refresh
              </Button>
            </div>

            <ScrollArea className="mt-3 flex-1 rounded-lg border">
              {loading ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  Loading timesheets...
                </div>
              ) : error ? (
                <div className="p-4 text-sm text-destructive">{error}</div>
              ) : timesheets.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-center text-sm text-muted-foreground px-6">
                  No approved timesheets found for this project in the last 60 days.
                </div>
              ) : (
                <div className="divide-y">
                  {timesheets.map((timesheet) => (
                    <label
                      key={timesheet.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:bg-muted/60",
                        selectedIds[timesheet.id] && "bg-muted/60"
                      )}
                    >
                      <Checkbox
                        checked={Boolean(selectedIds[timesheet.id])}
                        onCheckedChange={(checked) =>
                          setSelectedIds((prev) => ({
                            ...prev,
                            [timesheet.id]: Boolean(checked),
                          }))
                        }
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{timesheet.worker_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(timesheet.date), "MMM d, yyyy")} • {timesheet.total_hours.toFixed(2)} hrs @ $
                          {timesheet.hourly_rate.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        ${(timesheet.total_hours * timesheet.hourly_rate).toFixed(2)}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleImport}
                disabled={selectedTimesheets.length === 0}
              >
                Import {selectedTimesheets.length > 0 ? `(${selectedTimesheets.length})` : ""}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-sm text-muted-foreground">
            Select a project before importing timesheets.
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}



