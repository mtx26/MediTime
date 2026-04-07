import { useContext, useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../../contexts/UserContext';
import { computeMobileBottomOffset } from '@meditime/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Share2, Bell, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_BASE = 'mb-1 shrink-0 text-muted-foreground group-hover:text-primary !size-[36px]';
const ICON_STYLE: CSSProperties = { width: 36, height: 36, flexShrink: 0 };
const ITEM_BASE = 'inline-flex flex-col items-center justify-center h-full px-7 hover:bg-accent/50 group';

function NavItem({ to, label, icon: Icon, isActive, customIcon }: {
  to: string;
  label: string;
  icon?: LucideIcon;
  isActive: boolean;
  customIcon?: ReactNode;
}) {
  return (
    <Button variant="ghost" asChild className={ITEM_BASE}>
      <Link
        to={to}
        className={isActive ? 'bg-secondary rounded-xl' : ''}
        aria-current={isActive ? 'page' : undefined}
        aria-label={label}
      >
        {customIcon ?? (
          Icon && <Icon className={`${ICON_BASE} ${isActive ? 'text-primary' : ''}`} style={ICON_STYLE} />
        )}
        <span className="sr-only">{label}</span>
      </Link>
    </Button>
  );
}

function MobileNavBar() {
  const { lng = 'en' } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const userContext = useContext(UserContext);
  const userInfo = userContext?.userInfo;
  const [bottomOffset, setBottomOffset] = useState(0);

  useEffect(() => {
    const computeOffset = () => {
      const vv = window.visualViewport;
      const layoutH = window.innerHeight;
      setBottomOffset(
        computeMobileBottomOffset(
          layoutH,
          vv?.height,
          vv?.offsetTop
        )
      );
    };
    computeOffset();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', computeOffset);
    vv?.addEventListener('scroll', computeOffset);
    window.addEventListener('resize', computeOffset);
    return () => {
      vv?.removeEventListener('resize', computeOffset);
      vv?.removeEventListener('scroll', computeOffset);
      window.removeEventListener('resize', computeOffset);
    };
  }, []);

  const isActive = (path: string): boolean => location.pathname.startsWith(path);

  const settingsPath = `/${lng}/settings`;
  const settingsActive = isActive(settingsPath);

  const nav = (
    <nav
      className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-10 pb-[env(safe-area-inset-bottom)]"
      style={{ bottom: bottomOffset }}
    >
      <div className="w-[min(100vw-8px,40rem)] mx-auto px-2">
        <div className="grid h-20 grid-cols-4 bg-background border rounded-2xl shadow-lg font-medium">
        <NavItem to={`/${lng}/calendars`} label={t('calendars')} icon={Calendar} isActive={isActive(`/${lng}/calendars`)} />
        <NavItem to={`/${lng}/shared-calendars`} label={t('shared')} icon={Share2} isActive={isActive(`/${lng}/shared-calendars`)} />
        <NavItem to={`/${lng}/notifications`} label={t('notification.label')} icon={Bell} isActive={isActive(`/${lng}/notifications`)} />
        <NavItem
          to={settingsPath}
          label={t('settings.label')}
          isActive={settingsActive}
          customIcon={
            userInfo ? (
              <Avatar className="w-10 h-10 mb-1">
                <AvatarImage src={userInfo.photoUrl || undefined} alt={userInfo.displayName || t('user')} referrerPolicy="no-referrer" />
                <AvatarFallback>
                  <User/>
                </AvatarFallback>
              </Avatar>
            ) : (
              <User className={`${ICON_BASE} ${settingsActive ? 'text-primary' : ''}`} style={ICON_STYLE} />
            )
          }
        />
        </div>
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
}

export default MobileNavBar;
