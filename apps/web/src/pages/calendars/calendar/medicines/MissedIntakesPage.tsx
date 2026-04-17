import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCalendarSourceMap, detectCalendarType } from '@meditime/utils';
import { useRealtimeBoxesSwitcher } from '@/hooks/realtime/useRealtimeBoxesSwitcher';
import { useLoading } from '@/components/ui/loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CalendarDays, Pill, Sun, Clock, Moon, ArrowRight } from 'lucide-react';
import DateSelectionCalendar from '@/components/medicines/DateSelectionCalendar';
import NotFound from '@/pages/general/NotFound';
import type { MissedIntakesPageProps, MissedMode, TimeOfDay, BoxItem, MissedSelectionMode } from '@meditime/types';

const TIME_COLORS: Record<TimeOfDay, string> = {
  morning: 'bg-red-400/20 text-red-700 border-red-400/50',
  noon: 'bg-emerald-400/20 text-emerald-700 border-emerald-400/50',
  evening: 'bg-blue-400/20 text-blue-700 border-blue-400/50',
};

/** Retourne true si la box a au moins une condition active (non expirée). */
const isBoxActive = (box: BoxItem): boolean => {
  if (!box.conditions || box.conditions.length === 0) return true;
  const now = new Date();
  return box.conditions.some((c) => {
    if (!c.max_date) return true;
    return new Date(c.max_date) >= now;
  });
};

/** Extrait les time_of_day distincts des conditions actives d'une box. */
const getBoxTimes = (box: BoxItem): TimeOfDay[] => {
  if (!box.conditions) return [];
  const times = new Set<TimeOfDay>();
  for (const c of box.conditions) {
    if (!c.time_of_day) continue;
    if (c.max_date && new Date(c.max_date) < new Date()) continue;
    times.add(c.time_of_day as TimeOfDay);
  }
  return Array.from(times);
};

/** Formate une Date en "YYYY-MM-DD" en heure locale (pas UTC). */
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const TIME_ICONS: Record<TimeOfDay, typeof Sun> = {
  morning: Sun,
  noon: Clock,
  evening: Moon,
};

