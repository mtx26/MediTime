module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@tamagui/babel-plugin',
      'react-native-reanimated/plugin',
      'expo-router/babel',
    ],
  };
};
