import { useEffect, useState, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import HoveredUserProfile from '@/components/common/HoveredUserProfile';
import { getMondayDate } from '@meditime/utils';
import { getCalendarSourceMap } from '@meditime/utils';
import { UserContext } from '@/contexts/UserContext';
import { useAlert } from '@/contexts/AlertContext';
import { Button } from '@/components/ui/button';
import { History, RotateCcw } from 'lucide-react';
import NotFound from '@/pages/general/NotFound';
import { CALENDAR_ROUTE_PREFIXES } from '@meditime/constants';
import type {
  PillboxSource,
  PillboxUseItem,
  PillboxUsesPageProps,
} from '@meditime/types';

const PillboxUses = ({ personalCalendars, sharedUserCalendars, tokenCalendars }: PillboxUsesPageProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams<{ lng?: string; calendarId?: string; sharedToken?: string }>();
  const { lng } = params;

  const { userInfo } = useContext(UserContext);
  const { showConfirm } = useAlert();

  const [pillboxUsesData, setPillboxUsesData] = useState<PillboxUseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  let calendarType: 'personal' | 'sharedUser' | 'token' = 'personal';
  let calendarId = params.calendarId;

  const pathWithoutLang =
    location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

  if (pathWithoutLang.startsWith(CALENDAR_ROUTE_PREFIXES.SHARED_USER)) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
  } else if (pathWithoutLang.startsWith(CALENDAR_ROUTE_PREFIXES.SHARED_TOKEN)) {
    calendarType = 'token';
    calendarId = params.sharedToken;
  }

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType] as unknown as PillboxSource;

  const formatWeek = (dateString: string) => {
    const date = new Date(dateString);
    const monday = getMondayDate(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const locale = lng ?? 'en';
    return `${monday.toLocaleDateString(locale, options)} - ${sunday.toLocaleDateString(locale, options)}`;
  };

  const fetchData = async () => {
    if (!calendarId) return setLoading(true);
    if (calendarType === 'personal' || calendarType === 'sharedUser') {
      if (!userInfo) return setLoading(true);
    }
    const rep = await calendarSource.fetchPillboxUses(calendarId);
    if (rep.success) {
      setPillboxUsesData(rep.pillbox_uses ?? []);
      setLoading(false);
    } else {
      console.error('Error fetching pillbox uses:', rep.status);
      if (rep.status === 404) {
        setNotFound(true);
      }
      setLoading(false);
    }
  };

  const cancelUse = (useId: string | number) => {
    if (!calendarId) return;
    
    showConfirm(
      'confirm-safe',
      t('restore_pillbox_title'),
      t('restore_pillbox_description'),
      async () => {
        const res = await calendarSource.cancelUse(calendarId, useId);
        if (res.success) {
          setLoading(true);
          void fetchData();
        }
      }
    );
  };

  useEffect(() => {
    void fetchData();
  }, [calendarId, calendarType, userInfo]);

  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(Boolean(loading === true && calendarId), t('loading_pillbox_uses'));
  }, [loading, calendarId, showLoading, t, notFound]);

  if (loading === true && calendarId) {
    return null;
  }

  if (notFound) {
    return <NotFound />;
  }
  
  return (
    <div className="max-w-175 mx-auto">
      <h4 className="mb-3 font-bold flex items-center gap-2">
        <History className="h-5 w-5" />
        {t('pillbox_uses')}
      </h4>
      {pillboxUsesData.length === 0 ? (
        <div className="text-center py-12">
          <History className="h-16 w-16 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg text-muted-foreground mb-4">
            {t('you_have_no_pillbox_use_history')}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t('week')}</th>
                <th className="px-4 py-3 text-left font-semibold">{t('prepared_by')}</th>
                <th className="px-4 py-3 text-right font-semibold">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pillboxUsesData.sort((a, b) => new Date(b.prepared_at).getTime() - new Date(a.prepared_at).getTime()).map((use) => (
                <tr key={use.id} className="hover:bg-muted/50 transition">
                  <td className="px-4 py-3">{formatWeek(use.prepared_at)}</td>
                  <td className="px-4 py-3">
                    <HoveredUserProfile
                      user={use.prepared_by}
                      trigger={<span>{use.prepared_by.display_name}</span>}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelUse(use.id)}
                      title={t('restore')}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      {t('restore')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PillboxUses;