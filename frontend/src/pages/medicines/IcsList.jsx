import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom';
import ActionSheet from '../../components/common/ActionSheet';
import AlertSystem from '../../components/common/AlertSystem';
import { getCalendarSourceMap } from '../../utils/calendar/calendarSourceMap';

const VITE_API_URL = import.meta.env.VITE_API_URL;


function IcsList({ personalCalendars, sharedUserCalendars, tokenCalendars }) {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();

  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [tokenToDelete, setTokenToDelete] = useState(null);

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
  const showAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
  };

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    const result = await calendarSource.getTokensIcs(calendarId);
    if (result.success) {
      setTokens(result.data.tokens || []);
    } else {
      showAlert(t('ics.fetch_error'), 'danger');
    }
    setLoading(false);
  }, [calendarId, calendarSource.getTokensIcs, t]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleCreateToken = async () => {
    const result = await calendarSource.createTokenIcs(calendarId);
    if (result.success) {
      showAlert(t('ics.create_success'), 'success');
      fetchTokens();
    } else {
      showAlert(t('ics.create_error'), 'danger');
    }
  };

  const handleDeleteToken = async (tokenId) => {
    const result = await calendarSource.deleteTokenIcs(calendarId, tokenId);
    if (result.success) {
      showAlert(t('ics.delete_success'), 'success');
      fetchTokens();
    } else {
      showAlert(t('ics.delete_error'), 'danger');
    }
  };

  const openDeleteActionSheet = (token) => {
    setTokenToDelete(token.id);
    showAlert('ics.delete_confirmation', 'confirm-danger');
  };

  const handleConfirmDelete = async () => {
    if (tokenToDelete) {
      await handleDeleteToken(tokenToDelete);
      setTokenToDelete(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showAlert(t('link_copied'), 'success');
    });
  };

  const getWebcalUrl = (token) => {
    return `webcal:${VITE_API_URL}/api/calendar/${token}.ics`;
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary">
          <span className="visually-hidden">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4" style={{ maxWidth: '800px' }}>
      <AlertSystem
        message={!tokenToDelete ? alertMessage : ''}
        type={alertType}
        onClose={() => setAlertMessage('')}
        onConfirm={handleConfirmDelete}
      />
      
      <div className="mb-4">
        <h4 className="mb-3 fw-bold">
          <i className="bi bi-link-45deg me-2"></i>
          {t('ics.title')}
        </h4>
      </div>

      <div className="alert alert-info shadow-sm mb-4">
        <div className="d-flex">
          <div className="me-3">
            <i className="bi bi-info-circle-fill fs-4"></i>
          </div>
          <div>
            <h5 className="alert-heading">{t('ics.info_title')}</h5>
            <p className="mb-0">{t('ics.info_description')}</p>
          </div>
        </div>
      </div>

      {tokens.map((token) => (
        <div className="card p-3 mb-3 shadow" key={token.id}>
          <ul className="list-group">
            {tokenToDelete === token.id && (
              <AlertSystem
                message={alertMessage}
                type={alertType}
                onClose={() => {
                  setTokenToDelete(null);
                  setAlertMessage('');
                }}
                onConfirm={handleConfirmDelete}
              />
            )}
            <h5 className="mb-3 d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-link-45deg me-2"></i>
                {t('ics.token_label')}
              </div>
              <ActionSheet
                actions={[
                  {
                    label: (
                      <>
                        <i className="bi bi-trash me-2"></i> {t('delete')}
                      </>
                    ),
                    onClick: () => openDeleteActionSheet(token),
                    title: t('delete'),
                    danger: true,
                  },
                ]}
                buttonSize="sm"
              />
            </h5>
            <div>
              <div className="input-group col-md-6 mb-2">
                <input
                  type="text"
                  className="form-control border-2 border-success"
                  value={getWebcalUrl(token.token)}
                  readOnly
                  aria-label={t('ics.token_label')}
                />
                <button
                  className="btn btn-outline-success"
                  onClick={() => copyToClipboard(getWebcalUrl(token.token))}
                  title={t('copy_link')}
                  aria-label={t('copy_link')}
                >
                  <i className="bi bi-clipboard"></i>
                </button>
                <a
                  href={getWebcalUrl(token.token)}
                  className="btn btn-outline-primary"
                  title={t('open')}
                  aria-label={t('open')}
                >
                  <i className="bi bi-box-arrow-up-right"></i>
                </a>
              </div>
            </div>
          </ul>
        </div>
      ))}

      <div className="card p-3 mb-3 shadow">
        <h5 className="mb-3 d-flex align-items-center">
          <i className="bi bi-plus-circle me-2"></i>
          {t('ics.add_token')}
        </h5>
        <button
          className="btn btn-outline-dark w-100"
          onClick={handleCreateToken}
          aria-label={t('ics.add_token')}
          title={t('ics.add_token')}
        >
          <i className="bi bi-plus-lg me-2"></i>
          {t('ics.add_token')}
        </button>

      </div>
    </div>
  );
}

export default IcsList;