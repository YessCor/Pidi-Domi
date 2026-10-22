const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for react-native-web compatibility with React Native 0.74
// The issue: react-native internal modules use relative imports like "../Utilities/Platform"
// which don't resolve in web bundling
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '../Utilities/Platform') {
    return {
      filePath: require.resolve('react-native-web/dist/exports/Platform'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;