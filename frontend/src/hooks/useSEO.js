import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, DEFAULT_LANG, enabledLanguageCodes } from '../config/languages.js';
import { SEO_CONFIG, upsertMetaTag, getSchemaOrg } from '../config/seo.js';

/**
 * Hook unifié pour gérer toutes les métadonnées SEO, Schema.org et PWA
 * Centralise toute la logique SEO de l'application
 */
export const useSEO = ({ 
  title, 
  description, 
  path = '/', 
  customMeta = {} 
}) => {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  
  const finalTitle = title || t('app.pageTitle');
  const finalDescription = description || t('app.description');
  const finalUrl = `${SEO_CONFIG.BASE_URL}/${lng}${path}`;

  useEffect(() => {
    // 1. Base HTML
    document.documentElement.lang = lng;
    document.title = finalTitle;

    // 2. Meta de base
    upsertMetaTag('meta', 'name', 'description', { content: finalDescription });
    upsertMetaTag('meta', 'name', 'robots', { content: 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1' });
    upsertMetaTag('meta', 'name', 'googlebot', { content: 'index,follow' });
    upsertMetaTag('meta', 'name', 'bingbot', { content: 'index,follow' });
    upsertMetaTag('meta', 'name', 'application-name', { content: t('app.shortName') });
    upsertMetaTag('meta', 'name', 'apple-mobile-web-app-title', { content: t('app.shortName') });
    upsertMetaTag('meta', 'name', 'theme-color', { content: SEO_CONFIG.PWA.themeColor });
    upsertMetaTag('meta', 'name', 'msapplication-TileColor', { content: SEO_CONFIG.PWA.themeColor });
    upsertMetaTag('meta', 'name', 'author', { content: SEO_CONFIG.AUTHOR.name });
    
    // 3. Canonical et hreflang
    upsertMetaTag('link', 'rel', 'canonical', { href: finalUrl });
    
    LANGUAGES.forEach((lang) => {
      upsertMetaTag('link', 'hreflang', lang.code, {
        rel: 'alternate',
        href: `${SEO_CONFIG.BASE_URL}/${lang.code}${path}`,
      });
    });
    
    upsertMetaTag('link', 'hreflang', 'x-default', {
      rel: 'alternate',
      href: `${SEO_CONFIG.BASE_URL}/${DEFAULT_LANG}${path}`,
    });

    // 4. Open Graph
    upsertMetaTag('meta', 'property', 'og:locale', { content: lng });
    LANGUAGES.filter((lang) => lang.code !== lng).forEach((lang) => {
      upsertMetaTag('meta', 'property', 'og:locale:alternate', { content: lang.code });
    });
    
    upsertMetaTag('meta', 'property', 'og:site_name', { content: t('app.name') });
    upsertMetaTag('meta', 'property', 'og:title', { content: finalTitle });
    upsertMetaTag('meta', 'property', 'og:description', { content: finalDescription });
    upsertMetaTag('meta', 'property', 'og:url', { content: finalUrl });
    upsertMetaTag('meta', 'property', 'og:type', { content: SEO_CONFIG.META.ogType });
    upsertMetaTag('meta', 'property', 'og:image', { 
      content: `${SEO_CONFIG.BASE_URL}${SEO_CONFIG.META.ogImage}` 
    });
    upsertMetaTag('meta', 'property', 'og:image:width', { content: '1200' });
    upsertMetaTag('meta', 'property', 'og:image:height', { content: '630' });
    upsertMetaTag('meta', 'property', 'og:image:alt', { 
      content: `${t('app.name')} - ${t('app.subtitle')}` 
    });

    // 5. Twitter Cards
    upsertMetaTag('meta', 'name', 'twitter:card', { content: SEO_CONFIG.META.twitterCard });
    upsertMetaTag('meta', 'name', 'twitter:title', { content: finalTitle });
    upsertMetaTag('meta', 'name', 'twitter:description', { content: finalDescription });
    upsertMetaTag('meta', 'name', 'twitter:image', { 
      content: `${SEO_CONFIG.BASE_URL}${SEO_CONFIG.META.ogImage}` 
    });
    upsertMetaTag('meta', 'name', 'twitter:site', { content: SEO_CONFIG.META.twitterSite });
    upsertMetaTag('meta', 'name', 'twitter:creator', { content: SEO_CONFIG.META.twitterSite });
    upsertMetaTag('meta', 'name', 'twitter:image:alt', { 
      content: `${t('app.name')} - ${t('app.subtitle')}` 
    });

    // 6. Pinterest & Rich Pins
    upsertMetaTag('meta', 'name', 'pinterest-rich-pin', { content: 'true' });
    upsertMetaTag('meta', 'name', 'pinterest:description', { content: finalDescription });
    
    // 7. Article/Page Meta (si applicable)
    upsertMetaTag('meta', 'property', 'article:author', { content: SEO_CONFIG.AUTHOR.name });
    upsertMetaTag('meta', 'property', 'article:publisher', { content: SEO_CONFIG.BASE_URL });

    // 8. Meta personnalisées
    Object.entries(customMeta).forEach(([key, value]) => {
      if (key.startsWith('og:')) {
        upsertMetaTag('meta', 'property', key, { content: value });
      } else {
        upsertMetaTag('meta', 'name', key, { content: value });
      }
    });

    // 9. PWA Manifest
    const manifestUrl = enabledLanguageCodes.includes(lng) 
      ? `/manifests/manifest-${lng}.json`
      : '/manifest.json';
    upsertMetaTag('link', 'rel', 'manifest', { href: manifestUrl });

    // 10. Schema.org JSON-LD
    updateSchemaOrg();

  }, [finalTitle, finalDescription, path, lng, t, customMeta]);

  const updateSchemaOrg = () => {
    // Supprime l'ancien script
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Crée le nouveau script avec Schema.org complet
    const schema = getSchemaOrg(lng, t);
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  };

  return {
    currentLanguage: lng,
    changeLanguage: i18n.changeLanguage,
    t,
    title: finalTitle,
    description: finalDescription,
    url: finalUrl
  };
};

export default useSEO;
