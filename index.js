/**
 * @format
 */

// Import global polyfills FIRST, before any other imports
import './src/utils/global-polyfills';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
