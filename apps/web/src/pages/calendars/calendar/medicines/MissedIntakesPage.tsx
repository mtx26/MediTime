import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCalendarSourceMap, detectCalendarType } from '@meditime/utils';
import { useRealtimeBoxesSwitcher } from '@/hooks/realtime/useRealtimeBoxesSwitcher';
import { useLoading } from '@/components/ui/loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CalendarDays, Pill, Sun, Clock, Moon, Info, Loader2, ArrowRight } from 'lucide-react';
import NotFound from '@/pages/general/NotFound';
import { toast } from 'sonner';
import type { MissedIntakesPageProps, MissedMode, TimeOfDay, BoxItem, BoxCondition } from '@meditime/types';

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

/** Vérifie si une condition est active à une date donnée. */
const isConditionActiveAt = (cond: BoxCondition, day: Date): boolean => {
  if (!cond) return false;
  if (cond.max_date && new Date(cond.max_date) < day) return false;
  if (cond.start_date) {
    const start = new Date(cond.start_date + 'T00:00:00');
    if (day < start) return false;
  }
  return true;
};

/** Extrait les time_of_day distincts des conditions actives d'une box aux dates données (ou maintenant si absent). */
const getBoxTimes = (box: BoxItem, forDays?: Date[]): TimeOfDay[] => {
  if (!box.conditions) return [];
  const times = new Set<TimeOfDay>();
  for (const c of box.conditions) {
    if (!c.time_of_day) continue;
    // Si des jours sont fournis, vérifier que la condition est active sur au moins un jour
    if (forDays && forDays.length > 0) {
      if (!forDays.some((d) => isConditionActiveAt(c, d))) continue;
    } else {
      if (c.max_date && new Date(c.max_date) < new Date()) continue;
    }
    times.add(c.time_of_day as TimeOfDay);
  }
  return Array.from(times);
};

/** Formate une Date en "YYYY-MM-DD" en heure locale (pas UTC). */
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Estime le nombre de comprimés à réajouter pour une box donnée. */
const estimateTabletsToAdd = (
  box: BoxItem,
  days: Date[],
  filterTimes?: TimeOfDay[],
  perDayTimes?: Record<string, TimeOfDay[]>,
): number => {
  if (!box.conditions) return 0;
  let total = 0;
  for (const cond of box.conditions) {
    const tabletCount = cond.tablet_count ?? 0;
    if (tabletCount <= 0) continue;
    const intervalDays = cond.interval_days ?? 1;
    const startDate = cond.start_date ? new Date(cond.start_date + 'T00:00:00') : null;
    for (const day of days) {
      // Vérifier si la condition est active à cette date
      if (!isConditionActiveAt(cond, day)) continue;
      // Vérifier interval
      if (startDate) {
        const delta = Math.round((day.getTime() - startDate.getTime()) / 86400000);
        if (delta < 0 || delta % intervalDays !== 0) continue;
      }
      // Filtrer par moment si fourni
      if (filterTimes || perDayTimes) {
        const dayKey = toDateKey(day);
        const dayTimes = perDayTimes?.[dayKey] ?? filterTimes ?? [];
        if (cond.time_of_day && !dayTimes.includes(cond.time_of_day as TimeOfDay)) continue;
      }
      total += tabletCount;
    }
  }
  return total;
};

const TIME_ICONS: Record<TimeOfDay, typeof Sun> = {
  morning: Sun,
  noon: Clock,
  evening: Moon,
};

