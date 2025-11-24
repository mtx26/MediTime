import React, { useEffect, useState, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HoveredUserProfile from '../../components/common/HoveredUserProfile';
import { getMondayDate } from '../../utils/calendar/dateUtils';
import { getCalendarSourceMap } from '../../utils/calendar/calendarSourceMap';
import { UserContext } from '../../contexts/UserContext';

const PillboxUses = ({ personalCalendars, sharedUserCalendars, tokenCalendars }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const { lng } = params;

  const { userInfo } = useContext(UserContext);

  const [pillboxUsesData, setPillboxUsesData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString(lng);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!calendarId) return setLoading(true);
      if (calendarType === 'personal' || calendarType === 'sharedUser') {
        if (!userInfo) return setLoading(true);
      }
      const rep = await calendarSource.fetchPillboxUses(calendarId); 
      if (rep.success) {
        setPillboxUsesData(rep.pillbox_uses);
        console.log('Pillbox Uses Data:', rep.pillbox_uses);
      }
      setLoading((rep.success ? false : undefined))
    };
    fetchData();
  }, [calendarId, calendarType, userInfo]);

  if (loading === undefined && calendarId) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        ❌ {t('invalid_or_expired_link')}
      </div>
    );
  }

  if (loading === true && calendarId) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary">
          <span className="visually-hidden">{t('loading_pillbox_uses')}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mt-4" style={{ maxWidth: '900px' }}>
      <h4 className="mb-3 fw-bold">
        <i className="bi bi-grid-3x3-gap me-2"></i>
        {t('pillbox_uses')}
    </h4>
      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>{t('week')}</th>
              <th>{t('prepared_by')}</th>
              <th>{t('created_at')}</th>
              <th className="text-end">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {pillboxUsesData.sort((a, b) => new Date(b.prepared_at) - new Date(a.prepared_at)).map((use) => (
              <tr key={use.id}>
                <td>{formatWeek(use.prepared_at)}</td>
                <td>
                  <HoveredUserProfile
                    user={use.prepared_by}
                    trigger={<span>{use.prepared_by.display_name}</span>}
                  />
                </td>
                <td>{formatDate(use.created_at)}</td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => console.log('Restore', use.id)}
                    title={t('restore')}
                  >
                    <i className="bi bi-arrow-counterclockwise me-1"></i>
                    {t('restore')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PillboxUses;

{/*
    setPillboxUsesData([
      {"idx":0,"id":"0c14731d-241d-4e2e-adad-1d619b17533a","calendar_id":"5aa9fff9-32c7-488f-89b7-c71004827cb4","prepared_at":"2025-12-12 00:00:00+00","prepared_by":{ display_name: "User 0bf98", email: "user_0bf98@example.com", photo_url: "https://via.placeholder.com/150" },"created_at":"2025-11-24 13:46:33.43011+00","updated_at":"2025-11-24 13:46:33.43011+00"},
      {"idx":1,"id":"40f7f9cc-e8c5-4774-b20c-c62acae7b618","calendar_id":"5aa9fff9-32c7-488f-89b7-c71004827cb4","prepared_at":"2025-12-01 00:00:00+00","prepared_by":{ display_name: "User 0bf98", email: "user_0bf98@example.com", photo_url: "https://via.placeholder.com/150" },"created_at":"2025-11-24 13:46:18.750006+00","updated_at":"2025-11-24 13:46:18.750006+00"},
      {"idx":2,"id":"43306056-4c13-47ee-b6ba-a019064a146e","calendar_id":"2ef7fcc2-5d39-4f05-af16-be9bbda35b21","prepared_at":"2025-11-17 09:17:00+00","prepared_by":{ display_name: "User 0bf98", email: "user_0bf98@example.com", photo_url: "https://via.placeholder.com/150" },"created_at":"2025-11-20 09:18:00+00","updated_at":"2025-11-20 09:18:32.826611+00"},
      {"idx":3,"id":"4541a21c-1345-457b-a51b-c644c8a315ce","calendar_id":"5aa9fff9-32c7-488f-89b7-c71004827cb4","prepared_at":"2025-11-21 00:00:00+00","prepared_by":{ display_name: "User 5d6c8", email: "user_5d6c8@example.com", photo_url: "https://via.placeholder.com/150" },"created_at":"2025-11-20 01:03:45.034247+00","updated_at":"2025-11-20 01:03:45.034247+00"},
      {"idx":4,"id":"46b816e1-0dcd-4a13-9bb9-a93ca8f90f78","calendar_id":"5aa9fff9-32c7-488f-89b7-c71004827cb4","prepared_at":"2025-11-27 00:00:00+00","prepared_by":{ display_name: "User 0bf98", email: "user_0bf98@example.com", photo_url: "https://via.placeholder.com/150" },"created_at":"2025-11-20 00:51:37.371632+00","updated_at":"2025-11-20 00:51:37.371632+00"},
      {"idx":5,"id":"4e904506-99d5-4f75-b67d-c0f2cec92ca9","calendar_id":"2ef7fcc2-5d39-4f05-af16-be9bbda35b21","prepared_at":"2025-11-30 00:00:00+00","prepared_by":{ display_name: "User 0bf98", email: "user_0bf98@example.com", photo_url: "https://via.placeholder.com/150" },"created_at":"2025-11-23 18:11:48.240223+00","updated_at":"2025-11-23 18:11:48.240223+00"},
      {"idx":6,"id":"597b0a4f-f193-4025-b48f-1287e441338d","calendar_id":"5aa9fff9-32c7-488f-89b7-c71004827cb4","prepared_at":"2025-11-14 00:00:00+00","prepared_by":{ display_name: "User 0bf98", email: "user_0bf98@example.com", photo_url: "https://via.placeholder.com/150" },"created_at":"2025-11-20 12:21:39.993992+00","updated_at":"2025-11-20 12:21:39.993992+00"},
      {"idx":7,"id":"6029712f-15d2-4383-be65-c9cc101335b3","calendar_id":"1f936bb9-d375-45d5-b5be-be3609cccaa4","prepared_at":"2025-11-29 00:00:00+00","prepared_by":{ display_name: "User 5d6c8", email: "user_5d6c8@example.com", photo_url: "https://via.placeholder.com/150" },"created_at":"2025-11-22 10:46:23.201389+00","updated_at":"2025-11-22 10:46:23.201389+00"},
      {"idx":8,"id":"9e5f9c29-beb8-4f4f-aff9-36f73c778f5c","calendar_id":"1f936bb9-d375-45d5-b5be-be3609cccaa4","prepared_at":"2025-12-12 00:00:00+00","prepared_by":{ display_name: "User 5d6c8", email: "user_5d6c8@example.com", photo_url: "https://via.placeholder.com/150" },"created_at":"2025-11-24 19:38:50.889984+00","updated_at":"2025-11-24 19:38:50.889984+00"},
      {"idx":9,"id":"ef8be80d-eb3a-4fc5-9c8e-b04c9cb30e50","calendar_id":"1f936bb9-d375-45d5-b5be-be3609cccaa4","prepared_at":"2025-12-01 00:00:00+00","prepared_by":{ display_name: "User 5d6c8", email: "user_5d6c8@example.com", photo_url: "https://via.placeholder.com/150" },"created_at":"2025-11-24 19:37:48.927224+00","updated_at":"2025-11-24 19:37:48.927224+00"}
    ]);
*/}