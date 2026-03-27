import React, { useState, useEffect, useContext } from 'react';
import Security from './Security';
import Notification from './Notification';
import Account from './Account';
import Preferences from './Preferences';
import { Link, useLocation, useParams } from 'react-router-dom';
import { handleLogout, resetPassword } from '../../services/auth/authService';
import { UserContext } from '../../contexts/UserContext';
import { useAlert } from '../../contexts/AlertContext';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ShieldCheck, Bell, Sliders, LogOut, Mail } from 'lucide-react';

export default function SettingsPage( sharedProps ) {
  const { t } = useTranslation();
  const location = useLocation();
  const { lng } = useParams();
  const { userInfo } = useContext(UserContext);
  const { showAlert } = useAlert();

  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'account';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());

  useEffect(() => {
    // Met à jour le tab si l’URL change
    setActiveTab(getInitialTab());
  }, [location.search]);

  const renderTab = () => {
    switch (activeTab) {
      case 'account':
        return <Account {...sharedProps} />;
      case 'security':
        return <Security {...sharedProps} />;
      case 'notifications':
        return <Notification {...sharedProps} />;
      case 'preferences':
        return <Preferences {...sharedProps} />;
      default:
        return <Account {...sharedProps} />;
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-wrap gap-4">
        {/* 🧭 Onglets verticaux */}
        <div className="w-full md:w-1/4 mb-3">
          <Card className="shadow">
            <CardContent className="p-3">
              <h5 className="mb-3 font-semibold">{t('settings.label')}</h5>
              <div className="flex flex-col gap-1">
                <Button
                  asChild
                  variant={activeTab === 'account' ? 'default' : 'ghost'}
                  className="justify-start"
                >
                  <Link to={`/${lng}/settings?tab=account`}>
                    <User className="h-4 w-4 mr-2" /> {t('settings.account')}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant={activeTab === 'security' ? 'default' : 'ghost'}
                  className="justify-start"
                >
                  <Link to={`/${lng}/settings?tab=security`}>
                    <ShieldCheck className="h-4 w-4 mr-2" /> {t('settings.security')}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant={activeTab === 'notifications' ? 'default' : 'ghost'}
                  className="justify-start"
                >
                  <Link to={`/${lng}/settings?tab=notifications`}>
                    <Bell className="h-4 w-4 mr-2" /> {t('notifications')}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant={activeTab === 'preferences' ? 'default' : 'ghost'}
                  className="justify-start"
                >
                  <Link to={`/${lng}/settings?tab=preferences`}>
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
                  onClick={() => {
                    resetPassword(userInfo.email);
                    showAlert('success', t('reset_password.success'));
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" /> {t('reset_password.title')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 📄 Contenu de l'onglet actif */}
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
};