module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    plugins: [
      // Removed deprecated 'expo-router/babel'
      'react-native-reanimated/plugin', // MUST remain last
    ],
  };
};
