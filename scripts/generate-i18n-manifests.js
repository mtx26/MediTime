import fs from 'fs';
import path from 'path';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..', '..');
const localesRoot = path.join(repoRoot, 'packages', 'i18n', 'src', 'locales');
const publicDir = path.join(webRoot, 'public');
const manifestDir = path.join(publicDir, 'manifests');

const PWA_CONFIG = {
  scope: '/',
  display: 'standalone',
  orientation: 'portrait-primary',
  backgroundColor: '#FFFFFF',
  themeColor: '#5FC3B4',
  categories: ['health', 'medical', 'productivity', 'lifestyle'],
  icons: [
    { src: '/icons/icon-16.png', type: 'image/png', sizes: '16x16', purpose: 'any maskable' },
    { src: '/icons/icon-32.png', type: 'image/png', sizes: '32x32', purpose: 'any maskable' },
    { src: '/icons/icon-48.png', type: 'image/png', sizes: '48x48', purpose: 'any maskable' },
    { src: '/icons/icon-192.png', type: 'image/png', sizes: '192x192', purpose: 'any maskable' },
    { src: '/icons/icon-512.png', type: 'image/png', sizes: '512x512', purpose: 'any maskable' },
    { src: '/icons/apple-touch-icon.png', type: 'image/png', sizes: '180x180', purpose: 'any' }
  ],
  screenshots: [
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', form_factor: 'wide' }
  ],
  related_applications: [],
  prefer_related_applications: false,
  dir: 'ltr'
};

const resolveTranslation = (translations, key) => {
  return key.split('.').reduce((value, segment) => {
    if (!value || typeof value !== 'object') {
      return undefined;
    }
    return value[segment];
  }, translations);
};

const getShortcuts = (langCode, translations) => {
  const translate = (key, fallback) => {
    const value = resolveTranslation(translations, key);
    return typeof value === 'string' ? value : fallback;
  };

  return [
    {
      name: translate('shortcuts.addMedication', 'Add medication'),
      short_name: translate('shortcuts.addMedicationShort', 'Add'),
      description: translate('shortcuts.addMedicationDesc', 'Add a new medication calendar'),
      url: `/${langCode}/add-calendar`,
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
    },
    {
      name: translate('shortcuts.calendar', 'Calendar'),
      short_name: translate('shortcuts.calendarShort', 'Calendar'),
      description: translate('shortcuts.calendarDesc', 'Open your calendars'),
      url: `/${langCode}/calendars`,
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
    }
  ];
};

const loadTranslations = (langCode) => {
  try {
    const translationPath = path.join(localesRoot, langCode, 'translation.json');
    const translationContent = fs.readFileSync(translationPath, 'utf8');
    return JSON.parse(translationContent);
  } catch (error) {
    console.warn(`Impossible de charger les traductions pour ${langCode}:`, error.message);
    return null;
  }
};

const getLanguageCodes = () => {
  return fs.readdirSync(localesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
};

const createManifest = (langCode, translations) => ({
  name: translations?.app?.name || 'MediTime',
  short_name: translations?.app?.shortName || 'MediTime',
  description: translations?.app?.description || 'Medical treatment application',
  start_url: `/${langCode}/home`,
  lang: langCode,
  ...PWA_CONFIG,
  shortcuts: translations ? getShortcuts(langCode, translations) : []
});

async function generateI18nManifests() {
  const languageCodes = getLanguageCodes();

  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }

  console.log('Generation des manifests internationalises...');
  console.log(`Langues detectees: ${languageCodes.join(', ')}`);

  for (const langCode of languageCodes) {
    const translations = loadTranslations(langCode);
    const manifest = createManifest(langCode, translations);

    fs.writeFileSync(
      path.join(manifestDir, `manifest-${langCode}.json`),
      JSON.stringify(manifest, null, 2)
    );

    console.log(`Manifest genere pour ${langCode}: ${manifest.name}`);
  }

  const defaultTranslations = loadTranslations('en');
  const defaultManifest = createManifest('en', defaultTranslations);

  fs.writeFileSync(
    path.join(publicDir, 'manifest.json'),
    JSON.stringify(defaultManifest, null, 2)
  );

  console.log(`Manifests generes: ${languageCodes.length + 1}`);
}

generateI18nManifests().catch((error) => {
  console.error('Erreur lors de la generation des manifests:', error);
  process.exit(1);
});
