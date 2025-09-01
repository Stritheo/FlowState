const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .wasm files
config.resolver.assetExts.push('wasm');

// Configure transformer to handle wasm files
config.transformer = {
  ...config.transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

// For web platform, make sure wasm files are treated as assets
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

// Disable source maps temporarily to resolve Metro bundler "unknown" file errors
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Disable source maps for development to prevent Metro errors
if (process.env.NODE_ENV === 'development') {
  config.transformer.getTransformOptions = async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false,
    },
  });
}

module.exports = config;