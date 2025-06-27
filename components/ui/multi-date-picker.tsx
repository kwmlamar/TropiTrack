"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface MultiDatePickerProps {
  selectedDates: Date[]
  onDatesChange: (dates: Date[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxDates?: number
}

export function MultiDatePicker({
  selectedDates,
  onDatesChange,
  placeholder = "Select dates",
  className,
  disabled = false,
  maxDates,
}: MultiDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    const dateStr = date.toDateString()
    const isSelected = selectedDates.some(d => d.toDateString() === dateStr)

    if (isSelected) {
      // Remove date if already selected
      onDatesChange(selectedDates.filter(d => d.toDateString() !== dateStr))
    } else {
      // Add date if not selected and under max limit
      if (!maxDates || selectedDates.length < maxDates) {
        onDatesChange([...selectedDates, date].sort((a, b) => a.getTime() - b.getTime()))
      }
    }
  }

  const isDateSelected = (date: Date) => {
    return selectedDates.some(d => d.toDateString() === date.toDateString())
  }

  // Custom day renderer to handle toggle behavior
  const DayContent = ({ date, displayMonth }: { date: Date; displayMonth: Date }) => {
    const isSelected = isDateSelected(date)
    const isCurrentMonth = date.getMonth() === displayMonth.getMonth()
    const isDisabled = date > new Date() || date < new Date("1900-01-01")

    if (!isCurrentMonth) {
      return <div className="h-8 w-8" />
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 p-0 font-normal",
          isSelected && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed",
          !isDisabled && !isSelected && "hover:bg-accent hover:text-accent-foreground"
        )}
        disabled={isDisabled}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!isDisabled) {
            handleDateSelect(date)
          }
        }}
      >
        {date.getDate()}
      </Button>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedDates.length && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDates.length > 0 ? (
              <span>
                {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={undefined}
            onSelect={() => {}} // Disable default selection behavior
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            components={{
              DayContent: DayContent,
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Max Dates Warning */}
      {maxDates && selectedDates.length >= maxDates && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxDates} date{maxDates !== 1 ? 's' : ''} allowed
        </p>
      )}
    </div>
  )
} 