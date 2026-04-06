import { useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pill, Calendar, Users, Lock, Phone, CheckCircle } from 'lucide-react';

function HomePage() {
  const { lng } = useParams();
  const { userInfo } = useContext(UserContext);
  const { t } = useTranslation();
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);

  return (
    <>
      <header className="bg-muted border-b shadow-sm py-5 rounded-3xl">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <div className="flex items-center justify-center gap-3">
            <Pill className="h-12 w-12 text-primary" aria-hidden="true" />
            <h1 className="text-4xl font-bold text-primary">{t('app.title')}</h1>
          </div>
          <p className="text-lg text-muted-foreground mt-2">{t('app.subtitle')}</p>
          <div className="mt-6 flex flex-col md:flex-row justify-center gap-4">
            {userInfo ? (
              <Link
                to={`/${lng}/calendars`}
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                aria-label={t('app.access')}
                title={t('app.access')}
              >
                {t('app.access')}
              </Link>
            ) : (
              <>
                <Link
                  to={`/${lng}/login`}
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  aria-label={t('app.login')}
                  title={t('app.login')}
                >
                  {t('app.login')}
                </Link>
                <Link
                  to={`/${lng}/register`}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  aria-label={t('app.register')}
                  title={t('app.register')}
                >
                  {t('app.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-5 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
          <div>
            <Calendar className="h-12 w-12 text-primary mx-auto" aria-hidden="true" />
            <h3 className="mt-4 font-semibold text-lg">{t('features.title1')}</h3>
            <p className="text-muted-foreground">{t('features.desc1')}</p>
          </div>
          <div>
            <Users className="h-12 w-12 text-primary mx-auto" aria-hidden="true" />
            <h3 className="mt-4 font-semibold text-lg">{t('features.title2')}</h3>
            <p className="text-muted-foreground">{t('features.desc2')}</p>
          </div>
          <div>
            <Lock className="h-12 w-12 text-primary mx-auto" aria-hidden="true" />
            <h3 className="mt-4 font-semibold text-lg">{t('features.title3')}</h3>
            <p className="text-muted-foreground">{t('features.desc3')}</p>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary">{t('why.title')}</h2>
          <p className="text-muted-foreground mx-auto max-w-200 mt-3">
            {t('why.desc')}
          </p>
        </div>
      </section>

      <section className="bg-muted py-5">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <h2 className="text-2xl font-bold text-primary mb-6">{t('testimonials.title')}</h2>
          <blockquote className="mx-auto max-w-175">
            <p className="mb-4 italic text-muted-foreground">"{t('testimonials.quote')}"</p>
            <footer className="text-sm text-muted-foreground font-semibold">
              {t('testimonials.author')}
            </footer>
          </blockquote>
        </div>
      </section>

      <section className="bg-background border-t py-5">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-center md:text-left">
              <Phone className="h-16 w-16 text-primary mx-auto md:mx-0" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">{t('mobile.title')}</h2>
              <p className="text-muted-foreground mb-4">{t('mobile.desc')}</p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  <span>{t('mobile.feature1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  <span>{t('mobile.feature2')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  <span>{t('mobile.feature3')}</span>
                </li>
              </ul>

              {isIOS && (
                <Alert className="mt-4">
                  <AlertDescription
                    dangerouslySetInnerHTML={{ __html: t('mobile.ios') }}
                  />
                </Alert>
              )}

              {isAndroid && (
                <Alert className="mt-4">
                  <AlertDescription
                    dangerouslySetInnerHTML={{ __html: t('mobile.android') }}
                  />
                </Alert>
              )}

              {!isIOS && !isAndroid && (
                <Alert className="mt-4" variant="secondary">
                  <AlertDescription>{t('mobile.other')}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-5">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <h2 className="text-2xl font-bold">{t('cta.title')}</h2>
          <p className="text-lg mb-6 text-primary-foreground/90">{t('cta.desc')}</p>
          <Link
            to={`/${lng}/register`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-8 py-2 text-sm font-medium text-secondary-foreground ring-offset-background transition-colors hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            aria-label={t('app.register')}
            title={t('app.register')}
          >
            {t('cta.button')}
          </Link>
        </div>
      </section>

      <section className="bg-background border-t py-4">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <a
            href={`/${lng}/privacy`}
            className="text-muted-foreground hover:text-foreground no-underline text-sm mx-3 transition-colors"
          >
            {t('privacy.label')}
          </a>
          <span className="text-muted-foreground text-sm">|</span>
          <a
            href={`/${lng}/terms`}
            className="text-muted-foreground hover:text-foreground no-underline text-sm mx-3 transition-colors"
          >
            {t('terms.label')}
          </a>
        </div>
      </section>
    </>
  );
}

export default HomePage;
