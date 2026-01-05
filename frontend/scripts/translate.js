import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { v2 as Translate } from '@google-cloud/translate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const translate = new Translate.Translate({
  key: process.env.VITE_GOOGLE_TRANSLATE_API_KEY,
});

import { LANGUAGES, DEFAULT_LANG } from '../src/config/languages.js';

const baseDir = path.join(__dirname, '..', 'src');
const sourceFile = path.join(baseDir, 'locales', DEFAULT_LANG, 'translation.json');
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
  const source = loadJSON(sourceFile);
  for (const lang of LANGUAGES) {
    await processLanguage(lang, source);
  }
  console.log('✨ Script terminé.');
})();

async function processLanguage(lang, source) {
  const { locale } = lang;
  if (locale === DEFAULT_LANG) return;

  const outputFile = path.join(outputBase, locale, 'translation.json');
  const target = fs.existsSync(outputFile) ? loadJSON(outputFile) : {};

  if (checkOnly) return logMissing(source, target, locale);
  if (localOnly) return updateLocale(target, outputFile, locale);
  if (args.includes('--fill-missing'))
    return await fillMissing(source, target, locale, outputFile);
  if (!forceTranslate && fs.existsSync(outputFile)) {
    console.log(`⏩ ${locale} : fichier existant. Utilise --force ou --fill-missing.`);
    return;
  }
  await translateAndSave(source, locale, outputFile);
}

function logMissing(source, target, locale) {
  const missing = findMissingKeys(source, target);
  if (missing.length > 0) {
    console.log(`⛔ Clés manquantes pour ${locale}:`);
    missing.forEach((k) => console.log(`  - ${k}`));
  } else {
    console.log(`✅ ${locale} : toutes les clés sont présentes.`);
  }
}

function updateLocale(target, outputFile, locale) {
  target.locale = locale;
  saveJSON(outputFile, target);
  console.log(`🔁 ${locale} : locale mis à jour`);
}

async function fillMissing(source, target, locale, outputFile) {
  const missing = findMissingKeys(source, target);
  if (missing.length === 0) {
    console.log(`✅ ${locale} : aucune clé manquante.`);
    return;
  }

  console.log(`🧩 Remplissage des clés manquantes pour ${locale}...`);
  for (const fullKey of missing) {
    await translateMissingKey(fullKey, source, target, locale);
  }

  target.locale = locale;
  saveJSON(outputFile, target);
  console.log(`✅ ${locale} : clés manquantes ajoutées.`);
}

async function translateMissingKey(fullKey, source, target, locale) {
  const keys = fullKey.split('.');
  const value = keys.reduce((obj, key) => obj?.[key], source);
  if (value === undefined || value === null) {
    console.warn(`⚠️  Clé introuvable dans la source: "${fullKey}"`);
    return;
  }
  if (isSingleStringObject(value)) {
    await translateSingleStringObject(value, keys, target, locale, fullKey);
    return;
  }
  if (typeof value === 'string') {
    await translateSimpleString(value, keys, target, locale, fullKey);
    return;
  }
  if (typeof value === 'object') {
    await translateComplexObject(value, keys, target, locale, fullKey);
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

async function translateSingleStringObject(value, keys, target, locale, fullKey) {
  const onlyKey = Object.keys(value)[0];
  const onlyVal = value[onlyKey];
  try {
    const [translated] = await translate.translate(onlyVal, locale);
    let ref = target;
    while (keys.length > 1) {
      const k = keys.shift();
      ref[k] = ref[k] || {};
      ref = ref[k];
    }
    ref[keys[0]] = { [onlyKey]: translated };
    console.log(`✅ ${locale} : "${fullKey}.${onlyKey}" → "${translated}"`);
  } catch (e) {
    console.error(
      `❌ Erreur de traduction pour ${fullKey}.${onlyKey} (${locale}) : ${e.message}`
    );
  }
}

async function translateSimpleString(value, keys, target, locale, fullKey) {
  try {
    const protectedValue = protectPlaceholders(value);
    const [translatedRaw] = await translate.translate(protectedValue, locale);
    const translated = restorePlaceholders(translatedRaw);
    let ref = target;
    while (keys.length > 1) {
      const k = keys.shift();
      ref[k] = ref[k] || {};
      ref = ref[k];
    }
    ref[keys[0]] = translated;
    console.log(`✅ ${locale} : "${fullKey}" → "${translated}"`);
  } catch (e) {
    console.error(`❌ Erreur de traduction pour ${fullKey} (${locale}) : ${e.message}`);
  }
}

async function translateComplexObject(value, keys, target, locale, fullKey) {
  try {
    const translatedSubtree = await translateObject(value, locale);
    let ref = target;
    while (keys.length > 1) {
      const k = keys.shift();
      ref[k] = ref[k] || {};
      ref = ref[k];
    }
    ref[keys[0]] = translatedSubtree;
    console.log(`✅ ${locale} : "${fullKey}" → (sous-clés traduites)`);
  } catch (e) {
    console.error(
      `❌ Erreur de traduction récursive pour ${fullKey} (${locale}) : ${e.message}`
    );
  }
}

async function translateAndSave(source, locale, outputFile) {
  console.log(`🌐 Traduction de '${DEFAULT_LANG}' → '${locale}'...`);
  const translated = await translateObject(source, locale);
  translated.locale = locale;
  saveJSON(outputFile, translated);
  console.log(`✅ ${locale} : traduction complète enregistrée.`);
}
