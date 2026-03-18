import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
}

function splitValue(value: string): { datePart: string; timePart: string } {
  const [datePart = "", timePart = "00:00"] = value.split("T");
  return { datePart, timePart };
}

export function DateTimePicker({
  value,
  onChange,
  disabled,
  placeholder = "Pick a date & time",
}: DateTimePickerProps) {
  const { datePart, timePart } = splitValue(value);
  const selected = datePart ? parse(datePart, "yyyy-MM-dd", new Date()) : undefined;

  function handleDaySelect(day: Date | undefined) {
    if (!day) {
      onChange("");
      return;
    }
    const newDate = format(day, "yyyy-MM-dd");
    onChange(`${newDate}T${timePart}`);
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newTime = e.target.value;
    if (datePart) {
      onChange(`${datePart}T${newTime}`);
    }
  }

  const displayValue = selected ? `${format(selected, "PPP")} ${timePart}` : null;

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !displayValue && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {displayValue ?? <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={handleDaySelect}
          disabled={disabled}
          autoFocus
        />
        <div className="border-t p-3">
          <Input type="time" value={timePart} onChange={handleTimeChange} disabled={!datePart} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
