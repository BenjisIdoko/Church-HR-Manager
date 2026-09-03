import * as React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { parseLocalDate } from "../../utils/dateUtils";

export interface DatePickerProps {
  value?: string; // Expects "YYYY-MM-DD"
  onChange?: (dateString: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
  disabled = false,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parseLocalDate(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value]);

  const handleSelect = (date?: Date) => {
    if (!date) {
      onChange?.("");
      setOpen(false);
      return;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formatted = `${year}-${month}-${day}`;
    onChange?.(formatted);
    setOpen(false);
  };

  const handleToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    handleSelect(today);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
    setOpen(false);
  };

  const formattedDisplay = React.useMemo(() => {
    if (!selectedDate) return undefined;
    return selectedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative inline-flex w-full items-center">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal bg-[#fbf9f5] border-[#e7e2d8] hover:border-[#d6cebf] hover:bg-[#f4f1ea] rounded-xl text-xs text-[#1c1917] transition-all shadow-2xs h-10 px-3",
              !value && "text-[#989086]",
              clearable && value && "pr-8",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-[#4f46e5] shrink-0" />
            <span className="truncate font-medium">{formattedDisplay || placeholder}</span>
          </Button>

          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 p-1 text-[#989086] hover:text-[#1c1917] rounded-md transition-colors"
              title="Clear date"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-0 bg-transparent shadow-none z-50" align="start">
        <div className="flex flex-col gap-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            initialFocus
          />
          <div className="flex items-center justify-between px-3 py-2 bg-white border border-[#e7e2d8] rounded-xl shadow-md text-xs">
            <button
              type="button"
              onClick={handleToday}
              className="text-[#4f46e5] font-semibold hover:underline"
            >
              Select Today
            </button>

            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[#78716c] font-medium hover:text-[#1c1917]"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
