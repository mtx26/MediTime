import { useEffect, useContext, useState, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLoading } from '@/components/ui/loading';
import { UserContext } from '@/contexts/UserContext';
import { getCalendarSourceMap, getMondayDate, toISO } from '@meditime/utils';
import isEqual from 'lodash/isEqual';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/contexts/AlertContext';
import type {
  PillboxContentProps,
  PillboxCalendarSource,
  PillboxTable,
  PillboxOrderedMed,
  PillboxTableMed,
} from '@meditime/types';

export function usePillboxData({
  type,
  selectedDate,
  calendarType,
  calendarId,
  basePath,
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
  setNotFound,
}: PillboxContentProps) {
  const { t } = useTranslation();
  const userContext = useContext(UserContext);
  const userInfo = userContext?.userInfo ?? null;
  const navigate = useNavigate();
  const { lng } = useParams();
  const [searchParams] = useSearchParams();

  const medsIdParam = searchParams.get('medsId');
  const medsId = useMemo(() =>
    medsIdParam ? JSON.parse(decodeURIComponent(medsIdParam)) as string[] : [],
    [medsIdParam]
  );

  const [calendarTable, setCalendarTable] = useState<PillboxTable>({});
  const [selectedMedIndex, setSelectedMedIndex] = useState(0);
  const [orderedMeds, setOrderedMeds] = useState<PillboxOrderedMed[]>([]);
  const [loading, setLoading] = useState<boolean | undefined>(undefined);
  const { showConfirm } = useAlert();
  const [isPillboxUsed, setIsPillboxUsed] = useState(false);
  const [pillboxError, setPillboxError] = useState(false);

  const weekDates = useMemo(() => {
    if (!selectedDate) return [];
    const base = new Date(getMondayDate(selectedDate)!);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType] as unknown as PillboxCalendarSource;

  const handleNextMed = () => {
    setSelectedMedIndex((prev) => (prev + 1 < orderedMeds.length ? prev + 1 : prev));
  };

  const handlePreviousMed = () => {
    setSelectedMedIndex((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleScheduleResponse = (rep: { success?: boolean; status?: number; table?: unknown }) => {
    if (rep.success && !isEqual(rep.table, calendarTable)) {
      setCalendarTable(rep.table as PillboxTable);
    } else if (rep.status === 404) {
      setNotFound(true);
    }
    setLoading(rep.success);
  };

  const getSchedule = async () => {
    if (!calendarId) return;
    setLoading(undefined);
    const rep = await calendarSource.fetchSchedule(calendarId, toISO(selectedDate as Date));
    handleScheduleResponse(rep);
  };

  const getScheduleNegativeStock = async () => {
    if (!calendarId) return;
    setLoading(undefined);
    const rep = await calendarSource.fetchScheduleNegativeStock(calendarId, medsId);
    handleScheduleResponse(rep);
  };

  useEffect(() => {
    if (!calendarId) return;
    if ((calendarType === 'sharedUser' || calendarType === 'personal') && !userInfo) return;

    if (medsId.length === 0) {
      getSchedule();
    } else {
      getScheduleNegativeStock();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarId, calendarSource.fetchSchedule, calendarSource.fetchScheduleNegativeStock, userInfo, selectedDate, medsId]);

  useEffect(() => {
    const time_order = ['morning', 'noon', 'evening'];
    const allMeds: PillboxOrderedMed[] = time_order.flatMap((moment) => {
      const meds: PillboxTableMed[] = calendarTable[moment] || [];
      return meds
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((med) => ({ ...med, moment }));
    });
    setOrderedMeds(allMeds);
    setSelectedMedIndex(0);
  }, [calendarTable]);

  useEffect(() => {
    const fetchPillboxUsage = async () => {
      if (!calendarId) return;
      if (!selectedDate) return;
      if (calendarType === 'personal' || calendarType === 'sharedUser') {
        if (!userInfo) return;
      }
      const rep = await calendarSource.fetchIfPillboxUsed(calendarId, toISO(selectedDate as Date));
      if (rep.success) {
        setIsPillboxUsed(rep.if_pillbox_used ?? false);
      }
    };
    fetchPillboxUsage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarId, calendarType, calendarSource.fetchIfPillboxUsed, selectedDate, userInfo]);

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(loading === undefined, t('loading_pillbox'), 'pillbox');
  }, [loading, showLoading, t]);

  const handleComplete = async () => {
    showConfirm(
      'confirm-safe',
      medsId.length === 0
        ? t('confirm_calendar_completion')
        : t('confirm_calendar_refill'),
      medsId.length === 0
        ? t('pillbox_completion_description')
        : t('pillbox_refill_description'),
      async () => {
        if (!calendarId) return;
        if (medsId.length === 0) {
          const rep = await calendarSource.decreaseStock(calendarId, toISO(selectedDate as Date));
          if (!rep.success) {
            setPillboxError(true);
          }
          if (type === 'pillbox') {
            navigate(`/${lng}/${basePath}/${calendarId}`);
          }
        } else {
          for (const medId of medsId) {
            const rep = await calendarSource.restockBox(calendarId, medId);
            if (!rep.success) {
              setPillboxError(true);
              break;
            }
          }
          if (type === 'pillbox') {
            navigate(`/${lng}/${basePath}/${calendarId}/boxes`);
          }
        }
      }
    );
  };

  return {
    t, lng, loading, weekDates, orderedMeds, selectedMedIndex,
    isPillboxUsed, pillboxError, setPillboxError, medsId,
    handleNextMed, handlePreviousMed, handleComplete,
    selectedDate, calendarId, basePath, calendarType,
  };
}
