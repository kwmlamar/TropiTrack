"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface PricingToggleProps {
  onToggle: (isYearly: boolean) => void
}

export function PricingToggle({ onToggle }: PricingToggleProps) {
  const [isYearly, setIsYearly] = useState(false)

  const handleToggle = (checked: boolean) => {
    setIsYearly(checked)
    onToggle(checked)
  }

  return (
    <div className="flex items-center justify-center space-x-4">
      <Label htmlFor="pricing-toggle" className="text-base font-medium">
        Monthly
      </Label>
      <Switch
        id="pricing-toggle"
        checked={isYearly}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-primary"
      />
      <Label htmlFor="pricing-toggle" className="text-base font-medium">
        Yearly <span className="text-sm text-primary font-semibold">Save 20%</span>
      </Label>
    </div>
  )
}
