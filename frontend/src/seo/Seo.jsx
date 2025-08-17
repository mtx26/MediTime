import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, getLocale, DEFAULT_LANG } from '../config/languages';


const VITE_URL = import.meta.env.VITE_VITE_URL;

function Seo({ title, description, path }) {
  const { i18n } = useTranslation();
  const lng = i18n.language;
  const url = `${VITE_URL}/${lng}${path}`;

  useEffect(() => {
    document.documentElement.lang = lng;
    document.title = title;

    const upsertTag = (tagName, keyAttr, key, attrs) => {
      const selector = `${tagName}[${keyAttr}="${key}"]`;
      let tag = document.head.querySelector(selector);
      if (!tag) {
        tag = document.createElement(tagName);
        tag.setAttribute(keyAttr, key);
        document.head.appendChild(tag);
      }
      Object.entries(attrs).forEach(([attr, value]) => {
        tag.setAttribute(attr, value);
      });
    };

    upsertTag('meta', 'name', 'description', { content: description });
    upsertTag('meta', 'name', 'robots', { content: 'index,follow' });
    upsertTag('link', 'rel', 'canonical', { href: url });

    LANGUAGES.forEach((lang) => {
      upsertTag('link', 'hreflang', lang.code, {
        rel: 'alternate',
        href: `${VITE_URL}/${lang.code}${path}`,
      });
    });
    upsertTag('link', 'hreflang', 'x-default', {
      rel: 'alternate',
      href: `${VITE_URL}/${DEFAULT_LANG}${path}`,
    });

    upsertTag('meta', 'property', 'og:locale', { content: getLocale(lng) });
    LANGUAGES.filter((lang) => lang.code !== lng).forEach((lang) => {
      upsertTag('meta', 'property', 'og:locale:alternate', {
        content: lang.locale,
      });
    });
    upsertTag('meta', 'property', 'og:site_name', { content: 'MediTime' });
    upsertTag('meta', 'property', 'og:title', { content: title });
    upsertTag('meta', 'property', 'og:description', { content: description });
    upsertTag('meta', 'property', 'og:url', { content: url });
    upsertTag('meta', 'property', 'og:type', { content: 'website' });
    upsertTag('meta', 'property', 'og:image', { content: `${VITE_URL}/icons/og-image.png` });

    upsertTag('meta', 'name', 'twitter:card', {
      content: 'summary_large_image',
    });
    upsertTag('meta', 'name', 'twitter:title', { content: title });
    upsertTag('meta', 'name', 'twitter:description', { content: description });
    upsertTag('meta', 'name', 'twitter:image', { content: `${VITE_URL}/icons/og-image.png` });
    upsertTag('meta', 'name', 'twitter:site', { content: '@MediTime' });
  }, [title, description, path, lng]);

  return null;
}

export default Seo;
