import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { BackButton } from '../ui/BackButton';
import { useTenant } from '../../tenants/TenantContext';
import { Storage } from '../../utils/storage';
import APIService from '../../services/api';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { useTenantTheme } from '../../context/TenantThemeContext';
import { buildApiUrl } from '../../config/environment';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  intent?: string;
  actions?: string[];
  isTyping?: boolean;
}

interface TransferData {
  recipientAccountNumber?: string;
  recipientBankCode?: string;
  recipientName?: string;
  amount?: number;
  pin?: string;
  description?: string;
  saveRecipient?: boolean;
  step: 'account' | 'bank' | 'name' | 'amount' | 'pin' | 'description' | 'confirm' | 'complete';
}

interface AIChatInterfaceProps {
  onActionSelect?: (action: string, data?: any) => void;
  onClose?: () => void;
  onBack?: () => void;
  isVisible?: boolean;
  initialMessage?: string;
}

// Web Speech API declaration for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({
  onActionSelect,
  onClose,
  onBack,
  isVisible = true,
  initialMessage
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [transferData, setTransferData] = useState<TransferData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const [notification, setNotification] = useState<{message: string, type: 'info' | 'error' | 'success'} | null>(null);
  const [voiceMode, setVoiceMode] = useState<'off' | 'push-to-talk' | 'continuous'>('off');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { currentTenant } = useTenant();
  const { theme: tenantTheme } = useTenantTheme() as any;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      if (initialMessage) {
        handleSendMessage(initialMessage);
      } else {
        addWelcomeMessage();
      }
    }
  }, [isVisible, initialMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const showNotificationRef = useRef<((message: string, type?: 'info' | 'error' | 'success') => void) | undefined>(undefined);
  
  showNotificationRef.current = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
    // Auto-hide notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  // Initialize Web Speech API
  useEffect(() => {
    console.log('Initializing speech recognition', { 
      isWeb: Platform.OS === 'web', 
      hasWindow: typeof window !== 'undefined',
      hasSpeechRecognition: typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    });
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      console.log('SpeechRecognition API available:', !!SpeechRecognition);
      
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          
          recognition.onresult = (event: any) => {
            console.log('Speech recognition result:', event.results[0][0].transcript);
            const transcript = event.results[0][0].transcript;
            handleSendMessage(transcript);
            setIsRecording(false);
          };
          
          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
            showNotificationRef.current?.(`Speech recognition failed: ${event.error}. Please try again or use text input.`, 'error');
          };
          
          recognition.onstart = () => {
            console.log('Speech recognition started');
          };
          
          recognition.onend = () => {
            console.log('Speech recognition ended');
            setIsRecording(false);
          };
          
          setSpeechRecognition(recognition);
          console.log('Speech recognition initialized successfully');
        } catch (error) {
          console.error('Failed to initialize speech recognition:', error);
        }
      } else {
        console.log('Speech recognition not supported in this browser');
      }
    }
  }, []);


  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: `Hello! I'm your AI banking assistant for ${currentTenant?.displayName || 'Firstmidas Microfinance Bank'}. How can I help you today?`,
      sender: 'ai',
      timestamp: new Date(),
      actions: ['Check Balance', 'Send Money', 'View Transactions', 'Help']
    };
    setMessages([welcomeMessage]);
    loadSuggestions();
  };

  const loadSuggestions = async () => {
    const defaultSuggestions = [
      "Check my account balance",
      "Send money to someone"
    ];
    setSuggestions(defaultSuggestions);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendToAIService(text.trim());
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.message,
        sender: 'ai',
        timestamp: new Date(),
        intent: response.intent,
        actions: response.actions
      };

      setTimeout(() => {
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const sendToAIService = async (text: string) => {
    try {
      const lowerText = text.toLowerCase();

      // Handle transfer cancellation at any step
      if (transferData && (lowerText.includes('cancel') || lowerText === 'cancel transfer')) {
        setTransferData(null);
        return {
          message: 'Transfer cancelled. How else can I help you?',
          intent: 'transfer_cancelled',
          actions: ['Check Balance', 'Send Money', 'View Transactions']
        };
      }

      // If we're in a transfer flow, process the step
      if (transferData) {
        return await processTransferStep(text);
      }

      // Check for specific banking actions first
      if (lowerText.includes('send') ||
          lowerText.includes('transfer') ||
          lowerText.includes('pay') ||
          lowerText.includes('remit')) {
        return await startTransfer();
      } else if (lowerText.includes('transaction') ||
                 lowerText.includes('history') ||
                 lowerText.includes('recent') ||
                 lowerText.includes('payment') ||
                 lowerText.includes('record') ||
                 lowerText.includes('activity') ||
                 lowerText.includes('statement')) {
        return await fetchTransactions();
      } else if (lowerText.includes('balance') ||
          lowerText.includes('account balance') ||
          lowerText.includes('how much') ||
          lowerText.includes('funds') ||
          lowerText.includes('money') ||
          lowerText.includes('amount') ||
          lowerText.includes('wallet')) {
        return await fetchBalance();
      }

      // Use enhanced AI Intelligence Services for complex queries
      return await callEnhancedAIService(text);
    } catch (error) {
      console.error('AI service error:', error);
      throw new Error('AI service unavailable');
    }
  };

  const callEnhancedAIService = async (text: string) => {
    try {
      const token = await getAuthToken();

      // Fetch user's actual transaction data for context
      let recentTransactions = [];
      let accountBalance = 0;

      try {
        // Get recent transactions
        const transactionsData = await APIService.getTransferHistory({ page: 1, limit: 10 });
        if (transactionsData.transactions) {
          recentTransactions = transactionsData.transactions.map((tx: any) => ({
            amount: Math.abs(tx.amount || 0),
            type: tx.direction === 'sent' ? 'debit' : 'credit',
            description: tx.description || tx.recipient?.accountName || 'Transaction',
            date: tx.createdAt,
            category: tx.category || 'general'
          }));
        }

        // Get account balance
        const balanceResponse = await fetch(buildApiUrl('wallets/balance'), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          if (balanceData.success && balanceData.data) {
            accountBalance = balanceData.data.balance || 0;
          }
        }
      } catch (error) {
        console.log('Could not fetch user transaction data:', error);
        // Continue without transaction data
      }

      const response = await fetch(buildApiUrl('ai/chat'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          userId: await getUserId(),
          context: {
            userId: await getUserId(),
            tenantId: currentTenant?.id,
            conversationId: `conversation-${Date.now()}`,
            sessionId: Date.now().toString(),
            language: 'en',
            conversationHistory: messages.slice(-5).map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text
            })),
            bankingContext: {
              accountBalance: accountBalance,
              recentTransactions: recentTransactions,
              userProfile: await getUserProfile(),
              capabilities: ['balance_inquiry', 'transaction_analysis', 'spending_insights']
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AI service error: ${response.status}`);
      }

      const data = await response.json();

      // Handle direct response from AI service (no success wrapper)
      if (data.message || data.response) {
        // Format smart suggestions as action buttons
        const suggestionActions = data.suggestions?.map((s: any) => s.title || s.text) || [];
        const standardActions = ['Check Balance', 'Send Money', 'View Transactions', 'Help'];

        return {
          message: data.response || data.message,
          intent: data.intent || 'ai_response',
          actions: [...suggestionActions.slice(0, 3), ...standardActions].slice(0, 6)
        };
      } else {
        throw new Error(data.message || 'AI service failed');
      }
    } catch (error) {
      console.error('Enhanced AI service error:', error);

      // Fallback to basic response
      const lowerText = text.toLowerCase();
      if (lowerText.includes('help') ||
          lowerText.includes('what can you do') ||
          lowerText.includes('assist') ||
          lowerText.includes('support')) {
        return {
          message: 'I can help you with: checking balances, sending money, viewing transactions, paying bills, and managing your FMFB account. What would you like to do?',
          intent: 'help',
          actions: ['Check Balance', 'Send Money', 'Pay Bills', 'Account Settings']
        };
      } else if (lowerText.includes('hello') ||
                 lowerText.includes('hi') ||
                 lowerText.includes('hey') ||
                 lowerText.includes('good morning') ||
                 lowerText.includes('good afternoon') ||
                 lowerText.includes('good evening')) {
        return {
          message: 'Hello! I\'m your FMFB banking assistant. I can help you check your balance, view transactions, send money, and more. What would you like to do today?',
          intent: 'greeting',
          actions: ['Check Balance', 'Send Money', 'View Transactions', 'Help']
        };
      } else {
        return {
          message: `I understand you're asking about "${text}". I can help you with:\n\n• Checking your account balance\n• Viewing recent transactions\n• Sending money to others\n• General banking support\n\nWhat specific task would you like me to help you with?`,
          intent: 'general_inquiry',
          actions: ['Check Balance', 'Send Money', 'View Transactions', 'Help']
        };
      }
    }
  };

  const fetchBalance = async () => {
    try {
      const token = await getAuthToken();

      const response = await fetch(buildApiUrl('wallets/balance'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const { balance, currency, accountNumber, owner } = data.data;
        return {
          message: `Your current account balance is ${formatCurrency(balance, currency || 'NGN', { locale: 'en-NG' })}. Account: ${accountNumber}. Account holder: ${owner.name}. You have sufficient funds for transactions.`,
          intent: 'balance_inquiry',
          actions: ['Send Money', 'View Transactions', 'Transfer Funds']
        };
      } else {
        throw new Error('Invalid balance response');
      }
    } catch (error) {
      console.error('Balance fetch error:', error);
      throw error; // Re-throw error instead of falling back to demo data
    }
  };

  const fetchTransactions = async () => {
    try {
      console.log('🔍 Starting fetchTransactions using APIService.getTransferHistory...');
      
      // Use the same working API call that Dashboard uses successfully
      const data = await APIService.getTransferHistory({ page: 1, limit: 5 });
      console.log('📊 API Response Data:', JSON.stringify(data, null, 2));
      
      if (data.transactions && data.transactions.length > 0) {
        console.log('✅ Found transactions, processing...');
        const transactions = data.transactions;
        console.log('📋 Processing', transactions.length, 'transactions');
        
        const transactionList = transactions.map((tx: any, index: number) => {
          console.log(`🔄 Processing transaction ${index + 1}:`, tx);
          
          const amount = tx.amount ? Math.abs(tx.amount).toLocaleString() : '0';
          const date = tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Unknown';
          const description = tx.description || tx.recipient?.accountName || tx.direction || 'Transaction';
          const direction = tx.direction === 'sent' ? 'to' : 'from';
          const recipient = tx.recipient?.accountName || 'Unknown';
          
          const formatted = `${index + 1}) ${description} ${direction} ${recipient} - ${formatCurrency(parseFloat(amount.replace(/,/g, '')), 'NGN', { locale: 'en-NG' })} (${date})`;
          console.log(`✅ Formatted transaction ${index + 1}:`, formatted);
          return formatted;
        }).join(', ');

        console.log('🎯 Final transaction list:', transactionList);
        return {
          message: `Here are your recent transactions: ${transactionList}`,
          intent: 'transaction_history',
          actions: ['Download Statement', 'Filter Transactions', 'View Details']
        };
      } else {
        console.log('⚠️ No transactions found');
        
        return {
          message: 'You don\'t have any recent transactions to display.',
          intent: 'transaction_history',
          actions: ['Send Money', 'Check Balance', 'View Account']
        };
      }
    } catch (error) {
      console.error('❌ Transactions fetch error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  const startTransfer = async () => {
    const newTransferData: TransferData = {
      step: 'account'
    };
    setTransferData(newTransferData);
    
    return {
      message: 'I\'ll help you send money. Let\'s start by getting the recipient\'s details.\n\nPlease enter the recipient\'s 10-digit account number:',
      intent: 'money_transfer_start',
      actions: ['Cancel Transfer']
    };
  };

  const processTransferStep = async (userInput: string) => {
    if (!transferData) return null;

    const cleanInput = userInput.trim();
    const currentStep = transferData.step;

    switch (currentStep) {
      case 'account':
        if (!/^\d{10}$/.test(cleanInput)) {
          return {
            message: 'Please enter a valid 10-digit account number (numbers only):',
            intent: 'money_transfer_validation_error',
            actions: ['Cancel Transfer']
          };
        }
        setTransferData(prev => prev ? { ...prev, recipientAccountNumber: cleanInput, step: 'bank' } : null);
        return {
          message: `Account number: ${cleanInput}\n\nNow, please enter the 3-digit bank code for the recipient\'s bank:\n\nCommon bank codes:\n• 011 - First Bank\n• 044 - Access Bank\n• 057 - Zenith Bank\n• 058 - GTBank\n• 070 - Fidelity Bank`,
          intent: 'money_transfer_bank_step',
          actions: ['Cancel Transfer']
        };

      case 'bank':
        if (!/^\d{3}$/.test(cleanInput)) {
          return {
            message: 'Please enter a valid 3-digit bank code (numbers only):',
            intent: 'money_transfer_validation_error',
            actions: ['Cancel Transfer']
          };
        }
        setTransferData(prev => prev ? { ...prev, recipientBankCode: cleanInput, step: 'name' } : null);
        return {
          message: `Bank code: ${cleanInput}\n\nPlease enter the recipient\'s full name as it appears on their bank account:`,
          intent: 'money_transfer_name_step',
          actions: ['Cancel Transfer']
        };

      case 'name':
        if (cleanInput.length < 2 || cleanInput.length > 100) {
          return {
            message: 'Please enter a valid recipient name (2-100 characters):',
            intent: 'money_transfer_validation_error',
            actions: ['Cancel Transfer']
          };
        }
        setTransferData(prev => prev ? { ...prev, recipientName: cleanInput, step: 'amount' } : null);
        return {
          message: `Recipient: ${cleanInput}\n\nPlease enter the amount you want to send (minimum ${formatCurrency(100)}):`,
          intent: 'money_transfer_amount_step',
          actions: ['Cancel Transfer']
        };

      case 'amount':
        const amount = parseFloat(cleanInput.replace(/[^\d.]/g, ''));
        if (isNaN(amount) || amount < 100) {
          return {
            message: `Please enter a valid amount (minimum ${formatCurrency(100)}):`,
            intent: 'money_transfer_validation_error',
            actions: ['Cancel Transfer']
          };
        }
        setTransferData(prev => prev ? { ...prev, amount, step: 'pin' } : null);
        return {
          message: `Amount: ${formatCurrency(amount)}\n\nPlease enter your 4-digit transaction PIN to authorize this transfer:`,
          intent: 'money_transfer_pin_step',
          actions: ['Cancel Transfer']
        };

      case 'pin':
        if (!/^\d{4}$/.test(cleanInput)) {
          return {
            message: 'Please enter a valid 4-digit PIN (numbers only):',
            intent: 'money_transfer_validation_error',
            actions: ['Cancel Transfer']
          };
        }
        setTransferData(prev => prev ? { ...prev, pin: cleanInput, step: 'description' } : null);
        return {
          message: 'PIN entered successfully.\n\nOptional: Enter a description for this transfer (or type "skip" to proceed):',
          intent: 'money_transfer_description_step',
          actions: ['Skip Description', 'Cancel Transfer']
        };

      case 'description':
        const description = cleanInput.toLowerCase() === 'skip' ? undefined : cleanInput;
        setTransferData(prev => prev ? { ...prev, description, step: 'confirm' } : null);
        const transferSummary = {
          ...transferData,
          description,
          step: 'confirm'
        };
        return {
          message: `Please confirm your transfer details:\n\n📋 Transfer Summary\n• Account: ${transferSummary.recipientAccountNumber}\n• Bank Code: ${transferSummary.recipientBankCode}\n• Recipient: ${transferSummary.recipientName}\n• Amount: ${formatCurrency(transferSummary.amount || 0)}\n• Description: ${transferSummary.description || 'None'}\n\nType "confirm" to proceed or "cancel" to abort:`,
          intent: 'money_transfer_confirm_step',
          actions: ['Confirm Transfer', 'Cancel Transfer']
        };

      case 'confirm':
        if (cleanInput.toLowerCase() === 'confirm') {
          return await executeTransfer();
        } else {
          setTransferData(null);
          return {
            message: 'Transfer cancelled. How else can I help you?',
            intent: 'transfer_cancelled',
            actions: ['Check Balance', 'Send Money', 'View Transactions']
          };
        }

      default:
        setTransferData(null);
        return {
          message: 'Transfer session expired. Please start a new transfer.',
          intent: 'transfer_expired',
          actions: ['Send Money', 'Check Balance']
        };
    }
  };

  const executeTransfer = async () => {
    if (!transferData) {
      return {
        message: 'Transfer data missing. Please start a new transfer.',
        intent: 'transfer_error',
        actions: ['Send Money']
      };
    }

    try {
      const token = await getAuthToken();

      const response = await fetch(buildApiUrl('transfers/initiate'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientAccountNumber: transferData.recipientAccountNumber,
          recipientBankCode: transferData.recipientBankCode,
          recipientName: transferData.recipientName,
          amount: transferData.amount,
          pin: transferData.pin,
          description: transferData.description,
          saveRecipient: false
        })
      });

      const data = await response.json();
      
      setTransferData(null);
      
      if (response.ok && data.success) {
        return {
          message: `✅ Transfer successful!\n\nTransfer ID: ${data.data.reference}\nAmount: ${formatCurrency(transferData.amount || 0)}\nRecipient: ${transferData.recipientName}\nStatus: Completed\n\nYour transfer has been processed successfully.`,
          intent: 'transfer_success',
          actions: ['Check Balance', 'Send Another', 'View Transactions']
        };
      } else {
        return {
          message: `❌ Transfer failed: ${data.message || 'Unknown error occurred'}\n\nPlease try again or contact support if the problem persists.`,
          intent: 'transfer_failed',
          actions: ['Try Again', 'Check Balance', 'Contact Support']
        };
      }
    } catch (error) {
      console.error('Transfer execution error:', error);
      setTransferData(null);
      return {
        message: '❌ Transfer failed due to a network error. Please check your connection and try again.',
        intent: 'transfer_network_error',
        actions: ['Try Again', 'Check Balance']
      };
    }
  };

  const getAuthToken = async () => {
    try {
      const token = APIService.getAccessToken();
      if (token) {
        console.log('🔐 Using access token from APIService');
        return token;
      }
    } catch (error) {
      console.log('⚠️ Could not get token from APIService:', error);
    }

    throw new Error('No valid authentication token available. Please log in again.');
  };

  const getUserId = async () => {
    try {
      const profile = await APIService.getProfile();
      return profile.id || 'current-user';
    } catch (error) {
      console.log('⚠️ Could not get user profile from APIService:', error);
      return 'current-user';
    }
  };

  const getUserProfile = async () => {
    try {
      const profile = await APIService.getProfile();
      return {
        name: `${profile.firstName} ${profile.lastName}`.trim(),
        email: profile.email,
        accountType: profile.role,
        tier: profile.kycLevel
      };
    } catch (error) {
      console.log('⚠️ Could not get user profile from APIService:', error);
      return null;
    }
  };

  const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
    // Auto-hide notification after 3 seconds
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleVoiceMode = () => {
    if (voiceMode === 'off') {
      setVoiceMode('push-to-talk');
      showNotification('Push-to-talk mode enabled. Hold the voice button to record.', 'success');
    } else if (voiceMode === 'push-to-talk') {
      setVoiceMode('continuous');
      showNotification('Continuous voice mode enabled. Click to start/stop recording.', 'success');
    } else {
      setVoiceMode('off');
      showNotification('Voice mode disabled.', 'info');
      if (isRecording) {
        speechRecognition?.stop();
        setIsRecording(false);
      }
    }
  };

  const handleVoicePress = () => {
    console.log('Voice button pressed', { isWeb: Platform.OS === 'web', speechRecognition, isRecording, voiceMode });
    
    if (Platform.OS === 'web') {
      if (!speechRecognition) {
        showNotification('Voice input not available. Please use a modern browser like Chrome, Firefox, or Safari.', 'error');
        console.log('Browser does not support speech recognition');
        return;
      }

      if (voiceMode === 'off') {
        toggleVoiceMode();
        return;
      }

      if (voiceMode === 'continuous') {
        if (isRecording) {
          // Stop recording
          console.log('Stopping voice recording');
          speechRecognition.stop();
          setIsRecording(false);
          showNotification('Voice recording stopped.', 'info');
        } else {
          // Start recording
          console.log('Starting voice recording');
          setIsRecording(true);
          showNotification('Voice recording started. Speak your banking request.', 'success');
          try {
            speechRecognition.start();
          } catch (error) {
            console.error('Failed to start speech recognition:', error);
            setIsRecording(false);
            showNotification('Failed to start voice recognition. Please try again.', 'error');
          }
        }
      }
    } else {
      // React Native mobile implementation
      showNotification('Voice recording feature is coming soon for mobile. Please use text input for now.', 'info');
    }
  };

  const handleVoicePressIn = () => {
    if (Platform.OS === 'web' && voiceMode === 'push-to-talk' && speechRecognition && !isRecording) {
      console.log('Starting push-to-talk recording');
      setIsRecording(true);
      showNotification('Recording... Release to send.', 'info');
      try {
        speechRecognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setIsRecording(false);
        showNotification('Failed to start voice recognition.', 'error');
      }
    }
  };

  const handleVoicePressOut = () => {
    if (Platform.OS === 'web' && voiceMode === 'push-to-talk' && speechRecognition && isRecording) {
      console.log('Stopping push-to-talk recording');
      speechRecognition.stop();
      setIsRecording(false);
      showNotification('Processing voice input...', 'info');
    }
  };

  const handleActionPress = (action: string) => {
    // Handle special transfer actions
    if (action === 'Cancel Transfer') {
      setTransferData(null);
      const cancelMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Transfer cancelled. How else can I help you?',
        sender: 'ai',
        timestamp: new Date(),
        intent: 'transfer_cancelled',
        actions: ['Check Balance', 'Send Money', 'View Transactions']
      };
      setMessages(prev => [...prev, cancelMessage]);
      return;
    }
    
    if (action === 'Skip Description') {
      handleSendMessage('skip');
      return;
    }
    
    if (action === 'Confirm Transfer') {
      handleSendMessage('confirm');
      return;
    }
    
    if (action === 'Send Another') {
      handleSendMessage('I want to send money');
      return;
    }
    
    if (action === 'Try Again') {
      handleSendMessage('I want to send money');
      return;
    }

    const actionMessages: { [key: string]: string } = {
      'Check Balance': 'Check my account balance',
      'Send Money': 'I want to send money',
      'View Transactions': 'Show me my recent transactions',
      'Help': 'How can you help me?',
      'Transfer Funds': 'I want to transfer funds'
    };

    const message = actionMessages[action] || action;
    handleSendMessage(message);
    
    if (onActionSelect) {
      onActionSelect(action);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = (message: Message) => (
    <View key={message.id} style={[
      styles.messageContainer,
      message.sender === 'user' ? styles.userMessage : styles.aiMessage
    ]}>
      {message.sender === 'ai' && (
        <View style={styles.aiHeader}>
          <Text style={styles.aiHeaderText}>AI Assistant</Text>
        </View>
      )}
      
      <View style={[
        styles.messageBubble,
        message.sender === 'user' ? styles.userBubble : styles.aiBubble
      ]}>
        <Text style={[
          styles.messageText,
          message.sender === 'user' ? styles.userText : styles.aiText
        ]}>
          {message.text}
        </Text>
        
        {message.actions && message.actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {message.actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionButton}
                onPress={() => handleActionPress(action)}
              >
                <Text style={styles.actionText}>{action}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      
      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={[styles.messageContainer, styles.aiMessage]}>
      <View style={styles.aiHeader}>
        <Text style={styles.aiHeaderText}>AI Assistant</Text>
      </View>
      <View style={[styles.messageBubble, styles.aiBubble]}>
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color="#666" />
          <Text style={styles.typingText}>Thinking...</Text>
        </View>
      </View>
    </View>
  );

  if (!isVisible) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#010080" barStyle="light-content" />
      
      {onBack && (
        <View style={styles.header}>
          <BackButton
            onPress={onBack}
            title="Back"
            variant="transparent"
            size="medium"
          />
          <Text style={styles.headerTitle}>AI Assistant</Text>
          <View style={styles.headerSpacer} />
        </View>
      )}
      
      <View style={styles.contentContainer}>
      {notification && (
        <View style={[styles.notificationContainer, styles[`notification${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}`]]}>
          <Text style={styles.notificationText}>{notification.message}</Text>
          <TouchableOpacity
            style={styles.notificationClose}
            onPress={() => setNotification(null)}
          >
            <Text style={styles.notificationCloseText}>×</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {voiceMode !== 'off' && (
        <View style={styles.voiceModeIndicator}>
          <Text style={styles.voiceModeText}>
            Voice Mode: {voiceMode === 'push-to-talk' ? 'Push-to-Talk (Hold to record)' : 'Continuous (Click to toggle)'}
          </Text>
          <TouchableOpacity
            style={styles.voiceModeToggle}
            onPress={toggleVoiceMode}
          >
            <Text style={styles.voiceModeToggleText}>Change Mode</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(renderMessage)}
        {isLoading && renderTypingIndicator()}
      </ScrollView>

      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          onSubmitEditing={() => handleSendMessage(inputText)}
          blurOnSubmit={false}
        />
        
        <TouchableOpacity
          style={[
            styles.voiceButton, 
            isRecording && styles.voiceButtonRecording,
            voiceMode !== 'off' && styles.voiceButtonActive
          ]}
          onPress={handleVoicePress}
          onPressIn={handleVoicePressIn}
          onPressOut={handleVoicePressOut}
          activeOpacity={0.7}
          testID="voice-button"
        >
          <Text style={styles.voiceIcon}>
            {isRecording ? '🔴' : voiceMode === 'off' ? '🎤' : voiceMode === 'push-to-talk' ? '🎙️' : '🔊'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={() => handleSendMessage(inputText)}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    ...Platform.select({
      web: {
        maxHeight: '100vh' as any,
        width: '100%'
      }
    })
  } as any,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#010080',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 80,
  },
  contentContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 100,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  aiHeader: {
    backgroundColor: '#010080',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 2,
  },
  aiHeaderText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: '#010080',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderTopLeftRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginHorizontal: 8,
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#010080',
  },
  actionText: {
    fontSize: 12,
    color: '#010080',
    fontWeight: '500',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#010080',
  },
  suggestionText: {
    fontSize: 12,
    color: '#010080',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    alignItems: 'flex-end',
    ...Platform.select({
      web: {
        paddingBottom: 16,
      }
    })
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
    ...Platform.select({
      web: {
        outlineWidth: 0,
      }
    })
  },
  voiceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#010080',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonRecording: {
    backgroundColor: '#dc3545',
    // animation: 'pulse 1s infinite', // CSS animation not supported in React Native
  },
  voiceIcon: {
    fontSize: 16,
    color: 'white',
  },
  sendButton: {
    backgroundColor: '#010080',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  sendText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationInfo: {
    backgroundColor: '#d1ecf1',
    borderLeftColor: '#0c5460',
    borderLeftWidth: 4,
  },
  notificationSuccess: {
    backgroundColor: '#d4edda',
    borderLeftColor: '#155724',
    borderLeftWidth: 4,
  },
  notificationError: {
    backgroundColor: '#f8d7da',
    borderLeftColor: '#721c24',
    borderLeftWidth: 4,
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  notificationClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  notificationCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  voiceModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e3f2fd',
    borderBottomWidth: 1,
    borderBottomColor: '#bbdefb',
  },
  voiceModeText: {
    flex: 1,
    fontSize: 12,
    color: '#1565c0',
    fontWeight: '500',
  },
  voiceModeToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#1976d2',
    borderRadius: 4,
  },
  voiceModeToggleText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  voiceButtonActive: {
    backgroundColor: '#1976d2',
  }
});

export default AIChatInterface;