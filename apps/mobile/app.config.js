const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '.env'), quiet: true });

const appJson = require('./app.json');

const appleTeamId = (process.env.EXPO_PUBLIC_APPLE_TEAM_ID || process.env.APPLE_TEAM_ID || '').trim();

const config = {
  ...appJson.expo,
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
