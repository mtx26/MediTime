import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v2 as Translate } from '@google-cloud/translate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chargement de la configuration dotenv depuis le répertoire MediTime
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const translate = new Translate.Translate({
  key: process.env.VITE_GOOGLE_TRANSLATE_API_KEY,
});

// Déterminer le type de projet à partir des arguments
const args = process.argv.slice(2);
const projectType = args.find(arg => arg.startsWith('--project='))?.split('=')[1] || 'frontend';
const checkOnly = args.includes('--check-only');
const localOnly = args.includes('--local-only');
const forceTranslate = args.includes('--force');

// Configuration des chemins selon le type de projet
function getProjectPaths(type) {
  const basePath = path.join(__dirname, '..');
  
  switch (type) {
    case 'mobile':
    case 'mobile-app':
      return {
        configPath: path.join(basePath, 'mobile-app', 'src', 'config', 'languages.js'),
        localesBase: path.join(basePath, 'mobile-app', 'src', 'locales'),
        sourceFile: path.join(basePath, 'mobile-app', 'src', 'locales', 'fr', 'translation.json')
      };
    case 'frontend':
    default:
      return {
        configPath: path.join(basePath, 'frontend', 'src', 'config', 'languages.js'),
        localesBase: path.join(basePath, 'frontend', 'src', 'locales'),
        sourceFile: path.join(basePath, 'frontend', 'src', 'locales', 'fr', 'translation.json')
      };
  }
}

// Import dynamique de la configuration des langues
async function loadLanguagesConfig(configPath) {
  try {
    if (fs.existsSync(configPath)) {
      const { LANGUAGES } = await import(`file://${configPath}`);
      return LANGUAGES;
    } else {
      console.warn(`⚠️  Fichier de configuration des langues non trouvé: ${configPath}`);
      console.warn('Utilisation de la configuration par défaut.');
      return [
        { code: 'fr', locale: 'Français' },
        { code: 'en', locale: 'English' },
        { code: 'es', locale: 'Español' },
        { code: 'de', locale: 'Deutsch' },
        { code: 'it', locale: 'Italiano' }
      ];
    }
  } catch (error) {
    console.error(`❌ Erreur lors du chargement de la configuration: ${error.message}`);
    process.exit(1);
  }
}

const { configPath, localesBase, sourceFile } = getProjectPaths(projectType);

console.log(`🚀 Traduction pour le projet: ${projectType}`);
console.log(`📁 Répertoire locales: ${localesBase}`);
console.log(`📄 Fichier source: ${sourceFile}`);

// 📄 Charge JSON depuis un fichier
function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// 💾 Sauvegarde JSON dans un fichier
function saveJSON(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// 🔒 Protège les placeholders pour éviter leur traduction
const RE_PROTECT = /{{([^{}]*)}}/g;
const RE_RESTORE = /__NP__([^_]*)___/g;

function protectPlaceholders(str) {
  return str.replace(RE_PROTECT, (_, inner) => `__NP__${inner}___`);
}

function restorePlaceholders(str) {
  return str.replace(RE_RESTORE, '{{$1}}');
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
        const protectedValue = protectPlaceholders(value);
        const [translatedRaw] = await translate.translate(protectedValue, targetLang);
        const translated = restorePlaceholders(translatedRaw);
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
  try {
    // Vérifier que le fichier source existe
    if (!fs.existsSync(sourceFile)) {
      console.error(`❌ Fichier source non trouvé: ${sourceFile}`);
      process.exit(1);
    }

    const LANGUAGES = await loadLanguagesConfig(configPath);
    const source = loadJSON(sourceFile);
    
    for (const lang of LANGUAGES) {
      await processLanguage(lang, source);
    }
    console.log('✨ Script terminé.');
  } catch (error) {
    console.error(`❌ Erreur fatale: ${error.message}`);
    process.exit(1);
  }
})();

