import React, { useEffect, useContext, useState, useCallback } from "react";
import { UserContext } from "../../contexts/UserContext";
import PropTypes from "prop-types";
import { useAlert } from "../../contexts/AlertContext";
import HoveredUserProfile from "../../components/common/HoveredUserProfile";
import { toISO } from "../../utils/calendar/dateUtils";
import { useTranslation } from "react-i18next";
import ActionSheet from '../../components/common/ActionSheet';
import { useSearchParams, useNavigate, useParams, Link } from "react-router-dom";

const VITE_URL = import.meta.env.VITE_VITE_URL;

function SharedList({
  tokenCalendars,
  personalCalendars,
  sharedUserCalendars,
}) {
  // 🔐 Contexte d'authentification
  const { userInfo } = useContext(UserContext); // Contexte de l'utilisateur connecté
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const calendarFromURL = searchParams.get('calendar');
  const navigate = useNavigate(); // Hook pour la navigation
  const { lng } = useParams();

  // ⚠️ Alertes et confirmations
  const { showAlert, showConfirm } = useAlert();

  // 🔄 Chargement et données partagées groupées
  const [loadingGroupedShared, setLoadingGroupedShared] = useState(true); // État de chargement des partages groupés
  const [groupedShared, setGroupedShared] = useState({}); // Données groupées des partages

  // 🔗 Données liées aux partages
  const [expiresAt, setExpiresAt] = useState({}); // Dates d'expiration des liens partagés
  const [permissions, setPermissions] = useState({}); // Permissions associées aux partages
  const [expirationType, setExpirationType] = useState({});
  const [emailsToInvite, setEmailsToInvite] = useState({}); // E-mails à inviter au partage
  const [selectedModifyToken, setSelectedModifyToken] = useState(null); // Token sélectionné pour modification
  const [selectedCalendarId, setSelectedCalendarId] = useState(null);

  // 📅 Date du jour
  const today = toISO(new Date()); // Date du jour au format 'YYYY-MM-DD'

  // 📄 Copie du lien
  const handleCopyLink = async (token) => {
    try {
      await navigator.clipboard.writeText(
        `${VITE_URL}/${lng}/shared-token-calendar/${token.id}`,
      );
      showAlert('success', t("link_copied"));
    } catch {
      showAlert('danger', t("copy_link_error"));
    }
  };

  // 📅 Mise à jour de la date d'expiration
  const handleUpdateTokenExpiration = async (tokenId, date) => {
    await tokenCalendars.updateTokenExpiration(tokenId, date);
  };

  const promptDeleteCalendar = ({
    calendarId,
    navigate,
    personalCalendars,
    t,
    lng,
  }) => {
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

  const deleteTokenConfirmAction = (tokenId) => {
    showConfirm(
      'confirm-danger',
      t("delete_link_title"),
      t("delete_link_description"),
      () => handleDeleteToken(tokenId)
    );
  };

  const handleDeleteToken = async (tokenId) => {
    await tokenCalendars.deleteToken(tokenId);
    setSelectedModifyToken(null);
  };

  const deleteLoginInvitationConfirmAction = (token) => {
    showConfirm(
      'confirm-danger',
      t("delete_access_title"),
      t("delete_access_description"),
      () => handleDeleteLoginInvitation(token)
    );
  };

  const handleDeleteLoginInvitation = async (token) => {
    await sharedUserCalendars.deleteLoginInvitation(token);
  };

  const deleteRegistrationInvitationConfirmAction = (token) => {
    showConfirm(
      'confirm-danger',
      t("delete_invitation_title"),
      t("delete_invitation_description"),
      () => handledeleteRegistrationInvitation(token)
    );
  };

  const handledeleteRegistrationInvitation = async (token) => {
    const rep = await sharedUserCalendars.deleteRegistrationInvitation(token);
    if (rep.success) {
      setGroupedSharedFunction();
    }
  };

  const handleSendInvitation = async (calendarId) => {
    const email = emailsToInvite[calendarId];

    const rep = await sharedUserCalendars.sendInvitation(email, calendarId);
    if (rep.success) {
      setGroupedSharedFunction();
      setEmailsToInvite((prev) => ({ ...prev, [calendarId]: "" }));
    }
  };

  const handleCreateToken = async (calendarId) => {
    await tokenCalendars.createToken(
      calendarId,
      expiresAt[calendarId],
      permissions[calendarId],
    );
  };

  // 🔄 Fonction pour mettre à jour les info de partage
  const setGroupedSharedFunction = useCallback(async () => {
    // --- MOCK DEMO START ---
    if (calendarFromURL === 'demo') {
      setGroupedShared({
        'demo': {
          calendar_name: t("tour.calendar_name"),
          users: [
            { email: 'doctor@example.com', receiver_name: 'Dr. Smith', accepted: true, permission: 'read', receiver_photo_url: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg" },
            { email: 'family@example.com', receiver_name: 'Family Member', accepted: false, permission: 'write', receiver_photo_url: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/icons/person-circle.svg" }
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
    const rep = await sharedUserCalendars.fetchGroupedSharedCalendars();

    if (rep.success) {
      setGroupedShared(rep.grouped);
    } else {
      setGroupedShared({});
    }

    setLoadingGroupedShared(false);
  }, [sharedUserCalendars, t, calendarFromURL]);


  // 🔄 Chargement des données groupées
  useEffect(() => {
    if ((userInfo && personalCalendars.calendarsData) || calendarFromURL === 'demo') {
      setGroupedSharedFunction();
    }
  }, [
    userInfo,
    personalCalendars.calendarsData,
    tokenCalendars.tokensList,
    setGroupedSharedFunction,
    calendarFromURL
  ]);

  // 🔄 Initialisation des permissions et des dates d'expiration
  useEffect(() => {
    if (userInfo && personalCalendars.calendarsData) {
      for (const calendar of personalCalendars.calendarsData) {
        setPermissions((prev) => ({ ...prev, [calendar.id]: "read" }));
        setExpiresAt((prev) => ({ ...prev, [calendar.id]: null }));
        setExpirationType((prev) => ({ ...prev, [calendar.id]: "never" }));
      }
    }
  }, [userInfo, personalCalendars.calendarsData]);

  useEffect(() => {
    // --- MOCK DEMO START ---
    if (calendarFromURL === 'demo') {
      setSelectedCalendarId('demo');
      return;
    }
    // --- MOCK DEMO END ---

    const existsInList = personalCalendars.calendarsData?.some(c => c.id === calendarFromURL);

    if (calendarFromURL && existsInList) {
      setSelectedCalendarId(calendarFromURL);
    } else if (personalCalendars.calendarsData?.length > 0) {
      const first = personalCalendars.calendarsData[0].id;
      setSelectedCalendarId(first);
      setSearchParams({ calendar: first });
    }
  }, [personalCalendars.calendarsData, calendarFromURL]);


  if (loadingGroupedShared) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <div className="spinner-border text-primary">
          <span className="visually-hidden">{t("loading_calendars")}</span>
        </div>
      </div>
    );
  }

  if (
    personalCalendars.calendarsData &&
    personalCalendars.calendarsData?.length === 0 &&
    calendarFromURL !== 'demo'
  ) {
    return (
      <div className="container mt-4 text-center">
        <h3 className="text-muted">{t("no_calendar_found")}</h3>
        <p className="text-muted">{t("no_calendar_found_cta")}</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="mb-2 pb-2">
        <div
          className="d-flex flex-nowrap gap-2 p-1 overflow-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* --- MOCK DEMO START --- */}
          {calendarFromURL === 'demo' && (
            <Link
              key="demo"
              to="?calendar=demo"
              className="btn rounded-pill px-3 py-1 fw-semibold shadow-sm text-nowrap btn-primary"
              title={t("tour.calendar_name")}
            >
              {t("tour.calendar_name")}
            </Link>
          )}
          {/* --- MOCK DEMO END --- */}
          {(personalCalendars?.calendarsData || []).map((calendar) => (
            <Link
              key={calendar.id}
              to={`?calendar=${calendar.id}`}
              className={`btn rounded-pill px-3 py-1 fw-semibold shadow-sm text-nowrap ${
                selectedCalendarId === calendar.id ? 'btn-primary' : 'btn-outline-primary'
              }`}
              onClick={() => {
                setSelectedCalendarId(calendar.id);
              }}
              title={calendar.name}
            >
              {calendar.name.length > 20 ? calendar.name.slice(0, 17) + '…' : calendar.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="row g-4">
        {Object.entries(groupedShared)
          .filter(([calendarId]) => calendarId === selectedCalendarId)
          .map(([calendarId, data]) => (
            <CalendarCard
              key={calendarId}
              calendarId={calendarId}
              data={data}
              handleCopyLink={handleCopyLink}
              handleUpdateTokenExpiration={handleUpdateTokenExpiration}
              deleteTokenConfirmAction={deleteTokenConfirmAction}
              handleCreateToken={handleCreateToken}
              today={today}
              VITE_URL={VITE_URL}
              selectedModifyToken={selectedModifyToken}
              setSelectedModifyToken={setSelectedModifyToken}
              tokenCalendars={tokenCalendars}
              handleSendInvitation={handleSendInvitation}
              deleteLoginInvitationConfirmAction={deleteLoginInvitationConfirmAction}
              deleteRegistrationInvitationConfirmAction={deleteRegistrationInvitationConfirmAction}
              emailsToInvite={emailsToInvite}
              setEmailsToInvite={setEmailsToInvite}
              navigate={navigate}
              personalCalendars={personalCalendars}
              promptDeleteCalendar={promptDeleteCalendar}
            />
          ))}
      </div>
    </div>
  );
}

const calendarActions = ({
  calendarId,
  navigate,
  personalCalendars,
  promptDeleteCalendar,
  t,
  lng,
}) => {
  return [
    {
      label: (
        <>
          <i className="bi bi-eye me-2"></i> {t("open")}
        </>
      ),
      linkTo: `/${lng}/calendar/${calendarId}`,
      title: t("open"),
    },
    {
      label: (
        <>
          <i className="bi bi-capsule me-2"></i> {t("medicines.label")}
        </>
      ),
      linkTo: `/${lng}/calendar/${calendarId}/boxes`,
      title: t("medicines.label"),
    },
    { separator: true },
    {
      label: (
        <>
          <i className="bi bi-trash me-2"></i> {t("delete")}
        </>
      ),
      onClick: () =>
        promptDeleteCalendar({
          calendarId,
          navigate,
          personalCalendars,
          t,
          lng,
        }),
        title: t("delete"),
      danger: true,
    },
  ];
};

function CalendarCard({
  calendarId, data,
  handleCopyLink, handleUpdateTokenExpiration,
  deleteTokenConfirmAction, handleCreateToken, today,
  VITE_URL, selectedModifyToken, setSelectedModifyToken, tokenCalendars,
  handleSendInvitation, deleteLoginInvitationConfirmAction, deleteRegistrationInvitationConfirmAction,
  emailsToInvite, setEmailsToInvite, navigate, personalCalendars, promptDeleteCalendar,
}) {
  const { t } = useTranslation();
  const { lng } = useParams();
  const tokenProps = { handleCopyLink, handleUpdateTokenExpiration, deleteTokenConfirmAction, handleCreateToken, today, VITE_URL, data, calendarId, selectedModifyToken, setSelectedModifyToken, tokenCalendars };
  const userProps = { handleSendInvitation, deleteLoginInvitationConfirmAction, deleteRegistrationInvitationConfirmAction, data, calendarId, emailsToInvite, setEmailsToInvite };
  return (
    <div>
      <div className="card-body">
          <h4 className="mb-4 fw-bold justify-content-between d-flex align-items-center">
            <span>
              <i className="bi bi-people-fill me-2"></i>
              {t("shared_calendar", { name: data.calendar_name })}
            </span>
            <ActionSheet
              actions={calendarActions({
                calendarId,
                navigate,
                personalCalendars,
                promptDeleteCalendar,
                t,
                lng,
              })}
            />
          </h4>
        <TokenList {...tokenProps} />
        <UserList {...userProps} />
      </div>
    </div>
  );
}

function TokenList({
  handleCopyLink,
  handleUpdateTokenExpiration,
  deleteTokenConfirmAction,
  handleCreateToken,
  today,
  VITE_URL,
  data,
  calendarId,
  selectedModifyToken,
  setSelectedModifyToken,
  tokenCalendars,
}) {
  const { t } = useTranslation();
  const { lng } = useParams();
  return (
    data.tokens.length !== 0 ? (
      (data.tokens || []).map((token) => (
        <div className="card p-3 mb-3 shadow" key={token.id}>
          <ul className="list-group">
            <h5 className="mb-3 d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-link-45deg me-2"></i>
                {t("public_links")} :
              </div>
              <ActionSheet
                actions={[
                  {
                    label: (
                      <>
                        <i className="bi bi-trash me-2"></i> {t('delete')}
                      </>
                    ),
                    onClick: () => deleteTokenConfirmAction(token.id),
                    title: t('delete'),
                    danger: true,
                  },
                ]}
                buttonSize="sm"
              />
            </h5>
            <div key={token.id}>
              {/* Lien */}
              <div className="input-group col-md-6 mb-2" data-tour="share-public-links">
                <input
                  id={"tokenLink" + token.id}
                  type="text"
                  className={`form-control border-2 ${
                    token.expires_at && new Date(token.expires_at) < new Date()
                      ? "border-danger"
                      : "border-success"
                  }`}
                  aria-label={t("shared_link_label")}
                  title={t("shared_link_label")}
                  value={`${VITE_URL}/${lng}/shared-token-calendar/${token.id}`}
                  readOnly
                />
                <button
                  className={`btn ${
                    token.expires_at && new Date(token.expires_at) < new Date()
                      ? "btn-outline-danger"
                      : "btn-outline-success"
                  }`}
                  onClick={() => handleCopyLink(token)}
                  aria-label={t("copy_link")}
                  title={t("copy_link")}
                >
                  <i className="bi bi-clipboard"></i>
                </button>
              </div>

              {/* Expiration */}
              <div className="d-flex align-items-center gap-2 mb-2">
                <label
                  htmlFor={`tokenExpiration${token.id}`}
                  className="form-label mb-0 fw-semibold"
                >
                  {t("expiration")}:
                </label>
                <select
                  id={`tokenExpiration${token.id}`}
                  className="form-select w-auto"
                  value={token.expires_at === null ? "" : "date"}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleUpdateTokenExpiration(
                      token.id,
                      value === "" ? null : today,
                    );
                  }}
                >
                  <option value="">{t("never")}</option>
                  <option value="date">{t("date")}</option>
                </select>
                {token.expires_at && (
                  <input
                    type="date"
                    className="form-control w-auto"
                    style={{ minWidth: "130px" }}
                    value={toISO(token.expires_at)}
                    onChange={(e) =>
                      handleUpdateTokenExpiration(
                        token.id,
                        toISO(e.target.value),
                      )
                    }
                    min={toISO(today)}
                  />
                )}
              </div>
            </div>
          </ul>
        </div>
      ))
    ) : (
      <div className="card p-3 mb-3 shadow">
        <h5 className="mb-3 d-flex align-items-center">
          <i className="bi bi-link-45deg me-2"></i>
          {t("public_links")} :
        </h5>
        <button
          className="btn btn-outline-dark w-100"
          onClick={() => handleCreateToken(calendarId)}
          aria-label={t("create_share_link")}
          title={t("create_share_link")}
        >
          <i className="bi bi-plus-lg me-2"></i>
          {t("create_share_link")}
        </button>
      </div>
    )
  );
}

function UserList({
  handleSendInvitation,
  deleteLoginInvitationConfirmAction,
  deleteRegistrationInvitationConfirmAction,
  data,
  calendarId,
  emailsToInvite,
  setEmailsToInvite,
}) {
  const { t } = useTranslation();
  return (
    <div className="card p-3 shadow">
      <ul className="list-group">
        <h5>
          <i className="bi bi-person me-2"></i>
          {t("shared_users")}:
        </h5>
        {/* Liste des utilisateurs partagés */}
        {(data.users || []).map((user) => (
          <li className="list-group-item" key={user.token} data-tour="share-users-list">
            <div className="row align-items-center col-md-12 d-flex">
              <div className="col-8 d-flex align-items-center gap-2 p-0">
                <HoveredUserProfile
                  user={{
                    photo_url: user.receiver_photo_url,
                    display_name: user.receiver_name,
                    email: user.receiver_email,
                  }}
                  trigger={
                    <div className="d-flex align-items-center gap-2">
                      <div>
                        <img
                          src={user.receiver_photo_url}
                          alt={t("profile")}
                          className="rounded-circle"
                          style={{ width: "40px", height: "40px" }}
                        />
                      </div>

                      <div>
                        <strong>{user.receiver_name}</strong>
                      </div>
                    </div>
                  }
                />
              </div>

              {/* Statut */}
              <div className="col-2 d-flex align-items-center justify-content-center">
                <span
                  className={`badge rounded-pill ${user.accepted ? "bg-success" : "bg-warning text-dark"}`}
                >
                  {user.accepted ? t("accepted") : t("pending")}
                </span>
              </div>

              {/* Supprimer */}
              <div className="col-2 justify-content-end d-flex p-0">
                <ActionSheet
                  actions={[
                    {
                      label: (
                        <>
                          <i className="bi bi-trash"></i> {t('delete')}
                        </>
                      ),
                      onClick: () => deleteLoginInvitationConfirmAction(user.token),
                      title: t('delete'),
                      danger: true,
                    },
                  ]}
                  buttonSize="sm"
                />
              </div>
            </div>
          </li>
        ))}
        {/* Liste des utilisateurs invités */}
        {(data.invitation || []).map((invitation) => {

          const displayName = invitation.invited_email || t("unknown_user");

          const avatarUrl =
            invitation.receiver_photo_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;


          return (
            <li
              className="list-group-item"
              key={invitation.token}
            >
              <div className="row align-items-center col-md-12 d-flex">
                {/* Colonne gauche : image + infos */}
                <div className="col-8 d-flex align-items-center gap-2 p-0">
                  <img
                    src={avatarUrl}
                    alt={t("profile")}
                    className="rounded-circle"
                    style={{ width: "40px", height: "40px" }}
                  />
                  <div>
                    <strong>{displayName}</strong>
                  </div>
                </div>

                {/* Colonne statut */}
                <div className="col-2 d-flex align-items-center justify-content-center">
                  <span className={`badge rounded-pill bg-warning text-dark`}>
                    {t("pending")}
                  </span>
                </div>

                {/* Colonne actions */}
                <div className="col-2 d-flex justify-content-end p-0">
                  <ActionSheet
                    actions={[
                      {
                        label: (
                          <>
                            <i className="bi bi-trash"></i> {t("delete")}
                          </>
                        ),
                        onClick: () => deleteRegistrationInvitationConfirmAction(invitation.token),
                        title: t('delete'),
                        danger: true,
                      },
                    ]}
                    buttonSize="sm"
                  />
                </div>
              </div>
            </li>
          );
        })}



        {/* Ajouter un utilisateur */}
        <div>
          <div className="row align-items-center mt-2">
            <div className="col-md-12">
              <form
                data-tour="share-invite-user-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendInvitation(calendarId);
                }}
              >
                <div className="input-group ">
                  <input
                    id={"emailToInvite" + calendarId}
                    type="email"
                    className={`form-control`}
                    placeholder={t("recipient_email")}
                    aria-label={t("recipient_email")}
                    onChange={(e) =>
                      setEmailsToInvite((prev) => ({
                        ...prev,
                        [calendarId]: e.target.value,
                      }))
                    }
                    value={emailsToInvite[calendarId] ?? ""}
                    required
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendInvitation(calendarId);
                      }
                    }}
                  />
                  <button
                    className={`btn btn-primary`}
                    aria-label={t("send_invitation")}
                    title={t("send_invitation")}
                    type="submit"
                  >
                    <i className="bi bi-envelope-paper"></i>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </ul>
    </div>
  );
}

SharedList.propTypes = {
  tokenCalendars: PropTypes.shape({
    updateTokenExpiration: PropTypes.func.isRequired,
    deleteToken: PropTypes.func.isRequired,
    createToken: PropTypes.func.isRequired,
    tokensList: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  personalCalendars: PropTypes.shape({
    calendarsData: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string,
      }),
    ).isRequired,
    deleteCalendar: PropTypes.func,
  }).isRequired,
  sharedUserCalendars: PropTypes.shape({
    fetchSharedUsers: PropTypes.func.isRequired,
    deleteLoginInvitation: PropTypes.func.isRequired,
    sendInvitation: PropTypes.func.isRequired,
  }).isRequired,
};

CalendarCard.propTypes = {
  calendarId: PropTypes.string.isRequired,
  data: PropTypes.shape({
    tokens: PropTypes.array,
    users: PropTypes.array,
    calendar_name: PropTypes.string,
  }).isRequired,
  handleCopyLink: PropTypes.func.isRequired,
  handleUpdateTokenExpiration: PropTypes.func.isRequired,
  deleteTokenConfirmAction: PropTypes.func.isRequired,
  handleCreateToken: PropTypes.func.isRequired,
  today: PropTypes.string.isRequired,
  VITE_URL: PropTypes.string.isRequired,
  selectedModifyToken: PropTypes.string,
  setSelectedModifyToken: PropTypes.func.isRequired,
  tokenCalendars: PropTypes.object.isRequired,
  handleSendInvitation: PropTypes.func.isRequired,
  deleteLoginInvitationConfirmAction: PropTypes.func.isRequired,
  deleteRegistrationInvitationConfirmAction: PropTypes.func.isRequired,
  emailsToInvite: PropTypes.object.isRequired,
  setEmailsToInvite: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  personalCalendars: PropTypes.object.isRequired,
  promptDeleteCalendar: PropTypes.func.isRequired,
};

TokenList.propTypes = {
  handleCopyLink: PropTypes.func.isRequired,
  handleUpdateTokenExpiration: PropTypes.func.isRequired,
  deleteTokenConfirmAction: PropTypes.func.isRequired,
  handleCreateToken: PropTypes.func.isRequired,
  today: PropTypes.string.isRequired,
  VITE_URL: PropTypes.string.isRequired,
  data: PropTypes.shape({
    tokens: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        revoked: PropTypes.bool,
        expires_at: PropTypes.string,
      }),
    ),
    calendar_name: PropTypes.string,
  }).isRequired,
  calendarId: PropTypes.string.isRequired,
  selectedModifyToken: PropTypes.string,
  setSelectedModifyToken: PropTypes.func.isRequired,
  tokenCalendars: PropTypes.shape({
    tokensList: PropTypes.array,
  }).isRequired,
};

UserList.propTypes = {
  handleSendInvitation: PropTypes.func.isRequired,
  deleteLoginInvitationConfirmAction: PropTypes.func.isRequired,
  deleteRegistrationInvitationConfirmAction: PropTypes.func.isRequired,
  data: PropTypes.shape({
    users: PropTypes.arrayOf(
      PropTypes.shape({
        receiver_uid: PropTypes.string,
        receiver_photo_url: PropTypes.string,
        receiver_name: PropTypes.string,
        receiver_email: PropTypes.string,
        accepted: PropTypes.bool,
      }),
    ),
    calendar_name: PropTypes.string,
  }).isRequired,
  calendarId: PropTypes.string.isRequired,
  emailsToInvite: PropTypes.object.isRequired,
  setEmailsToInvite: PropTypes.func.isRequired,
};

export default SharedList;
