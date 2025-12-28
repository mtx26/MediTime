import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      className={cn(
        "bg-background group/calendar p-3",
        "[--cell-size:clamp(2.25rem,8vw,2.75rem)]",
        className
      )}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-full", defaultClassNames.root),

        months: cn(
          "relative flex flex-col md:flex-row gap-4",
          defaultClassNames.months
        ),

        month: cn(
          "relative flex flex-col w-full gap-4 pt-(--cell-size)",
          defaultClassNames.month
        ),

        nav: cn(
          "absolute top-0 inset-x-0 z-10 flex items-center justify-between",
          defaultClassNames.nav
        ),

        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "w-(--cell-size) h-(--cell-size) p-0 [&_svg]:text-foreground",
          defaultClassNames.button_previous
        ),

        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "w-(--cell-size) h-(--cell-size) p-0 [&_svg]:text-foreground",
          defaultClassNames.button_next
        ),

        month_caption: cn(
          "relative z-0 flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption
        ),

        dropdowns: cn(
          "flex items-center justify-center gap-1.5 text-sm font-medium h-(--cell-size)",
          defaultClassNames.dropdowns
        ),

        dropdown_root: cn(
          "relative border border-input rounded-md shadow-xs focus-within:ring-2 focus-within:ring-ring",
          defaultClassNames.dropdown_root
        ),

        dropdown: cn(
          "absolute inset-0 opacity-0",
          defaultClassNames.dropdown
        ),

        caption_label: cn(
          "select-none font-medium text-sm",
          defaultClassNames.caption_label
        ),

        table: cn("w-full border-collapse", defaultClassNames.table),

        weekdays: cn("flex", defaultClassNames.weekdays),

        weekday: cn(
          "flex-1 text-center text-muted-foreground text-[0.8rem] select-none",
          defaultClassNames.weekday
        ),

        week: cn("flex w-full mt-2", defaultClassNames.week),

        week_number_header: cn(
          "w-(--cell-size)",
          defaultClassNames.week_number_header
        ),

        week_number: cn(
          "text-[0.75rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),

        day: cn(
          "relative w-full h-(--cell-size) p-0 text-center select-none",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
            : "[&:first-child[data-selected=true]_button]:rounded-l-md",
          defaultClassNames.day
        ),

        range_start: cn(
          "bg-primary text-primary-foreground rounded-l-md",
          defaultClassNames.range_start
        ),

        range_middle: cn(
          "bg-accent text-accent-foreground rounded-none",
          defaultClassNames.range_middle
        ),

        range_end: cn(
          "bg-primary text-primary-foreground rounded-r-md",
          defaultClassNames.range_end
        ),

        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),

        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),

        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),

        hidden: cn("invisible", defaultClassNames.hidden),

        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(className)}
            {...props}
          />
        ),

        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left")
            return <ChevronLeftIcon className={cn("size-4", className)} {...props} />
          if (orientation === "right")
            return <ChevronRightIcon className={cn("size-4", className)} {...props} />
          return <ChevronDownIcon className={cn("size-4", className)} {...props} />
        },

        DayButton: CalendarDayButton,

        WeekNumber: ({ children, ...props }) => (
          <td {...props}>
            <div className="flex w-(--cell-size) h-(--cell-size) items-center justify-center">
              {children}
            </div>
          </td>
        ),

        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames()
  const ref = React.useRef(null)

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_middle &&
        !modifiers.range_end
      }
      data-range-start={modifiers.range_start}
      data-range-middle={modifiers.range_middle}
      data-range-end={modifiers.range_end}
      className={cn(
        "w-(--cell-size) h-(--cell-size) flex items-center justify-center leading-none",
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        "data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground rounded-l-md",
        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground rounded-r-md",
        "focus-visible:ring-2 focus-visible:ring-ring",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}
