/**
 * Configuration centralisée SEO et métadonnées pour MediTime
 */

import { enabledLanguageCodes } from './languages.js';

// Constantes de l'application
const APP_VERSION = '0.1.0';
const CURRENT_DATE = new Date().toISOString().split('T')[0];
const AUTHOR = {
  name: 'Mtx_26',
  email: 'mtx_26@outlook.be',
  github: 'https://github.com/mtx26'
};

// Fonction pour obtenir l'URL de base
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return import.meta.env?.VITE_VITE_URL || 'https://meditime-app.com';
  }
  return process.env.VITE_VITE_URL || 'https://meditime-app.com';
};

export const SEO_CONFIG = {
  BASE_URL: getBaseUrl(),
  APP_VERSION,
  AUTHOR,
  
  // Métadonnées par défaut
  META: {
    siteName: 'MediTime',
    twitterSite: '@MediTime',
    ogType: 'website',
    ogImage: '/icons/og-image.png',
    twitterCard: 'summary_large_image'
  },
  
  // Configuration PWA de base
  PWA: {
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    backgroundColor: '#FFFFFF',
    themeColor: '#5FC3B4',
    categories: ['health', 'medical', 'productivity', 'lifestyle'],
    icons: [
      { src: '/icons/icon-16.png', type: 'image/png', sizes: '16x16', purpose: 'any maskable' },
      { src: '/icons/icon-32.png', type: 'image/png', sizes: '32x32', purpose: 'any maskable' },
      { src: '/icons/icon-48.png', type: 'image/png', sizes: '48x48', purpose: 'any maskable' },
      { src: '/icons/icon-192.png', type: 'image/png', sizes: '192x192', purpose: 'any maskable' },
      { src: '/icons/icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'any maskable' },
      { src: '/icons/apple-touch-icon.png', type: 'image/png', sizes: '180x180', purpose: 'any' }
    ],
    screenshots: [
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', form_factor: 'wide' }
    ],
    related_applications: [],
    prefer_related_applications: false,
    dir: 'ltr'
  }
};

/**
 * Génère les shortcuts PWA selon la langue
 * @param {string} langCode - Code de langue
 * @param {Function|Object} t - Fonction de traduction i18next ou objet de traductions brutes
 */
export const getShortcuts = (langCode, t) => {
  // Si t est une fonction (i18next), l'utiliser directement
  // Sinon, créer une fonction helper pour accéder aux traductions
  const translate = typeof t === 'function' 
    ? t 
    : (key) => {
        const keys = key.split('.');
        let value = t;
        for (const k of keys) {
          value = value?.[k];
        }
        return value || key;
      };

  return [
    {
      name: translate('shortcuts.addMedication'),
      short_name: translate('shortcuts.addMedicationShort'),
      description: translate('shortcuts.addMedicationDesc'),
      url: `/${langCode}/add-calendar`,
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
    },
    {
      name: translate('shortcuts.calendar'),
      short_name: translate('shortcuts.calendarShort'),
      description: translate('shortcuts.calendarDesc'),
      url: `/${langCode}/calendars`,
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
    }
  ];
};

/**
 * Génère le Schema.org complet optimisé
 */
export const getSchemaOrg = (lng, t) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SEO_CONFIG.BASE_URL}/#webapp`,
      "name": t('app.name'),
      "alternateName": `${t('app.name')} - ${t('app.subtitle')}`,
      "url": SEO_CONFIG.BASE_URL,
      "applicationCategory": "HealthApplication",
      "applicationSubCategory": "Medical",
      "operatingSystem": "All",
      "description": t('app.description'),
      "screenshot": `${SEO_CONFIG.BASE_URL}/icons/icon-512.png`,
      "inLanguage": enabledLanguageCodes,
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "softwareVersion": SEO_CONFIG.APP_VERSION,
      "datePublished": CURRENT_DATE,
      "dateModified": CURRENT_DATE,
      "installUrl": `${SEO_CONFIG.BASE_URL}/${lng}/register`,
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      },
      "creator": {
        "@type": "Person",
        "@id": `${SEO_CONFIG.BASE_URL}/#creator`,
        "name": SEO_CONFIG.AUTHOR.name,
        "url": SEO_CONFIG.AUTHOR.github
      },
      "publisher": {
        "@id": `${SEO_CONFIG.BASE_URL}/#organization`
      }
    },
    {
      "@type": "Organization",
      "@id": `${SEO_CONFIG.BASE_URL}/#organization`,
      "name": t('app.name'),
      "url": SEO_CONFIG.BASE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SEO_CONFIG.BASE_URL}/icons/icon-192.png`,
        "width": 192,
        "height": 192
      },
      "founder": {
        "@type": "Person",
        "name": SEO_CONFIG.AUTHOR.name
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "email": SEO_CONFIG.AUTHOR.email,
        "contactType": "technical support",
        "availableLanguage": enabledLanguageCodes
      }
    },
    {
      "@type": "WebSite",
      "@id": `${SEO_CONFIG.BASE_URL}/#website`,
      "url": SEO_CONFIG.BASE_URL,
      "name": t('app.name'),
      "description": t('app.description'),
      "publisher": {
        "@id": `${SEO_CONFIG.BASE_URL}/#organization`
      },
      "inLanguage": enabledLanguageCodes
    },
    {
      "@type": "MobileApplication",
      "@id": `${SEO_CONFIG.BASE_URL}/#mobileapp`,
      "name": t('app.name'),
      "operatingSystem": "Android, iOS, Windows, macOS, Linux",
      "applicationCategory": "HealthApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  ]
});

/**
 * Utilitaire pour créer ou mettre à jour des balises meta/link
 */
export const upsertMetaTag = (tagName, keyAttr, key, attrs) => {
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
  return tag;
};
