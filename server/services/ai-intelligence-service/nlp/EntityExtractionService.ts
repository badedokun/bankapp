import * as compromise from 'compromise';
import * as natural from 'natural';
import { ConversationContext } from '../core/ConversationalAIService';

export interface Entity {
  type: string;
  value: any;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
  raw: string;
}

export interface ExtractionResult {
  entities: Entity[];
  sanitizedText: string;
  metadata: {
    processingTime: number;
    confidence: number;
  };
}

export class EntityExtractionService {
  private nigerianBanks: string[];
  private nigerianStates: string[];
  private commonNames: string[];
  private phonePattern: RegExp;
  private accountPattern: RegExp;
  private amountPattern: RegExp;
  private datePattern: RegExp;
  private emailPattern: RegExp;

  constructor() {
    this.initializePatterns();
    this.initializeNigerianData();
  }

  private initializePatterns(): void {
    this.phonePattern = /(\+234|234|0)([789]\d{9})/g;
    this.accountPattern = /\b(\d{10})\b/g;
    this.amountPattern = /₦?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:naira|NGN|₦)?/gi;
    this.datePattern = /\b(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{2,4})\b/gi;
    this.emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  }

  private initializeNigerianData(): void {
    this.nigerianBanks = [
      'Access Bank', 'GTBank', 'Zenith Bank', 'First Bank', 'UBA', 'Fidelity Bank',
      'Union Bank', 'Sterling Bank', 'Stanbic IBTC', 'Keystone Bank', 'Wema Bank',
      'FCMB', 'Heritage Bank', 'Polaris Bank', 'Unity Bank', 'Jaiz Bank',
      'Providus Bank', 'SunTrust Bank', 'Parallex Bank', 'Titan Trust Bank',
      'Firstmidas Microfinance Bank', 'FMFB'
    ];

    this.nigerianStates = [
      'Lagos', 'Kano', 'Abuja', 'Oyo', 'Kaduna', 'Rivers', 'Anambra', 'Imo',
      'Ogun', 'Plateau', 'Cross River', 'Delta', 'Edo', 'Akwa Ibom', 'Ondo',
      'Osun', 'Kwara', 'Benue', 'Niger', 'Katsina', 'Sokoto', 'Zamfara',
      'Kebbi', 'Jigawa', 'Yobe', 'Borno', 'Adamawa', 'Gombe', 'Taraba',
      'Bauchi', 'Nasarawa', 'Kogi', 'Enugu', 'Ebonyi', 'Abia', 'Bayelsa'
    ];

    this.commonNames = [
      'John', 'Mary', 'James', 'Sarah', 'Michael', 'Grace', 'David', 'Faith',
      'Peter', 'Joy', 'Paul', 'Peace', 'Daniel', 'Love', 'Samuel', 'Hope',
      'Emmanuel', 'Blessing', 'Joseph', 'Mercy', 'Adebayo', 'Adunni', 'Chidi',
      'Nkem', 'Emeka', 'Ngozi', 'Kemi', 'Tunde', 'Bola', 'Seun', 'Musa',
      'Amina', 'Ibrahim', 'Aisha', 'Aliyu', 'Fatima', 'Usman', 'Zainab'
    ];
  }

  async extractEntities(text: string, context?: ConversationContext): Promise<ExtractionResult> {
    const startTime = Date.now();
    const entities: Entity[] = [];
    
    try {
      entities.push(...this.extractAmounts(text));
      entities.push(...this.extractPhoneNumbers(text));
      entities.push(...this.extractAccountNumbers(text));
      entities.push(...this.extractEmails(text));
      entities.push(...this.extractDates(text));
      entities.push(...this.extractNames(text));
      entities.push(...this.extractBanks(text));
      entities.push(...this.extractLocations(text));
      entities.push(...this.extractBankingTerms(text));
      entities.push(...this.extractTransactionTypes(text));
      entities.push(...this.extractBillTypes(text));

      const sanitizedText = this.sanitizeText(text, entities);
      const processingTime = Date.now() - startTime;
      const confidence = this.calculateOverallConfidence(entities);

      return {
        entities: entities.sort((a, b) => a.position.start - b.position.start),
        sanitizedText,
        metadata: {
          processingTime,
          confidence
        }
      };

    } catch (error) {
      console.error('Error extracting entities:', error);
      return {
        entities: [],
        sanitizedText: text,
        metadata: {
          processingTime: Date.now() - startTime,
          confidence: 0
        }
      };
    }
  }

  private extractAmounts(text: string): Entity[] {
    const entities: Entity[] = [];
    let match;
    
    while ((match = this.amountPattern.exec(text)) !== null) {
      const rawAmount = match[1].replace(/,/g, '');
      const amount = parseFloat(rawAmount);
      
      if (amount > 0 && amount <= 10000000) { // Reasonable banking limits
        entities.push({
          type: 'amount',
          value: amount,
          confidence: 0.95,
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          raw: match[0]
        });
      }
    }
    
    this.amountPattern.lastIndex = 0;
    return entities;
  }

  private extractPhoneNumbers(text: string): Entity[] {
    const entities: Entity[] = [];
    let match;
    
    while ((match = this.phonePattern.exec(text)) !== null) {
      const fullNumber = match[0];
      const normalized = this.normalizePhoneNumber(fullNumber);
      
      entities.push({
        type: 'phone_number',
        value: normalized,
        confidence: 0.9,
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        raw: fullNumber
      });
    }
    
    this.phonePattern.lastIndex = 0;
    return entities;
  }

  private extractAccountNumbers(text: string): Entity[] {
    const entities: Entity[] = [];
    let match;
    
    while ((match = this.accountPattern.exec(text)) !== null) {
      entities.push({
        type: 'account_number',
        value: match[1],
        confidence: 0.85,
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        raw: match[0]
      });
    }
    
    this.accountPattern.lastIndex = 0;
    return entities;
  }

  private extractEmails(text: string): Entity[] {
    const entities: Entity[] = [];
    let match;
    
    while ((match = this.emailPattern.exec(text)) !== null) {
      entities.push({
        type: 'email',
        value: match[0].toLowerCase(),
        confidence: 0.95,
        position: {
          start: match.index,
          end: match.index + match[0].length
        },
        raw: match[0]
      });
    }
    
    this.emailPattern.lastIndex = 0;
    return entities;
  }

  private extractDates(text: string): Entity[] {
    const entities: Entity[] = [];
    let match;
    
    while ((match = this.datePattern.exec(text)) !== null) {
      const dateValue = new Date(match[0]);
      if (!isNaN(dateValue.getTime())) {
        entities.push({
          type: 'date',
          value: dateValue.toISOString().split('T')[0],
          confidence: 0.8,
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          raw: match[0]
        });
      }
    }
    
    this.datePattern.lastIndex = 0;
    return entities;
  }

  private extractNames(text: string): Entity[] {
    const entities: Entity[] = [];
    const doc = (compromise as any)(text);
    
    // Extract person names using compromise
    const people = doc.people().out('array') as string[];
    people.forEach((name: string) => {
      const index = text.toLowerCase().indexOf(name.toLowerCase());
      if (index !== -1) {
        entities.push({
          type: 'person_name',
          value: name,
          confidence: 0.7,
          position: {
            start: index,
            end: index + name.length
          },
          raw: name
        });
      }
    });

    // Extract common Nigerian names
    this.commonNames.forEach(name => {
      const regex = new RegExp(`\\b${name}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          type: 'person_name',
          value: match[0],
          confidence: 0.6,
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          raw: match[0]
        });
      }
    });

    return entities;
  }

  private extractBanks(text: string): Entity[] {
    const entities: Entity[] = [];
    
    this.nigerianBanks.forEach(bank => {
      const regex = new RegExp(`\\b${bank}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          type: 'bank_name',
          value: bank,
          confidence: 0.9,
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          raw: match[0]
        });
      }
    });

    return entities;
  }

  private extractLocations(text: string): Entity[] {
    const entities: Entity[] = [];
    
    this.nigerianStates.forEach(state => {
      const regex = new RegExp(`\\b${state}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          type: 'location',
          value: state,
          confidence: 0.8,
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          raw: match[0]
        });
      }
    });

    return entities;
  }

  private extractBankingTerms(text: string): Entity[] {
    const entities: Entity[] = [];
    const bankingTerms = {
      'savings': 'account_type',
      'current': 'account_type',
      'checking': 'account_type',
      'deposit': 'transaction_type',
      'withdrawal': 'transaction_type',
      'credit': 'transaction_type',
      'debit': 'transaction_type',
      'atm': 'service_type',
      'pos': 'service_type',
      'ussd': 'service_type',
      'mobile banking': 'service_type',
      'internet banking': 'service_type'
    };

    Object.entries(bankingTerms).forEach(([term, type]) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          type,
          value: term,
          confidence: 0.8,
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          raw: match[0]
        });
      }
    });

    return entities;
  }

  private extractTransactionTypes(text: string): Entity[] {
    const entities: Entity[] = [];
    const transactionTypes = [
      'transfer', 'payment', 'withdrawal', 'deposit', 'send', 'receive',
      'buy', 'sell', 'purchase', 'refund', 'charge', 'fee'
    ];

    transactionTypes.forEach(type => {
      const regex = new RegExp(`\\b${type}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          type: 'transaction_type',
          value: type,
          confidence: 0.75,
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          raw: match[0]
        });
      }
    });

    return entities;
  }

  private extractBillTypes(text: string): Entity[] {
    const entities: Entity[] = [];
    const billTypes = [
      'electricity', 'power', 'nepa', 'phcn', 'ekedc', 'ikedc',
      'water', 'internet', 'data', 'airtime', 'cable tv', 'dstv', 'gotv',
      'startimes', 'school fees', 'tuition', 'rent', 'fuel', 'gas'
    ];

    billTypes.forEach(bill => {
      const regex = new RegExp(`\\b${bill}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        entities.push({
          type: 'bill_type',
          value: bill,
          confidence: 0.8,
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          raw: match[0]
        });
      }
    });

    return entities;
  }

  private normalizePhoneNumber(phone: string): string {
    let normalized = phone.replace(/\D/g, '');
    
    if (normalized.startsWith('234')) {
      return '+' + normalized;
    } else if (normalized.startsWith('0')) {
      return '+234' + normalized.substring(1);
    } else if (normalized.length === 10) {
      return '+234' + normalized;
    }
    
    return phone;
  }

  private sanitizeText(text: string, entities: Entity[]): string {
    let sanitized = text;
    
    // Sort entities by position in reverse order to avoid index shifting
    const sortedEntities = entities.sort((a, b) => b.position.start - a.position.start);
    
    sortedEntities.forEach(entity => {
      if (entity.type === 'account_number' || entity.type === 'phone_number') {
        const masked = '*'.repeat(entity.raw.length - 4) + entity.raw.slice(-4);
        sanitized = sanitized.substring(0, entity.position.start) + 
                   masked + 
                   sanitized.substring(entity.position.end);
      }
    });

    return sanitized;
  }

  private calculateOverallConfidence(entities: Entity[]): number {
    if (entities.length === 0) return 0;
    
    const totalConfidence = entities.reduce((sum, entity) => sum + entity.confidence, 0);
    return totalConfidence / entities.length;
  }

  async validateExtractedEntities(entities: Entity[], context?: ConversationContext): Promise<Entity[]> {
    return entities.map(entity => {
      switch (entity.type) {
        case 'amount':
          entity.confidence = this.validateAmount(entity.value) ? entity.confidence : entity.confidence * 0.5;
          break;
        case 'phone_number':
          entity.confidence = this.validatePhoneNumber(entity.value) ? entity.confidence : entity.confidence * 0.3;
          break;
        case 'account_number':
          entity.confidence = this.validateAccountNumber(entity.value) ? entity.confidence : entity.confidence * 0.3;
          break;
        case 'email':
          entity.confidence = this.validateEmail(entity.value) ? entity.confidence : entity.confidence * 0.3;
          break;
      }
      return entity;
    });
  }

  private validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 10000000 && Number.isFinite(amount);
  }

  private validatePhoneNumber(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 14;
  }

  private validateAccountNumber(account: string): boolean {
    return /^\d{10}$/.test(account);
  }

  private validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getEntityTypes(): string[] {
    return [
      'amount', 'phone_number', 'account_number', 'email', 'date',
      'person_name', 'bank_name', 'location', 'account_type',
      'transaction_type', 'service_type', 'bill_type'
    ];
  }
}

export default EntityExtractionService;