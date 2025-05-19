import * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface TimePickerProps {
  date: Date
  setDate: (hours: number, minutes: number) => void
}

export function TimePickerDemo({
  date,
  setDate,
}: TimePickerProps) {
  const minuteRef = React.useRef<HTMLInputElement>(null)
  const hourRef = React.useRef<HTMLInputElement>(null)

  const [hour, setHour] = React.useState(date?.getHours() || 0)
  const [minute, setMinute] = React.useState(date?.getMinutes() || 0)

  // Update component state when date changes
  React.useEffect(() => {
    if (date) {
      setHour(date.getHours())
      setMinute(date.getMinutes())
    }
  }, [date])

  // Update parent date when time changes
  React.useEffect(() => {
    setDate(hour, minute)
  }, [hour, minute, setDate])

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      const newHour = Math.max(0, Math.min(23, value))
      setHour(newHour)
      if (newHour > 9 && value > 9) {
        minuteRef.current?.focus()
      }
    }
  }

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value)) {
      setMinute(Math.max(0, Math.min(59, value)))
    }
  }

  // Handle arrow keys
  const handleHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setHour((prev) => (prev === 23 ? 0 : prev + 1))
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setHour((prev) => (prev === 0 ? 23 : prev - 1))
    } else if (e.key === "ArrowRight" && hourRef.current) {
      e.preventDefault()
      const position = hourRef.current.selectionStart
      const length = hourRef.current.value.length
      if (position === length) {
        minuteRef.current?.focus()
      }
    }
  }

  const handleMinuteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setMinute((prev) => (prev === 59 ? 0 : prev + 1))
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setMinute((prev) => (prev === 0 ? 59 : prev - 1))
    } else if (e.key === "ArrowLeft" && minuteRef.current) {
      const position = minuteRef.current.selectionStart
      if (position === 0) {
        hourRef.current?.focus()
      }
    }
  }

  const formatTimeValue = (value: number): string => {
    return value.toString().padStart(2, "0")
  }

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          Hours
        </Label>
        <Input
          ref={hourRef}
          id="hours"
          value={formatTimeValue(hour)}
          onChange={handleHourChange}
          onKeyDown={handleHourKeyDown}
          className="w-12 text-center"
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">
          Minutes
        </Label>
        <Input
          ref={minuteRef}
          id="minutes"
          value={formatTimeValue(minute)}
          onChange={handleMinuteChange}
          onKeyDown={handleMinuteKeyDown}
          className="w-12 text-center"
        />
      </div>
      <div className="flex h-10 items-center">
        <Clock className="ml-2 h-4 w-4" />
      </div>
    </div>
  )
} 