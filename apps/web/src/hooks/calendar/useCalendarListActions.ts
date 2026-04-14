import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLoading } from '@/components/ui/loading';
import { useTranslation } from 'react-i18next';
import { useAlert } from '@/contexts/AlertContext';
import type { CalendarListPageProps } from '@meditime/types';

export function useCalendarListActions({
  personalCalendars,
  sharedUserCalendars,
}: CalendarListPageProps) {
  const { lng } = useParams();
  const { t } = useTranslation();
  const { showConfirm } = useAlert();

  const [renameValues, setRenameValues] = useState<Record<string, string>>({});
  const [renameMode, setRenameMode] = useState<string | null>(null);

  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfCalendarId, setPdfCalendarId] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const openPdfDialog = (calendarId: string) => {
    setPdfCalendarId(calendarId);
    setIncludeInactive(false);
    setPdfDialogOpen(true);
  };

  const handleDownloadPdf = () => {
    if (pdfCalendarId) {
      personalCalendars.downloadPersonalCalendarPdf(pdfCalendarId, includeInactive);
    }
    setPdfDialogOpen(false);
  };

  const renameConfirmAction = async (calendarId: string) => {
    const rep = await personalCalendars.renameCalendar(
      calendarId,
      renameValues[String(calendarId)]
    );
    if (rep.success) {
      setRenameValues((prev) => ({ ...prev, [String(calendarId)]: '' }));
    }
  };

  const handleRenameClick = (calendarId: string) => {
    showConfirm(
      'confirm-safe',
      t('calendar.rename_title'),
      t('calendar.rename_description'),
      () => renameConfirmAction(calendarId)
    );
  };

  const handleDeleteCalendarClick = (calendarId: string) => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_title'),
      t('calendar.delete_description'),
      async () => { await personalCalendars.deleteCalendar(calendarId); }
    );
  };

  const handleDeleteSharedCalendarClick = (calendarId: string) => {
    showConfirm(
      'confirm-danger',
      t('calendar.delete_shared_title'),
      t('calendar.delete_shared_description'),
      async () => { await sharedUserCalendars.deleteSharedCalendar(calendarId); }
    );
  };

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(personalCalendars.calendarsData === null, t('loading_calendars'));
  }, [personalCalendars.calendarsData, showLoading, t]);

  return {
    t, lng,
    renameValues, setRenameValues, renameMode, setRenameMode,
    pdfDialogOpen, setPdfDialogOpen, includeInactive, setIncludeInactive,
    openPdfDialog, handleDownloadPdf, handleRenameClick,
    handleDeleteCalendarClick, handleDeleteSharedCalendarClick,
    personalCalendars, sharedUserCalendars,
  };
}
