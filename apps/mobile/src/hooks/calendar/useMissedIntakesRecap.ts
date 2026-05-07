import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type {
  ApiResult,
  CalendarDetailSourceType,
  MissedIntakesPayload,
  MissedIntakesPreviewBox,
} from '@meditime/types';
import { useCalendarApis } from './useCalendarApis';

type PreviewResult = ApiResult & {
  boxes?: MissedIntakesPreviewBox[];
  days?: string[];
  status?: number;
};

export function useMissedIntakesRecap(sourceType: Exclude<CalendarDetailSourceType, 'token'>) {
  const { calendarId, payload: payloadParam } = useLocalSearchParams<{
    calendarId?: string;
    payload?: string;
  }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { personalCalendarsApi, sharedUserCalendarsApi } = useCalendarApis();

  const payload: MissedIntakesPayload | null = useMemo(() => {
    if (!payloadParam) return null;
    try {
      return JSON.parse(payloadParam) as MissedIntakesPayload;
    } catch {
      return null;
    }
  }, [payloadParam]);

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [previewBoxes, setPreviewBoxes] = useState<MissedIntakesPreviewBox[]>([]);
  const [previewDays, setPreviewDays] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { previewFn, applyFn } = useMemo(() => {
    if (sourceType === 'personal') {
      return {
        previewFn: personalCalendarsApi.previewPersonalMissedIntakes,
        applyFn: personalCalendarsApi.applyPersonalMissedIntakes,
      };
    }
    return {
      previewFn: sharedUserCalendarsApi.previewSharedUserMissedIntakes,
      applyFn: sharedUserCalendarsApi.applySharedUserMissedIntakes,
    };
  }, [personalCalendarsApi, sharedUserCalendarsApi, sourceType]);

  useFocusEffect(
    useCallback(() => {
      if (!payload || !calendarId) {
        setLoading(false);
        return;
      }
      let cancelled = false;
      (async () => {
        setLoading(true);
        setError(null);
        try {
          const result = (await previewFn(calendarId, payload)) as PreviewResult;
          if (cancelled) return;
          if (result.success) {
            setPreviewBoxes(result.boxes ?? []);
            setPreviewDays(result.days ?? []);
          } else {
            setError(String(t('error')));
          }
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : String(t('error')));
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [calendarId, payload, previewFn, t]),
  );

  const handleApply = async () => {
    if (!calendarId || !payload) return;
    setApplying(true);
    try {
      const result = await applyFn(calendarId, payload);
      if (result.success) {
        router.dismiss(2);
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
    error,
    handleApply,
  };
}
