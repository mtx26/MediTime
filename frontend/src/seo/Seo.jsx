import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, getLocale } from '../config/languages';

const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://meditime-app.com';

function Seo({ title, description, path }) {
  const { i18n } = useTranslation();
  const lng = i18n.language;
  const url = `${SITE_URL}/${lng}${path}`;

  useEffect(() => {
    document.documentElement.lang = lng;
  }, [lng]);
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {LANGUAGES.map((lang) => (
        <link
          key={lang.code}
          rel="alternate"
          hrefLang={lang.code}
          href={`${SITE_URL}/${lang.code}${path}`}
        />
      ))}
      <meta property="og:locale" content={getLocale(lng)} />
      {LANGUAGES.filter((lang) => lang.code !== lng).map((lang) => (
        <meta
          key={lang.code}
          property="og:locale:alternate"
          content={lang.locale}
        />
      ))}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </>
  );
}

export default Seo;
