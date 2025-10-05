/**
 * ============================================================================
 * REFERRAL SERVICES INDEX
 * ============================================================================
 * Purpose: Export all referral-related services
 * Created: October 5, 2025
 * Phase: 2 - Backend Services
 * ============================================================================
 */

export { ReferralService } from './ReferralService';
export { PromoCodeService } from './PromoCodeService';
export { AggregatorService } from './AggregatorService';
export { FraudDetectionService } from './FraudDetectionService';

export type {
  CreateReferralParams,
  ReferralStats,
  Referral,
  ShareReferralParams,
  ShareResult,
  ShareAnalytics,
} from './ReferralService';

export type {
  PromotionalCampaign,
  PromoCodeRedemption,
  CreateCampaignParams,
  ValidationResult,
  RedemptionResult,
  CampaignStats,
} from './PromoCodeService';

export type {
  AggregatorPartner,
  CompensationTier,
  Payout,
  CreatePartnerParams,
  PartnerStats,
} from './AggregatorService';

export type {
  FraudCheckResult,
  RateLimitCheck,
  DeviceFingerprintCheck,
  IPAddressCheck,
} from './FraudDetectionService';
