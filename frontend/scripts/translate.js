const fs = require('fs');
const path = require('path');
const process = require('process');
require('dotenv').config();
const { Translate } = require('@google-cloud/translate').v2;

const translate = new Translate({
  key: process.env.VITE_GOOGLE_TRANSLATE_API_KEY,
});

const { LANGUAGES } = require('../src/config/languages');

const baseDir = path.join(__dirname, '..', 'src');
const sourceFile = path.join(baseDir, 'locales', 'fr', 'translation.json');
const outputBase = path.join(baseDir, 'locales');

const args = process.argv.slice(2);
const checkOnly = args.includes('--check-only');
const localOnly = args.includes('--local-only');
const forceTranslate = args.includes('--force');

// 📄 Charge JSON depuis un fichier
function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// 💾 Sauvegarde JSON dans un fichier
function saveJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// 🔍 Trouve les clés manquantes ou vides entre deux objets récursivement
function findMissingKeys(source, target, prefix = '') {
  let missing = [];

  for (const key in source) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    const sourceValue = source[key];
    const targetValue = target[key];

    const isMissing =
      !(key in target) ||
      (typeof targetValue === 'string' && targetValue.trim() === '');

    if (isMissing) {
      missing.push(fullKey);
    } else if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      typeof targetValue === 'object' &&
      targetValue !== null
    ) {
      missing = missing.concat(findMissingKeys(sourceValue, targetValue, fullKey));
    }
  }

  return missing;
}

// 🌍 Traduction récursive
async function translateObject(obj, targetLang) {
  const result = {};

  for (const key in obj) {
    const value = obj[key];
    if (typeof value === 'string') {
      try {
        const [translated] = await translate.translate(value, targetLang);
        result[key] = translated;
      } catch (e) {
        console.error(`❌ Erreur de traduction (${targetLang}) :`, value, e.message);
        result[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = await translateObject(value, targetLang);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// 🚀 Traitement principal
(async () => {
  const source = loadJSON(sourceFile);

  for (const lang of LANGUAGES) {
    const { code, locale } = lang;
    if (code === 'fr') continue;

    const outputFile = path.join(outputBase, code, 'translation.json');
    let target = fs.existsSync(outputFile) ? loadJSON(outputFile) : {};

    if (checkOnly) {
      const missing = findMissingKeys(source, target);
      if (missing.length > 0) {
        console.log(`⛔ Clés manquantes pour ${code} (${locale}):`);
        missing.forEach(k => console.log(`  - ${k}`));
      } else {
        console.log(`✅ ${code} : toutes les clés sont présentes.`);
      }
      continue;
    }

    if (localOnly) {
      target.locale = locale;
      saveJSON(outputFile, target);
      console.log(`🔁 ${code} : locale mis à jour en "${locale}"`);
      continue;
    }

    if (args.includes('--fill-missing')) {
      const missing = findMissingKeys(source, target);
      if (missing.length === 0) {
        console.log(`✅ ${code} : aucune clé manquante.`);
        continue;
      }

      console.log(`🧩 Remplissage des clés manquantes pour ${code}...`);
      for (const fullKey of missing) {
        let value = fullKey.split('.').reduce((obj, key) => obj?.[key], source);

        if (typeof value !== 'string' || value.trim() === '') {
          console.warn(`⚠️  Clé ignorée (vide ou introuvable dans fr): "${fullKey}"`);
          continue;
        }

        try {
          const [translated] = await translate.translate(value, code);
          const keys = fullKey.split('.');
          let ref = target;
          while (keys.length > 1) {
            const k = keys.shift();
            ref[k] = ref[k] || {};
            ref = ref[k];
          }
          ref[keys[0]] = translated;
          console.log(`✅ ${code} : "${fullKey}" → "${translated}"`);
        } catch (e) {
          console.error(`❌ Erreur de traduction pour ${fullKey} (${code}) : ${e.message}`);
        }
      }

      target.locale = locale;
      saveJSON(outputFile, target);
      console.log(`✅ ${code} : clés manquantes ajoutées.`);
      continue;
    }

    if (!forceTranslate && fs.existsSync(outputFile)) {
      console.log(`⏩ ${code} : fichier existant. Utilise --force ou --fill-missing.`);
      continue;
    }

    console.log(`🌐 Traduction de 'fr' → '${code}'...`);
    const translated = await translateObject(source, code);
    translated.locale = locale;
    saveJSON(outputFile, translated);
    console.log(`✅ ${code} : traduction complète enregistrée.`);
  }

  console.log('✨ Script terminé.');
})();
