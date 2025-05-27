"use client"

import { useState } from "react"
import { IconSearch, IconCommand } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export function SearchCommand() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      >
        <IconSearch className="h-4 w-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search projects, workers, timesheets..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Projects">
            <CommandItem>Paradise Resort Phase 1</CommandItem>
            <CommandItem>Cable Beach Condos</CommandItem>
            <CommandItem>Downtown Office Complex</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Workers">
            <CommandItem>Marcus Johnson</CommandItem>
            <CommandItem>David Williams</CommandItem>
            <CommandItem>James Brown</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Quick Actions">
            <CommandItem>
              <IconCommand className="mr-2 h-4 w-4" />
              Create New Project
            </CommandItem>
            <CommandItem>
              <IconCommand className="mr-2 h-4 w-4" />
              Add Worker
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
