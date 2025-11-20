// pages/PillboxPage.jsx
import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ForcedLandscapeWrapper from '../../components/common/ForcedLandscapeWrapper';
import PillboxDisplay from '../../components/calendar/PillboxDisplay';

function PillboxPage({ personalCalendars, sharedUserCalendars, tokenCalendars }) {
  const location = useLocation();
  const params = useParams();

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  const pathWithoutLang =
    location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';

  if (pathWithoutLang.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  } else if (pathWithoutLang.startsWith('/shared-token-calendar')) {
    calendarType = 'token';
    calendarId = params.sharedToken;
    basePath = 'shared-token-calendar';
  }

  const selectedDateParam = new URLSearchParams(location.search).get('date');
  const selectedDate = selectedDateParam ? new Date(selectedDateParam) : undefined;

  return (
    <ForcedLandscapeWrapper>
      <PillboxDisplay
        type="pillbox"
        selectedDate={selectedDate}
        calendarType={calendarType}
        calendarId={calendarId}
        basePath={basePath}
        personalCalendars={personalCalendars}
        sharedUserCalendars={sharedUserCalendars}
        tokenCalendars={tokenCalendars}
      />
    </ForcedLandscapeWrapper>
  );
}

export default PillboxPage;
