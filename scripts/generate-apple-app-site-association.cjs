const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const webRoot = process.cwd();
const outputPath = path.join(webRoot, 'public', '.well-known', 'apple-app-site-association');

for (const envFile of ['.env', '.env.local', '.env.prod', '.env.dev']) {
  const envPath = path.join(webRoot, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, quiet: true });
  }
}

const appleTeamId = (process.env.VITE_APPLE_TEAM_ID || '').trim();
const bundleId = (process.env.IOS_BUNDLE_ID || 'app.meditime.mobile').trim();

// Les .env ne sont pas versionnés : sur Vercel, VITE_APPLE_TEAM_ID doit être
// défini dans le dashboard. S'il manque, ce script écrivait un AASA avec
// `details: []`, ce qui désactive les universal links iOS sans aucune erreur
// visible — le site se déployait normalement et seuls les liens cassaient.
const isProductionBuild =
  process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

if (isProductionBuild && !appleTeamId) {
  console.error(
    'VITE_APPLE_TEAM_ID est manquante : ' +
    "l'apple-app-site-association serait généré sans appID et les universal links " +
    'iOS seraient inertes. Définissez la variable dans le projet Vercel.'
  );
  process.exit(1);
}

const details = appleTeamId
  ? [
      {
        appIDs: [`${appleTeamId}.${bundleId}`],
        components: [
          {
            '/': '/*',
            comment: 'Matches all paths',
          },
        ],
      },
    ]
  : [];

const association = {
  applinks: {
    details,
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(association, null, 2)}\n`);

if (appleTeamId) {
  console.log(`AASA generated for ${appleTeamId}.${bundleId}`);
} else {
  console.log('AASA generated without appID because VITE_APPLE_TEAM_ID is not set');
}
