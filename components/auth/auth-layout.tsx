import type React from "react"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  children: React.ReactNode
  className?: string
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen flex items-center justify-center p-4",
        className,
      )}
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
