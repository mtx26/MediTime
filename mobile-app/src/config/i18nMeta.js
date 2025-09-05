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
  
  // Configuration PWA
  PWA_CONFIG: {
    display: 'standalone',
    backgroundColor: '#FFFFFF',
    themeColor: '#5FC3B4',
    icons: [
      {
        src: '/icons/icon-192.png',
        type: 'image/png',
        sizes: '192x192'
      },
      {
        src: '/icons/icon-512.png',
        type: 'image/png',
        sizes: '512x512'
      },
      {
        src: '/icons/apple-touch-icon.png',
        type: 'image/png',
        sizes: '180x180',
        purpose: 'any'
      }
    ]
  }
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
};
