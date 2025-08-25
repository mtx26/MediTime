/**
 * Barrel export pour tous les utilitaires d'internationalisation
 */

// Configuration
export * from '../config/i18nMeta.js';
export * from '../config/languages.js';

// Hooks
export { default as useI18nMetadata } from '../hooks/useI18nMetadata.js';

// Composants
export { default as I18nHead } from '../components/common/I18nHead.jsx';

// Utilitaires (si vous voulez garder les scripts de génération)
export * from '../utils/i18nManifests.js';
