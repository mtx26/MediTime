import { forwardRef, useImperativeHandle, useState } from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"
import WeeklyEventContent from "./WeeklyEventContent"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "lucide-react"

const DateModal = forwardRef(
  (
    {
      selectedDate,
      eventsForDay,
      onNext,
      onPrev,
      onSelectDate,
      getPastWeek,
      getNextWeek,
    },
    ref
  ) => {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)

    // 🔁 expose open() / close() au parent
    useImperativeHandle(ref, () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
    }))

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              <Calendar className="inline-block h-4 w-4 mr-2" />
              {new Date(selectedDate).toLocaleDateString(t("locale"), {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {t('calendar.modal_description')}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-12rem)] px-1">
            <div className="pr-4">
              <WeeklyEventContent
                ifModal
                selectedDate={selectedDate}
                eventsForDay={eventsForDay}
                onSelectDate={onSelectDate}
                onNext={onNext}
                onPrev={onPrev}
                getPastWeek={getPastWeek}
                getNextWeek={getNextWeek}
              />
            </div>
          </ScrollArea>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">
                {t("close")}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
)

export default DateModal

DateModal.propTypes = {
  selectedDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ]).isRequired,
  eventsForDay: PropTypes.array.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  onSelectDate: PropTypes.func.isRequired,
  getPastWeek: PropTypes.func.isRequired,
  getNextWeek: PropTypes.func.isRequired,
}
