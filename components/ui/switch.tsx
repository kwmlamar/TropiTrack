"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Base layout - slightly larger for better usability
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5",
        "transition-all duration-150 ease-in-out outline-none",

        // OFF state - Light mode: visible gray, Dark mode: darker gray
        "data-[state=unchecked]:bg-[#d1d5db]",
        "dark:data-[state=unchecked]:bg-[#3f3f46]",

        // ON state - Brand primary color with subtle variations for dark mode
        "data-[state=checked]:bg-[#2596be]",
        "dark:data-[state=checked]:bg-[#2596be]",

        // Hover states - subtle brightness adjustment
        "hover:data-[state=unchecked]:bg-[#c4c9d0]",
        "hover:data-[state=checked]:bg-[#1e7fa3]",
        "dark:hover:data-[state=unchecked]:bg-[#52525b]",
        "dark:hover:data-[state=checked]:bg-[#2ba8d4]",

        // Focus state - matches input focus ring style
        "focus-visible:ring-2 focus-visible:ring-[#2596be]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "dark:focus-visible:ring-[#2596be]/40",

        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#d1d5db]",
        "disabled:data-[state=checked]:hover:bg-[#2596be]",
        "dark:disabled:hover:bg-[#3f3f46]",
        "dark:disabled:data-[state=checked]:hover:bg-[#2596be]",

        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          // Base thumb styling
          "pointer-events-none block h-5 w-5 rounded-full",
          "transition-transform duration-150 ease-in-out",

          // Thumb color - white with subtle shadow for depth
          "bg-white",
          "shadow-[0_1px_3px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.1)]",

          // Dark mode thumb
          "dark:bg-[#fafafa]",
          "dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)]",

          // Transform positions
          "data-[state=unchecked]:translate-x-0",
          "data-[state=checked]:translate-x-5"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
