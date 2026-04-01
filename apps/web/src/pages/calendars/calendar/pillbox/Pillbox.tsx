// pages/PillboxPage.tsx
import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ForcedLandscapeWrapper from '@/components/common/ForcedLandscapeWrapper';
import PillboxDisplay from '@/components/calendar/PillboxDisplay';
import NotFound from '@/pages/general/NotFound';
import { CALENDAR_ROUTE_PREFIXES } from '@meditime/constants';
import type { PillboxPageProps } from '@meditime/types';

function PillboxPage({ personalCalendars, sharedUserCalendars, tokenCalendars }: PillboxPageProps) {
  const location = useLocation();
  const params = useParams<{ calendarId?: string; sharedToken?: string }>();

  const [notFound, setNotFound] = useState(false);

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  const pathWithoutLang =
    location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

  if (pathWithoutLang.startsWith(CALENDAR_ROUTE_PREFIXES.SHARED_USER)) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  } else if (pathWithoutLang.startsWith(CALENDAR_ROUTE_PREFIXES.SHARED_TOKEN)) {
    calendarType = 'token';
    calendarId = params.sharedToken;
    basePath = 'shared-token-calendar';
  }

  const selectedDateParam = new URLSearchParams(location.search).get('date');
  const selectedDate = selectedDateParam ? new Date(selectedDateParam) : undefined;

  if (notFound) {
    return <NotFound />;
  }

  return (
    <ForcedLandscapeWrapper>
      <div className='p-2'>
        <PillboxDisplay
          type="pillbox"
          selectedDate={selectedDate}
          calendarType={calendarType}
          calendarId={calendarId}
          basePath={basePath}
          personalCalendars={personalCalendars}
          sharedUserCalendars={sharedUserCalendars}
          tokenCalendars={tokenCalendars}
          setNotFound={setNotFound}
        />
      </div>
    </ForcedLandscapeWrapper>
  );
}

export default PillboxPage;
