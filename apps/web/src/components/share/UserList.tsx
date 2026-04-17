import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAlert } from "@/contexts/AlertContext";
import HoveredUserProfile from "@/components/common/HoveredUserProfile";
import StatusBadge from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Mail, User } from 'lucide-react';
import type { UserListProps, SharedCalendarUser, SharedCalendarPendingInvite } from '@meditime/types';

export default function UserList({ data, calendarId, sharedUserCalendars, onRefresh }: UserListProps) {
  const { t } = useTranslation();
  const { showConfirm } = useAlert();
  const [emailToInvite, setEmailToInvite] = useState("");

  const deleteLoginInvitationConfirmAction = (token: string) => {
    showConfirm(
      'confirm-danger',
      t("delete_access_title"),
      t("delete_access_description"),
      async () => {
        const rep = await sharedUserCalendars.deleteLoginInvitation(token);
        if (rep.success) {
          onRefresh();
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
        const rep = await sharedUserCalendars.deleteRegistrationInvitation(token);
        if (rep.success) {
          onRefresh();
        }
      }
    );
  };

  const handleSendInvitation = async () => {
    const rep = await sharedUserCalendars.sendInvitation(emailToInvite, calendarId);
    if (rep.success) {
      onRefresh();
      setEmailToInvite("");
    }
  };
  return (
    <Card className="shadow">
      <CardContent>
        <h5 className="flex items-center gap-2">
          <User className="h-4 w-4" />
          {t("shared_users")}:
        </h5>
        {/* Liste des utilisateurs partagés */}
        {(data.users || []).map((user: SharedCalendarUser) => (
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
              <StatusBadge variant={user.accepted ? "success" : "warning"} text={user.accepted ? t("accepted") : t("pending")} />
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
                <StatusBadge variant={user.accepted ? "success" : "warning"} text={user.accepted ? t("accepted") : t("pending")} />
              </div>
            </div>
          </div>
        ))}
        {/* Liste des utilisateurs invités */}
        {(data.invitation || []).map((invitation: SharedCalendarPendingInvite) => {

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
                <StatusBadge variant="warning" text={t("pending")} />
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
                  <StatusBadge variant="warning" text={t("pending")} />
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
            handleSendInvitation();
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
              onChange={(e) => setEmailToInvite(e.target.value)}
              value={emailToInvite}
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
