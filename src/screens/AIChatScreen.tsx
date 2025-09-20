/**
 * AI Chat Screen
 * Main screen for AI conversational interface
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import AIChatInterface from '../components/ai/AIChatInterface';

interface AIChatScreenProps {
  onBack?: () => void;
}

const AIChatScreen: React.FC<AIChatScreenProps> = ({ onBack }) => {
  return (
    <View style={styles.container}>
      <AIChatInterface onBack={onBack} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});

export default AIChatScreen;