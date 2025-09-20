import * as tf from '@tensorflow/tfjs';
import * as natural from 'natural';
import { ConversationContext } from '../core/ConversationalAIService';

export interface Intent {
  name: string;
  confidence: number;
  parameters?: { [key: string]: any };
}

export interface TrainingData {
  text: string;
  intent: string;
  entities?: { [key: string]: any };
}

export class IntentClassificationService {
  private tokenizer: natural.WordTokenizer;
  private stemmer = natural.PorterStemmer;
  private model: tf.LayersModel | null = null;
  private vocabulary: string[] = [];
  private intents: string[] = [];
  private isInitialized = false;

  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.loadPretrainedIntents();
      await this.buildModel();
      this.isInitialized = true;
      console.log('Intent Classification Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Intent Classification Service:', error);
    }
  }

  private async loadPretrainedIntents(): Promise<void> {
    this.intents = [
      'account_balance',
      'transfer_money',
      'transaction_history',
      'bill_payment',
      'account_info',
      'customer_support',
      'greeting',
      'goodbye',
      'help',
      'complaint',
      'loan_inquiry',
      'card_services',
      'exchange_rate',
      'general_inquiry'
    ];

    const bankingTerms = [
      'account', 'balance', 'transfer', 'send', 'money', 'payment', 'bill',
      'transaction', 'history', 'statement', 'deposit', 'withdraw', 'check',
      'savings', 'current', 'loan', 'credit', 'debit', 'card', 'atm',
      'help', 'support', 'problem', 'issue', 'hello', 'hi', 'goodbye',
      'thanks', 'please', 'naira', 'dollar', 'rate', 'exchange'
    ];

    const nigerianTerms = [
      'kudi', 'ego', 'owo', 'money', 'send', 'transfer', 'pay', 'balance',
      'account', 'bank', 'atm', 'pos', 'ussd', 'mobile', 'app'
    ];

    this.vocabulary = [...new Set([...bankingTerms, ...nigerianTerms])];
  }

  async classifyIntent(text: string, context?: ConversationContext): Promise<Intent> {
    if (!this.isInitialized) {
      await this.initializeService();
    }

    try {
      const preprocessedText = this.preprocessText(text);
      const features = this.extractFeatures(preprocessedText);
      
      if (this.model) {
        const tensorInput = tf.tensor2d([features]);
        const prediction = this.model.predict(tensorInput) as tf.Tensor;
        const probabilities = await prediction.data();
        
        const maxIndex = probabilities.indexOf(Math.max(...Array.from(probabilities)));
        const confidence = probabilities[maxIndex];
        
        tensorInput.dispose();
        prediction.dispose();
        
        return {
          name: this.intents[maxIndex] || 'general_inquiry',
          confidence: confidence,
          parameters: this.extractParameters(text, this.intents[maxIndex])
        };
      }

      return this.fallbackClassification(preprocessedText);
    } catch (error) {
      console.error('Error classifying intent:', error);
      return this.fallbackClassification(text);
    }
  }

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractFeatures(text: string): number[] {
    const tokens = this.tokenizer.tokenize(text) || [];
    const stemmed = tokens.map(token => this.stemmer.stem(token));
    
    const features = new Array(this.vocabulary.length).fill(0);
    
    stemmed.forEach(token => {
      const index = this.vocabulary.indexOf(token);
      if (index !== -1) {
        features[index] = 1;
      }
    });
    
    return features;
  }

  private async buildModel(): Promise<void> {
    try {
      const trainingData = this.generateTrainingData();
      
      const inputSize = this.vocabulary.length;
      const hiddenSize = 128;
      const outputSize = this.intents.length;
      
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [inputSize],
            units: hiddenSize,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({
            units: hiddenSize / 2,
            activation: 'relu'
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: outputSize,
            activation: 'softmax'
          })
        ]
      });

      this.model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });

      const { xs, ys } = this.prepareTrainingData(trainingData);
      
      await this.model.fit(xs, ys, {
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        verbose: 0
      });

      xs.dispose();
      ys.dispose();
      
    } catch (error) {
      console.error('Error building model:', error);
    }
  }

  private generateTrainingData(): TrainingData[] {
    return [
      // Account Balance
      { text: "What is my account balance?", intent: "account_balance" },
      { text: "Check my balance", intent: "account_balance" },
      { text: "How much money do I have?", intent: "account_balance" },
      { text: "Show me my account balance", intent: "account_balance" },
      { text: "Wo iye owo mi", intent: "account_balance" },
      
      // Transfer Money
      { text: "Send money to John", intent: "transfer_money" },
      { text: "Transfer 5000 naira", intent: "transfer_money" },
      { text: "I want to send money", intent: "transfer_money" },
      { text: "Transfer funds", intent: "transfer_money" },
      { text: "Fi owo ranṣẹ", intent: "transfer_money" },
      
      // Transaction History
      { text: "Show my transaction history", intent: "transaction_history" },
      { text: "Recent transactions", intent: "transaction_history" },
      { text: "Transaction statement", intent: "transaction_history" },
      { text: "My transaction records", intent: "transaction_history" },
      
      // Bill Payment
      { text: "Pay my electricity bill", intent: "bill_payment" },
      { text: "Pay bills", intent: "bill_payment" },
      { text: "I want to pay for utilities", intent: "bill_payment" },
      { text: "Bill payment", intent: "bill_payment" },
      
      // Greetings
      { text: "Hello", intent: "greeting" },
      { text: "Hi there", intent: "greeting" },
      { text: "Good morning", intent: "greeting" },
      { text: "Sannu", intent: "greeting" },
      { text: "Ndewo", intent: "greeting" },
      
      // Help
      { text: "I need help", intent: "help" },
      { text: "How can you assist me?", intent: "help" },
      { text: "What can you do?", intent: "help" },
      { text: "Help me", intent: "help" },
      
      // Customer Support
      { text: "I have a problem", intent: "customer_support" },
      { text: "Contact support", intent: "customer_support" },
      { text: "Speak to an agent", intent: "customer_support" },
      { text: "I need assistance", intent: "customer_support" }
    ];
  }

  private prepareTrainingData(data: TrainingData[]): { xs: tf.Tensor2D; ys: tf.Tensor2D } {
    const features = data.map(item => this.extractFeatures(this.preprocessText(item.text)));
    const labels = data.map(item => {
      const label = new Array(this.intents.length).fill(0);
      const index = this.intents.indexOf(item.intent);
      if (index !== -1) {
        label[index] = 1;
      }
      return label;
    });

    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);
    
    return { xs, ys };
  }

  private fallbackClassification(text: string): Intent {
    const keywords = {
      account_balance: ['balance', 'money', 'account', 'funds', 'iye', 'owo'],
      transfer_money: ['send', 'transfer', 'pay', 'give', 'fi', 'ranṣẹ'],
      transaction_history: ['history', 'transactions', 'statement', 'records'],
      bill_payment: ['bill', 'payment', 'electricity', 'utilities', 'pay'],
      greeting: ['hello', 'hi', 'good', 'morning', 'sannu', 'ndewo'],
      help: ['help', 'assist', 'support', 'how', 'what', 'can'],
      customer_support: ['problem', 'issue', 'support', 'agent', 'assistance']
    };

    const lowerText = text.toLowerCase();
    let bestMatch = { intent: 'general_inquiry', confidence: 0.3 };

    for (const [intent, words] of Object.entries(keywords)) {
      const matches = words.filter(word => lowerText.includes(word)).length;
      const confidence = Math.min(0.9, matches * 0.3);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = { intent, confidence };
      }
    }

    return {
      name: bestMatch.intent,
      confidence: bestMatch.confidence,
      parameters: this.extractParameters(text, bestMatch.intent)
    };
  }

  private extractParameters(text: string, intent: string): { [key: string]: any } {
    const parameters: { [key: string]: any } = {};

    const amountMatch = text.match(/₦?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (amountMatch) {
      parameters.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    const phoneMatch = text.match(/(\+234|0)[789]\d{9}/);
    if (phoneMatch) {
      parameters.phoneNumber = phoneMatch[0];
    }

    const accountMatch = text.match(/\b\d{10}\b/);
    if (accountMatch) {
      parameters.accountNumber = accountMatch[0];
    }

    const nameMatch = text.match(/(?:to|for)\s+([A-Za-z\s]+)/i);
    if (nameMatch) {
      parameters.recipientName = nameMatch[1].trim();
    }

    const billTypes = ['electricity', 'water', 'internet', 'phone', 'cable', 'tv'];
    const billMatch = billTypes.find(type => text.toLowerCase().includes(type));
    if (billMatch) {
      parameters.billType = billMatch;
    }

    return parameters;
  }

  async getIntentSuggestions(partialText: string): Promise<string[]> {
    const suggestions: { [key: string]: string[] } = {
      account_balance: [
        "Check my account balance",
        "What's my current balance?",
        "Show me how much money I have"
      ],
      transfer_money: [
        "Send money to a contact",
        "Transfer funds to another account",
        "Make a payment"
      ],
      transaction_history: [
        "Show my recent transactions",
        "View transaction history",
        "Download my statement"
      ],
      bill_payment: [
        "Pay my electricity bill",
        "Pay for utilities",
        "Make bill payments"
      ]
    };

    if (partialText.length < 2) {
      return [
        "Check my balance",
        "Send money",
        "Recent transactions",
        "Pay bills",
        "Help"
      ];
    }

    const intent = await this.classifyIntent(partialText);
    return suggestions[intent.name] || ["How can I help you?"];
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
    }
  }
}

export default IntentClassificationService;