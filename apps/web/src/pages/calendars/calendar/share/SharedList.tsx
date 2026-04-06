import { useEffect, useContext, useState, useCallback } from "react";
import { UserContext } from "@/contexts/UserContext";
import { useAlert } from "@/contexts/AlertContext";
import { useLoading } from '@/components/ui/loading';
import HoveredUserProfile from "@/components/common/HoveredUserProfile";
import { toISO, buildPersonalCalendarActions } from '@meditime/utils';
import { useTranslation } from "react-i18next";
import ActionSheet from '@/components/common/ActionSheet';
import { toActionSheetItems } from '@/utils/actionSheetAdapter';
import { useSearchParams, useNavigate, useParams, Link } from "react-router-dom";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Link2, Trash2, Plus, Clipboard, Mail, User } from 'lucide-react';
import type { SharedListPageProps } from '@meditime/types';

// TODO: Replace AnyRecord usages with proper types
type AnyRecord = Record<string, any>;

const VITE_URL = import.meta.env.VITE_VITE_URL ?? '';

function SharedList({
  tokenCalendars,
  personalCalendars,
  sharedUserCalendars,
}: SharedListPageProps) {
  // 🔐 Contexte d'authentification
  const userContext = useContext(UserContext) as { userInfo?: unknown } | null;
  const userInfo = userContext?.userInfo; // Contexte de l'utilisateur connecté
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const calendarFromURL = searchParams.get('calendar');
  const navigate = useNavigate(); // Hook pour la navigation
  const { lng } = useParams<{ lng?: string }>();

  // ⚠️ Alertes et confirmations
  const { showAlert, showConfirm } = useAlert();
  const { showLoading } = useLoading();

  // 🔄 Chargement et données partagées groupées
  const [loadingGroupedShared, setLoadingGroupedShared] = useState(true); // État de chargement des partages groupés
  const [groupedShared, setGroupedShared] = useState<AnyRecord>({}); // Données groupées des partages

  // 🔗 Données liées aux partages
  const [expiresAt, setExpiresAt] = useState<AnyRecord>({}); // Dates d'expiration des liens partagés
  const [permissions, setPermissions] = useState<AnyRecord>({}); // Permissions associées aux partages
  const [emailsToInvite, setEmailsToInvite] = useState<AnyRecord>({}); // E-mails à inviter au partage
  const [selectedModifyToken, setSelectedModifyToken] = useState<string | null>(null); // Token sélectionné pour modification
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);

  // 📅 Date du jour
  const today = toISO(new Date()); // Date du jour au format 'YYYY-MM-DD'

  // 📄 Copie du lien
  const handleCopyLink = async (token: AnyRecord) => {
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
  const handleUpdateTokenExpiration = async (tokenId: string, date: string | null) => {
    await (tokenCalendars as AnyRecord).updateTokenExpiration(tokenId, date);
  };

  const promptDeleteCalendar = ({
    calendarId,
    navigate,
    personalCalendars,
    t,
    lng,
  }: AnyRecord) => {
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

  const deleteTokenConfirmAction = (tokenId: string) => {
    showConfirm(
      'confirm-danger',
      t("delete_link_title"),
      t("delete_link_description"),
      async () => {
        const rep = await (tokenCalendars as AnyRecord).deleteToken(tokenId);
        if (rep.success) {
          setSelectedModifyToken(null);
          setGroupedSharedFunction();
        }
      }
    );
  };

  const deleteLoginInvitationConfirmAction = (token: string) => {
    showConfirm(
      'confirm-danger',
      t("delete_access_title"),
      t("delete_access_description"),
      async () => {
        const rep = await (sharedUserCalendars as AnyRecord).deleteLoginInvitation(token);
        if (rep.success) {
          setGroupedSharedFunction();
        }
      }
    );
  };

  const deleteRegistrationInvitationConfirmAction = (token: string) => {
    showConfirm(
      'confirm-danger',
      t("delete_invitation_title"),
      t("delete_invitation_description"),
      async () => {
        const rep = await (sharedUserCalendars as AnyRecord).deleteRegistrationInvitation(token);
        if (rep.success) {
          setGroupedSharedFunction();
        }
      }
    );
  };

  const handleSendInvitation = async (calendarId: string) => {
    const email = emailsToInvite[calendarId];
    const rep = await (sharedUserCalendars as AnyRecord).sendInvitation(email, calendarId);
    if (rep.success) {
      setGroupedSharedFunction();
      setEmailsToInvite((prev) => ({ ...prev, [calendarId]: "" }));
    }
  };

  const handleCreateToken = async (calendarId: string) => {
    const rep = await (tokenCalendars as AnyRecord).createToken(
      calendarId,
      expiresAt[calendarId],
      permissions[calendarId],
    );
    if (rep.success) {
      setGroupedSharedFunction();
    }
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
    const rep = await (sharedUserCalendars as AnyRecord).fetchGroupedSharedCalendars();

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
    tokenCalendars.tokensList
  ]);

  // 🔄 Initialisation des permissions et des dates d'expiration
  useEffect(() => {
    if (userInfo && personalCalendars.calendarsData) {
      for (const calendar of ((personalCalendars as AnyRecord).calendarsData || [])) {
        setPermissions((prev) => ({ ...prev, [calendar.id]: "read" }));
        setExpiresAt((prev) => ({ ...prev, [calendar.id]: null }));
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

    const existsInList = (personalCalendars as AnyRecord).calendarsData?.some((c: AnyRecord) => String(c.id) === String(calendarFromURL));

    if (calendarFromURL && existsInList) {
      setSelectedCalendarId(calendarFromURL);
    } else if ((personalCalendars as AnyRecord).calendarsData?.length > 0) {
      const first = String((personalCalendars as AnyRecord).calendarsData[0].id);
      setSelectedCalendarId(first);
      setSearchParams({ calendar: first });
    }
  }, [personalCalendars, calendarFromURL, setSearchParams]);

  // Gérer l'affichage du spinner global
  useEffect(() => {
    showLoading(loadingGroupedShared, t('loading_calendars'));
  }, [loadingGroupedShared, showLoading, t]);


  if (loadingGroupedShared) {
    return null;
  }

  if (
    (personalCalendars as AnyRecord).calendarsData &&
    (personalCalendars as AnyRecord).calendarsData?.length === 0 &&
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
          {(((personalCalendars as AnyRecord)?.calendarsData || []) as AnyRecord[]).map((calendar) => (
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
                {calendar.name.length > 20 ? calendar.name.slice(0, 17) + '…' : calendar.name}
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
              data={data as AnyRecord}
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
}: AnyRecord) => {
  return toActionSheetItems(
    buildPersonalCalendarActions(
      { calendarId, lng, basePath: 'calendar', selectedDate: null },
      {
        onDelete: () =>
          promptDeleteCalendar({
            calendarId,
            navigate,
            personalCalendars,
            t,
            lng,
          }),
        onExportPdf: () => personalCalendars.downloadPersonalCalendarPdf(calendarId),
      },
      ['rename'],
    ),
    t,
  );
};

function CalendarCard({
  calendarId, data,
  handleCopyLink, handleUpdateTokenExpiration,
  deleteTokenConfirmAction, handleCreateToken, today,
  VITE_URL,
  handleSendInvitation, deleteLoginInvitationConfirmAction, deleteRegistrationInvitationConfirmAction,
  emailsToInvite, setEmailsToInvite, navigate, personalCalendars, promptDeleteCalendar,
}: AnyRecord) {
  const { t } = useTranslation();
  const { lng } = useParams();
  const tokenProps = { handleCopyLink, handleUpdateTokenExpiration, deleteTokenConfirmAction, handleCreateToken, today, VITE_URL, data, calendarId };
  const userProps = { handleSendInvitation, deleteLoginInvitationConfirmAction, deleteRegistrationInvitationConfirmAction, data, calendarId, emailsToInvite, setEmailsToInvite };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-xl font-bold flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t("shared_calendar", { name: data.calendar_name })}
        </h4>
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
      </div>
      <TokenList {...tokenProps} />
      <UserList {...userProps} />
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
}: AnyRecord) {
  const { t } = useTranslation();
  const { lng } = useParams();
  return (
    data.tokens.length !== 0 ? (
      (data.tokens || []).map((token: AnyRecord) => (
        <Card key={token.id} className="shadow">
          <CardContent>
            <h5 className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                {t("public_links")} :
              </div>
            </h5>
            <div>
              {/* Lien */}
              <div className="flex mt-1 mb-2" data-tour="share-public-links">
                <Input
                  id={"tokenLink" + token.id}
                  type="text"
                  className={`flex-1 min-w-0 rounded-r-none border-2 text-sm ${
                    token.expires_at && new Date(token.expires_at) < new Date()
                      ? "border-destructive"
                      : "border-green-500"
                  }`}
                  aria-label={t("shared_link_label")}
                  title={t("shared_link_label")}
                  value={`${VITE_URL}/${lng}/shared-token-calendar/${token.id}`}
                  readOnly
                />
                <Button
                  variant={token.expires_at && new Date(token.expires_at) < new Date() ? "destructive" : "outline"}
                  className={`rounded-l-none shrink-0 ${!(token.expires_at && new Date(token.expires_at) < new Date()) && "border-green-500 text-green-600 hover:bg-green-50"}`}
                  onClick={() => handleCopyLink(token)}
                  aria-label={t("copy_link")}
                  title={t("copy_link")}
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  className="ml-2"
                  onClick={() => deleteTokenConfirmAction(token.id)}
                  aria-label={t("delete")}
                  title={t("delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Expiration */}
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor={`tokenExpiration${token.id}`}
                  className="font-semibold whitespace-nowrap"
                >
                  {t("expiration")}:
                </label>
                <Select
                  value={token.expires_at === null ? "never" : "date"}
                  onValueChange={(value) => {
                    handleUpdateTokenExpiration(
                      token.id,
                      value === "never" ? null : today,
                    );
                  }}
                >
                  <SelectTrigger className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">{t("never")}</SelectItem>
                    <SelectItem value="date">{t("date")}</SelectItem>
                  </SelectContent>
                </Select>
                {token.expires_at && (
                  <Input
                    type="date"
                    className="w-full sm:w-auto min-w-32"
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
          </CardContent>
        </Card>
      ))
    ) : (
      <Card className="shadow">
        <CardContent>
          <h5 className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            {t("public_links")} :
          </h5>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleCreateToken(calendarId)}
            aria-label={t("create_share_link")}
            title={t("create_share_link")}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("create_share_link")}
          </Button>
        </CardContent>
      </Card>
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
}: AnyRecord) {
  const { t } = useTranslation();
  return (
    <Card className="shadow">
      <CardContent>
        <h5 className="flex items-center gap-2">
          <User className="h-4 w-4" />
          {t("shared_users")}:
        </h5>
        {/* Liste des utilisateurs partagés */}
        {(data.users || []).map((user: AnyRecord) => (
          <div className="border rounded-lg p-2 mt-2" key={user.token} data-tour="share-users-list">
            {/* Desktop: tout sur une ligne */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <HoveredUserProfile
                  user={{
                    photo_url: user.receiver_photo_url,
                    display_name: user.receiver_name,
                    email: user.receiver_email,
                  }}
                  trigger={
                    <div className="flex items-center gap-2 cursor-pointer min-w-0">
                      <img
                        src={user.receiver_photo_url}
                        alt={t("profile")}
                        className="rounded-full w-10 h-10 shrink-0"
                      />
                      <strong className="truncate">{user.receiver_name}</strong>
                    </div>
                  }
                />
              </div>
              <Badge variant={user.accepted ? "default" : "secondary"} className={user.accepted ? "bg-green-500" : "bg-yellow-500 text-foreground"}>
                {user.accepted ? t("accepted") : t("pending")}
              </Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteLoginInvitationConfirmAction(user.token)}
                aria-label={t("delete")}
                title={t("delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {/* Mobile: nom + delete, puis statut centré */}
            <div className="sm:hidden">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <HoveredUserProfile
                    user={{
                      photo_url: user.receiver_photo_url,
                      display_name: user.receiver_name,
                      email: user.receiver_email,
                    }}
                    trigger={
                      <div className="flex items-center gap-2 cursor-pointer min-w-0 max-w-[45vw]">
                        <img
                          src={user.receiver_photo_url}
                          alt={user.receiver_name}
                          className="rounded-full w-10 h-10 shrink-0"
                        />
                        <strong className="truncate block flex-1 min-w-0">
                          {user.receiver_name}
                        </strong>
                      </div>
                    }
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="shrink-0"
                  onClick={() => deleteLoginInvitationConfirmAction(user.token)}
                  aria-label={t("delete")}
                  title={t("delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center mt-2">
                <Badge variant={user.accepted ? "default" : "secondary"} className={user.accepted ? "bg-green-500" : "bg-yellow-500 text-foreground"}>
                  {user.accepted ? t("accepted") : t("pending")}
                </Badge>
              </div>
            </div>
          </div>
        ))}
        {/* Liste des utilisateurs invités */}
        {(data.invitation || []).map((invitation: AnyRecord) => {

          const displayName = invitation.invited_email || t("unknown_user");

          const avatarUrl =
            invitation.receiver_photo_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;


          return (
            <div
              className="border rounded-lg p-2 mt-2"
              key={invitation.token}
            >
              {/* Desktop: tout sur une ligne */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <img
                    src={avatarUrl}
                    alt={t("profile")}
                    className="rounded-full w-10 h-10 shrink-0"
                  />
                  <strong className="truncate">{displayName}</strong>
                </div>
                <Badge variant="secondary" className="bg-yellow-500 text-foreground">
                  {t("pending")}
                </Badge>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteRegistrationInvitationConfirmAction(invitation.token)}
                  aria-label={t("delete")}
                  title={t("delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {/* Mobile: email + delete, puis statut centré */}
              <div className="sm:hidden">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <HoveredUserProfile
                      user={{
                        photo_url: avatarUrl,
                        display_name: displayName,
                        email: null,
                      }}
                      trigger={
                        <div className="flex items-center gap-2 cursor-pointer min-w-0 max-w-[45vw]">
                          <img
                            src={avatarUrl}
                            alt={displayName}
                            className="rounded-full w-10 h-10 shrink-0"
                          />
                          <strong className="truncate block flex-1 min-w-0">
                            {displayName}
                          </strong>
                        </div>
                      }
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-auto shrink-0"
                    onClick={() => deleteRegistrationInvitationConfirmAction(invitation.token)}
                    aria-label={t("delete")}
                    title={t("delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex justify-center mt-2">
                  <Badge variant="secondary" className="bg-yellow-500 text-foreground">
                    {t("pending")}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}



        {/* Ajouter un utilisateur */}
        <form
          data-tour="share-invite-user-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendInvitation(calendarId);
          }}
          className="mt-2"
        >
          <div className="flex gap-0">
            <Input
              id={"emailToInvite" + calendarId}
              type="email"
              className="rounded-r-none"
              placeholder={t("recipient_email")}
              aria-label={t("recipient_email")}
              onChange={(e) =>
                setEmailsToInvite((prev: AnyRecord) => ({
                  ...prev,
                  [calendarId]: e.target.value,
                }))
              }
              value={emailsToInvite[calendarId] ?? ""}
              required
            />
            <Button
              className="rounded-l-none"
              aria-label={t("send_invitation")}
              title={t("send_invitation")}
              type="submit"
            >
              <Mail className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default SharedList;
