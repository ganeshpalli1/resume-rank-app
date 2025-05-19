import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TimePickerDemo } from "./time-picker"

interface DatePickerProps {
  id?: string;
  selected: Date | null;
  onSelect: (date: Date | null) => void;
  className?: string;
  showTimeSelect?: boolean;
}

export function DatePicker({ id, selected, onSelect, className, showTimeSelect = false }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? (
            showTimeSelect ? (
              format(selected, "PPP p")
            ) : (
              format(selected, "PPP")
            )
          ) : (
            <span>Select date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected || undefined}
          onSelect={(date) => {
            // Preserve the time if there's an existing date
            if (date && selected) {
              const newDate = new Date(date);
              newDate.setHours(selected.getHours());
              newDate.setMinutes(selected.getMinutes());
              onSelect(newDate);
            } else {
              onSelect(date || null);
            }
          }}
          initialFocus
        />
        {showTimeSelect && (
          <div className="p-3 border-t border-border">
            <TimePickerDemo 
              setDate={(hours, minutes) => {
                if (selected) {
                  const newDate = new Date(selected);
                  newDate.setHours(hours);
                  newDate.setMinutes(minutes);
                  onSelect(newDate);
                } else {
                  const now = new Date();
                  now.setHours(hours);
                  now.setMinutes(minutes);
                  onSelect(now);
                }
              }}
              date={selected || new Date()}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
} 