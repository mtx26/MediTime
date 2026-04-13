import { useEffect, useContext, useState, useCallback } from "react";
import { UserContext } from "@/contexts/UserContext";
import { useLoading } from '@/components/ui/loading';
import { useTranslation } from "react-i18next";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from '@/components/ui/button';
import CalendarCard from './components/CalendarCard';
import type { SharedListPageProps, GroupedSharedCalendars, GroupedSharedCalendarsResult } from '@meditime/types';

function SharedList({
  tokenCalendars,
  personalCalendars,
  sharedUserCalendars,
}: SharedListPageProps) {
  const userContext = useContext(UserContext) as { userInfo?: unknown } | null;
  const userInfo = userContext?.userInfo;
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const calendarFromURL = searchParams.get('calendar');
  const { showLoading } = useLoading();

  const [loadingGroupedShared, setLoadingGroupedShared] = useState(true);
  const [groupedShared, setGroupedShared] = useState<GroupedSharedCalendars>({});
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);

  const refreshGroupedShared = useCallback(async () => {
    // --- MOCK DEMO START ---
    if (calendarFromURL === 'demo') {
      setGroupedShared({
        'demo': {
          calendar_name: t("tour.calendar_name"),
          users: [
            { email: 'doctor@example.com', receiver_name: 'Dr. Smith', accepted: true, permission: 'read', receiver_photo_url: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg", token: 'demo-user-1' },
            { email: 'family@example.com', receiver_name: 'Family Member', accepted: false, permission: 'write', receiver_photo_url: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg", token: 'demo-user-2' }
          ],
          tokens: [
            { id: 'demo-token-1', token: 'demo-link-123', permission: 'read', expires_at: null, is_revoked: false }
          ]
        }
      });
      setLoadingGroupedShared(false);
      return;
    }
    // --- MOCK DEMO END ---

    setLoadingGroupedShared(true);
    const rep = await sharedUserCalendars.fetchGroupedSharedCalendars() as GroupedSharedCalendarsResult;

    if (rep.success) {
      setGroupedShared(rep.grouped);
    } else {
      setGroupedShared({});
    }

    setLoadingGroupedShared(false);
  }, [sharedUserCalendars, t, calendarFromURL]);

  useEffect(() => {
    if ((userInfo && personalCalendars.calendarsData) || calendarFromURL === 'demo') {
      refreshGroupedShared();
    }
  }, [userInfo, personalCalendars.calendarsData, tokenCalendars.tokensList]);

  useEffect(() => {
    // --- MOCK DEMO START ---
    if (calendarFromURL === 'demo') {
      setSelectedCalendarId('demo');
      return;
    }
    // --- MOCK DEMO END ---

    const existsInList = personalCalendars.calendarsData?.some((c) => String(c.id) === String(calendarFromURL));

    if (calendarFromURL && existsInList) {
      setSelectedCalendarId(calendarFromURL);
    } else if (personalCalendars.calendarsData && personalCalendars.calendarsData.length > 0) {
      const first = String(personalCalendars.calendarsData[0].id);
      setSelectedCalendarId(first);
      setSearchParams({ calendar: first });
    }
  }, [personalCalendars, calendarFromURL, setSearchParams]);

  useEffect(() => {
    showLoading(loadingGroupedShared, t('loading_calendars'));
  }, [loadingGroupedShared, showLoading, t]);

  if (loadingGroupedShared) {
    return null;
  }

  if (
    personalCalendars.calendarsData &&
    personalCalendars.calendarsData.length === 0 &&
    calendarFromURL !== 'demo'
  ) {
    return (
      <div className="container mx-auto mt-4 text-center">
        <h3 className="text-muted-foreground">{t("no_calendar_found")}</h3>
        <p className="text-muted-foreground">{t("no_calendar_found_cta")}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="mb-2 pb-2">
        <div className="flex flex-nowrap gap-2 p-1 overflow-auto scroll-smooth">
          {/* --- MOCK DEMO START --- */}
          {calendarFromURL === 'demo' && (
            <Button
              asChild
              variant="default"
              className="rounded-full px-3 py-1 font-semibold shadow-sm whitespace-nowrap"
            >
              <Link to="?calendar=demo" title={t("tour.calendar_name")}>
                {t("tour.calendar_name")}
              </Link>
            </Button>
          )}
          {/* --- MOCK DEMO END --- */}
          {(personalCalendars.calendarsData || []).map((calendar) => (
            <Button
              key={calendar.id}
              asChild
              variant={selectedCalendarId === calendar.id ? 'default' : 'outline'}
              className="rounded-full px-3 py-1 font-semibold shadow-sm whitespace-nowrap"
            >
              <Link
                to={`?calendar=${calendar.id}`}
                onClick={() => setSelectedCalendarId(calendar.id)}
                title={calendar.name}
              >
                {calendar.name.length > 20 ? calendar.name.slice(0, 17) + '...' : calendar.name}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedShared)
          .filter(([calendarId]) => calendarId === selectedCalendarId)
          .map(([calendarId, data]) => (
            <CalendarCard
              key={calendarId}
              calendarId={calendarId}
              data={data}
              personalCalendars={personalCalendars}
              tokenCalendars={tokenCalendars}
              sharedUserCalendars={sharedUserCalendars}
              onRefresh={refreshGroupedShared}
            />
          ))}
      </div>
    </div>
  );
}

export default SharedList;