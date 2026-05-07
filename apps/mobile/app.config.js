const path = require('path');

try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env'), quiet: true });
} catch {
  // Expo can still boot with environment variables provided by the shell or CI.
}

const appJson = require('./app.json');

const appleTeamId = (process.env.EXPO_PUBLIC_APPLE_TEAM_ID || '').trim();
const googleServicesJsonPath = process.env.GOOGLE_SERVICES_JSON || './google-services.json';
const googleServicesInfoPlistPath = process.env.GOOGLE_SERVICES_INFO_PLIST || './GoogleService-Info.plist';

const config = {
  ...appJson.expo,
  plugins: [
    ...(appJson.expo.plugins ?? []),
    '@react-native-community/datetimepicker',
    ['expo-notifications', {
      icon: './assets/adaptive-icon-dark.png',
      color: '#0A84FF',
      defaultChannel: 'default',
    }],
  ],
  ios: {
    ...appJson.expo.ios,
    googleServicesFile: googleServicesInfoPlistPath,
    entitlements: {
      ...appJson.expo.ios.entitlements,
      'aps-environment': 'production',
    },
    infoPlist: {
      ...appJson.expo.ios.infoPlist,
      UIBackgroundModes: ['remote-notification'],
    },
    icon: {
      light: './assets/icon.png',
      dark: './assets/icon-dark.png',
      tinted: './assets/icon-tinted.png',
    },
  },
  android: {
    ...appJson.expo.android,
    googleServicesFile: googleServicesJsonPath,
    notification: {
      color: '#0A84FF',
      icon: './assets/adaptive-icon-dark.png',
    },
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
