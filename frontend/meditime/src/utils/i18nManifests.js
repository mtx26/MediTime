import fs from 'fs';
import path from 'path';
import { I18N_CONFIG } from '../config/i18nMeta.js';
import { enabledLanguageCodes } from '../config/languages.js';

/**
 * Lit les traductions d'un fichier de langue
 */
const loadTranslations = (langCode) => {
  try {
    const translationPath = path.join(process.cwd(), 'src', 'locales', langCode, 'translation.json');
    const translationContent = fs.readFileSync(translationPath, 'utf8');
    return JSON.parse(translationContent);
  } catch (error) {
    console.warn(`⚠️  Impossible de charger les traductions pour ${langCode}:`, error.message);
    return null;
  }
};

/**
 * Génère des manifests pour chaque langue en lisant les fichiers de traduction
 */
export const generateI18nManifests = async () => {
  const publicDir = path.join(process.cwd(), 'public');
  
  // Créer le dossier manifests s'il n'existe pas
  const manifestDir = path.join(publicDir, 'manifests');
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }

  let manifestsGenerated = 0;

  // Génère un manifest pour chaque langue supportée
  for (const langCode of enabledLanguageCodes) {
    try {
      const translations = loadTranslations(langCode);
      
      if (!translations || !translations.app) {
        console.warn(`⚠️  Traductions 'app' manquantes pour ${langCode}, utilisation des valeurs par défaut`);
        
        // Utilise des valeurs par défaut si les traductions manquent
        const fallbackManifest = {
          name: "MediTime",
          short_name: "MediTime",
          description: "Medical treatment scheduling and sharing application",
          start_url: `/${langCode}/`,
          lang: langCode,
          ...I18N_CONFIG.PWA_CONFIG
        };
        
        fs.writeFileSync(
          path.join(manifestDir, `manifest-${langCode}.json`),
          JSON.stringify(fallbackManifest, null, 2)
        );
      } else {
        // Utilise les traductions disponibles
        const manifest = {
          name: translations.app.name || "MediTime",
          short_name: translations.app.shortName || "MediTime",
          description: translations.app.description || "Medical treatment application",
          start_url: `/${langCode}/`,
          lang: langCode,
          ...I18N_CONFIG.PWA_CONFIG
        };
        
        fs.writeFileSync(
          path.join(manifestDir, `manifest-${langCode}.json`),
          JSON.stringify(manifest, null, 2)
        );
        
        console.log(`✅ Manifest généré pour ${langCode}: ${manifest.name}`);
      }
      
      manifestsGenerated++;
      
    } catch (error) {
      console.error(`❌ Erreur lors de la génération du manifest pour ${langCode}:`, error.message);
    }
  }
  
  // Génère le manifest par défaut (anglais)
  const enTranslations = loadTranslations('en');
  const defaultManifest = {
    name: enTranslations?.app?.name || "MediTime",
    short_name: enTranslations?.app?.shortName || "MediTime",
    description: enTranslations?.app?.description || "Medical treatment application",
    start_url: '/en/',
    lang: 'en',
    ...I18N_CONFIG.PWA_CONFIG
  };
  
  fs.writeFileSync(
    path.join(publicDir, 'manifest.json'),
    JSON.stringify(defaultManifest, null, 2)
  );

  console.log(`✅ ${manifestsGenerated} manifests i18n générés avec succès`);
  console.log('📁 Fichiers générés:');
  console.log('   - manifest.json (défaut)');
  enabledLanguageCodes.forEach(lang => {
    console.log(`   - manifests/manifest-${lang}.json`);
  });
};

/**
 * Fonction utilitaire pour obtenir l'URL du manifest selon la langue
 */
export const getManifestUrl = (language = 'en') => {
  if (enabledLanguageCodes.includes(language)) {
    return `/manifests/manifest-${language}.json`;
  }
  return '/manifest.json';
};

/**
 * Version synchrone pour les cas où on a déjà les traductions
 * (utilisée dans le hook React)
 */
export const generateManifestForLanguage = (language) => {
  const translations = loadTranslations(language);
  
  return {
    name: translations?.app?.name || "MediTime",
    short_name: translations?.app?.shortName || "MediTime",
    description: translations?.app?.description || "Medical treatment application",
    start_url: `/${language}/`,
    lang: language,
    ...I18N_CONFIG.PWA_CONFIG
  };
};

// Génère les manifests si ce script est exécuté directement
// Note: import.meta.url n'est pas supporté dans React Native
// if (import.meta.url === `file://${process.argv[1]}`) {
//   generateI18nManifests().catch(console.error);
// }
