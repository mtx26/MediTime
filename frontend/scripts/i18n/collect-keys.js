import fs from 'fs';
import path from 'path';

export function walkFiles(rootDir, extensions) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const out = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === '__pycache__' || entry.name === 'node_modules' || entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
        out.push(fullPath);
      }
    }
  }

  return out;
}

function extractResponseBlocks(content) {
  const responsePattern = /(success_response|error_response|warning_response)\s*\(/g;
  const blocks = [];
  let match;

  while ((match = responsePattern.exec(content)) !== null) {
    const start = match.index;
    let end = start;
    let parenCount = 1;
    let inString = false;
    let stringChar = null;

    for (let i = match.index + match[0].length; i < content.length; i += 1) {
      const ch = content[i];
      const prev = i > 0 ? content[i - 1] : '';

      if ((ch === '"' || ch === "'") && prev !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = ch;
        } else if (ch === stringChar) {
          inString = false;
          stringChar = null;
        }
      }

      if (!inString) {
        if (ch === '(') parenCount += 1;
        if (ch === ')') parenCount -= 1;
        if (parenCount === 0) {
          end = i;
          break;
        }
      }
    }

    if (end > start) {
      blocks.push({ start, block: content.slice(start, end + 1) });
    }
  }

  return blocks;
}

export function collectBackendKeys(backendAppDir) {
  const pyFiles = walkFiles(backendAppDir, ['.py']);
  const byKey = new Map();

  for (const filePath of pyFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const blocks = extractResponseBlocks(content);

    for (const { start, block } of blocks) {
      const keyMatch = block.match(/i18n_key\s*=\s*(["'])(.*?)\1/);
      if (!keyMatch) {
        continue;
      }

      const key = keyMatch[2].trim();
      if (!key) {
        continue;
      }

      const messageMatchDouble = block.match(/message\s*=\s*"([^"]*)"/);
      const messageMatchSingle = block.match(/message\s*=\s*'([^']*)'/);
      const message = messageMatchDouble ? messageMatchDouble[1] : messageMatchSingle ? messageMatchSingle[1] : '';
      const line = content.slice(0, start).split('\n').length;

      if (!byKey.has(key)) {
        byKey.set(key, []);
      }

      byKey.get(key).push({ source: 'backend', filePath, line, message });
    }
  }

  return byKey;
}

function addFrontendKey(byKey, key, ref) {
  const normalized = key.trim();
  if (!normalized) {
    return;
  }

  if (normalized.includes('${')) {
    return;
  }

  if (!byKey.has(normalized)) {
    byKey.set(normalized, []);
  }

  byKey.get(normalized).push(ref);
}

export function collectFrontendKeys(frontendSrcDir, baseMap = new Map()) {
  const files = walkFiles(frontendSrcDir, ['.js', '.jsx', '.ts', '.tsx']);
  const byKey = new Map(baseMap);

  const callPatterns = [
    /\bt\s*\(\s*(["'`])([^"'`]+)\1\s*[,)\]]/g,
    /\bi18n\.t\s*\(\s*(["'`])([^"'`]+)\1\s*[,)\]]/g,
    /\bi18next\.t\s*\(\s*(["'`])([^"'`]+)\1\s*[,)\]]/g,
    /\bi18nKey\s*=\s*(["'`])([^"'`]+)\1/g,
  ];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');

    for (const pattern of callPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const key = match[2];
        const line = content.slice(0, match.index).split('\n').length;
        addFrontendKey(byKey, key, { source: 'frontend', filePath, line, message: '' });
      }
    }
  }

  return byKey;
}
