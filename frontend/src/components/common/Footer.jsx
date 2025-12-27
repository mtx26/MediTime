import React, { useContext } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { 
  Home, 
  Info, 
  FileText, 
  ShieldCheck, 
  UserCog, 
  Calendar, 
  Share2, 
  Bell, 
  Mail, 
  Github, 
  Pill 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function Footer() {
  const location = useLocation();
  const { lng } = useParams();
  const { userInfo } = useContext(UserContext);
  const { t } = useTranslation();

  const hiddenFooterRoutes = [
    '/login',
    '/register',
    '/reset-password',
    '/verify-email',
  ];

  const pathAfterLang = '/' + location.pathname.split('/').slice(2).join('/');
  const shouldShowFooter = !hiddenFooterRoutes.includes(pathAfterLang);

  const currentYear = new Date().getFullYear();

  return (
    <>
    {shouldShowFooter && (
      <footer className="bg-muted/50 border-t pt-4 pb-3 hidden lg:block">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Colonne liens */}
          <div className="md:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <ul className="list-none space-y-2">
                  <li className="flex items-center">
                    <Home className="h-4 w-4 mr-2 text-primary" aria-hidden="true" />
                    <Link
                      to={`/${lng}/home`}
                      className="text-muted-foreground no-underline hover:underline"
                    >
                      {t('home')}
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <Info className="h-4 w-4 mr-2 text-primary" aria-hidden="true" />
                    <Link
                      to={`/${lng}/about`}
                      className="text-muted-foreground no-underline hover:underline"
                    >
                      {t('about')}
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-primary" aria-hidden="true" />
                    <Link
                      to={`/${lng}/terms`}
                      className="text-muted-foreground no-underline hover:underline"
                    >
                      {t('terms.label')}
                    </Link>
                  </li>
                  <li className="flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-2 text-primary" aria-hidden="true" />
                    <Link
                      to={`/${lng}/privacy`}
                      className="text-muted-foreground no-underline hover:underline"
                    >
                      {t('privacy.label')}
                    </Link>
                  </li>
                </ul>
              </div>
              {userInfo && (
                <div>
                  <ul className="list-none space-y-2">
                    <li className="flex items-center">
                      <UserCog className="h-4 w-4 mr-2 text-primary" aria-hidden="true" />
                        <Link
                        to={`/${lng}/account`}
                        className="text-muted-foreground no-underline hover:underline"
                      >
                        {t('account.label')}
                      </Link>
                    </li>
                    <li className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary" aria-hidden="true" />
                      <Link
                        to={`/${lng}/calendars`}
                        className="text-muted-foreground no-underline hover:underline"
                      >
                        {t('my_calendars')}
                      </Link>
                    </li>
                    <li className="flex items-center">
                      <Share2 className="h-4 w-4 mr-2 text-primary" aria-hidden="true" />
                      <Link
                        to={`/${lng}/shared-calendars`}
                        className="text-muted-foreground no-underline hover:underline"
                      >
                        {t('shared_calendars')}
                      </Link>
                    </li>
                    <li className="flex items-center">
                      <Bell className="h-4 w-4 mr-2 text-primary" aria-hidden="true" />
                      <Link
                        to={`/${lng}/notifications`}
                        className="text-muted-foreground no-underline hover:underline"
                      >
                        {t('notifications')}
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
              <div>
                <ul className="list-none space-y-2">
                  <li className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-primary" aria-hidden="true" />
                    <a
                      href="mailto:mtx_26@outlook.be"
                      className="text-muted-foreground no-underline hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('contact')}
                    </a>
                  </li>
                  <li className="flex items-center">
                    <Github className="h-4 w-4 mr-2 text-primary" aria-hidden="true" />
                    <a
                      href="https://github.com/mtx26/MediTime"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground no-underline hover:underline"
                    >
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Logo + copyright */}
            <Link
              className='md:col-span-4 no-underline hover:underline'
              to={`/${lng}`}
            >
              <div className="text-center md:text-right">
                <div className="flex items-center justify-center md:justify-end">
                  <img src="/icons/og-image.png" alt="MediTime" className="h-32" />
                </div>
                <div className="text-muted-foreground text-sm">
                  © {currentYear} — {t('rights_reserved')}
                </div>
              </div>
            </Link>
          </div>
        </div>
      </footer>
    )}
    {/* Mobile bottom nav handled by MobileNavBar portal */}
    </>
  );
}

export default Footer;
