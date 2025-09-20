const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Enhanced Metro configuration for Android APK compatibility
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    alias: {
      'crypto': 'react-native-crypto',
    },
    // Add platform-specific extensions for better Android support
    platforms: ['ios', 'android', 'native', 'web'],
    // Ensure all file extensions are resolved
    sourceExts: ['js', 'json', 'ts', 'tsx', 'jsx'],
    assetExts: ['glb', 'gltf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
    // Enable minification for production builds
    minifierConfig: {
      mangle: {
        keep_fnames: true,
      },
      output: {
        ascii_only: true,
        quote_style: 3,
        wrap_iife: true,
      },
      sourceMap: {
        includeSources: false,
      },
      toplevel: false,
      compress: {
        reduce_funcs: false,
      },
    },
  },
  server: {
    // Enhanced server configuration for better Android connectivity
    port: 8081,
    // Enable HTTPS if needed for production
    // enhanceMiddleware: (middleware) => {
    //   return middleware;
    // },
  },
  // Add watchman configuration for better file watching on Android
  watchFolders: [],
  // Reset cache more aggressively for development
  resetCache: false,
  // Optimize for Android builds
  maxWorkers: 2,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
