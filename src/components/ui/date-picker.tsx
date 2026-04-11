import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  disabled,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  const currentYear = new Date().getFullYear();

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0" />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          onSelect={onChange}
          disabled={disabled}
          captionLayout="dropdown"
          startMonth={new Date(currentYear - 20, 0)}
          endMonth={new Date(currentYear + 10, 11)}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
