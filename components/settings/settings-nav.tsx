"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
// Icons will be imported as needed

const settingsNav: Array<{
  title: string
  href: string
  icon: React.ElementType
  description: string
}> = [
  // Settings navigation items will be added here
]

export function SettingsNav() {
  const pathname = usePathname()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {settingsNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50",
                isActive && "bg-muted border-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <h3 className="font-semibold">{item.title}</h3>
              </div>
                                        <p className="text-sm text-gray-500">
                            {item.description}
                          </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
} 