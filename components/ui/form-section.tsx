import * as React from "react"
import { cn } from "@/lib/utils"

interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  columns?: 1 | 2
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  columns = 1,
  className,
}: FormSectionProps) {
  return (
    <div
      data-slot="form-section"
      className={cn("space-y-4", className)}
    >
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {title}
            </h4>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div
        className={cn(
          columns === 2 && "grid grid-cols-1 md:grid-cols-2 gap-4",
          columns === 1 && "space-y-4"
        )}
      >
        {children}
      </div>
    </div>
  )
}
