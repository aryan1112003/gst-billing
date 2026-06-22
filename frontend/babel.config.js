module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Standard Expo plugins are handled by babel-preset-expo
      // Added react-native-paper/babel for optimization in production below
    ],
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
  };
};