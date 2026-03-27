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
import { Calendar } from "lucide-react"

const DateModal = forwardRef(({
  selectedDate,
  eventsForDay,
  onNext,
  onPrev,
  onSelectDate,
  getPastWeek,
  getNextWeek,
}, ref) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
  }))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="h-[90vh] flex flex-col overflow-hidden">
        {/* HEADER */}
        <DialogHeader className="shrink-0">
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
            {t("calendar.modal_description")}
          </DialogDescription>
        </DialogHeader>

        {/* 🔥 ZONE SCROLLABLE AVEC HAUTEUR RÉELLE */}
        <div className="flex-1 overflow-hidden">
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
      </DialogContent>
    </Dialog>
  )
})

export default DateModal

DateModal.propTypes = {
  selectedDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
    PropTypes.number,
    PropTypes.oneOf([undefined, null]),
  ]).isRequired,
  eventsForDay: PropTypes.array.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  onSelectDate: PropTypes.func.isRequired,
  getPastWeek: PropTypes.func.isRequired,
  getNextWeek: PropTypes.func.isRequired,
}
