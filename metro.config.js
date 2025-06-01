// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package.json exports to fix compatibility with @supabase/supabase-js
config.resolver.unstable_enablePackageExports = false;

// Add support for additional file extensions
config.resolver.assetExts.push('svg', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico');

// Web-specific configuration to resolve React Native Paper Provider issues
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  'react-native$': 'react-native-web',
  // Add web-specific React Native Animated fix
  'react-native/Libraries/Animated/NativeAnimatedModule': 'react-native-web/dist/cjs/modules/AnimatedModule',
  // Chart Kit web compatibility
  'react-native-svg$': 'react-native-svg/lib/commonjs/ReactNativeSVG.web.js',
  // Node.js core modules for web compatibility
  'fs': false,
  'path': 'path-browserify',
  'crypto': 'react-native-crypto',
  'stream': 'stream-browserify',
  'buffer': 'buffer',
  'util': 'util',
  'process': 'process/browser',
  'os': false,
  'net': false,
  'tls': false,
  'http': false,
  'https': false,
  'zlib': false,
  'child_process': false,
  'os': false,
  '@sendgrid/mail': false,
  '@sendgrid/client': false,
  '@sendgrid/helpers': false,
  '@': __dirname,
};

// Ensure proper platform extensions resolution for web
config.resolver.platforms = ['web', 'native', 'ios', 'android'];
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'cjs', 'web.js', 'web.ts', 'web.tsx'];

// Web-specific transformer options
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  minifierConfig: {
    keep_fnames: process.env.NODE_ENV !== 'production',
    mangle: {
      keep_fnames: process.env.NODE_ENV !== 'production',
    },
    output: {
      comments: false,
    },
    compress: {
      drop_console: process.env.NODE_ENV === 'production',
      drop_debugger: process.env.NODE_ENV === 'production',
      unused: true,
      dead_code: true,
    },
  },
};

// Web-specific optimization for production builds
if (process.env.NODE_ENV === 'production') {
  config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
  config.transformer.minifierPath = 'metro-minify-terser';
  config.transformer.minifierConfig = {
    ...config.transformer.minifierConfig,
    ecma: 2017,
    module: true,
    warnings: false,
  };
}

module.exports = config;