import React, { useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HoveredUserProfile from '../../components/common/HoveredUserProfile';
import { getMondayDate } from '../../utils/calendar/dateUtils';
import { getCalendarSourceMap } from '../../utils/calendar/calendarSourceMap';
import { UserContext } from '../../contexts/UserContext';
import { useAlert } from '../../contexts/AlertContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, History, RotateCcw } from 'lucide-react';

const PillboxUses = ({ personalCalendars, sharedUserCalendars, tokenCalendars }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const { lng } = params;

  const { userInfo } = useContext(UserContext);
  const { showConfirm } = useAlert();

  const [pillboxUsesData, setPillboxUsesData] = useState([]);
  const [loading, setLoading] = useState(true);

  let calendarType = 'personal';
  let calendarId = params.calendarId;

  const pathWithoutLang =
    location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

  if (pathWithoutLang.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
  } else if (pathWithoutLang.startsWith('/shared-token-calendar')) {
    calendarType = 'token';
    calendarId = params.sharedToken;
  }

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType];

  const formatWeek = (dateString) => {
    const date = new Date(dateString);
    const monday = getMondayDate(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const options = { day: 'numeric', month: 'short' };
    return `${monday.toLocaleDateString(lng, options)} - ${sunday.toLocaleDateString(lng, options)}`;
  };

  const fetchData = async () => {
    if (!calendarId) return setLoading(true);
    if (calendarType === 'personal' || calendarType === 'sharedUser') {
      if (!userInfo) return setLoading(true);
    }
    const rep = await calendarSource.fetchPillboxUses(calendarId); 
    if (rep.success) {
      setPillboxUsesData(rep.pillbox_uses);
    }
    setLoading((rep.success ? false : undefined))
  };

  const cancelUse = (useId) => {
    if (!calendarId) return;
    
    showConfirm(
      'confirm-safe',
      t('restore_pillbox_title'),
      t('restore_pillbox_description'),
      async () => {
        const res = await calendarSource.cancelUse(calendarId, useId);
        if (res.success) {
          setLoading(true);
          fetchData();
        }
      }
    );
  };

  useEffect(() => {
    fetchData();
  }, [calendarId, calendarType, userInfo]);

  if (loading === undefined && calendarId) {
    return (
      <div className="mt-5">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-center">
            {t('invalid_or_expired_link')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading === true && calendarId) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="sr-only">{t('loading_pillbox_uses')}</span>
      </div>
    );
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
              {pillboxUsesData.sort((a, b) => new Date(b.prepared_at) - new Date(a.prepared_at)).map((use) => (
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

PillboxUses.propTypes = {
  personalCalendars: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  sharedUserCalendars: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  tokenCalendars: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
};

export default PillboxUses;