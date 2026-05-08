import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getCalendarSourceMap, detectCalendarType } from '@meditime/utils';
import type { MissedIntakesPageProps, MissedIntakesPayload, MissedIntakesPreviewBox } from '@meditime/types';

export function useMissedIntakesRecap({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}: MissedIntakesPageProps) {
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

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

  // Redirect if no payload
  useEffect(() => {
    if (!payload) {
      navigate('..', { relative: 'path' });
    }
  }, [payload, navigate]);

  // Call preview backend
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
        navigate('../..', { relative: 'path' });
      }
    } finally {
      setApplying(false);
    }
  };

  return {
    payload,
    loading,
    applying,
    previewBoxes,
    previewDays,
    handleApply,
  };
}
