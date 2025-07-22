"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { 
  User, 
  Shield, 
  Building2
} from "lucide-react"

const settingsNav = [
  {
    title: "Profile",
    href: "/dashboard/settings/profile",
    icon: User,
    description: "Personal information and preferences"
  },
  {
    title: "Account",
    href: "/dashboard/settings/account", 
    icon: Shield,
    description: "Security, billing, and subscription"
  },
  {
    title: "Company",
    href: "/dashboard/settings/company",
    icon: Building2,
    description: "Business settings and configuration"
  }
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
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
} 