import React from "react"
import PropTypes from "prop-types"
import { useTranslation } from "react-i18next"
import ArrowControls from "./ArrowControls"
import WeekDayCircles from "./WeekDayCircles"
import { getMondayDate, toISO } from '@meditime/utils'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, ArrowRight } from "lucide-react"

export default function WeeklyEventContent({
  ifModal,
  selectedDate,
  eventsForDay,
  onSelectDate,
  onNext,
  onPrev,
  getPastWeek,
  getNextWeek,
}) {
  const { t, i18n } = useTranslation()

  const selDate =
    selectedDate instanceof Date ? selectedDate : new Date(selectedDate)

  const weekDates = [...Array(7)].map((_, i) => {
    const d = new Date(getMondayDate(selDate))
    d.setDate(d.getDate() + i)
    d.setHours(0, 0, 0, 0)
    return d
  })

  const selIso = toISO(selDate)
  const weekIsos = weekDates.map(toISO)
  const isFirstDay = weekIsos[0] === selIso
  const isLastDay = weekIsos[6] === selIso

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 pb-2">
        <ArrowControls
          onLeft={isFirstDay ? getPastWeek : onPrev}
          onRight={isLastDay ? getNextWeek : onNext}
        />

        <div className="mb-2 flex justify-center">
          <WeekDayCircles
            selectedDate={selDate}
            onSelectDate={onSelectDate}
          />
        </div>

        <div className="flex items-center justify-between mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={isFirstDay ? getPastWeek : onPrev}
            className="min-w-10 px-1.5 py-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="text-center grow px-2">
            <div className="text-muted-foreground text-xs capitalize">
              {selDate.toLocaleDateString(i18n.language, { weekday: "long" })}
            </div>
            <div className="font-semibold text-base">
              {selDate.toLocaleDateString(i18n.language, {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={isLastDay ? getNextWeek : onNext}
            className="min-w-10 px-1.5 py-1"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ✅ ScrollArea remontée AU-DESSUS du footer */}
      <ScrollArea className="flex-1 pr-3 overflow-auto">
        {eventsForDay.length > 0 ? (
          <div className="grid gap-2 px-1 over">
            {eventsForDay.map((event, index) => {
              const time = new Date(event.start).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })

              return (
                <Card key={index} className="rounded-lg p-2.5">
                  <div className="flex items-start">
                    <div className="w-16 shrink-0 mr-3">
                      <div
                        className="text-white px-2 py-1.5 rounded-md text-center font-semibold text-sm"
                        style={{ backgroundColor: event.color || "#6c757d" }}
                      >
                        {time}
                      </div>
                    </div>

                    <div className="grow">
                      <div className="font-semibold">{event.title}</div>
                      {event.dose != null && (
                        <div className="text-muted-foreground text-sm">
                          {event.dose} mg
                        </div>
                      )}
                      {event.notes && (
                        <div className="text-muted-foreground mt-1 text-sm">
                          {event.notes}
                        </div>
                      )}
                    </div>

                    <div className="ml-3">
                      <Badge variant="secondary" className="px-2 py-1.5">
                        {event.tablet_count}
                      </Badge>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-center">
            {t("no_events_today")}
          </p>
        )}
      </ScrollArea>
    </div>
  )
}

WeeklyEventContent.propTypes = {
  ifModal: PropTypes.bool.isRequired,
  selectedDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date),
    PropTypes.number,
    PropTypes.oneOf([undefined, null]),
  ]).isRequired,
  eventsForDay: PropTypes.array.isRequired,
  onSelectDate: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  getPastWeek: PropTypes.func.isRequired,
  getNextWeek: PropTypes.func.isRequired,
}
