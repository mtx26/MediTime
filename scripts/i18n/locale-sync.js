import fs from 'fs';
import path from 'path';

const RE_PROTECT = /{{([^{}]*)}}/g;
const RE_RESTORE = /__NP__(.*?)___/g;

function protectPlaceholders(str) {
  return str.replace(RE_PROTECT, (_, inner) => `__NP__${inner}___`);
}

function restorePlaceholders(str) {
  return str.replace(RE_RESTORE, '{{$1}}');
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function getByKeyPath(obj, dottedPath) {
  return dottedPath.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return acc[part];
    }
    return undefined;
  }, obj);
}

export function setByKeyPath(obj, dottedPath, value) {
  const parts = dottedPath.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (current[part] === undefined) {
      current[part] = {};
    } else if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
      throw new Error(`Translation key conflict: "${parts.slice(0, i + 1).join('.')}" already contains a value`);
    }
    current = current[part];
  }

  const leafKey = parts[parts.length - 1];
  if (current[leafKey] && typeof current[leafKey] === 'object') {
    throw new Error(`Translation key conflict: "${dottedPath}" already contains nested keys`);
  }

  current[leafKey] = value;
}

export function isValidTranslationValue(value) {
  return typeof value === 'string' && value.trim() !== '';
}

export function keyToFallbackText(key) {
  return key.split('.').pop().replace(/_/g, ' ');
}

export function flattenTranslationKeys(obj, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const keyPath = prefix ? `${prefix}.${key}` : key;

    if (isValidTranslationValue(value)) {
      keys.push(keyPath);
      continue;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenTranslationKeys(value, keyPath));
    }
  }

  return keys;
}

export async function translateTextSafe(text, lang, translateClient) {
  if (!translateClient) {
    return text;
  }

  const protectedText = protectPlaceholders(text);
  const [translatedRaw] = await translateClient.translate(protectedText, lang);
  return restorePlaceholders(translatedRaw);
}

export function listLocaleCodes(localesRootDir) {
  return fs
    .readdirSync(localesRootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function localeFilePath(localesRootDir, code) {
  return path.join(localesRootDir, code, 'translation.json');
}
