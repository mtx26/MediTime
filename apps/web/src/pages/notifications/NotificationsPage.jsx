import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLoading } from '@/components/ui/loading';
import PropTypes from 'prop-types';
import NotificationLine from '../../components/common/NotificationLine';
import ActionSheet from '../../components/common/ActionSheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Settings, Info } from 'lucide-react';

function NotificationsPage({ notifications }) {
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
          actions={[
            {
              label: (
                <>
                  <Bell className="h-4 w-4 mr-2" /> {t('notification.mark_all_read')}
                </>
              ),
              onClick: () => {
                if (notifications.notificationsData && notifications.notificationsData.length > 0 && notifications.notificationsData.some(n => !n.read)) {
                  notifications.readAllNotifications();
                }
              },
              title: t('notification.mark_all_read')
            },
            {
              label: (
                <>
                  <Settings className="h-4 w-4 mr-2" /> {t('settings.label')}
                </>
              ),
              linkTo: `/${lng}/settings?tab=notifications`,
              title: t('settings.label')
            },
          ]}
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

NotificationsPage.propTypes = {
  notifications: PropTypes.shape({
    notificationsData: PropTypes.array,
    readNotification: PropTypes.func,
  }).isRequired,
};

export default NotificationsPage;
