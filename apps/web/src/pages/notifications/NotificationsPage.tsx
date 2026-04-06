import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import type { NotificationsPageProps } from '@meditime/types';
import { buildNotificationActions } from '@meditime/utils';
import NotificationLine from '../../components/common/NotificationLine';
import ActionSheet from '../../components/common/ActionSheet';
import { toActionSheetItems } from '@/utils/actionSheetAdapter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Info } from 'lucide-react';

function NotificationsPage({ notifications }: NotificationsPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lng } = useParams();
  const { showLoading } = useLoading();

  useEffect(() => {
    showLoading(notifications.notificationsData === null, t('loading_notifications'));
  }, [notifications.notificationsData, showLoading, t]);

  if (notifications.notificationsData === null) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-xl flex items-center gap-2">
          <Bell className="h-5 w-5" /> {t('notification.label')}
        </h4>
        <ActionSheet
          actions={toActionSheetItems(
            buildNotificationActions(
              { lng: lng! },
              {
                onMarkAllRead: () => {
                  if (notifications.notificationsData && notifications.notificationsData.length > 0 && notifications.notificationsData.some(n => !n.read)) {
                    notifications.readAllNotifications();
                  }
                },
              },
            ),
            t,
          )}
        />
      </div>

      {notifications.notificationsData.length === 0 ? (
        <Alert className="text-center">
          <Info className="h-4 w-4" />
          <AlertDescription>{t('no_notifications')}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2">
          {notifications.notificationsData.map((notif) => (
            <NotificationLine
              key={notif.notification_id}
              notif={notif}
              onRead={notifications.readNotification}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
