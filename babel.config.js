module.exports = function (api) {
  api.cache(true);
  
  const plugins = ['react-native-reanimated/plugin'];

  // In production builds, remove all console statements for better performance
  if (process.env.NODE_ENV === 'production') {
    plugins.unshift([
      'transform-remove-console',
      {
        exclude: ['error', 'warn'] // Keep error and warn in production for critical issues
      }
    ]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
