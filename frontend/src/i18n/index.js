/**
 * Barrel export pour tous les utilitaires d'internationalisation
 */

// Configuration SEO centralisée
export * from '../config/seo.js';
export * from '../config/languages.js';

// Hook SEO unifié
export { default as useSEO } from '../hooks/useSEO.js';

// Utilitaires
export * from '../utils/i18nManifests.js';
