import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { v2 as Translate } from '@google-cloud/translate';
import { collectBackendKeys, collectFrontendKeys } from './collect-keys.js';
import {
  getByKeyPath,
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
const workspaceFrontendDir = path.join(workspaceRootDir, 'apps', 'web');
const workspaceBackendDir = path.join(workspaceRootDir, 'apps', 'backend');
const workspaceBackendAppDir = path.join(workspaceRootDir, 'apps', 'backend', 'app');
const frontendSrcDir = path.join(workspaceFrontendDir, 'src');
const localesRootDir = path.join(workspaceRootDir, 'packages', 'i18n', 'src', 'locales');
const frPath = localeFilePath(localesRootDir, 'fr');

function loadMonorepoEnv() {
  const envFiles = [
    path.join(workspaceRootDir, '.env'),
    path.join(workspaceBackendDir, '.env'),
    path.join(workspaceFrontendDir, '.env'),
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

const apiKey = process.env.VITE_GOOGLE_TRANSLATE_API_KEY;
const canTranslate = !noTranslate && Boolean(apiKey);
const translateClient = canTranslate ? new Translate.Translate({ key: apiKey }) : null;

function mergeKeyMaps(primary, secondary) {
  const merged = new Map(primary);

  for (const [key, refs] of secondary.entries()) {
    if (!merged.has(key)) {
      merged.set(key, []);
    }
    merged.get(key).push(...refs);
  }

  return merged;
}

function chooseFrValue(key, refs) {
  const backendRef = refs.find((ref) => ref.source === 'backend' && ref.message && ref.message.trim() !== '');
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

  const backendKeys = collectBackendKeys(workspaceBackendAppDir);
  const frontendKeys = collectFrontendKeys(frontendSrcDir);
  const allKeys = mergeKeyMaps(backendKeys, frontendKeys);

  const allSortedKeys = [...allKeys.keys()].sort();
  const localeCodes = listLocaleCodes(localesRootDir);

  console.log(`backend keys: ${backendKeys.size}`);
  console.log(`frontend keys: ${frontendKeys.size}`);
  console.log(`total unique keys: ${allSortedKeys.length}`);
  console.log(`locales: ${localeCodes.join(', ')}`);

  const frData = readJson(frPath);

  let frAdded = 0;
  for (const key of allSortedKeys) {
    const current = getByKeyPath(frData, key);
    if (isValidTranslationValue(current)) {
      continue;
    }

    const refs = allKeys.get(key) || [];
    const value = chooseFrValue(key, refs);
    setByKeyPath(frData, key, value);
    frAdded += 1;
  }

  if (!dryRun && frAdded > 0) {
    writeJson(frPath, frData);
  }

  let translatedAdded = 0;
  const perLocaleAdded = new Map();

  for (const code of localeCodes) {
    if (code === 'fr') {
      continue;
    }

    const filePath = localeFilePath(localesRootDir, code);
    const data = readJson(filePath);
    let added = 0;

    for (const key of allSortedKeys) {
      const current = getByKeyPath(data, key);
      if (isValidTranslationValue(current)) {
        continue;
      }

      const frValue = getByKeyPath(frData, key);
      const sourceText = isValidTranslationValue(frValue) ? frValue : keyToFallbackText(key);
      const translated = await translateTextSafe(sourceText, code, translateClient);
      setByKeyPath(data, key, translated);
      added += 1;
      translatedAdded += 1;
    }

    perLocaleAdded.set(code, added);

    if (!dryRun && added > 0) {
      writeJson(filePath, data);
    }
  }

  const missingAfter = [];

  for (const code of localeCodes) {
    const filePath = localeFilePath(localesRootDir, code);
    const data = code === 'fr' ? frData : readJson(filePath);

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

  if (!canTranslate) {
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
