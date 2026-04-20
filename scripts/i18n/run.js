import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { v2 as Translate } from '@google-cloud/translate';
import { collectBackendKeys, collectFrontendKeys } from './collect-keys.js';
import {
  getByKeyPath,
  flattenTranslationKeys,
  isValidTranslationValue,
  keyToFallbackText,
  listLocaleCodes,
  localeFilePath,
  readJson,
  setByKeyPath,
  translateTextSafe,
  writeJson,
} from './locale-sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspaceRootDir = path.join(__dirname, '..', '..');
const workspaceBackendDir = path.join(workspaceRootDir, 'apps', 'backend');
const workspaceWebDir = path.join(workspaceRootDir, 'apps', 'web');
const backendAppDir = path.join(workspaceBackendDir, 'app');
const frontendSourceDirs = [
  path.join(workspaceWebDir, 'src'),
  path.join(workspaceRootDir, 'apps', 'mobile', 'src'),
  path.join(workspaceRootDir, 'apps', 'mobile', 'app'),
];
const localesRootDir = path.join(workspaceRootDir, 'packages', 'i18n', 'src', 'locales');
const frPath = localeFilePath(localesRootDir, 'fr');

function loadMonorepoEnv() {
  const envFiles = [
    path.join(workspaceRootDir, '.env'),
    path.join(workspaceBackendDir, '.env'),
    path.join(workspaceWebDir, '.env'),
  ];

  const loaded = [];
  for (const envFile of envFiles) {
    const resolvedEnvFile = path.resolve(envFile);
    if (!resolvedEnvFile.startsWith(path.resolve(workspaceRootDir))) {
      continue;
    }
    if (!fs.existsSync(resolvedEnvFile)) {
      continue;
    }

    dotenv.config({ path: resolvedEnvFile, override: true });
    loaded.push(resolvedEnvFile);
  }

  return loaded;
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const noTranslate = args.includes('--no-translate');
const strict = args.includes('--strict');

function createTranslateClient() {
  const apiKey = process.env.VITE_GOOGLE_TRANSLATE_API_KEY;
  return !noTranslate && apiKey ? new Translate.Translate({ key: apiKey }) : null;
}

function collectFrontendSourceKeys() {
  return frontendSourceDirs.reduce((keys, dir) => collectFrontendKeys(dir, keys), new Map());
}

function sortUniqueKeys(...keyLists) {
  return [...new Set(keyLists.flatMap((keys) => [...keys]))].sort();
}

async function fillMissingTranslations(data, keys, resolveValue) {
  let added = 0;

  for (const key of keys) {
    if (isValidTranslationValue(getByKeyPath(data, key))) {
      continue;
    }

    setByKeyPath(data, key, await resolveValue(key));
    added += 1;
  }

  return added;
}

function chooseFrValue(key, backendRefs = []) {
  const backendRef = backendRefs.find((ref) => ref.message && ref.message.trim() !== '');
  if (backendRef) {
    return backendRef.message;
  }

  return keyToFallbackText(key);
}

async function main() {
  const loadedEnvFiles = loadMonorepoEnv();
  console.log('i18n sync started');
  console.log(`mode: ${dryRun ? 'dry-run' : 'write'}`);
  console.log(
    loadedEnvFiles.length > 0
      ? `env loaded: ${loadedEnvFiles.join(', ')}`
      : 'env loaded: none (.env not found)',
  );

  const frData = readJson(frPath);
  const frLocaleKeys = flattenTranslationKeys(frData);
  const backendKeys = collectBackendKeys(backendAppDir);
  const frontendKeys = collectFrontendSourceKeys();
  const allSortedKeys = sortUniqueKeys(backendKeys.keys(), frontendKeys.keys(), frLocaleKeys);
  const translateClient = createTranslateClient();

  const localeCodes = listLocaleCodes(localesRootDir);

  console.log(`backend keys: ${backendKeys.size}`);
  console.log(`frontend dirs: ${frontendSourceDirs.map((dir) => path.relative(workspaceRootDir, dir)).join(', ')}`);
  console.log(`frontend keys: ${frontendKeys.size}`);
  console.log(`fr locale keys: ${frLocaleKeys.length}`);
  console.log(`total unique keys: ${allSortedKeys.length}`);
  console.log(`locales: ${localeCodes.join(', ')}`);

  const frAdded = await fillMissingTranslations(frData, allSortedKeys, (key) => chooseFrValue(key, backendKeys.get(key)));

  if (!dryRun && frAdded > 0) {
    writeJson(frPath, frData);
  }

  let translatedAdded = 0;
  const perLocaleAdded = new Map();
  const localeDataByCode = new Map([['fr', frData]]);

  for (const code of localeCodes) {
    if (code === 'fr') {
      continue;
    }

    const filePath = localeFilePath(localesRootDir, code);
    const data = readJson(filePath);
    const added = await fillMissingTranslations(data, allSortedKeys, async (key) => {
      const frValue = getByKeyPath(frData, key);
      const sourceText = isValidTranslationValue(frValue) ? frValue : keyToFallbackText(key);
      return translateTextSafe(sourceText, code, translateClient);
    });

    perLocaleAdded.set(code, added);
    translatedAdded += added;
    localeDataByCode.set(code, data);

    if (!dryRun && added > 0) {
      writeJson(filePath, data);
    }
  }

  const missingAfter = [];

  for (const code of localeCodes) {
    const data = localeDataByCode.get(code) || readJson(localeFilePath(localesRootDir, code));

    const missing = allSortedKeys.filter((key) => !isValidTranslationValue(getByKeyPath(data, key)));
    if (missing.length > 0) {
      missingAfter.push({ code, missing });
    }
  }

  console.log(`fr added: ${frAdded}`);
  for (const [code, added] of perLocaleAdded.entries()) {
    console.log(`${code} added: ${added}`);
  }
  console.log(`non-fr added total: ${translatedAdded}`);

  if (!translateClient) {
    console.log('translation API disabled or missing: fallback value copied from fr for non-fr locales');
  }

  if (missingAfter.length > 0) {
    console.error('missing keys remain after sync');
    for (const entry of missingAfter) {
      console.error(`${entry.code}: ${entry.missing.length}`);
    }
    process.exitCode = 1;
    return;
  }

  if (strict && (frAdded > 0 || translatedAdded > 0)) {
    console.error('strict mode: updates were required');
    process.exitCode = 1;
    return;
  }

  console.log('i18n sync completed');
}

main().catch((error) => {
  console.error('i18n sync error:', error.message);
  process.exitCode = 1;
});