/** Génère toutes les dates entre from et to (inclus). */
const expandRange = (from: Date, to: Date): Date[] => {
  const days: Date[] = [];
  const current = new Date(from);
  current.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

function MissedIntakesPage({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}: MissedIntakesPageProps) {
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showLoading } = useLoading();

  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState<boolean | undefined>(undefined);
  const [rep, setRep] = useState<Response | null>(null);
  const [notFound, setNotFound] = useState(false);

  const { calendarType } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  getCalendarSourceMap(personalCalendars, sharedUserCalendars, tokenCalendars)[calendarType];

  useRealtimeBoxesSwitcher(
    calendarType,
    calendarId ?? null,
    setBoxes,
    setLoadingBoxes,
    setRep,
  );

  useEffect(() => {
    if (rep && (rep as unknown as { status?: number }).status === 404) {
      setNotFound(true);
      setLoadingBoxes(false);
    }
  }, [rep]);

  useEffect(() => {
    showLoading(Boolean(loadingBoxes === undefined), t('missed_intakes.loading'));
  }, [loadingBoxes, showLoading, t]);

  // --- Form state ---
  const [mode, setMode] = useState<MissedMode>('intake');
  const [selectionMode, setSelectionMode] = useState<MissedSelectionMode>('individual');
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date } | undefined>(undefined);
  const [selectedTimes, setSelectedTimes] = useState<TimeOfDay[]>([]);
  const [customPerDay, setCustomPerDay] = useState(false);
  const [perDayTimes, setPerDayTimes] = useState<Record<string, TimeOfDay[]>>({});
  const [selectedMedIds, setSelectedMedIds] = useState<string[]>([]);

  // Les jours effectifs (merge des deux modes de sélection)
  const effectiveDays = useMemo(() => {
    if (selectionMode === 'range' && dateRange?.from) {
      return expandRange(dateRange.from, dateRange.to ?? dateRange.from);
    }
    return selectedDays;
  }, [selectionMode, selectedDays, dateRange]);

  const allTimes: TimeOfDay[] = ['morning', 'noon', 'evening'];

  // Ne garder que les boxes actives (au moins 1 condition non expirée)
  const activeBoxes = useMemo(() => boxes.filter(isBoxActive), [boxes]);

  const hasTimesSelected = customPerDay
    ? Object.values(perDayTimes).some((times) => times.length > 0)
    : selectedTimes.length > 0;

  const isValid =
    effectiveDays.length > 0 &&
    (mode === 'intake' ? hasTimesSelected : selectedMedIds.length > 0);

  const handleNext = () => {
    const days = effectiveDays.map((d) => toDateKey(d));
    const payload =
      mode === 'intake'
        ? { mode, days, ...(customPerDay ? { per_day_times: perDayTimes } : { times: selectedTimes }) }
        : { mode, days, med_ids: selectedMedIds };

    navigate('recap', { state: { payload } });
  };

  const formatDay = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  if (loadingBoxes === undefined) return null;
  if (notFound) return <NotFound />;

  return (
    <div className="container mx-auto flex flex-col items-center gap-3">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <h4 className="text-xl font-bold mb-0.5">{t('missed_intakes.title')}</h4>
        <p className="text-sm text-muted-foreground mb-3">{t('missed_intakes.subtitle')}</p>

        {/* Mode selector */}
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as MissedMode)} className="mb-4 grid grid-cols-2 gap-2">
          <Card className={`cursor-pointer transition-colors py-0 ${mode === 'intake' ? 'border-primary' : ''}`} onClick={() => setMode('intake')}>
            <CardContent className="flex items-center gap-2 px-3 py-2.5">
              <RadioGroupItem value="intake" id="mode-intake" />
              <CalendarDays className="size-4 text-muted-foreground" />
              <Label htmlFor="mode-intake" className="cursor-pointer font-medium text-sm">{t('missed_intakes.mode_intake')}</Label>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-colors py-0 ${mode === 'medication' ? 'border-primary' : ''}`} onClick={() => setMode('medication')}>
            <CardContent className="flex items-center gap-2 px-3 py-2.5">
              <RadioGroupItem value="medication" id="mode-med" />
              <Pill className="size-4 text-muted-foreground" />
              <Label htmlFor="mode-med" className="cursor-pointer font-medium text-sm">{t('missed_intakes.mode_medication')}</Label>
            </CardContent>
          </Card>
        </RadioGroup>

        <Separator className="mb-4" />

        {/* ============ MODE 1: Oubli de prise ============ */}
        {mode === 'intake' && (
          <div className="space-y-4">
            {/* Calendar */}
            <div>
              <h5 className="font-semibold mb-1.5">{t('missed_intakes.select_days')}</h5>
              <DateSelectionCalendar
                selectionMode={selectionMode}
                onSelectionModeChange={setSelectionMode}
                selectedDays={selectedDays}
                onSelectedDaysChange={setSelectedDays}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                effectiveDays={effectiveDays}
              />
            </div>

            {/* Time selection */}
            {effectiveDays.length > 0 && (
              <div>
                <h5 className="font-semibold mb-1.5">{t('missed_intakes.select_times')}</h5>

                {!customPerDay && (
                  <ToggleGroup type="multiple" variant="outline" value={selectedTimes} onValueChange={(v) => setSelectedTimes(v as TimeOfDay[])}>
                    {allTimes.map((time) => {
                      const Icon = TIME_ICONS[time];
                      return (
                        <ToggleGroupItem key={time} value={time} className={`gap-1.5 px-4 ${selectedTimes.includes(time) ? TIME_COLORS[time] : ''}`}>
                          <Icon className="size-4" />
                          {t(time)}
                        </ToggleGroupItem>
                      );
                    })}
                  </ToggleGroup>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <Checkbox
                    id="custom-per-day"
                    checked={customPerDay}
                    onCheckedChange={(v) => setCustomPerDay(!!v)}
                  />
                  <Label htmlFor="custom-per-day" className="text-sm cursor-pointer">
                    {t('missed_intakes.customize_per_day')}
                  </Label>
                </div>

                {customPerDay && (
                  <div className="space-y-2 mt-3">
                    {effectiveDays.sort((a, b) => a.getTime() - b.getTime()).map((day) => {
                      const dayKey = toDateKey(day);
                      const dayTimes = perDayTimes[dayKey] ?? [];
                      return (
                        <Card key={dayKey} className="py-0">
                          <CardContent className="flex items-center gap-3 px-3 py-1.5 flex-wrap">
                            <span className="text-sm font-medium min-w-17.5">{formatDay(day)}</span>
                            <ToggleGroup type="multiple" variant="outline" size="sm" value={dayTimes} onValueChange={(v) => setPerDayTimes((p) => ({ ...p, [dayKey]: v as TimeOfDay[] }))}>
                              {allTimes.map((time) => {
                                const Icon = TIME_ICONS[time];
                                return (
                                  <ToggleGroupItem key={time} value={time} className={`gap-1 px-2.5 ${dayTimes.includes(time) ? TIME_COLORS[time] : ''}`}>
                                    <Icon className="size-3.5" />
                                    {t(time)}
                                  </ToggleGroupItem>
                                );
                              })}
                            </ToggleGroup>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============ MODE 2: Médicament indisponible ============ */}
        {mode === 'medication' && (
          <div className="space-y-4">
            {/* Medication selector */}
            <div>
              <h5 className="font-semibold mb-1.5">{t('missed_intakes.select_medication')}</h5>
              <div className="space-y-1.5">
                {activeBoxes.map((box) => {
                  const selected = selectedMedIds.includes(box.id);
                  const boxTimes = getBoxTimes(box);
                  return (
                    <Card
                      key={box.id}
                      className={`cursor-pointer transition-colors py-0 ${selected ? 'border-primary' : ''}`}
                      onClick={() => setSelectedMedIds((prev) => selected ? prev.filter((id) => id !== box.id) : [...prev, box.id])}
                    >
                      <CardContent className="flex items-center gap-3 px-4 py-2">
                        <Checkbox checked={selected} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{box.name}{box.dose ? ` (${box.dose} mg)` : ''}</span>
                            <span className="text-muted-foreground text-xs">{t('missed_intakes.stock')}: {box.stock_quantity}</span>
                          </div>
                          {boxTimes.length > 0 && (
                            <div className="flex gap-1 mt-0.5">
                              {boxTimes.map((time) => {
                                const Icon = TIME_ICONS[time];
                                return (
                                  <Badge key={time} variant="outline" className={`text-xs py-0 gap-1 ${TIME_COLORS[time]}`}>
                                    <Icon className="size-3" />
                                    {t(time)}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Period */}
            {selectedMedIds.length > 0 && (
              <div>
                <h5 className="font-semibold mb-1.5">{t('missed_intakes.select_period')}</h5>
                <DateSelectionCalendar
                  selectionMode={selectionMode}
                  onSelectionModeChange={setSelectionMode}
                  selectedDays={selectedDays}
                  onSelectedDaysChange={setSelectedDays}
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  effectiveDays={effectiveDays}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {isValid && (
        <div className="w-full max-w-2xl border-t p-3 flex items-center justify-end">
          <Button onClick={handleNext}>
            {t('missed_intakes.next')}
            <ArrowRight className="size-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default MissedIntakesPage;