async function processLanguage(lang, source) {
  const { code, locale } = lang;
  if (code === 'fr') return;

  const outputFile = path.join(localesBase, code, 'translation.json');
  const target = fs.existsSync(outputFile) ? loadJSON(outputFile) : {};

  if (checkOnly) return logMissing(source, target, code, locale);
  if (localOnly) return updateLocale(target, outputFile, code, locale);
  if (args.includes('--fill-missing'))
    return await fillMissing(source, target, code, locale, outputFile);
  if (!forceTranslate && fs.existsSync(outputFile)) {
    console.log(`⏩ ${code} : fichier existant. Utilise --force ou --fill-missing.`);
    return;
  }
  await translateAndSave(source, code, locale, outputFile);
}

function logMissing(source, target, code, locale) {
  const missing = findMissingKeys(source, target);
  if (missing.length > 0) {
    console.log(`⛔ Clés manquantes pour ${code} (${locale}):`);
    missing.forEach((k) => console.log(`  - ${k}`));
  } else {
    console.log(`✅ ${code} : toutes les clés sont présentes.`);
  }
}

function updateLocale(target, outputFile, code, locale) {
  target.locale = locale;
  saveJSON(outputFile, target);
  console.log(`🔁 ${code} : locale mis à jour en "${locale}"`);
}

async function fillMissing(source, target, code, locale, outputFile) {
  const missing = findMissingKeys(source, target);
  if (missing.length === 0) {
    console.log(`✅ ${code} : aucune clé manquante.`);
    return;
  }

  console.log(`🧩 Remplissage des clés manquantes pour ${code}...`);
  for (const fullKey of missing) {
    await translateMissingKey(fullKey, source, target, code);
  }

  target.locale = locale;
  saveJSON(outputFile, target);
  console.log(`✅ ${code} : clés manquantes ajoutées.`);
}

async function translateMissingKey(fullKey, source, target, code) {
  const keys = fullKey.split('.');
  const value = keys.reduce((obj, key) => obj?.[key], source);
  if (value === undefined || value === null) {
    console.warn(`⚠️  Clé introuvable dans fr: "${fullKey}"`);
    return;
  }
  if (isSingleStringObject(value)) {
    await translateSingleStringObject(value, keys, target, code, fullKey);
    return;
  }
  if (typeof value === 'string') {
    await translateSimpleString(value, keys, target, code, fullKey);
    return;
  }
  if (typeof value === 'object') {
    await translateComplexObject(value, keys, target, code, fullKey);
    return;
  }
  console.warn(`⚠️  Clé ignorée (type non pris en charge): "${fullKey}"`);
}

function isSingleStringObject(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 1 &&
    typeof Object.values(value)[0] === 'string'
  );
}

async function translateSingleStringObject(value, keys, target, code, fullKey) {
  const onlyKey = Object.keys(value)[0];
  const onlyVal = value[onlyKey];
  try {
    const [translated] = await translate.translate(onlyVal, code);
    let ref = target;
    while (keys.length > 1) {
      const k = keys.shift();
      ref[k] = ref[k] || {};
      ref = ref[k];
    }
    ref[keys[0]] = { [onlyKey]: translated };
    console.log(`✅ ${code} : "${fullKey}.${onlyKey}" → "${translated}"`);
  } catch (e) {
    console.error(
      `❌ Erreur de traduction pour ${fullKey}.${onlyKey} (${code}) : ${e.message}`
    );
  }
}

async function translateSimpleString(value, keys, target, code, fullKey) {
  try {
    const protectedValue = protectPlaceholders(value);
    const [translatedRaw] = await translate.translate(protectedValue, code);
    const translated = restorePlaceholders(translatedRaw);
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

async function translateComplexObject(value, keys, target, code, fullKey) {
  try {
    const translatedSubtree = await translateObject(value, code);
    let ref = target;
    while (keys.length > 1) {
      const k = keys.shift();
      ref[k] = ref[k] || {};
      ref = ref[k];
    }
    ref[keys[0]] = translatedSubtree;
    console.log(`✅ ${code} : "${fullKey}" → (sous-clés traduites)`);
  } catch (e) {
    console.error(
      `❌ Erreur de traduction récursive pour ${fullKey} (${code}) : ${e.message}`
    );
  }
}

async function translateAndSave(source, code, locale, outputFile) {
  console.log(`🌐 Traduction de 'fr' → '${code}'...`);
  const translated = await translateObject(source, code);
  translated.locale = locale;
  saveJSON(outputFile, translated);
  console.log(`✅ ${code} : traduction complète enregistrée.`);
}
