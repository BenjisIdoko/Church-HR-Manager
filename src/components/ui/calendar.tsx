"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-white rounded-2xl shadow-xl border border-[#e7e2d8]", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-3",
        caption: "flex justify-between pt-1 relative items-center w-full px-1 mb-2",
        caption_label: "text-sm font-bold text-[#1c1917]",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-[#fbf9f5] border-[#e7e2d8] p-0 text-[#57534e] hover:bg-[#f4f1ea] hover:text-[#1c1917] rounded-lg transition-colors",
        ),
        nav_button_previous: "static",
        nav_button_next: "static",
        table: "w-full border-collapse space-y-1",
        head_row: "flex justify-between mb-1",
        head_cell:
          "text-[#989086] rounded-md w-9 font-semibold text-[0.75rem] uppercase tracking-wider text-center",
        row: "flex w-full justify-between mt-1.5",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-xl [&:has(>.day-range-start)]:rounded-l-xl first:[&:has([aria-selected])]:rounded-l-xl last:[&:has([aria-selected])]:rounded-r-xl"
            : "[&:has([aria-selected])]:rounded-xl",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-medium text-xs text-[#1c1917] hover:bg-[#f4f1ea] hover:text-[#1c1917] rounded-xl transition-all aria-selected:opacity-100",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-[#4f46e5] aria-selected:text-white font-bold shadow-xs",
        day_range_end:
          "day-range-end aria-selected:bg-[#4f46e5] aria-selected:text-white font-bold shadow-xs",
        day_selected:
          "bg-[#4f46e5] text-white hover:bg-[#4338ca] hover:text-white focus:bg-[#4f46e5] focus:text-white font-bold shadow-sm rounded-xl",
        day_today: "bg-[#e0e7ff] text-[#3730a3] font-bold border border-[#4f46e5]/30 rounded-xl",
        day_outside:
          "day-outside text-[#c2bbb0] opacity-40 aria-selected:text-muted-foreground",
        day_disabled: "text-[#c2bbb0] opacity-30 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-[#e0e7ff] aria-selected:text-[#3730a3] rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4 text-[#57534e]", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4 text-[#57534e]", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
