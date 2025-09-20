"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationalAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const TenantConfigLoader_1 = __importDefault(require("../../../../src/tenants/TenantConfigLoader"));
class ConversationalAIService {
    constructor() {
        this.openai = null;
        this.tenantConfig = null;
        this.initializeAI();
    }
    async initializeAI() {
        try {
            this.tenantConfig = TenantConfigLoader_1.default.getCurrentConfig();
            if (this.tenantConfig?.aiConfig.provider === 'openai') {
                this.openai = new openai_1.default({
                    apiKey: process.env.OPENAI_API_KEY || this.tenantConfig.aiConfig.apiKey
                });
            }
        }
        catch (error) {
            console.error('Failed to initialize AI service:', error);
        }
    }
    async processMessage(message, context) {
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
        }
        catch (error) {
            console.error('Error processing message:', error);
            return {
                message: "I'm sorry, I'm having trouble understanding your request right now. Please try again.",
                confidence: 0.1
            };
        }
    }
    buildSystemPrompt(context) {
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
    preprocessMessage(message, context) {
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
    async extractIntent(message) {
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
    async extractEntities(message, context) {
        const entities = {};
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
    async suggestActions(message, context) {
        const intent = await this.extractIntent(message);
        const actions = [];
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
    async processVoiceCommand(audioData, context) {
        try {
            if (!this.openai) {
                throw new Error('OpenAI not initialized');
            }
            const transcription = await this.openai.audio.transcriptions.create({
                file: new File([audioData], 'audio.wav', { type: 'audio/wav' }),
                model: 'whisper-1',
                language: context.language === 'en' ? 'en' : undefined
            });
            const text = transcription.text;
            return this.processMessage(text, context);
        }
        catch (error) {
            console.error('Error processing voice command:', error);
            return {
                message: "I couldn't understand the voice command. Please try speaking again.",
                confidence: 0.1
            };
        }
    }
    async generateSuggestions(context) {
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
    async translateSuggestions(suggestions, language) {
        const translations = {
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
        return suggestions.map(suggestion => translations[language]?.[suggestion] || suggestion);
    }
}
exports.ConversationalAIService = ConversationalAIService;
exports.default = ConversationalAIService;
//# sourceMappingURL=ConversationalAIService.js.map