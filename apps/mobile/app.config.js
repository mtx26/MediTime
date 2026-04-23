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
  },
};

if (appleTeamId) {
  config.ios.associatedDomains = ['applinks:meditime-app.com'];
}

module.exports = {
  expo: config,
};
