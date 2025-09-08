import { Request } from 'express';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenant?: TenantInfo;
      tenantContext?: string;
      sessionId?: string;
    }
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'super_agent' | 'agent' | 'merchant' | 'viewer';
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'locked';
  tenantId: string;
  tenantName: string;
  tenantDisplayName: string;
  iat?: number;
  exp?: number;
}

export interface TenantInfo {
  id: string;
  name: string;
  displayName: string;
  status: 'active' | 'inactive' | 'suspended' | 'maintenance';
  tier: 'basic' | 'premium' | 'enterprise';
  subdomain: string;
  customDomain?: string;
  configuration: any;
  branding: any;
  aiConfiguration: any;
  securitySettings: any;
  database_name?: string;
  database_status?: 'pending' | 'provisioning' | 'active' | 'maintenance' | 'error';
}

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface TransferRequest {
  recipientAccountNumber: string;
  recipientBankCode: string;
  amount: number;
  narration?: string;
  pin: string;
  metadata?: Record<string, any>;
}

export interface WalletResponse {
  id: string;
  user_id: string;
  wallet_number: string;
  wallet_type: 'main' | 'savings' | 'business' | 'investment';
  balance: number;
  available_balance: number;
  reserved_balance: number;
  currency: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionResponse {
  id: string;
  reference: string;
  type: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  description?: string;
  created_at: Date;
  completed_at?: Date;
}