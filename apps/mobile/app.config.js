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
    ['expo-camera', {
      cameraPermission: 'MediTime uses the camera to scan QR codes and take photos for your calendars.',
      microphonePermission: false,
      recordAudioAndroid: false,
    }],
    ['expo-image-picker', {
      photosPermission: 'MediTime accesses your photo library to let you choose images for your calendars.',
      cameraPermission: 'MediTime uses the camera to take photos for your calendars.',
      microphonePermission: false,
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
      CFBundleLocalizations: ['de', 'en', 'es', 'fr', 'it', 'ja', 'pt', 'ru', 'zh'],
      CFBundleDevelopmentRegion: 'en',
      NSCameraUsageDescription: 'MediTime uses the camera to scan QR codes and take photos for your calendars.',
      NSPhotoLibraryUsageDescription: 'MediTime accesses your photo library to let you choose images for your calendars.',
      NSPhotoLibraryAddUsageDescription: 'MediTime may save images to your photo library.',
      NSMicrophoneUsageDescription: 'MediTime requires microphone access as part of camera usage.',
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
          NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
          NSPrivacyAccessedAPITypeReasons: ['E174.1'],
        },
      ],
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
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.VIBRATE',
    ],
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
