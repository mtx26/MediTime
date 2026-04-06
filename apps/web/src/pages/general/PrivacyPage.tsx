import { useTranslation } from 'react-i18next';
import { Shield, UserCheck, Pill, Phone, Lock, Mail, Globe, Github } from 'lucide-react';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <section className="container mx-auto px-4 py-5 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          {t('privacy.title')}
        </h2>
        <p className="mb-6">
          <strong>{t('privacy.last_update')}</strong>
        </p>

        <h3 className="text-2xl font-semibold mt-6 mb-3">{t('privacy.section1.title')}</h3>
        <p className="text-muted-foreground mb-6">{t('privacy.section1.content')}</p>

        <hr className="my-6" />

        <h3 className="text-2xl font-semibold mt-6 mb-3">{t('privacy.section2.title')}</h3>

        <h4 className="text-lg font-semibold mt-4 mb-2 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          {t('privacy.section2.personal_data.title')}
        </h4>
        <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
          <li>{t('privacy.section2.personal_data.email')}</li>
          <li>{t('privacy.section2.personal_data.uid')}</li>
        </ul>

        <h4 className="text-lg font-semibold mt-4 mb-2 flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          {t('privacy.section2.treatment_data.title')}
        </h4>
        <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
          <li>{t('privacy.section2.treatment_data.medicines')}</li>
          <li>{t('privacy.section2.treatment_data.boxes')}</li>
          <li>{t('privacy.section2.treatment_data.history')}</li>
        </ul>

        <h4 className="text-lg font-semibold mt-4 mb-2 flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          {t('privacy.section2.tech_data.title')}
        </h4>
        <ul className="list-disc list-inside space-y-1 mb-6 text-muted-foreground">
          <li>{t('privacy.section2.tech_data.tokens')}</li>
          <li>{t('privacy.section2.tech_data.device')}</li>
        </ul>

        <hr className="my-6" />

        <h3 className="text-2xl font-semibold mt-6 mb-3">{t('privacy.section3.title')}</h3>
        <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
          <li>{t('privacy.section3.sync')}</li>
          <li>{t('privacy.section3.reminders')}</li>
          <li>{t('privacy.section3.sharing')}</li>
          <li>{t('privacy.section3.stability')}</li>
        </ul>
        <p className="mb-6">
          <strong>{t('privacy.section3.no_ads')}</strong>
        </p>

        <hr className="my-6" />

        <h3 className="text-2xl font-semibold mt-6 mb-3">{t('privacy.section4.title')}</h3>
        <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
          <li>{t('privacy.section4.supabase')}</li>
          <li>{t('privacy.section4.firebase')}</li>
        </ul>
        <p className="text-muted-foreground mb-6">{t('privacy.section4.location')}</p>

        <hr className="my-6" />

        <h3 className="text-2xl font-semibold mt-6 mb-3">{t('privacy.section5.title')}</h3>
        <ul className="list-disc list-inside space-y-1 mb-6 text-muted-foreground">
          <li>{t('privacy.section5.encryption')}</li>
          <li>{t('privacy.section5.auth')}</li>
          <li>{t('privacy.section5.passwords')}</li>
        </ul>

        <hr className="my-6" />

        <h3 className="text-2xl font-semibold mt-6 mb-3">{t('privacy.section6.title')}</h3>
        <p className="text-muted-foreground mb-4">{t('privacy.section6.intro')}</p>
        <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
          <li>{t('privacy.section6.access')}</li>
          <li>{t('privacy.section6.delete')}</li>
          <li>{t('privacy.section6.revoke')}</li>
          <li>{t('privacy.section6.disable')}</li>
        </ul>
        <p className="text-muted-foreground mb-6">
          {t('privacy.section6.contact')} <br />
          <span className="flex items-center gap-2 mt-2">
            <Mail className="h-4 w-4" />
            <a href="mailto:mtx_26@outlook.be" className="font-semibold text-primary hover:underline">
              mtx_26@outlook.be
            </a>
          </span>
        </p>

        <hr className="my-6" />

        <h3 className="text-2xl font-semibold mt-6 mb-3">{t('privacy.section7.title')}</h3>
        <p className="text-muted-foreground">
          {t('privacy.section7.developer')}
          <br />
          <span className="flex items-center gap-2 mt-2 mb-2">
            <Mail className="h-4 w-4" />
            <a href="mailto:mtx_26@outlook.be" className="text-primary hover:underline">
              mtx_26@outlook.be
            </a>
          </span>
          <span className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4" />
            <a href="https://meditime-app.com" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              meditime-app.com
            </a>
          </span>
          <span className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            <a href="https://github.com/mtx26" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              GitHub – mtx26
            </a>
          </span>
        </p>
      </div>
    </section>
  );
}
