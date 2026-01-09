import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        // Base layout
        "flex field-sizing-content min-h-16 w-full rounded-lg border px-3 py-2 text-base transition-all duration-150 outline-none md:text-sm",
        // Light mode - explicit colors
        "bg-[#ffffff] border-[#d1d5db] text-[#111827] placeholder:text-[#9ca3af]",
        // Dark mode - explicit colors
        "dark:bg-[#18181b] dark:border-[#3f3f46] dark:text-[#fafafa] dark:placeholder:text-[#71717a]",
        // Hover state
        "hover:border-[#9ca3af] dark:hover:border-[#52525b]",
        // Focus state
        "focus-visible:border-[#3b82f6] focus-visible:ring-2 focus-visible:ring-[#3b82f6]/20",
        "dark:focus-visible:border-[#3b82f6] dark:focus-visible:ring-[#3b82f6]/30",
        // Error state
        "aria-invalid:border-[#ef4444] aria-invalid:ring-2 aria-invalid:ring-[#ef4444]/20",
        "dark:aria-invalid:border-[#ef4444] dark:aria-invalid:ring-[#ef4444]/30",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
