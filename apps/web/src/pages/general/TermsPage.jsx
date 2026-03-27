import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Info, Mail, Globe, Github } from 'lucide-react';

function TermsSection({ titleKey, paragraphs = [], list = [], conclusionKey }) {
  const { t } = useTranslation();
  return (
    <div className="mb-8">
      <h3 className="text-2xl font-semibold mb-3 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        {t(titleKey)}
      </h3>
      <div className="space-y-4 text-muted-foreground mb-4">
        {paragraphs.map((pKey) => (
          <p key={pKey}>{t(pKey)}</p>
        ))}
      </div>
      {list.length > 0 && (
        <ul className="list-disc list-inside space-y-1 mb-4 text-muted-foreground">
          {list.map((itemKey) => (
            <li key={itemKey}>{t(itemKey)}</li>
          ))}
        </ul>
      )}
      {conclusionKey && <p className="text-muted-foreground">{t(conclusionKey)}</p>}
      <hr className="my-6" />
    </div>
  );
}

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <section className="container mx-auto px-4 py-5 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          {t('terms.title')}
        </h2>
        <p className="mb-6">
          <strong>{t('terms.last_update')}</strong>
        </p>

        <TermsSection
          titleKey="terms.section1.title"
          paragraphs={['terms.section1.p1', 'terms.section1.p2']}
        />

        <TermsSection
          titleKey="terms.section2.title"
          paragraphs={['terms.section2.intro']}
          list={[
            'terms.section2.list.item1',
            'terms.section2.list.item2',
            'terms.section2.list.item3',
          ]}
          conclusionKey="terms.section2.disclaimer"
        />

        <TermsSection
          titleKey="terms.section3.title"
          paragraphs={['terms.section3.intro']}
          list={[
            'terms.section3.list.item1',
            'terms.section3.list.item2',
          ]}
          conclusionKey="terms.section3.conclusion"
        />

        <TermsSection
          titleKey="terms.section4.title"
          paragraphs={['terms.section4.content']}
        />

        <TermsSection
          titleKey="terms.section5.title"
          paragraphs={['terms.section5.p1', 'terms.section5.p2']}
          list={[
            'terms.section5.list.item1',
            'terms.section5.list.item2',
            'terms.section5.list.item3',
          ]}
        />

        <TermsSection
          titleKey="terms.section6.title"
          paragraphs={['terms.section6.intro']}
          list={[
            'terms.section6.list.item1',
            'terms.section6.list.item2',
          ]}
          conclusionKey="terms.section6.conclusion"
        />

        <TermsSection
          titleKey="terms.section7.title"
          paragraphs={['terms.section7.content']}
        />

        <h3 className="text-2xl font-semibold mb-3 flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          {t('terms.section8.title')}
        </h3>
        <p className="text-muted-foreground mb-4">{t('terms.section8.intro')}</p>
        <p className="text-muted-foreground">
          <strong className="text-foreground">Matis Gillet</strong>
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
