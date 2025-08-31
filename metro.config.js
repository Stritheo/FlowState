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

module.exports = config;