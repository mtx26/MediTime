import React, { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserContext } from '../../contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Share2, Bell, User } from 'lucide-react';

function MobileNavBar() {
  const { lng } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const { userInfo } = useContext(UserContext);
  const [bottomOffset, setBottomOffset] = useState(0);

  useEffect(() => {
    const computeOffset = () => {
      const vv = window.visualViewport;
      if (!vv) {
        // Espacement constant pour un rendu intentionnel
        setBottomOffset(10);
        return;
      }
      const layoutH = window.innerHeight;
      const visualBottom = vv.height + vv.offsetTop;
      // N'applique un offset que lorsque le clavier virtuel est probablement ouvert,
      // pour éviter un "gap" sous la barre lors des variations de la barre d'URL.
      const keyboardLikely = vv.height < layoutH - 80; // marge heuristique ~80px
      const offset = keyboardLikely ? Math.max(layoutH - visualBottom, 0) : 0;
      // Ajoute un léger espacement constant
      setBottomOffset(offset + 10);
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

  const isActive = (path) => location.pathname.startsWith(path);
  const itemBase = 'inline-flex flex-col items-center justify-center h-full px-7 hover:bg-accent/50 group';
  const iconBase = 'mb-1 shrink-0 text-muted-foreground group-hover:text-primary !size-[36px]';
  const iconStyle = { width: 36, height: 36, flexShrink: 0 };

  const nav = (
    <nav
      className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 z-10 pb-[env(safe-area-inset-bottom)]"
      style={{ bottom: bottomOffset }}
    >
      <div className="w-[min(100vw-8px,40rem)] mx-auto px-2">
        <div className="grid h-20 grid-cols-4 bg-background border rounded-2xl shadow-lg font-medium">
        <Button variant="ghost" asChild className={itemBase}>
          {(() => {
            const path = `/${lng}/calendars`;
            const active = isActive(path);
            return (
              <Link
                to={path}
                className={active ? 'bg-secondary rounded-xl' : ''}
                aria-current={active ? 'page' : undefined}
                aria-label={t('calendars')}
              >
                <Calendar className={`${iconBase} ${active ? 'text-primary' : ''}`} style={iconStyle} />
                <span className="sr-only">{t('calendars')}</span>
              </Link>
            );
          })()}
        </Button>

        <Button variant="ghost" asChild className={itemBase}>
          {(() => {
            const path = `/${lng}/shared-calendars`;
            const active = isActive(path);
            return (
              <Link
                to={path}
                className={active ? 'bg-secondary rounded-xl' : ''}
                aria-current={active ? 'page' : undefined}
                aria-label={t('shared')}
              >
                <Share2 className={`${iconBase} ${active ? 'text-primary' : ''}`} style={iconStyle} />
                <span className="sr-only">{t('shared')}</span>
              </Link>
            );
          })()}
        </Button>

        <Button variant="ghost" asChild className={itemBase}>
          {(() => {
            const path = `/${lng}/notifications`;
            const active = isActive(path);
            return (
              <Link
                to={path}
                className={active ? 'bg-secondary rounded-xl' : ''}
                aria-current={active ? 'page' : undefined}
                aria-label={t('notification.label')}
              >
                <Bell className={`${iconBase} ${active ? 'text-primary' : ''}`} style={iconStyle} />
                <span className="sr-only">{t('notification.label')}</span>
              </Link>
            );
          })()}
        </Button>

        <Button variant="ghost" asChild className={itemBase}>
          {(() => {
            const path = `/${lng}/settings`;
            const active = isActive(path);
            return (
              <Link
                to={path}
                className={active ? 'bg-secondary rounded-xl' : ''}
                aria-current={active ? 'page' : undefined}
                aria-label={t('settings.label')}
              >
                {userInfo ? (
                  <Avatar className="w-10 h-10 mb-1">
                    <AvatarImage src={userInfo.photoUrl} alt={userInfo.displayName} referrerPolicy="no-referrer" />
                    <AvatarFallback>
                      <User/>
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <User className={`${iconBase} ${active ? 'text-primary' : ''}`} style={iconStyle} />
                )}
                <span className="sr-only">{t('settings.label')}</span>
              </Link>
            );
          })()}
        </Button>
        </div>
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
}

export default MobileNavBar;
