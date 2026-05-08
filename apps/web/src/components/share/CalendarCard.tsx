import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { buildPersonalCalendarActions } from '@meditime/utils';
import { useAlert } from "@/contexts/AlertContext";
import ActionSheet from '@/components/common/ActionSheet';
import { toActionSheetItems } from '@/utils/actionSheetAdapter';
import { Users } from 'lucide-react';
import TokenList from './TokenList';
import UserList from './UserList';
import type { CalendarCardProps } from '@meditime/types';

export default function CalendarCard({
  calendarId, data, personalCalendars, tokenCalendars, sharedUserCalendars, onRefresh,
}: CalendarCardProps) {
  const { t } = useTranslation();
  const { lng } = useParams();
  const navigate = useNavigate();
  const { showConfirm } = useAlert();

  const promptDeleteCalendar = () => {
    showConfirm(
      'confirm-danger',
      t("calendar.delete_title'"),
      t("calendar.delete_description"),
      async () => {
        const rep = await personalCalendars.deleteCalendar(calendarId);
        if (rep.success) {
          navigate(`/${lng}/calendars`);
        }
      }
    );
  };

  const actions = toActionSheetItems(
    buildPersonalCalendarActions(
      { calendarId, basePath: `${lng ?? 'fr'}/calendar`, selectedDate: null },
      {
        onDelete: promptDeleteCalendar,
        onExportPdf: () => personalCalendars.downloadPersonalCalendarPdf(calendarId, false),
      },
      ['rename'],
    ),
    t,
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t("shared_calendar", { name: data.calendar_name })}
        </h4>
        <ActionSheet actions={actions} />
      </div>
      <TokenList data={data} calendarId={calendarId} tokenCalendars={tokenCalendars} onRefresh={onRefresh} />
      <UserList data={data} calendarId={calendarId} sharedUserCalendars={sharedUserCalendars} onRefresh={onRefresh} />
    </div>
  );
}
