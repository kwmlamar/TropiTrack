import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function TimesheetForm() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="default">
          <Plus className="h-4 w-4 mr-2" />
          Add Timesheet
        </Button>
      </SheetTrigger>
      <SheetContent >
        <SheetHeader>
          <SheetTitle>Add Timesheet</SheetTitle>
          <SheetDescription>
            Fill out the timesheet details. Nothing will actually be saved yet.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 py-4 h-screen w-full max-w-[700px] overflow-y-auto will-change-auto">
          {/* Date */}
          <div className="mb-4">
            <Label htmlFor="date" className="block mb-2">
              Date
            </Label>
            <Input id="date" type="date" className="w-full" />
          </div>

          {/* Worker ID */}
          <div className="mb-4">
            <Label htmlFor="worker_id" className="block mb-2">
              Worker ID
            </Label>
            <Input id="worker_id" className="w-full" />
          </div>

          {/* Project ID */}
          <div className="mb-4">
            <Label htmlFor="project_id" className="block mb-2">
              Project ID
            </Label>
            <Input id="project_id" className="w-full" />
          </div>

          {/* Clock In */}
          <div className="mb-4">
            <Label htmlFor="clock_in" className="block mb-2">
              Clock In
            </Label>
            <Input id="clock_in" type="datetime-local" className="w-full" />
          </div>

          {/* Clock Out */}
          <div className="mb-4">
            <Label htmlFor="clock_out" className="block mb-2">
              Clock Out
            </Label>
            <Input
              id="clock_out"
              type="datetime-local"
              className="w-full"
            />
          </div>

          {/* Break Duration */}
          <div className="mb-4">
            <Label htmlFor="break_duration" className="block mb-2">
              Break (mins)
            </Label>
            <Input id="break_duration" type="number" className="w-full" />
          </div>

          {/* Regular Hours */}
          <div className="mb-4">
            <Label htmlFor="regular_hours" className="block mb-2">
              Regular Hours
            </Label>
            <Input id="regular_hours" type="number" className="w-full" />
          </div>

          {/* Overtime Hours */}
          <div className="mb-4">
            <Label htmlFor="overtime_hours" className="block mb-2">
              Overtime Hours
            </Label>
            <Input id="overtime_hours" type="number" className="w-full" />
          </div>

          {/* Total Hours */}
          <div className="mb-4">
            <Label htmlFor="total_hours" className="block mb-2">
              Total Hours
            </Label>
            <Input id="total_hours" type="number" className="w-full" />
          </div>

          {/* Hourly Rate */}
          <div className="mb-4">
            <Label htmlFor="hourly_rate" className="block mb-2">
              Hourly Rate
            </Label>
            <Input id="hourly_rate" type="number" className="w-full" />
          </div>

          {/* Total Pay */}
          <div className="mb-4">
            <Label htmlFor="total_pay" className="block mb-2">
              Total Pay
            </Label>
            <Input id="total_pay" type="number" className="w-full" />
          </div>

          {/* Supervisor Approval */}
          <div className="flex items-center space-x-2">
            <Checkbox id="supervisor_approval" />
            <Label htmlFor="supervisor_approval">Supervisor Approval</Label>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="block mb-2 mt-2">
              Notes
            </Label>
            <Textarea id="notes" className="w-full" />
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button type="button">Save Timesheet</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
