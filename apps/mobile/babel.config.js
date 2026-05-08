const { expoRouterBabelPlugin } = require('babel-preset-expo/build/expo-router-plugin');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@tamagui/babel-plugin',
      // Required in this workspace because expo-router is installed under apps/mobile/node_modules,
      // so babel-preset-expo cannot auto-detect it from the hoisted preset package.
      expoRouterBabelPlugin,
      'react-native-reanimated/plugin',
    ],
  };
};
