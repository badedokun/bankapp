const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname, './');

// Multi-tenant configuration
const babelLoaderConfiguration = {
  test: /\.(js|jsx|ts|tsx)$/,
  include: [
    path.resolve(appDirectory, 'index.web.js'),
    path.resolve(appDirectory, 'src'),
    path.resolve(appDirectory, 'App.tsx'),
    path.resolve(appDirectory, 'node_modules/react-native-uncompiled'),
    path.resolve(appDirectory, 'node_modules/react-native-vector-icons'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: [
        ['module:@react-native/babel-preset'],
        '@babel/preset-react',
        ['@babel/preset-env', { targets: { node: 'current' } }],
      ],
      plugins: ['react-native-web'],
    },
  },
};

const svgLoaderConfiguration = {
  test: /\.svg$/,
  use: [
    {
      loader: '@svgr/webpack',
    },
  ],
};

const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png)$/,
  use: {
    loader: 'url-loader',
    options: {
      name: '[name].[ext]',
      esModule: false,
    },
  },
};

const fontLoaderConfiguration = {
  test: /\.(woff|woff2|eot|ttf|otf)$/,
  use: ['file-loader'],
};

module.exports = {
  entry: [path.resolve(appDirectory, 'index.web.js')],
  output: {
    filename: '[name].[contenthash].bundle.js',
    path: path.resolve(appDirectory, 'dist'),
    publicPath: '/',
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.web.jsx', '.web.js', '.jsx', '.js'],
    alias: {
      'react-native$': 'react-native-web',
      '@react-native-async-storage/async-storage': path.resolve(appDirectory, 'src/utils/storage.ts'),
      '@': path.resolve(appDirectory, 'src'),
      '@ai': path.resolve(appDirectory, 'src/ai'),
      '@components': path.resolve(appDirectory, 'src/components'),
      '@screens': path.resolve(appDirectory, 'src/screens'),
      '@services': path.resolve(appDirectory, 'src/services'),
      '@store': path.resolve(appDirectory, 'src/store'),
      '@themes': path.resolve(appDirectory, 'src/themes'),
      '@utils': path.resolve(appDirectory, 'src/utils'),
      '@hooks': path.resolve(appDirectory, 'src/hooks'),
      '@types': path.resolve(appDirectory, 'src/types'),
      '@tenants': path.resolve(appDirectory, 'src/tenants'),
      '@navigation': path.resolve(appDirectory, 'src/navigation'),
    },
  },
  module: {
    rules: [
      babelLoaderConfiguration,
      imageLoaderConfiguration,
      svgLoaderConfiguration,
      fontLoaderConfiguration,
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'public', 'index.html'),
      filename: 'index.html',
      inject: 'body',
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(true),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.TENANT_DETECTION_METHOD': JSON.stringify(
        process.env.TENANT_DETECTION_METHOD || 'subdomain'
      ),
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
    hot: true,
    historyApiFallback: true,
    open: true,
  },
};