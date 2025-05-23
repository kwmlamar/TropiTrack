// components/timesheets/TimesheetViewControls.tsx

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DatePicker } from "@/components/date-picker"; // adjust the import path if needed

export default function TimesheetViewControls({
  viewMode,
  setViewMode,
  selectedDate,
  setSelectedDate,
}: {
  viewMode: "daily" | "weekly";
  setViewMode: (mode: "daily" | "weekly") => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(val) => val && setViewMode(val as "daily" | "weekly")}
      >
        <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
        <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
      </ToggleGroup>

      <Button
        variant="ghost"
        onClick={() =>
          selectedDate &&
          setSelectedDate(
            new Date(
              selectedDate.setDate(
                selectedDate.getDate() - (viewMode === "daily" ? 1 : 7)
              )
            )
          )
        }
      >
        ←
      </Button>

      <div className="scale-90">
        <DatePicker date={selectedDate} setDate={setSelectedDate} />
      </div>

      <Button
        variant="ghost"
        onClick={() =>
          selectedDate &&
          setSelectedDate(
            new Date(
              selectedDate.setDate(
                selectedDate.getDate() + (viewMode === "daily" ? 1 : 7)
              )
            )
          )
        }
      >
        →
      </Button>
    </div>
  );
}
