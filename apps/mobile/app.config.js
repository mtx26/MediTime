const path = require('path');

try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env'), quiet: true });
} catch {
  // Expo can still boot with environment variables provided by the shell or CI.
}

const appJson = require('./app.json');

const appleTeamId = (process.env.EXPO_PUBLIC_APPLE_TEAM_ID || process.env.APPLE_TEAM_ID || '').trim();

const config = {
  ...appJson.expo,
  plugins: [
    ...(appJson.expo.plugins ?? []),
    '@react-native-community/datetimepicker',
  ],
  ios: {
    ...appJson.expo.ios,
    icon: {
      light: './assets/icon.png',
      dark: './assets/icon-dark.png',
      tinted: './assets/icon-dark.png',
    },
  },
  android: {
    ...appJson.expo.android,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      monochromeImage: './assets/adaptive-icon-dark.png',
    },
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'meditime-app.com',
            pathPrefix: '/',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
};

if (appleTeamId) {
  config.ios.associatedDomains = [
    'applinks:meditime-app.com',
    'applinks:dev.meditime-app.com',
  ];
}

module.exports = {
  expo: config,
};
