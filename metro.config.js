// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package.json exports to fix compatibility with @supabase/supabase-js
config.resolver.unstable_enablePackageExports = false;

// Add support for additional file extensions
config.resolver.assetExts.push('svg', 'png', 'jpg', 'jpeg', 'gif', 'webp');

// Web-specific configuration to resolve React Native Paper Provider issues
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  'react-native$': 'react-native-web',
  // Add web-specific React Native Animated fix
  'react-native/Libraries/Animated/NativeAnimatedModule': 'react-native-web/dist/cjs/modules/AnimatedModule',
};

// Ensure proper platform extensions resolution for web
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Web-specific transformer options to handle animation warnings
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  minifierConfig: {
    // Suppress useNativeDriver warnings on web
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config;