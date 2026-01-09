import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base layout
        "flex h-9 w-full min-w-0 rounded-lg border px-3 py-1 text-base transition-all duration-150 outline-none md:text-sm",
        // Light mode - explicit colors
        "bg-[#ffffff] border-[#d1d5db] text-[#111827] placeholder:text-[#9ca3af]",
        "selection:bg-[#3b82f6] selection:text-white",
        // Dark mode - explicit colors
        "dark:bg-[#18181b] dark:border-[#3f3f46] dark:text-[#fafafa] dark:placeholder:text-[#71717a]",
        "dark:selection:bg-[#3b82f6] dark:selection:text-white",
        // Hover state
        "hover:border-[#9ca3af] dark:hover:border-[#52525b]",
        // Focus state
        "focus-visible:border-[#3b82f6] focus-visible:ring-2 focus-visible:ring-[#3b82f6]/20",
        "dark:focus-visible:border-[#3b82f6] dark:focus-visible:ring-[#3b82f6]/30",
        // Error state
        "aria-invalid:border-[#ef4444] aria-invalid:ring-2 aria-invalid:ring-[#ef4444]/20",
        "dark:aria-invalid:border-[#ef4444] dark:aria-invalid:ring-[#ef4444]/30",
        // File input styling
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "file:text-[#111827] dark:file:text-[#fafafa]",
        // Disabled state
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
