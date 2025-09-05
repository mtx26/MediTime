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

    // 6. Métadonnées personnalisées
    Object.entries(customMeta).forEach(([key, value]) => {
      if (key.startsWith('og:')) {
        upsertMetaTag('meta', 'property', key, { content: value });
      } else {
        upsertMetaTag('meta', 'name', key, { content: value });
      }
    });

    // 7. Manifest dynamique
    updateManifest();

  }, [finalTitle, finalDescription, path, lng, t, customMeta]);

  const updateManifest = () => {
    // Utilise le manifest statique généré au lieu de créer un blob dynamique
    const manifestUrl = enabledLanguageCodes.includes(lng) 
      ? `/manifests/manifest-${lng}.json`
      : '/manifest.json';
    
    // Met à jour le lien du manifest
    upsertMetaTag('link', 'rel', 'manifest', { href: manifestUrl });
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
