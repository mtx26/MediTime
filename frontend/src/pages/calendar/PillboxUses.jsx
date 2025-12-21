import React, { useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HoveredUserProfile from '../../components/common/HoveredUserProfile';
import { getMondayDate } from '../../utils/calendar/dateUtils';
import { getCalendarSourceMap } from '../../utils/calendar/calendarSourceMap';
import { UserContext } from '../../contexts/UserContext';
import { useAlert } from '../../contexts/AlertContext';

const PillboxUses = ({ personalCalendars, sharedUserCalendars, tokenCalendars }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const { lng } = params;

  const { userInfo } = useContext(UserContext);
  const { showAlert, showConfirm } = useAlert();

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
          showAlert('success', res.message || t('pillbox_restored'));
          setLoading(true);
          fetchData();
        } else {
          showAlert('danger', res.error || t('restore_error'));
        }
      }
    );
  };

  useEffect(() => {
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
    <div className="container mt-4" style={{ maxWidth: '700px' }}>
      <h4 className="mb-3 fw-bold">
        <i className="bi bi-grid-3x3-gap me-2"></i>
        {t('pillbox_uses')}
    </h4>
      {pillboxUsesData.length === 0 ? (
        <div className="text-center py-5">
          <div className="text-muted mb-3">
            <i className="bi bi-clock-history display-1 opacity-25"></i>
          </div>
          <p className="lead text-muted mb-4">
            {t("you_have_no_pillbox_use_history")}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>{t('week')}</th>
                <th>{t('prepared_by')}</th>
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
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => cancelUse(use.id)}
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
      )}
    </div>
  );
};

PillboxUses.propTypes = {
  personalCalendars: PropTypes.array,
  sharedUserCalendars: PropTypes.array,
  tokenCalendars: PropTypes.array,
};

export default PillboxUses;