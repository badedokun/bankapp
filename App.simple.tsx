/**
 * Simple Test App to Debug Issues
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SimpleApp: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello OrokiiPay!</Text>
      <Text style={styles.subText}>This is a test to see if React Native Web is working</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default SimpleApp;