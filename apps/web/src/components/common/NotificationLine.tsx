import type { ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserPlus, CheckCircle, XCircle, Trash2, AlertTriangle, ArrowRightCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import HoveredUserProfile from './HoveredUserProfile';
import { useTranslation, Trans } from 'react-i18next';
import { formatDateTime } from '@meditime/utils';
import type { NotificationLineProps } from '@meditime/types';

export default function NotificationLine({
  notif,
  onRead
}: NotificationLineProps) {
  const { t } = useTranslation();
  const { lng } = useParams();

  const isUnread = !notif.read;
  const timestamp = formatDateTime(notif.timestamp, lng);

  const user = notif.sender_name ? (
    <HoveredUserProfile
      user={{
        photo_url: notif.sender_photo_url || '',
        display_name: notif.sender_name,
        email: notif.sender_email || null,
      }}
      trigger={<strong>{notif.sender_name}</strong>}
    />
  ) : (
    <strong>{t('unknown_user')}</strong>
  );

  let icon: ReactNode = null;
  let message: ReactNode = null;
  let link: string | null = null;
  let actions: ReactNode = null;

  switch (notif.notification_type) {
    case 'calendar_invitation':
      icon = <UserPlus className="w-5 h-5 text-primary mr-2 inline" />;
      if (!notif.accepted) {
        message = (
          <Trans
            i18nKey="notif.calendar_invite"
            values={{ name: notif.calendar_name }}
            components={[user, <strong />]}
          />
        );
        actions = (
          <div className="mt-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2"
              aria-label={t('accept')}
              title={t('accept')}
              onClick={(e) => e.stopPropagation()}
            >
              <Link to={`/accept-invite?token=${notif.token}&type=login`}>
                <ArrowRightCircle className="w-4 h-4 text-green-600" />
                {t('accept')}
              </Link>
            </Button>
          </div>
        );
        link = `/accept-invite?token=${notif.token}&type=login`;
      } else {
        message = (
          <Trans
            i18nKey="notif.calendar_joined"
            values={{ name: notif.calendar_name }}
            components={[user, <strong />]}
          />
        );
        actions = (
          <div className="mt-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2"
              aria-label={t('open')}
              title={t('open')}
              onClick={(e) => e.stopPropagation()}
            >
              <Link to={`/${lng}/shared-user-calendar/${notif.calendar_id}`}>
                <ArrowRightCircle className="w-4 h-4 text-green-600" />
                {t('open')}
              </Link>
            </Button>
          </div>
        );
        link = `/${lng}/shared-user-calendar/${notif.calendar_id}`;
      }
      break;

    case 'calendar_invitation_accepted':
      icon = <CheckCircle className="w-5 h-5 text-green-600 mr-2 inline" />;
      message = (
        <Trans
          i18nKey="notif.invite_accepted"
          values={{ name: notif.calendar_name }}
          components={[user, <strong />]}
        />
      );
      break;

    case 'calendar_invitation_rejected':
      icon = <XCircle className="w-5 h-5 text-destructive mr-2 inline" />;
      message = (
        <Trans
          i18nKey="notif.invite_rejected"
          values={{ name: notif.calendar_name }}
          components={[user, <strong />]}
        />
      );
      break;

    case 'calendar_shared_deleted_by_owner':
      icon = <Trash2 className="w-5 h-5 text-destructive mr-2 inline" />;
      message = (
        <Trans
          i18nKey="notif.share_removed_by_owner"
          values={{ name: notif.calendar_name }}
          components={[user, <strong />]}
        />
      );
      break;

    case 'calendar_shared_deleted_by_receiver':
      icon = <Trash2 className="w-5 h-5 text-destructive mr-2 inline" />;
      message = (
        <Trans
          i18nKey="notif.share_removed_by_you"
          values={{ name: notif.calendar_name }}
          components={[user, <strong />]}
        />
      );
      break;

    case 'low_stock':
      icon = <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 inline" />;
      message = (
        <Trans
          i18nKey="notif.low_stock"
          values={{
            name: notif.medication_name,
            qty: notif.medication_qty,
          }}
          components={[<strong />]}
        />
      );
      link = `/${lng}/calendar/${notif.calendar_id}/stock-alerts`;
      break;

    default:
      return null;
  }

  return (
    <Card
      className={`border-l-4 p-1 transition-colors ${
        isUnread
          ? 'bg-primary/10 border-l-primary'
          : 'bg-muted/50 text-muted-foreground border-l-transparent'
      }`}
    >
      <CardContent className="p-1">
        {link ? (
          <Link
            to={link}
            onClick={(e) => {
              e.stopPropagation();
              if (isUnread) onRead(notif.notification_id);
            }}
            style={{ cursor: isUnread || link ? 'pointer' : 'default' }}
            className="no-underline block text-foreground"
            tabIndex={0}
          >
            <p className="m-0">
              {icon}
              {message}
            </p>
            {actions}
            <small className="text-muted-foreground block mt-2">{timestamp}</small>
          </Link>  
        ) : (
          <div
            onClick={() => {
              if (isUnread) onRead(notif.notification_id);
            }}
            style={{ cursor: isUnread || link ? 'pointer' : 'default' }}
            className="no-underline block text-foreground"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                if (isUnread) onRead(notif.notification_id);
              }
            }}
          >
            <p className="m-0">
              {icon}
              {message}
            </p>
            {actions}
            <small className="text-muted-foreground block mt-2">{timestamp}</small>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
