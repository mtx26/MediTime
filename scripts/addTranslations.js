import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script pour ajouter les traductions backend dans les fichiers de locales
 */

async function addTranslations() {
    console.log('📝 Ajout des traductions...\n');

    // Charger le fichier d'analyse
    const analysisPath = path.join(__dirname, 'output', 'backend_analysis.json');
    const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

    // Créer la structure des traductions par clé
    const translations = {
        fr: { api: {} }
    };

    // Grouper par catégorie et clé
    for (const response of analysisData.responses) {
        const { i18nKey, messageFr } = response;
        
        if (!i18nKey) continue;

        // Extraire category et key de "api.category.key"
        const parts = i18nKey.split('.');
        if (parts.length !== 3 || parts[0] !== 'api') continue;

        const category = parts[1];
        const key = parts[2];

        // Initialiser la catégorie si nécessaire
        if (!translations.fr.api[category]) {
            translations.fr.api[category] = {};
        }
        // Ajouter les traductions
        translations.fr.api[category][key] = messageFr;
    }

    // Charger et mettre à jour les fichiers de traduction FR
    const localesPath = path.join(__dirname, '..', 'src', 'locales');

    // Français
    const frPath = path.join(localesPath, 'fr', 'translation.json');
    const frData = JSON.parse(fs.readFileSync(frPath, 'utf8'));
    frData.api = translations.fr.api;
    fs.writeFileSync(frPath, JSON.stringify(frData, null, 2), 'utf8');
    console.log('✅ Traductions FR ajoutées');

    // Statistiques
    const categories = Object.keys(translations.fr.api);
    let totalKeys = 0;
    
    console.log('\n📊 Statistiques par catégorie:');
    categories.forEach(category => {
        const count = Object.keys(translations.fr.api[category]).length;
        totalKeys += count;
        console.log(`   - api.${category}: ${count} clés`);
    });
    
    console.log(`\n🔑 Total: ${totalKeys} clés de traduction ajoutées`);
}

addTranslations().catch(console.error);
