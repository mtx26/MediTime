import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCalendarSourceMap, detectCalendarType } from '@meditime/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Pill, Sun, Clock, Moon, Info, Loader2, ArrowRight, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import type { MissedIntakesPageProps, MissedIntakesPayload, MissedIntakesPreviewBox } from '@meditime/types';

const TIME_COLORS: Record<string, string> = {
  morning: 'bg-red-400/20 text-red-700 border-red-400/50',
  noon: 'bg-emerald-400/20 text-emerald-700 border-emerald-400/50',
  evening: 'bg-blue-400/20 text-blue-700 border-blue-400/50',
};

const TIME_ICONS: Record<string, typeof Sun> = {
  morning: Sun,
  noon: Clock,
  evening: Moon,
};

function MissedIntakesRecapPage({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}: MissedIntakesPageProps) {
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { calendarType } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  const calendarSource = useMemo(
    () => getCalendarSourceMap(personalCalendars, sharedUserCalendars, tokenCalendars)[calendarType],
    [personalCalendars, sharedUserCalendars, tokenCalendars, calendarType],
  );

  const payload = (location.state as { payload?: MissedIntakesPayload } | null)?.payload;

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [previewBoxes, setPreviewBoxes] = useState<MissedIntakesPreviewBox[]>([]);
  const [previewDays, setPreviewDays] = useState<string[]>([]);

  // Si pas de payload, retour à la page formulaire
  useEffect(() => {
    if (!payload) {
      navigate('..', { relative: 'path' });
    }
  }, [payload, navigate]);

  // Appeler le preview backend
  useEffect(() => {
    const previewFn = calendarSource.previewMissedIntakes;
    if (!payload || !calendarId || !previewFn) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await previewFn(calendarId, payload);
        if (cancelled) return;
        if (result?.success) {
          const data = result as unknown as {
            boxes?: MissedIntakesPreviewBox[];
            total_tablets?: number;
            days?: string[];
          };
          setPreviewBoxes(data.boxes ?? []);
          setPreviewDays(data.days ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [payload, calendarId, calendarSource]);

  const handleApply = async () => {
    if (!calendarId || !calendarSource.applyMissedIntakes || !payload) return;
    setApplying(true);

    try {
      const result = await calendarSource.applyMissedIntakes(calendarId, payload);
      if (result?.success) {
        const total = (result as unknown as { total_tablets_added?: number }).total_tablets_added ?? 0;
        toast.success(t('missed_intakes.success', { count: total }));
        // Retour 2 niveaux (recap -> missed-intakes -> calendar)
        navigate('../..', { relative: 'path' });
      }
    } finally {
      setApplying(false);
    }
  };

  const formatDay = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (!payload) return null;

  return (
    <div className="container mx-auto flex flex-col items-center gap-3">
      <div className="w-full max-w-2xl space-y-4">
        {/* Header */}
        <div>
          <h4 className="text-xl font-bold mb-0.5">{t('missed_intakes.recap_title')}</h4>
          <p className="text-sm text-muted-foreground">{t('missed_intakes.recap_subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Criteria summary */}
            <Card className="py-0">
              <CardContent className="px-4 py-3 space-y-3">
                {/* Mode */}
                <div className="flex items-center gap-2 text-sm">
                  {payload.mode === 'intake' ? <CalendarDays className="size-4 text-muted-foreground" /> : <Pill className="size-4 text-muted-foreground" />}
                  <span className="font-medium">
                    {payload.mode === 'intake' ? t('missed_intakes.mode_intake') : t('missed_intakes.mode_medication')}
                  </span>
                </div>

                <Separator />

                {/* Days */}
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {previewDays.length} {t('missed_intakes.days_count')}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {previewDays.map((day) => (
                      <Badge key={day} variant="secondary">{formatDay(day)}</Badge>
                    ))}
                  </div>
                </div>

                {/* Times (intake mode) */}
                {payload.mode === 'intake' && payload.times && payload.times.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-1.5">
                      {payload.times.map((time) => {
                        const Icon = TIME_ICONS[time];
                        return (
                          <Badge key={time} variant="outline" className={`gap-1 ${TIME_COLORS[time]}`}>
                            {Icon && <Icon className="size-3.5" />}
                            {t(time)}
                          </Badge>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Affected medications */}
            {previewBoxes.length > 0 ? (
              <div className="space-y-2">
                <h5 className="font-semibold">{t('missed_intakes.affected_meds')}</h5>
                <div className="space-y-1.5">
                  {previewBoxes.map((box) => (
                    <Card key={box.box_id} className="py-0">
                      <CardContent className="px-4 py-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Pill className="size-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {box.name}{box.dose ? ` (${box.dose} mg)` : ''}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">+{box.tablets_to_add}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 ml-6 text-xs text-muted-foreground">
                          <span>{box.old_stock}</span>
                          <ArrowRight className="size-3" />
                          <span className="text-foreground font-medium">{box.new_stock}</span>
                          {box.times_of_day.length > 0 && (
                            <div className="flex gap-1 ml-auto">
                              {box.times_of_day.map((time) => (
                                <Badge key={time} variant="outline" className={`text-[10px] py-0 px-1 ${TIME_COLORS[time] ?? ''}`}>
                                  {t(time)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="py-0">
                <CardContent className="px-4 py-8 text-center text-muted-foreground text-sm">
                  {t('missed_intakes.no_affected_meds')}
                </CardContent>
              </Card>
            )}

            {/* Info */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2.5">
              <Info className="size-4 mt-0.5 shrink-0" />
              <span>
                {payload.mode === 'intake'
                  ? t('missed_intakes.info_intake')
                  : t('missed_intakes.info_medication')}
              </span>
            </div>

            {/* Actions */}
            {previewBoxes.length > 0 && (
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button onClick={handleApply} disabled={applying}>
                  {applying && <Loader2 className="size-4 mr-2 animate-spin" />}
                  {t('missed_intakes.apply')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default MissedIntakesRecapPage;
