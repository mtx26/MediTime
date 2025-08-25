# Système d'Internationalisation MediTime

Ce dossier contient tous les éléments nécessaires pour l'internationalisation des métadonnées de l'application MediTime.

## 📁 Structure

```
src/
├── i18n/
│   └── index.js           # Barrel exports pour tous les utilitaires i18n
├── config/
│   ├── i18nMeta.js        # Configuration centralisée des métadonnées
│   └── languages.js       # Configuration des langues supportées
├── hooks/
│   └── useI18nMetadata.js # Hook unifié pour toutes les métadonnées
├── components/common/
│   └── I18nHead.jsx       # Composant simplifié pour les métadonnées
└── utils/
    └── i18nManifests.js   # Générateur de manifests PWA par langue
```

## 🚀 Utilisation

### Import simplifié

```javascript
import { I18nHead, useI18nMetadata } from '../i18n';
```

### Dans un composant

```jsx
// Utilisation basique (utilise les traductions par défaut)
<I18nHead />

// Avec titre et description personnalisés
<I18nHead 
  title={t('ma.page.title')} 
  description={t('ma.page.description')} 
  path="/ma-page"
/>

// Avec métadonnées personnalisées
<I18nHead 
  title="Mon titre"
  description="Ma description"
  path="/ma-page"
  customMeta={{
    'og:image': '/my-custom-image.jpg',
    'twitter:creator': '@mon_compte'
  }}
/>
```

### Avec le hook directement

```javascript
const { title, description, url, currentLanguage } = useI18nMetadata({
  title: t('ma.page.title'),
  description: t('ma.page.description'),
  path: '/ma-page'
});
```

## ⚙️ Configuration

### Métadonnées par défaut
Modifiez `src/config/i18nMeta.js` pour changer :
- URL de base
- Nom du site
- Images par défaut
- Configuration PWA

### Langues supportées
Modifiez `src/config/languages.js` pour ajouter/supprimer des langues.

### Traductions
Ajoutez les clés suivantes dans vos fichiers de traduction :
```json
{
  "app": {
    "name": "MediTime",
    "shortName": "MediTime",
    "description": "Description de l'app",
    "pageTitle": "Titre de la page par défaut"
  }
}
```

## 🏗️ Build

```bash
# Génère les manifests PWA par langue
npm run build:i18n

# Build complet avec i18n
npm run build
```

## ✨ Fonctionnalités automatiques

- ✅ Titre de page traduit
- ✅ Métadonnées de base (description, application-name, etc.)
- ✅ Attribut `lang` du HTML
- ✅ Liens canoniques et alternatifs
- ✅ Open Graph tags
- ✅ Twitter Cards
- ✅ Manifest PWA dynamique
- ✅ Support SEO multilingue

## 🔧 Maintenance

Le système est conçu pour être maintenable :
- Configuration centralisée
- Pas de duplication de code
- Types TypeScript (si ajoutés)
- Documentation intégrée
