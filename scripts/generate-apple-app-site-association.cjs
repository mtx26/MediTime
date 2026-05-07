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