function MissedIntakesPage({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}: MissedIntakesPageProps) {
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const location = useLocation();
  const { t } = useTranslation();
  const { showLoading } = useLoading();

  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState<boolean | undefined>(undefined);
  const [rep, setRep] = useState<Response | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [applying, setApplying] = useState(false);

  const { calendarType } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars,
  )[calendarType];

  useRealtimeBoxesSwitcher(
    calendarType,
    calendarId ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setBoxes as any,
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
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<TimeOfDay[]>([]);
  const [customPerDay, setCustomPerDay] = useState(false);
  const [perDayTimes, setPerDayTimes] = useState<Record<string, TimeOfDay[]>>({});
  const [selectedMedIds, setSelectedMedIds] = useState<string[]>([]);

  const allTimes: TimeOfDay[] = ['morning', 'noon', 'evening'];

  // Ne garder que les boxes actives (au moins 1 condition non expirée)
  const activeBoxes = useMemo(() => boxes.filter(isBoxActive), [boxes]);

  const hasTimesSelected = customPerDay
    ? Object.values(perDayTimes).some((times) => times.length > 0)
    : selectedTimes.length > 0;

  const isValid =
    selectedDays.length > 0 &&
    (mode === 'intake' ? hasTimesSelected : selectedMedIds.length > 0);

  const resetForm = () => {
    setSelectedDays([]);
    setSelectedTimes([]);
    setSelectedMedIds([]);
    setPerDayTimes({});
    setCustomPerDay(false);
  };

  const handleApply = async () => {
    if (!calendarId || !calendarSource.applyMissedIntakes || !isValid) return;
    setApplying(true);

    const days = selectedDays.map((d) => toDateKey(d));
    const payload =
      mode === 'intake'
        ? { mode, days, ...(customPerDay ? { per_day_times: perDayTimes } : { times: selectedTimes }) }
        : { mode, days, med_ids: selectedMedIds };

    try {
      const result = await calendarSource.applyMissedIntakes(calendarId, payload);
      if (result?.success) {
        const total = (result as unknown as { total_tablets_added?: number }).total_tablets_added ?? 0;
        toast.success(t('missed_intakes.success', { count: total }));
        resetForm();
      }
    } finally {
      setApplying(false);
    }
  };

  const formatDay = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  if (loadingBoxes === undefined) return null;
  if (notFound) return <NotFound />;

  return (
    <div className="container mx-auto flex flex-col items-center gap-3 pb-20">
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
              <Card className="py-0">
                <CardContent className="flex justify-center px-2 py-1">
                  <Calendar
                    mode="multiple"
                    selected={selectedDays}
                    onSelect={(days) => setSelectedDays(days ?? [])}
                    disabled={{ after: new Date() }}
                  />
                </CardContent>
              </Card>
              {selectedDays.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {selectedDays
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((d) => (
                      <Badge key={d.toISOString()} variant="secondary">
                        {formatDay(d)}
                      </Badge>
                    ))}
                </div>
              )}
            </div>

            {/* Time selection */}
            {selectedDays.length > 0 && (
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
                    {selectedDays.sort((a, b) => a.getTime() - b.getTime()).map((day) => {
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

            {/* Summary */}
            {hasTimesSelected && selectedDays.length > 0 && (
              <div>
                <Separator className="mb-3" />
                <h5 className="font-semibold mb-1.5">{t('missed_intakes.summary')}</h5>

                {/* Per-day breakdown */}
                <div className="space-y-0.5 mb-3">
                  {selectedDays.sort((a, b) => a.getTime() - b.getTime()).map((day) => {
                    const dayKey = toDateKey(day);
                    const times = customPerDay ? (perDayTimes[dayKey] ?? []) : selectedTimes;
                    if (times.length === 0) return null;
                    return (
                      <div key={dayKey} className="text-sm flex gap-2 items-center">
                        <span className="font-medium">{formatDay(day)}</span>
                        <span className="text-muted-foreground">→</span>
                        <div className="flex gap-1">
                          {times.map((time) => (
                            <Badge key={time} variant="outline" className={`text-xs ${TIME_COLORS[time]}`}>
                              {t(time)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Affected medications with stock */}
                {(() => {
                  const affectedBoxes = activeBoxes
                    .map((box) => ({
                      box,
                      tablets: estimateTabletsToAdd(
                        box, selectedDays,
                        customPerDay ? undefined : selectedTimes,
                        customPerDay ? perDayTimes : undefined,
                      ),
                    }))
                    .filter(({ tablets }) => tablets > 0);
                  if (affectedBoxes.length === 0) return null;
                  return (
                    <>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('missed_intakes.affected_meds')}</p>
                      <Card className="py-0">
                        <CardContent className="px-4 py-2">
                          <div className="space-y-2">
                            {affectedBoxes.map(({ box, tablets }) => {
                              const newStock = box.stock_quantity + tablets;
                              return (
                                <div key={box.id}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Pill className="size-3.5 text-muted-foreground" />
                                      <span className="font-medium text-sm">{box.name}{box.dose ? ` (${box.dose} mg)` : ''}</span>
                                    </div>
                                    <div className="flex gap-1">
                                      {getBoxTimes(box, selectedDays).map((time) => (
                                        <Badge key={time} variant="outline" className={`text-[10px] py-0 px-1 ${TIME_COLORS[time]}`}>
                                          {t(time)}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5 ml-5 text-xs text-muted-foreground">
                                    <span>{t('missed_intakes.stock')}: {box.stock_quantity}</span>
                                    <ArrowRight className="size-3" />
                                    <span className="text-foreground font-medium">{newStock}</span>
                                    <Badge variant="secondary" className="text-[10px] py-0 px-1">+{tablets}</Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}

                <div className="flex items-start gap-2 mt-3 text-xs text-muted-foreground">
                  <Info className="size-4 mt-0.5 shrink-0" />
                  <span>{t('missed_intakes.info_intake')}</span>
                </div>
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
                <Card className="py-0">
                  <CardContent className="flex justify-center px-2 py-1">
                    <Calendar
                      mode="multiple"
                      selected={selectedDays}
                      onSelect={(days) => setSelectedDays(days ?? [])}
                      disabled={{ after: new Date() }}
                    />
                  </CardContent>
                </Card>
                {selectedDays.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {selectedDays
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((d) => (
                        <Badge key={d.toISOString()} variant="secondary">
                          {formatDay(d)}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            {selectedMedIds.length > 0 && selectedDays.length > 0 && (
              <div>
                <Separator className="mb-3" />
                <h5 className="font-semibold mb-1.5">{t('missed_intakes.summary')}</h5>

                {/* Days badge row */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3 text-sm">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <span className="font-medium">{selectedDays.length} {t('missed_intakes.days_count')}</span>
                </div>

                {/* Affected medications with stock */}
                {(() => {
                  const affectedBoxes = selectedMedIds
                    .map((medId) => {
                      const box = activeBoxes.find((b) => b.id === medId);
                      if (!box) return null;
                      return { box, tablets: estimateTabletsToAdd(box, selectedDays) };
                    })
                    .filter((item): item is { box: BoxItem; tablets: number } => item !== null && item.tablets > 0);
                  if (affectedBoxes.length === 0) return null;
                  return (
                    <>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">{t('missed_intakes.affected_meds')}</p>
                      <Card className="py-0">
                        <CardContent className="px-4 py-2">
                          <div className="space-y-2">
                            {affectedBoxes.map(({ box, tablets }) => {
                              const newStock = box.stock_quantity + tablets;
                              const boxTimes = getBoxTimes(box, selectedDays);
                              return (
                                <div key={box.id}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Pill className="size-3.5 text-muted-foreground" />
                                      <span className="font-medium text-sm">{box.name}{box.dose ? ` (${box.dose} mg)` : ''}</span>
                                    </div>
                                    {boxTimes.length > 0 && (
                                      <div className="flex gap-1">
                                        {boxTimes.map((time) => (
                                          <Badge key={time} variant="outline" className={`text-[10px] py-0 px-1 ${TIME_COLORS[time]}`}>
                                            {t(time)}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5 ml-5 text-xs text-muted-foreground">
                                    <span>{t('missed_intakes.stock')}: {box.stock_quantity}</span>
                                    <ArrowRight className="size-3" />
                                    <span className="text-foreground font-medium">{newStock}</span>
                                    <Badge variant="secondary" className="text-[10px] py-0 px-1">+{tablets}</Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}

                <div className="flex items-start gap-2 mt-3 text-xs text-muted-foreground">
                  <Info className="size-4 mt-0.5 shrink-0" />
                  <span>{t('missed_intakes.info_medication')}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky bottom bar */}
      {isValid && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 flex items-center justify-end max-w-2xl mx-auto">
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetForm}>
              {t('cancel')}
            </Button>
            <Button onClick={handleApply} disabled={applying}>
              {applying && <Loader2 className="size-4 mr-2 animate-spin" />}
              {t('missed_intakes.apply')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MissedIntakesPage;
