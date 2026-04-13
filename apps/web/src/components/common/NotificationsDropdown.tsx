import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationLine from './NotificationLine';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell } from 'lucide-react';
import type { NotificationItem } from '@meditime/types';

interface NotificationsDropdownProps {
  lng: string;
  notificationsData: NotificationItem[] | null;
  readNotification: (notificationId: string) => void;
  readAllNotifications: () => void;
  unreadCount: number;
}

export default function NotificationsDropdown({
  lng,
  notificationsData,
  readNotification,
  readAllNotifications,
  unreadCount,
}: NotificationsDropdownProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && notificationsData && notificationsData.length > 0 && notificationsData.some((n) => !n.read)) {
          readAllNotifications();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-125">
        {notificationsData === null ? (
          <DropdownMenuItem disabled>
            {t('loading_notifications')}
          </DropdownMenuItem>
        ) : notificationsData.filter((n) => !n.read).length === 0 ? (
          <DropdownMenuItem disabled>
            {t('no_notifications')}
          </DropdownMenuItem>
        ) : (
          notificationsData
            .filter((n) => !n.read)
            .slice(0, 5)
            .map((notif: NotificationItem) => (
              <NotificationLine
                key={notif.notification_id}
                notif={notif}
                onRead={readNotification}
              />
            ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={`/${lng}/notifications`} className="w-full flex items-center justify-center gap-2">
            <Bell className="h-4 w-4" /> {t('open_notifications')}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
