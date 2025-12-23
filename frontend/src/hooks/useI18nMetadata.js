import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, DEFAULT_LANG, enabledLanguageCodes } from '../config/languages.js';
import { I18N_CONFIG, upsertMetaTag } from '../config/i18nMeta.js';

/**
 * Hook unifié pour gérer toutes les métadonnées internationalisées
 * Remplace et unifie la logique de Seo.jsx et I18nHead.jsx
 */
export const useI18nMetadata = ({ 
  title, 
  description, 
  path = '/', 
  addLanguageToUrl = true,
  customMeta = {} 
}) => {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  
  // Utilise les traductions par défaut si aucune valeur n'est fournie
  const finalTitle = title || t('app.pageTitle');
  const finalDescription = description || t('app.description');
  const finalUrl = `${I18N_CONFIG.BASE_URL}/${lng}${path}`;

  useEffect(() => {
    // 1. Mise à jour des éléments de base
    document.documentElement.lang = lng;
    document.title = finalTitle;

    // 2. Métadonnées de base
    upsertMetaTag('meta', 'name', 'description', { content: finalDescription });
    upsertMetaTag('meta', 'name', 'robots', { content: 'index,follow' });
    upsertMetaTag('meta', 'name', 'application-name', { content: t('app.shortName') });
    upsertMetaTag('meta', 'name', 'apple-mobile-web-app-title', { content: t('app.shortName') });
    
    // 3. Liens canoniques et alternatifs
    upsertMetaTag('link', 'rel', 'canonical', { href: finalUrl });
    
    LANGUAGES.forEach((lang) => {
      upsertMetaTag('link', 'hreflang', lang.code, {
        rel: 'alternate',
        href: `${I18N_CONFIG.BASE_URL}/${lang.code}${path}`,
      });
    });
    
    upsertMetaTag('link', 'hreflang', 'x-default', {
      rel: 'alternate',
      href: `${I18N_CONFIG.BASE_URL}/${DEFAULT_LANG}${path}`,
    });

    // 4. Open Graph
    upsertMetaTag('meta', 'property', 'og:locale', { content: lng });
    LANGUAGES.filter((lang) => lang.code !== lng).forEach((lang) => {
      upsertMetaTag('meta', 'property', 'og:locale:alternate', {
        content: lang.code,
      });
    });
    
    upsertMetaTag('meta', 'property', 'og:site_name', { content: t('app.name') });
    upsertMetaTag('meta', 'property', 'og:title', { content: finalTitle });
    upsertMetaTag('meta', 'property', 'og:description', { content: finalDescription });
    upsertMetaTag('meta', 'property', 'og:url', { content: finalUrl });
    upsertMetaTag('meta', 'property', 'og:type', { content: I18N_CONFIG.DEFAULT_META.ogType });
    upsertMetaTag('meta', 'property', 'og:image', { 
      content: `${I18N_CONFIG.BASE_URL}${I18N_CONFIG.DEFAULT_META.ogImage}` 
    });
    
    // Discord Rich Embed
    upsertMetaTag('meta', 'property', 'og:image:width', { content: '1200' });
    upsertMetaTag('meta', 'property', 'og:image:height', { content: '630' });
    upsertMetaTag('meta', 'property', 'og:image:alt', { 
      content: `${t('app.name')} - ${t('app.subtitle')}` 
    });

    // 5. Twitter Cards
    upsertMetaTag('meta', 'name', 'twitter:card', { 
      content: I18N_CONFIG.DEFAULT_META.twitterCard 
    });
    upsertMetaTag('meta', 'name', 'twitter:title', { content: finalTitle });
    upsertMetaTag('meta', 'name', 'twitter:description', { content: finalDescription });
    upsertMetaTag('meta', 'name', 'twitter:image', { 
      content: `${I18N_CONFIG.BASE_URL}${I18N_CONFIG.DEFAULT_META.ogImage}` 
    });
    upsertMetaTag('meta', 'name', 'twitter:site', { 
      content: I18N_CONFIG.DEFAULT_META.twitterSite 
    });
    upsertMetaTag('meta', 'name', 'twitter:image:alt', { 
      content: `${t('app.name')} - ${t('app.subtitle')}` 
    });

    // 6. Pinterest Rich Pins
    upsertMetaTag('meta', 'name', 'pinterest-rich-pin', { content: 'true' });
    upsertMetaTag('meta', 'name', 'pinterest:description', { content: finalDescription });

    // 7. Métadonnées personnalisées
    Object.entries(customMeta).forEach(([key, value]) => {
      if (key.startsWith('og:')) {
        upsertMetaTag('meta', 'property', key, { content: value });
      } else {
        upsertMetaTag('meta', 'name', key, { content: value });
      }
    });

    // 8. Manifest dynamique
    updateManifest();
    
    // 9. Schema.org JSON-LD dynamique
    updateSchemaOrg();

  }, [finalTitle, finalDescription, path, lng, t, customMeta]);

  const updateManifest = () => {
    // Utilise le manifest statique généré au lieu de créer un blob dynamique
    const manifestUrl = enabledLanguageCodes.includes(lng) 
      ? `/manifests/manifest-${lng}.json`
      : '/manifest.json';
    
    // Met à jour le lien du manifest
    upsertMetaTag('link', 'rel', 'manifest', { href: manifestUrl });
  };

  const updateSchemaOrg = () => {
    // Supprime l'ancien script Schema.org s'il existe
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Crée le nouveau script avec les traductions
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          "@id": `${I18N_CONFIG.BASE_URL}/#webapp`,
          "name": t('app.name'),
          "alternateName": `${t('app.name')} - ${t('app.subtitle')}`,
          "url": I18N_CONFIG.BASE_URL,
          "applicationCategory": "HealthApplication",
          "applicationSubCategory": "Medical",
          "operatingSystem": "All",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          },
          "description": t('app.description'),
          "screenshot": `${I18N_CONFIG.BASE_URL}/icons/icon-512.png`,
          "inLanguage": ["en", "fr", "es", "de", "it", "ja", "zh", "pt", "ru"],
          "browserRequirements": "Requires JavaScript. Requires HTML5.",
          "softwareVersion": "0.1.0",
          "datePublished": "2025-12-23",
          "dateModified": "2025-12-23",
          "installUrl": `${I18N_CONFIG.BASE_URL}/${lng}/register`,
          "creator": {
            "@type": "Person",
            "@id": `${I18N_CONFIG.BASE_URL}/#creator`,
            "name": "Mtx_26",
            "url": "https://github.com/mtx26"
          },
          "publisher": {
            "@id": `${I18N_CONFIG.BASE_URL}/#organization`
          }
        },
        {
          "@type": "Organization",
          "@id": `${I18N_CONFIG.BASE_URL}/#organization`,
          "name": t('app.name'),
          "url": I18N_CONFIG.BASE_URL,
          "logo": {
            "@type": "ImageObject",
            "url": `${I18N_CONFIG.BASE_URL}/icons/icon-192.png`,
            "width": 192,
            "height": 192
          },
          "founder": {
            "@type": "Person",
            "name": "Mtx_26"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "mtx_26@outlook.be",
            "contactType": "technical support",
            "availableLanguage": ["en", "fr", "es", "de", "it", "ja", "zh", "pt", "ru"]
          }
        },
        {
          "@type": "WebSite",
          "@id": `${I18N_CONFIG.BASE_URL}/#website`,
          "url": I18N_CONFIG.BASE_URL,
          "name": t('app.name'),
          "description": t('app.description'),
          "publisher": {
            "@id": `${I18N_CONFIG.BASE_URL}/#organization`
          },
          "inLanguage": ["en", "fr", "es", "de", "it", "ja", "zh", "pt", "ru"]
        },
        {
          "@type": "MobileApplication",
          "@id": `${I18N_CONFIG.BASE_URL}/#mobileapp`,
          "name": t('app.name'),
          "operatingSystem": "Android, iOS, Windows, macOS, Linux",
          "applicationCategory": "HealthApplication",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${I18N_CONFIG.BASE_URL}/#breadcrumb`,
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": t('navigation.home') || 'Home',
              "item": `${I18N_CONFIG.BASE_URL}/${lng}/home`
            }
          ]
        }
      ]
    };

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

export default useI18nMetadata;
