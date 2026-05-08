import { useTranslation } from 'react-i18next';
import SecuritySettings from '@/components/settings/SecuritySettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import AccountSettings from '@/components/settings/AccountSettings';
import PreferencesSettings from '@/components/settings/PreferencesSettings';
import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/settings/useSettings';
import { SETTINGS_TABS } from '@meditime/constants';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ShieldCheck, Bell, Sliders, LogOut, Mail } from 'lucide-react';
import type { AppSharedProps } from '@meditime/types';

export default function SettingsPage(sharedProps: AppSharedProps) {
  const { t } = useTranslation();
  const { lng, activeTab, fcm, user, handleLogout, handleResetPassword } = useSettings(sharedProps);

  const renderTab = () => {
    switch (activeTab) {
      case SETTINGS_TABS.SECURITY:      return <SecuritySettings />;
      case SETTINGS_TABS.NOTIFICATIONS: return <NotificationSettings fcm={fcm} user={user} />;
      case SETTINGS_TABS.PREFERENCES:   return <PreferencesSettings />;
      default:                           return <AccountSettings />;
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-wrap gap-4">
        <div className="w-full md:w-1/4 mb-3">
          <Card className="shadow">
            <CardContent className="p-3">
              <h5 className="mb-3 font-semibold">{t('settings.label')}</h5>
              <div className="flex flex-col gap-1">
                <Button asChild variant={activeTab === SETTINGS_TABS.ACCOUNT ? 'default' : 'ghost'} className="justify-start">
                  <Link to={`/${lng}/settings?tab=${SETTINGS_TABS.ACCOUNT}`}>
                    <User className="h-4 w-4 mr-2" /> {t('settings.account')}
                  </Link>
                </Button>
                <Button asChild variant={activeTab === SETTINGS_TABS.SECURITY ? 'default' : 'ghost'} className="justify-start">
                  <Link to={`/${lng}/settings?tab=${SETTINGS_TABS.SECURITY}`}>
                    <ShieldCheck className="h-4 w-4 mr-2" /> {t('settings.security')}
                  </Link>
                </Button>
                <Button asChild variant={activeTab === SETTINGS_TABS.NOTIFICATIONS ? 'default' : 'ghost'} className="justify-start">
                  <Link to={`/${lng}/settings?tab=${SETTINGS_TABS.NOTIFICATIONS}`}>
                    <Bell className="h-4 w-4 mr-2" /> {t('notifications')}
                  </Link>
                </Button>
                <Button asChild variant={activeTab === SETTINGS_TABS.PREFERENCES ? 'default' : 'ghost'} className="justify-start">
                  <Link to={`/${lng}/settings?tab=${SETTINGS_TABS.PREFERENCES}`}>
                    <Sliders className="h-4 w-4 mr-2" /> {t('settings.preferences')}
                  </Link>
                </Button>
                <hr className="my-2" />
                <Button
                  variant="outline"
                  className="justify-start text-red-600! [&_svg]:text-red-600!"
                  aria-label={t('logout')}
                  title={t('logout')}
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" /> {t('logout')}
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  aria-label={t('reset_password.title')}
                  title={t('reset_password.title')}
                  onClick={handleResetPassword}
                >
                  <Mail className="h-4 w-4 mr-2" /> {t('reset_password.title')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:flex-1">
          <Card className="shadow">
            <CardContent className="p-4">
              {renderTab()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
