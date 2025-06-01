const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync({
    ...env,
    babel: {
      dangerouslyAddModulePathsToTranspile: ['@expo/vector-icons']
    }
  }, argv);

  // Customize the config before returning it.
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, './'),
    'react-native$': 'react-native-web',
    'react-native/Libraries/Animated/NativeAnimatedModule': 'react-native-web/dist/cjs/modules/AnimatedModule',
  };

  return config;
}; 