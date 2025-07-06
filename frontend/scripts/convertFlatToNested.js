const fs = require('fs');
const path = require('path');
const glob = require('glob');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const SRC_DIR = path.join(__dirname, '../src');

// 🔁 Conversion flat → nested avec transformation "key" → "key.label" si conflit
function unflattenWithLabel(flatObj, keysToConvert) {
  const nestedObj = {};
  for (const flatKey in flatObj) {
    const keys = flatKey.split('.');
    let current = nestedObj;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (i === keys.length - 1) {
        if (keysToConvert.includes(keys[0]) && keys.length === 1) {
          if (!current[key]) current[key] = {};
          current[key]['label'] = flatObj[flatKey];
        } else {
          current[key] = flatObj[flatKey];
        }
      } else {
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
    }
  }
  return nestedObj;
}

// 📂 Trouve les clés plates en conflit avec des sous-clés (ex: "settings" et "settings.account")
function findConflictingFlatKeys(flatObj) {
  const flatKeys = Object.keys(flatObj);
  const topLevelKeys = new Set();

  for (const key of flatKeys) {
    const parts = key.split('.');
    if (parts.length === 1) {
      const hasNested = flatKeys.some(k => k.startsWith(`${key}.`));
      if (hasNested) {
        topLevelKeys.add(key);
      }
    }
  }

  return [...topLevelKeys];
}

// ✏️ Remplace les {t("key")} → {t("key.label")} dans tous les fichiers source
function replaceKeysInCode(baseDir, keysToReplace) {
  const pattern = path.join(baseDir, '**/*.{js,jsx,ts,tsx}');
  const files = glob.sync(pattern, { nodir: true });

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    for (const key of keysToReplace) {
      const regex = new RegExp(`t\\((['"\`])${key}\\1\\)`, 'g');
      if (regex.test(content)) {
        console.log(`🔁 Remplacement dans ${file} : ${key} → ${key}.label`);
        content = content.replace(regex, `t('${key}.label')`);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Fichier modifié : ${file}`);
    }
  }
}

// 🚀 Script principal
function processAllLanguages() {
  const locales = fs.readdirSync(LOCALES_DIR).filter((dir) =>
    fs.existsSync(path.join(LOCALES_DIR, dir, 'translation.json'))
  );

  if (locales.length === 0) {
    console.warn('❌ Aucun fichier translation.json trouvé.');
    return;
  }

  // On prend les conflits à partir du fichier français (clé de référence)
  const frTranslationPath = path.join(LOCALES_DIR, 'fr', 'translation.json');
  const frRaw = fs.readFileSync(frTranslationPath, 'utf8');
  const frFlat = JSON.parse(frRaw);
  const keysToReplace = findConflictingFlatKeys(frFlat);

  console.log(`🔍 Clés conflictuelles à transformer (label) :`, keysToReplace);
  replaceKeysInCode(SRC_DIR, keysToReplace);

  // On transforme tous les fichiers
  for (const locale of locales) {
    const filePath = path.join(LOCALES_DIR, locale, 'translation.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const flat = JSON.parse(raw);
    const nested = unflattenWithLabel(flat, keysToReplace);

    fs.writeFileSync(filePath, JSON.stringify(nested, null, 2), 'utf8');
    console.log(`🌍 ${locale}/translation.json transformé avec succès.`);
  }

  console.log('🎉 Toutes les traductions ont été converties.');
}

processAllLanguages();
