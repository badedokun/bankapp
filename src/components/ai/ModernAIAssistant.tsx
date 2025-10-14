/**
 * Modern AI Assistant Component
 * Enhanced with dynamic theming and proper input visibility
 * Integrates with multi-tenant theme system
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import LinearGradient from '../common/LinearGradient';
import { useTenantTheme } from '../../context/TenantThemeContext';

interface AIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AISuggestion {
  id: string;
  text: string;
  action: string;
  icon: string;
}

interface ModernAIAssistantProps {
  isVisible?: boolean;
  onToggle?: () => void;
  onSendMessage?: (message: string) => Promise<string>;
}

const DEFAULT_SUGGESTIONS: AISuggestion[] = [
  {
    id: '1',
    text: 'Check my account balance',
    action: 'balance_inquiry',
    icon: '💰',
  },
  {
    id: '2',
    text: 'Show recent transactions',
    action: 'transaction_history',
    icon: '📊',
  },
  {
    id: '3',
    text: 'Transfer money',
    action: 'money_transfer',
    icon: '💸',
  },
  {
    id: '4',
    text: 'Apply for a loan',
    action: 'loan_application',
    icon: '💳',
  },
  {
    id: '5',
    text: 'Pay bills',
    action: 'bill_payment',
    icon: '🧾',
  },
];

export const ModernAIAssistant: React.FC<ModernAIAssistantProps> = ({
  isVisible = false,
  onToggle,
  onSendMessage,
}) => {
  const { theme, tenantInfo } = useTenantTheme();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const buttonScale = useRef(new Animated.Value(1)).current;
  const panelAnimation = useRef(new Animated.Value(0)).current;
  const inputFocusAnimation = useRef(new Animated.Value(0)).current;

  // Auto-scroll to bottom when new messages arrive
  const scrollViewRef = useRef<ScrollView>(null);

  const handleTogglePanel = () => {
    const newState = !isPanelOpen;
    setIsPanelOpen(newState);
    onToggle?.();

    Animated.spring(panelAnimation, {
      toValue: newState ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Call the AI service
      const response = onSendMessage
        ? await onSendMessage(userMessage.content)
        : `Thank you for your message: "${userMessage.content}". Our AI assistant is processing your request.`;

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: AISuggestion) => {
    setInputText(suggestion.text);
    handleSendMessage();
  };

  const handleInputFocus = () => {
    Animated.spring(inputFocusAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleInputBlur = () => {
    Animated.spring(inputFocusAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const dynamicStyles = getDynamicStyles(theme);

  return (
    <View style={styles.container}>
      {/* AI Chat Panel */}
      <Animated.View
        style={[
          dynamicStyles.panel,
          {
            opacity: panelAnimation,
            transform: [
              {
                translateY: panelAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
              {
                scale: panelAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
          },
          !isPanelOpen && styles.hidden,
        ]}
      >
        {/* Panel Header */}
        <LinearGradient
          colors={[theme.colors.primaryGradientStart, theme.colors.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={dynamicStyles.panelHeader}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={dynamicStyles.headerTitle}>AI Banking Assistant</Text>
              <Text style={dynamicStyles.headerSubtitle}>
                Powered by {tenantInfo.name} AI
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleTogglePanel}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={dynamicStyles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Messages Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            // Suggestions when no messages
            <View style={styles.suggestionsContainer}>
              <Text style={[dynamicStyles.suggestionsTitle]}>
                How can I help you today?
              </Text>
              {DEFAULT_SUGGESTIONS.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={[dynamicStyles.suggestionCard]}
                  onPress={() => handleSuggestionPress(suggestion)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[
                      theme.colors.primaryGradientStart + '15',
                      theme.colors.primaryGradientEnd + '10',
                    ]}
                    style={styles.suggestionGradient}
                  />
                  <Text style={styles.suggestionIcon}>{suggestion.icon}</Text>
                  <Text style={[dynamicStyles.suggestionText]}>{suggestion.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            // Messages
            <View style={styles.chatContainer}>
              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageContainer,
                    message.type === 'user' ? styles.userMessage : styles.assistantMessage,
                  ]}
                >
                  <View
                    style={[
                      dynamicStyles.messageBubble,
                      message.type === 'user'
                        ? dynamicStyles.userBubble
                        : dynamicStyles.assistantBubble,
                    ]}
                  >
                    <Text
                      style={[
                        dynamicStyles.messageText,
                        message.type === 'user'
                          ? dynamicStyles.userText
                          : dynamicStyles.assistantText,
                      ]}
                    >
                      {message.content}
                    </Text>
                  </View>
                  <Text style={dynamicStyles.messageTime}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              ))}
              {isLoading && (
                <View style={[styles.messageContainer, styles.assistantMessage]}>
                  <View style={[dynamicStyles.messageBubble, dynamicStyles.assistantBubble]}>
                    <Text style={[dynamicStyles.messageText, dynamicStyles.assistantText]}>
                      AI is typing...
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Enhanced Input Area */}
        <Animated.View
          style={[
            dynamicStyles.inputContainer,
            {
              transform: [
                {
                  scale: inputFocusAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.02],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={dynamicStyles.inputWrapper}>
            <TextInput
              style={dynamicStyles.textInput}
              placeholder="Ask me anything about your banking..."
              placeholderTextColor={theme.colors.textLight}
              value={inputText}
              onChangeText={setInputText}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
              multiline={false}
              blurOnSubmit={true}
            />
            <TouchableOpacity
              style={[
                dynamicStyles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  inputText.trim()
                    ? [theme.colors.primaryGradientStart, theme.colors.primaryGradientEnd]
                    : [theme.colors.textLight, theme.colors.textLight]
                }
                style={styles.sendButtonGradient}
              >
                <Text style={dynamicStyles.sendButtonText}>➤</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Floating AI Button */}
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [{ scale: buttonScale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleTogglePanel}
          onPressIn={handleButtonPressIn}
          onPressOut={handleButtonPressOut}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[theme.colors.primaryGradientStart, theme.colors.primaryGradientEnd]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonIcon}>🤖</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const getDynamicStyles = (theme: any) =>
  StyleSheet.create({
    panel: {
      position: 'absolute',
      bottom: 80,
      right: 0,
      width: Platform.OS === 'web' ? 400 : '90%',
      maxHeight: Platform.OS === 'web' ? 600 : '70%',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.layout.borderRadiusLarge,
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    panelHeader: {
      padding: theme.layout.spacing,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.9)',
    },
    closeButtonText: {
      fontSize: 24,
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    suggestionsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.layout.spacing,
    },
    suggestionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      marginBottom: 8,
      borderRadius: theme.layout.borderRadius,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      position: 'relative',
      overflow: 'hidden',
    },
    suggestionText: {
      fontSize: 14,
      color: theme.colors.text,
      marginLeft: 8,
      flex: 1,
    },
    messageBubble: {
      padding: 12,
      borderRadius: theme.layout.borderRadius,
      maxWidth: '80%',
      marginBottom: 4,
    },
    userBubble: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      backgroundColor: theme.colors.border,
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: 14,
      lineHeight: 20,
    },
    userText: {
      color: '#FFFFFF',
    },
    assistantText: {
      color: theme.colors.text,
    },
    messageTime: {
      fontSize: 10,
      color: theme.colors.textLight,
      marginTop: 2,
    },
    inputContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: theme.layout.spacing,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: theme.layout.borderRadius,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      paddingHorizontal: 12,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    textInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 14,
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamily,
    },
    sendButton: {
      marginLeft: 8,
      borderRadius: theme.layout.borderRadius,
      overflow: 'hidden',
    },
    sendButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    zIndex: 999,
  },
  hidden: {
    display: 'none',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
    maxHeight: 400,
  },
  messagesContent: {
    padding: 16,
  },
  suggestionsContainer: {
    paddingVertical: 8,
  },
  suggestionGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  suggestionIcon: {
    fontSize: 16,
  },
  chatContainer: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  buttonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonIcon: {
    fontSize: 28,
  },
});

export default ModernAIAssistant;