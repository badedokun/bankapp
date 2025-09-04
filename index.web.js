/**
 * OrokiiPay Multi-Tenant Money Transfer System
 * Web Entry Point
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Register the app
AppRegistry.registerComponent(appName, () => App);

// Run the app in web environment
AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('root'),
});