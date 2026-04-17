import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getCalendarSourceMap, detectCalendarType } from '@meditime/utils';
import { useRealtimeBoxesSwitcher } from '@/hooks/realtime/useRealtimeBoxesSwitcher';
import { useLoading } from '@/components/ui/loading';
import { Sun, Clock, Moon } from 'lucide-react';
import type { MissedIntakesPageProps, MissedMode, TimeOfDay, BoxItem } from '@meditime/types';

export const TIME_ICONS: Record<TimeOfDay, typeof Sun> = {
  morning: Sun,
  noon: Clock,
  evening: Moon,
};

const isBoxActive = (box: BoxItem): boolean => {
  if (!box.conditions || box.conditions.length === 0) return true;
  const now = new Date();
  return box.conditions.some((c) => {
    if (!c.max_date) return true;
    return new Date(c.max_date) >= now;
  });
};

export const getBoxTimes = (box: BoxItem): TimeOfDay[] => {
  if (!box.conditions) return [];
  const times = new Set<TimeOfDay>();
  for (const c of box.conditions) {
    if (!c.time_of_day) continue;
    if (c.max_date && new Date(c.max_date) < new Date()) continue;
    times.add(c.time_of_day as TimeOfDay);
  }
  return Array.from(times);
};

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const formatDay = (d: Date) =>
  d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

export function useMissedIntakes({
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

  const { calendarType } = detectCalendarType(location.pathname);
  const calendarId = calendarType === 'token' ? params.sharedToken : params.calendarId;

  getCalendarSourceMap(personalCalendars, sharedUserCalendars, tokenCalendars)[calendarType];

  useRealtimeBoxesSwitcher(calendarType, calendarId ?? null, setBoxes, setLoadingBoxes, setRep);

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

  const activeBoxes = useMemo(() => boxes.filter(isBoxActive), [boxes]);

  return {
    mode,
    setMode,
    loadingBoxes,
    notFound,
    activeBoxes,
  };
}
