module.exports = {
  extends: ['expo'],
  root: true,
  env: {
    node: true,
  },
  rules: {
    // Focus on deployment-critical issues only
    'no-console': 'warn', // Allow console for now, but warn
    'no-unused-vars': 'warn', // Warn about unused variables
    'prefer-const': 'warn', // Prefer const over let
    'no-undef': 'off', // TypeScript handles this
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'web-build/',
    '.expo/',
    'coverage/',
    'babel.config.js',
    'metro.config.js',
    'tailwind.config.js',
    'supabase/functions/',
  ],
}; 