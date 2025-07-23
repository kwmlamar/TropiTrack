// components/ui/MultiSelect.tsx

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover";
  import { Button } from "@/components/ui/button";
  import { Command, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
  import { Checkbox } from "@/components/ui/checkbox";
  import { Check } from "lucide-react";
  import { cn } from "@/lib/utils";
  import { useState } from "react";
  
  type Option = {
    label: string;
    value: string | number;
  };
  
  type MultiSelectProps = {
    options: Option[];
    value: (string | number)[];
    onChange: (value: (string | number)[]) => void;
    placeholder?: string;
    label?: string;
  };
  
  export function MultiSelect({
    options,
    value,
    onChange,
    placeholder = "Select options...",
    label,
  }: MultiSelectProps) {
    const [open, setOpen] = useState(false);
  
    const toggleOption = (val: string | number) => {
      onChange(
        value.includes(val)
          ? value.filter((v) => v !== val)
          : [...value, val]
      );
    };
  
    const selectedLabels = options
      .filter((opt) => value.includes(opt.value))
      .map((opt) => opt.label)
      .join(", ");
  
    return (
      <div className="w-full">
        {label && <label className="block mb-2 text-sm font-medium">{label}</label>}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between",
                !value.length && "text-gray-500"
              )}
            >
              {selectedLabels || placeholder}
              <Check className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search..." className="h-9" />
              <CommandList>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => toggleOption(opt.value)}
                    className="flex items-center gap-2"
                  >
                    <Checkbox checked={value.includes(opt.value)} />
                    <span>{opt.label}</span>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  }
  