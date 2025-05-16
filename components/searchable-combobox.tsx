// components/searchable-combobox.tsx

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SearchableComboboxProps<T> {
  items: T[];
  selectedItem: T | null;
  onSelect: (item: T) => void;
  placeholder?: string;
  displayKey: keyof T;
}

export function SearchableCombobox<T extends { id: string }>({
  items,
  selectedItem,
  onSelect,
  placeholder = "Select...",
  displayKey,
}: SearchableComboboxProps<T>) {
  const [open, setOpen] = useState(false);

  const getLabel = (item: T) => item[displayKey] as string;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline"
          className={cn(
            "flex w-[240px] justify-between items-center rounded-md border px-4 py-2 text-left text-sm shadow-sm",
            !selectedItem && "text-muted-foreground"
          )}
        >
          {selectedItem ? getLabel(selectedItem) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={getLabel(item)}
                onSelect={() => {
                  onSelect(item);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedItem?.id === item.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {getLabel(item)}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
