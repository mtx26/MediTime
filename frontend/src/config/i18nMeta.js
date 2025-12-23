/**
 * Configuration centralisée pour l'internationalisation des métadonnées
 */

// Fonction pour obtenir l'URL de base (compatible Node.js et navigateur)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // En mode navigateur, utilise Vite env
    return import.meta.env?.VITE_VITE_URL || 'https://meditime.app';
  } else {
    // En mode Node.js, utilise process.env ou fallback
    return process.env.VITE_VITE_URL || 'https://meditime.app';
  }
};

export const I18N_CONFIG = {
  // URLs de base
  BASE_URL: getBaseUrl(),
  
  // Métadonnées par défaut
  DEFAULT_META: {
    siteName: 'MediTime',
    twitterSite: '@MediTime',
    ogType: 'website',
    ogImage: '/icons/og-image.png',
    twitterCard: 'summary_large_image'
  },
  
  // Configuration PWA de base (sans shortcuts qui dépendent de la langue)
  PWA_CONFIG_BASE: {
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    backgroundColor: '#FFFFFF',
    themeColor: '#5FC3B4',
    categories: ['health', 'medical', 'productivity', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-16.png',
        type: 'image/png',
        sizes: '16x16',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-32.png',
        type: 'image/png',
        sizes: '32x32',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-48.png',
        type: 'image/png',
        sizes: '48x48',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-192.png',
        type: 'image/png',
        sizes: '192x192',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-512.png',
        type: 'image/png',
        sizes: '512x512',
        purpose: 'any maskable'
      },
      {
        src: '/icons/apple-touch-icon.png',
        type: 'image/png',
        sizes: '180x180',
        purpose: 'any'
      }
    ],
    screenshots: [
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'wide'
      }
    ],
    related_applications: [],
    prefer_related_applications: false,
    dir: 'ltr'
  }
};

/**
 * Génère les shortcuts PWA selon la langue
 */
export const getShortcuts = (langCode = 'en', translations = null) => {
  return [
    {
      name: translations?.shortcuts?.addMedication || 'Add Medication',
      short_name: translations?.shortcuts?.addMedicationShort || 'Add Med',
      description: translations?.shortcuts?.addMedicationDesc || 'Quickly add a new medication',
      url: `/${langCode}/add-calendar`,
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
    },
    {
      name: translations?.shortcuts?.calendar || 'Calendar',
      short_name: translations?.shortcuts?.calendarShort || 'Calendar',
      description: translations?.shortcuts?.calendarDesc || 'View your medication calendar',
      url: `/${langCode}/calendars`,
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
    }
  ];
};

/**
 * Génère la config PWA complète pour une langue donnée
 */
export const getPWAConfig = (langCode = 'en', translations = null) => {
  return {
    ...I18N_CONFIG.PWA_CONFIG_BASE,
    shortcuts: getShortcuts(langCode, translations)
  };
};

/**
 * Utilitaire pour créer ou mettre à jour des balises meta
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
}