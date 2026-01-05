import { generateI18nManifests } from '../src/utils/i18nManifests.js';

// Script pour générer les manifests i18n
console.log('🚀 Génération des manifests internationalisés...');
console.log('📋 Langues supportées: fr-FR, en-US, es-ES, de-DE, it-IT, ja-JP, zh-CN, pt-BR, ru-RU');

generateI18nManifests()
  .then(() => {
    console.log('✅ Génération terminée avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de la génération:', error);
    process.exit(1);
  });
