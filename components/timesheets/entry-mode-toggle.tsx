import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  
  type EntryMode = "clock-in-out" | "total hours";
  
  export default function EntryModeSelect({
    mode,
    onChange,
  }: {
    mode: EntryMode;
    onChange: (mode: EntryMode) => void;
  }) {
    return (
      <Select value={mode} onValueChange={(val) => onChange(val as EntryMode)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Entry Mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="clock-in-out">Clock-In/Out</SelectItem>
          <SelectItem value="total hours">Total Hours</SelectItem>
        </SelectContent>
      </Select>
    );
  }
  