import OpenAI from 'openai';
import TenantConfigLoader from '../../../../src/tenants/TenantConfigLoader';
import { TenantConfig } from '../../../../src/types/tenant';

export interface ConversationContext {
  userId: string;
  tenantId: string;
  conversationId: string;
  language: string;
  bankingContext: BankingContext;
}

export interface BankingContext {
  accountBalance?: number;
  recentTransactions?: any[];
  userProfile?: any;
  capabilities?: string[];
}

export interface AIResponse {
  message: string;
  intent?: string;
  entities?: any;
  confidence: number;
  actions?: string[];
  followUp?: string[];
}

export class ConversationalAIService {
  private openai: OpenAI | null = null;
  private tenantConfig: TenantConfig | null = null;

  constructor() {
    this.initializeAI();
  }

  private async initializeAI(): Promise<void> {
    try {
      this.tenantConfig = TenantConfigLoader.getCurrentConfig();
      
      if (this.tenantConfig?.aiConfig.provider === 'openai') {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY || this.tenantConfig.aiConfig.apiKey
        });
      }
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
    }
  }

  async processMessage(message: string, context: ConversationContext): Promise<AIResponse> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not initialized');
      }

      const systemPrompt = this.buildSystemPrompt(context);
      const userMessage = this.preprocessMessage(message, context);

      const completion = await this.openai.chat.completions.create({
        model: this.tenantConfig?.aiConfig.models.conversational || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content || '';
      
      return {
        message: response,
        confidence: 0.95,
        intent: await this.extractIntent(message),
        entities: await this.extractEntities(message, context),
        actions: await this.suggestActions(message, context)
      };

    } catch (error) {
      console.error('Error processing message:', error);
      return {
        message: "I'm sorry, I'm having trouble understanding your request right now. Please try again.",
        confidence: 0.1
      };
    }
  }

  private buildSystemPrompt(context: ConversationContext): string {
    const bankName = this.tenantConfig?.displayName || 'OrokiiPay';
    const capabilities = context.bankingContext.capabilities || [];
    
    return `You are a helpful AI banking assistant for ${bankName}. 

You can help users with:
- Account balance inquiries
- Transaction history
- Money transfers
- Bill payments
- General banking questions
- Account management

Current context:
- User language: ${context.language}
- Available features: ${capabilities.join(', ')}
- Account balance: ${context.bankingContext.accountBalance ? `₦${context.bankingContext.accountBalance.toLocaleString()}` : 'Not available'}

Guidelines:
1. Always be professional and helpful
2. Keep responses concise but informative
3. Ask for clarification when needed
4. Prioritize security and privacy
5. Use Nigerian banking terminology and currency (Naira)
6. Support multiple Nigerian languages when requested
7. Suggest relevant banking actions when appropriate

Respond in ${context.language === 'en' ? 'English' : context.language}.`;
  }

  private preprocessMessage(message: string, context: ConversationContext): string {
    const preprocessed = message.trim().toLowerCase();
    
    const commonPhrases = {
      'balance': 'account balance',
      'send money': 'transfer money',
      'check account': 'account balance',
      'pay bill': 'bill payment'
    };

    let processed = preprocessed;
    for (const [key, value] of Object.entries(commonPhrases)) {
      processed = processed.replace(new RegExp(key, 'g'), value);
    }

    return processed;
  }

  private async extractIntent(message: string): Promise<string> {
    const intents = {
      'balance': ['balance', 'account', 'money', 'funds'],
      'transfer': ['send', 'transfer', 'pay', 'move'],
      'history': ['history', 'transactions', 'statement'],
      'help': ['help', 'assist', 'support', 'how'],
      'greeting': ['hello', 'hi', 'good morning', 'good afternoon']
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }

  private async extractEntities(message: string, context: ConversationContext): Promise<any> {
    const entities: any = {};
    
    const amountMatch = message.match(/₦?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (amountMatch) {
      entities.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    const phoneMatch = message.match(/(\+234|0)[789]\d{9}/);
    if (phoneMatch) {
      entities.phoneNumber = phoneMatch[0];
    }

    const accountMatch = message.match(/\b\d{10}\b/);
    if (accountMatch) {
      entities.accountNumber = accountMatch[0];
    }

    return entities;
  }

  private async suggestActions(message: string, context: ConversationContext): Promise<string[]> {
    const intent = await this.extractIntent(message);
    const actions: string[] = [];

    switch (intent) {
      case 'balance':
        actions.push('check_balance', 'view_recent_transactions');
        break;
      case 'transfer':
        actions.push('initiate_transfer', 'view_beneficiaries');
        break;
      case 'history':
        actions.push('view_transactions', 'download_statement');
        break;
      case 'help':
        actions.push('show_help_menu', 'contact_support');
        break;
    }

    return actions;
  }

  async processVoiceCommand(audioData: Buffer, context: ConversationContext): Promise<AIResponse> {
    try {
      if (!this.openai) {
        throw new Error('OpenAI not initialized');
      }

      const transcription = await this.openai.audio.transcriptions.create({
        file: new File([audioData], 'audio.wav', { type: 'audio/wav' }) as any,
        model: 'whisper-1',
        language: context.language === 'en' ? 'en' : undefined
      });

      const text = transcription.text;
      return this.processMessage(text, context);

    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        message: "I couldn't understand the voice command. Please try speaking again.",
        confidence: 0.1
      };
    }
  }

  async generateSuggestions(context: ConversationContext): Promise<string[]> {
    const suggestions = [
      "Check my account balance",
      "Show recent transactions",
      "Transfer money to a contact",
      "Pay bills",
      "How can I help you today?"
    ];

    if (context.language !== 'en') {
      return this.translateSuggestions(suggestions, context.language);
    }

    return suggestions;
  }

  private async translateSuggestions(suggestions: string[], language: string): Promise<string[]> {
    const translations: { [key: string]: { [key: string]: string } } = {
      'yo': {
        "Check my account balance": "Wo iye owo mi",
        "Show recent transactions": "Fi awon iṣowo tuntun han",
        "Transfer money to a contact": "Fi owo ranṣẹ si ẹnikan",
        "Pay bills": "San awon iwe owo",
        "How can I help you today?": "Bawo ni mo ṣe le ran yin lowo loni?"
      },
      'ha': {
        "Check my account balance": "Duba ma'aunin asusuna",
        "Show recent transactions": "Nuna sabbin ma'amaloli",
        "Transfer money to a contact": "Tura kudi zuwa wani",
        "Pay bills": "Biya kudade",
        "How can I help you today?": "Ta yaya zan iya taimaka maka yau?"
      },
      'ig': {
        "Check my account balance": "Lelee ego m",
        "Show recent transactions": "Gosi azụmahịa ọhụrụ",
        "Transfer money to a contact": "Zigara mmadụ ego",
        "Pay bills": "Kwụọ ụgwọ",
        "How can I help you today?": "Kedu ka m ga-esi nyere gị aka taa?"
      }
    };

    return suggestions.map(suggestion => 
      translations[language]?.[suggestion] || suggestion
    );
  }
}

export default ConversationalAIService;