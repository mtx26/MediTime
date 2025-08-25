import { generateI18nManifests } from '../src/utils/i18nManifests.js';

// Script pour générer les manifests i18n
console.log('🚀 Génération des manifests internationalisés...');
console.log('📋 Langues supportées: fr, en, es, de, it, ja, zh, pt, ru');

generateI18nManifests()
  .then(() => {
    console.log('✅ Génération terminée avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la génération:', error);
    process.exit(1);
  });
