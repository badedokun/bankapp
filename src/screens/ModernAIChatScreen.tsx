/**
 * Modern AI Chat Screen
 * Glassmorphic design with tenant-aware theming
 * React Native + React Native Web compatible
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import LinearGradient from '../components/common/LinearGradient';
import { useTenantTheme } from '../context/TenantThemeContext';
import { useNotification } from '../services/ModernNotificationService';
import APIService from '../services/api';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { ENV_CONFIG } from '../config/environment';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  actions?: string[];
}

// Web Speech API declaration for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ModernAIChatScreenProps {
  navigation?: any;
  onBack?: () => void;
  initialMessage?: string;
}

const ModernAIChatScreen: React.FC<ModernAIChatScreenProps> = ({
  navigation,
  onBack,
  initialMessage,
}) => {
  const { theme } = useTenantTheme() as any;
  const notify = useNotification();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [voiceMode, setVoiceMode] = useState<'off' | 'listening' | 'processing'>('off');
  const [suggestions, setSuggestions] = useState<string[]>([
    'Check my balance',
    'Transfer money',
    'View recent transactions',
    'Apply for a loan',
  ]);
  const [transferState, setTransferState] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string>(`chat_${Date.now()}`);
  const [isAwaitingPin, setIsAwaitingPin] = useState(false);
  const [isAwaitingAccountNumber, setIsAwaitingAccountNumber] = useState(false);
  const [lastTransferReference, setLastTransferReference] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const typingDotsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Initialize with welcome message
    if (initialMessage) {
      handleSendMessage(initialMessage);
    } else {
      addWelcomeMessage();
    }
  }, []);

  useEffect(() => {
    // Typing animation
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingDotsAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingDotsAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isTyping]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Web Speech API
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (event.results[0].isFinal) {
              setInputText(transcript);
              // Check if this is a special command like "view receipt"
              if (transcript.toLowerCase().includes('view receipt') ||
                  transcript.toLowerCase().includes('show receipt')) {
                handleSuggestionPress('View receipt');
              } else {
                handleSendMessage(transcript);
              }
              setVoiceMode('off');
            } else {
              setInputText(transcript);
            }
          };

          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setVoiceMode('off');
            notify.error(`Voice recognition failed: ${event.error}`, 'Error');
          };

          recognition.onstart = () => {
            setVoiceMode('listening');
          };

          recognition.onend = () => {
            setVoiceMode('off');
            setIsRecording(false);
          };

          setSpeechRecognition(recognition);
        } catch (error) {
          console.error('Failed to initialize speech recognition:', error);
        }
      }
    }
  }, []);

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: "Hello! I'm your AI banking assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date(),
      actions: ['Check Balance', 'Transfer Money', 'View Transactions', 'Get Help'],
    };
    setMessages([welcomeMessage]);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await sendToAIService(text.trim());

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'ai',
        timestamp: new Date(),
        actions: response.actions,
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);

      // Update transfer state if present
      if (response.transferState) {
        setTransferState(response.transferState);
      }

      // Check if we're awaiting PIN (step 6 in transfer flow)
      if (response.inConversation && response.message) {
        const isPinStep = response.message.toLowerCase().includes('transaction pin') ||
                         response.message.toLowerCase().includes('enter your pin') ||
                         response.message.toLowerCase().includes('incorrect pin') ||
                         ((response as any).error && response.message.toLowerCase().includes('try again:'));
        setIsAwaitingPin(isPinStep);

        // Check if we're awaiting account number (step 2 in transfer flow)
        const isAccountStep = response.message.toLowerCase().includes('account number') &&
                             response.message.toLowerCase().includes('10 digits');
        setIsAwaitingAccountNumber(isAccountStep);
      } else {
        setIsAwaitingPin(false);
        setIsAwaitingAccountNumber(false);
      }

      // Check if transfer completed successfully and extract reference
      if (response.completed && response.data?.reference) {
        setLastTransferReference(response.data.reference);
      }

      // Update suggestions based on AI response
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      setIsTyping(false);

      // Fallback response
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble connecting to the service. Please try again in a moment.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    }
  };

  const sendToAIService = async (text: string) => {
    try {
      const token = APIService.getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Get user context for better AI responses
      let userProfile = null;
      let recentTransactions = [];

      try {
        userProfile = await APIService.getProfile();
      } catch (error) {
      }

      try {
        const transactionsData = await APIService.getTransferHistory({ page: 1, limit: 5 });
        if (transactionsData?.transactions) {
          recentTransactions = transactionsData.transactions.slice(0, 3);
        }
      } catch (error) {
      }

      const response = await fetch(`${ENV_CONFIG.API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': theme.tenantCode || 'platform',
        },
        body: JSON.stringify({
          message: text,
          userId: userProfile?.id || 'current-user',
          transferState: transferState,
          context: {
            conversationId: conversationId, // Use persistent conversation ID
            page: 'ai-chat',
            userName: userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : 'User',
            accountType: userProfile?.role || 'customer',
            recentTransactions: recentTransactions,
            timestamp: new Date().toISOString(),
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();

      return {
        message: data.response || data.message || data.text || 'I understand. How can I help you further?',
        actions: data.actions || [],
        suggestions: data.suggestions || [],
        intent: data.intent,
        transferState: data.transferState,
        inConversation: data.inConversation,
        completed: data.completed,
        conversationId: data.metadata?.conversationId,
        data: data.data, // Include data field for transfer reference
      };
    } catch (error) {
      console.error('Error connecting to AI service:', error);

      // Fallback to basic responses if API fails
      const input = text.toLowerCase();

      if (input.includes('balance')) {
        return {
          message: 'I\'m having trouble accessing your balance information right now. Please try again or check the Accounts section.',
          actions: ['View Accounts', 'Try Again'],
          suggestions: ['Check savings balance', 'View recent transactions'],
        };
      } else if (input.includes('transfer') || input.includes('send')) {
        return {
          message: 'I can help you with transfers. Would you like to make an internal or external transfer?',
          actions: ['Internal Transfer', 'External Transfer'],
          suggestions: [`Send ${formatCurrency(5000, 'NGN', { locale: 'en-NG' })}`, 'Transfer to savings'],
        };
      } else {
        return {
          message: 'I\'m experiencing connection issues, but I\'m here to help. You can try accessing features directly from the dashboard.',
          actions: ['Go to Dashboard', 'View Help'],
          suggestions: ['Check balance', 'Make transfer', 'View transactions'],
        };
      }
    }
  };

  const handleSuggestionPress = async (suggestion: string) => {
    // Check if this is a "View receipt" action
    if (suggestion.toLowerCase().includes('view receipt')) {
      // Try to extract reference from the last message if lastTransferReference is not set
      let referenceToUse = lastTransferReference;

      if (!referenceToUse && messages.length > 0) {
        // Look for reference in recent messages
        for (let i = messages.length - 1; i >= Math.max(0, messages.length - 5); i--) {
          const msg = messages[i];
          if (msg.sender === 'ai' && msg.text) {
            // Match reference pattern: 25 characters alphanumeric (bank code + ULID + HMAC + check digits)
            const refMatch = msg.text.match(/Reference:\s*([A-Z0-9]{25})/i);
            if (refMatch) {
              referenceToUse = refMatch[1];
              break;
            }
          }
        }
      }

      if (referenceToUse) {
        await handleViewReceipt(referenceToUse);
        return;
      } else {
        notify.error('No transfer reference available', 'Error');
        return;
      }
    }

    setInputText(suggestion);
    handleSendMessage(suggestion);
  };

  const handleViewReceipt = async (reference: string) => {
    try {
      const token = APIService.getAccessToken();
      if (!token) {
        notify.error('Authentication required', 'Error');
        return;
      }

      // Show loading message
      const loadingMessage: Message = {
        id: Date.now().toString(),
        text: '📄 Loading receipt...',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, loadingMessage]);

      // Use APIService method to get transfer by reference
      const transferData = await APIService.getTransferByReference(reference);

      // Replace loading message with actual receipt
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== loadingMessage.id);
        return [...filtered, {
          id: (Date.now() + 1).toString(),
          text: formatReceiptMessage(transferData),
          sender: 'ai',
          timestamp: new Date(),
        }];
      });

      setSuggestions(['Make another transfer', 'Check balance', 'View transactions']);
    } catch (error) {
      console.error('Error fetching receipt:', error);
      notify.error('Failed to load receipt. Please try again.', 'Error');

      // Show error message
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        text: '❌ Sorry, I couldn\'t load the receipt. The transfer was successful, but there was an error retrieving the receipt details.',
        sender: 'ai',
        timestamp: new Date(),
      }]);
    }
  };

  const formatReceiptMessage = (transfer: any) => {
    const statusEmoji = transfer.status === 'successful' ? '✅' :
                       transfer.status === 'pending' ? '⏳' :
                       transfer.status === 'failed' ? '❌' : '📋';

    // Use initiatedAt or fallback to completedAt if initiatedAt is not available
    const transactionDate = transfer.initiatedAt || transfer.completedAt || new Date();

    return `📄 **Transfer Receipt**\n\n` +
      `${statusEmoji} Status: ${transfer.status.toUpperCase()}\n\n` +
      `**Transaction Details**\n` +
      `Reference: ${transfer.reference}\n` +
      `Date: ${new Date(transactionDate).toLocaleString()}\n` +
      `Amount: ₦${transfer.amount.toLocaleString()}\n` +
      `Fee: ₦${transfer.fees?.toLocaleString() || '0'}\n` +
      `Total: ₦${transfer.totalAmount?.toLocaleString()}\n\n` +
      `**Recipient**\n` +
      `Name: ${transfer.recipient?.name}\n` +
      `Account: ${transfer.recipient?.accountNumber}\n` +
      `Bank: ${transfer.recipient?.bankName}\n\n` +
      `**Sender**\n` +
      `Name: ${transfer.sender?.name}\n` +
      `Account: ${transfer.sender?.accountNumber}\n` +
      `Bank: ${transfer.sender?.bankName}\n\n` +
      `${transfer.description ? `Description: ${transfer.description}\n\n` : ''}` +
      `Thank you for using our service!`;
  };

  const handleActionPress = (action: string) => {
    handleSendMessage(action);
  };

  const toggleVoiceRecording = () => {
    if (!speechRecognition) {
      notify.info('Voice recognition is not available in your browser', 'Info');
      return;
    }

    // Disable voice input during PIN entry for security
    if (isAwaitingPin) {
      notify.info('For security, please type your PIN instead of speaking it', 'Security Notice');
      return;
    }

    if (isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
      setVoiceMode('off');
    } else {
      try {
        speechRecognition.start();
        setIsRecording(true);
        setVoiceMode('listening');
      } catch (error) {
        notify.error('Failed to start voice recording', 'Error');
        console.error('Voice recording error:', error);
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      
      marginLeft: 20,
      marginRight: 20,
      marginTop: 0,
      marginBottom: 0,
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    backButtonText: {
      fontSize: 20,
      color: theme.colors.textInverse,
      fontWeight: '600',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      letterSpacing: 0.3,
      color: theme.colors.textInverse,
    },
    headerSubtitle: {
      fontSize: 12,
      color: `${theme.colors.textInverse}CC`, // 80% opacity
      marginTop: 2,
    },
    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.success,
      marginRight: 6,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chatContainer: {
      flex: 1,
      maxWidth: isTablet ? 800 : '100%',
      alignSelf: 'center',
      width: '100%',
    },
    messagesContainer: {
      flex: 1,
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    messageWrapper: {
      marginVertical: 8,
      maxWidth: '80%',
    },
    userMessageWrapper: {
      alignSelf: 'flex-end',
    },
    aiMessageWrapper: {
      alignSelf: 'flex-start',
    },
    messageBubble: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 20,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(20px)',
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    userMessage: {
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 4,
    },
    aiMessage: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    messageText: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
    },
    userMessageText: {
      color: theme.colors.textInverse,
    },
    aiMessageText: {
      color: theme.colors.text,
    },
    messageTime: {
      fontSize: 11,
      marginTop: 4,
      opacity: 0.7,
    },
    userMessageTime: {
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'right',
    },
    aiMessageTime: {
      color: theme.colors.textSecondary,
    },
    actionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
      marginHorizontal: -4,
    },
    actionButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      margin: 4,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        },
      }),
    },
    actionButtonText: {
      fontSize: 13,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 20,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.primary,
      marginHorizontal: 2,
    },
    suggestionsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    suggestionsScroll: {
      flexDirection: 'row',
    },
    suggestionChip: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(10px)',
        },
      }),
    },
    suggestionText: {
      fontSize: 14,
      fontWeight: '500',
      letterSpacing: 0.2,
      color: theme.colors.textInverse,
    },
    inputContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputWrapper: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 25,
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginRight: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(20px)',
        },
      }),
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: '400',
      color: theme.colors.text,
      maxHeight: 100,
      ...Platform.select({
        web: {
          outlineStyle: 'none' as any,
        },
      }),
    },
    sendButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
        web: {
          boxShadow: `0 4px 12px ${theme.colors.primary}40`,
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        },
      }),
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    sendButtonText: {
      fontSize: 20,
      color: theme.colors.textInverse,
      fontWeight: '600',
    },
    voiceButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    voiceButtonListening: {
      backgroundColor: theme.colors.danger,
      borderColor: theme.colors.danger,
      transform: [{ scale: 1.1 }],
    },
    voiceButtonProcessing: {
      backgroundColor: theme.colors.warning,
      borderColor: theme.colors.warning,
    },
    voiceButtonDisabled: {
      backgroundColor: 'rgba(150, 150, 150, 0.3)',
      borderColor: 'rgba(150, 150, 150, 0.3)',
      opacity: 0.6,
    },
    voiceButtonText: {
      fontSize: 20,
    },
    voiceButtonTextDisabled: {
      opacity: 0.5,
    },
    voiceIndicator: {
      position: 'absolute',
      bottom: 80,
      alignSelf: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(20px)',
        },
      }),
    },
    voiceIndicatorText: {
      marginLeft: 12,
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '600',
    },
    pulsingDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.danger,
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack || (() => navigation?.goBack())}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.headerTitle}>AI Assistant</Text>
                <View style={styles.statusContainer}>
                  <View style={styles.statusIndicator} />
                  <Text style={styles.headerSubtitle}>Online • Ready to help</Text>
                </View>
              </View>
            </View>

            <Animated.View
              style={[styles.chatContainer, { opacity: fadeAnim }]}
            >
              {/* Messages */}
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 20 }}
              >
                {messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageWrapper,
                      message.sender === 'user'
                        ? styles.userMessageWrapper
                        : styles.aiMessageWrapper,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        message.sender === 'user'
                          ? styles.userMessage
                          : styles.aiMessage,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          message.sender === 'user'
                            ? styles.userMessageText
                            : styles.aiMessageText,
                        ]}
                      >
                        {message.text}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          message.sender === 'user'
                            ? styles.userMessageTime
                            : styles.aiMessageTime,
                        ]}
                      >
                        {formatTime(message.timestamp)}
                      </Text>
                      {message.actions && message.actions.length > 0 && (
                        <View style={styles.actionsContainer}>
                          {message.actions.map((action, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.actionButton}
                              onPress={() => handleActionPress(action)}
                            >
                              <Text style={styles.actionButtonText}>{action}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                ))}

                {isTyping && (
                  <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
                    <Animated.View
                      style={[
                        styles.typingIndicator,
                        { opacity: typingDotsAnim }
                      ]}
                    >
                      <View style={styles.typingDot} />
                      <View style={[styles.typingDot, { opacity: 0.6 }]} />
                      <View style={[styles.typingDot, { opacity: 0.3 }]} />
                    </Animated.View>
                  </View>
                )}
              </ScrollView>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionsScroll}
                  >
                    {suggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.suggestionChip}
                        onPress={() => handleSuggestionPress(suggestion)}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Voice Indicator */}
              {voiceMode !== 'off' && (
                <Animated.View
                  style={[
                    styles.voiceIndicator,
                    { opacity: fadeAnim }
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.pulsingDot,
                      { opacity: voiceMode === 'listening' ? typingDotsAnim : 1 }
                    ]}
                  />
                  <Text style={styles.voiceIndicatorText}>
                    {voiceMode === 'listening' ? 'Listening...' : 'Processing...'}
                  </Text>
                </Animated.View>
              )}

              {/* Input */}
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  style={[
                    styles.voiceButton,
                    voiceMode === 'listening' && styles.voiceButtonListening,
                    voiceMode === 'processing' && styles.voiceButtonProcessing,
                    isAwaitingPin && styles.voiceButtonDisabled,
                  ]}
                  onPress={toggleVoiceRecording}
                  disabled={isAwaitingPin}
                >
                  <Text style={[
                    styles.voiceButtonText,
                    isAwaitingPin && styles.voiceButtonTextDisabled,
                  ]}>
                    {isAwaitingPin ? '🔒' : voiceMode === 'listening' ? '🔴' : '🎤'}
                  </Text>
                </TouchableOpacity>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={
                      isAwaitingPin
                        ? 'Enter 4-digit PIN'
                        : isAwaitingAccountNumber
                          ? 'Enter 10-digit account number'
                          : voiceMode === 'listening'
                            ? 'Listening...'
                            : 'Type your message...'
                    }
                    placeholderTextColor={theme.colors.textSecondary}
                    value={inputText}
                    onChangeText={(text) => {
                      // If awaiting PIN, only allow digits and max 4 characters
                      if (isAwaitingPin) {
                        const digitsOnly = text.replace(/[^0-9]/g, '');
                        setInputText(digitsOnly.slice(0, 4));
                      }
                      // If awaiting account number, only allow digits and max 10 characters
                      else if (isAwaitingAccountNumber) {
                        const digitsOnly = text.replace(/[^0-9]/g, '');
                        setInputText(digitsOnly.slice(0, 10));
                      }
                      else {
                        setInputText(text);
                      }
                    }}
                    multiline={!isAwaitingPin && !isAwaitingAccountNumber}
                    keyboardType={isAwaitingPin || isAwaitingAccountNumber ? 'numeric' : 'default'}
                    maxLength={isAwaitingPin ? 4 : isAwaitingAccountNumber ? 10 : undefined}
                    secureTextEntry={isAwaitingPin}
                    onSubmitEditing={() => handleSendMessage(inputText)}
                    editable={voiceMode === 'off'}
                    testID="message-input"
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !inputText.trim() && styles.sendButtonDisabled,
                  ]}
                  onPress={() => handleSendMessage(inputText)}
                  disabled={!inputText.trim()}
                  testID="send-button"
                >
                  <Text style={styles.sendButtonText}>→</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default ModernAIChatScreen;