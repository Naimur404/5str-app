const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Strip console.* calls in production builds for better performance
// This removes console statements at build time rather than runtime
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  drop_console: true, // Remove all console.* statements in production
};

// Additional optimizations for release builds
config.transformer.transform = {
  ...config.transformer.transform,
  inlineRequires: true, // Inline require statements for better bundling
};

module.exports = config;
