/**
 * ============================================================================
 * AGGREGATOR SERVICE
 * ============================================================================
 * Purpose: Partner/influencer program management
 * Created: October 5, 2025
 * Phase: 2 - Backend Services
 * ============================================================================
 */

import { Pool } from 'pg';
import { getTenantPool } from '../../config/tenantDatabase';

export interface AggregatorPartner {
  id: string;
  name: string;
  businessName: string | null;
  email: string;
  phone: string | null;
  contactPerson: string | null;
  customCode: string;
  codePrefix: string | null;
  compensationTierId: string | null;
  compensationType: 'per_referral' | 'percentage' | 'tiered' | 'hybrid';
  baseRate: number | null;
  customRates: Record<string, any>;
  totalReferrals: number;
  activeReferrals: number;
  fundedReferrals: number;
  pendingReferrals: number;
  totalCompensationEarned: number;
  totalCompensationPaid: number;
  pendingCompensation: number;
  status: 'pending' | 'active' | 'paused' | 'suspended' | 'terminated';
  statusReason: string | null;
  contractStartDate: Date | null;
  contractEndDate: Date | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  bankCode: string | null;
  monthlyTarget: number | null;
  quarterlyBonus: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompensationTier {
  id: string;
  tierName: string;
  tierLevel: number;
  tierDescription: string | null;
  minReferrals: number;
  maxReferrals: number | null;
  paymentPerReferral: number | null;
  paymentPerActiveReferral: number | null;
  paymentPerFundedReferral: number | null;
  tierBonus: number;
  benefits: string[] | null;
}

export interface Payout {
  id: string;
  partnerId: string;
  periodStart: Date;
  periodEnd: Date;
  totalReferrals: number;
  activeReferrals: number;
  fundedReferrals: number;
  baseCompensation: number;
  bonusCompensation: number;
  totalCompensation: number;
  status: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  submittedAt: Date | null;
  approvedAt: Date | null;
  paymentDate: Date | null;
  paymentReference: string | null;
  createdAt: Date;
}

export interface CreatePartnerParams {
  name: string;
  businessName?: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  customCode: string;
  codePrefix?: string;
  compensationType?: 'per_referral' | 'percentage' | 'tiered' | 'hybrid';
  baseRate?: number;
  contractStartDate?: Date;
  contractEndDate?: Date;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  bankCode?: string;
  monthlyTarget?: number;
  quarterlyBonus?: number;
}

export interface PartnerStats {
  partnerId: string;
  partnerName: string;
  currentTier: string;
  totalReferrals: number;
  activeReferrals: number;
  fundedReferrals: number;
  pendingReferrals: number;
  totalEarned: number;
  totalPaid: number;
  pendingAmount: number;
  conversionRate: number;
  thisMonthReferrals: number;
  lastMonthReferrals: number;
  referralsByMonth: Array<{ month: string; count: number }>;
}

export class AggregatorService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Get tenant-specific database pool
   */
  private async getPool(): Promise<Pool> {
    return getTenantPool(this.tenantId);
  }

  /**
   * Create a new aggregator partner
   */
  async createPartner(params: CreatePartnerParams): Promise<string> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{ id: string }>(
        `INSERT INTO aggregators.partners (
          name, business_name, email, phone, contact_person,
          custom_code, code_prefix, compensation_type, base_rate,
          contract_start_date, contract_end_date,
          bank_name, account_number, account_name, bank_code,
          monthly_target, quarterly_bonus, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'pending')
        RETURNING id`,
        [
          params.name,
          params.businessName || null,
          params.email,
          params.phone || null,
          params.contactPerson || null,
          params.customCode.toUpperCase(),
          params.codePrefix || null,
          params.compensationType || 'per_referral',
          params.baseRate || null,
          params.contractStartDate || null,
          params.contractEndDate || null,
          params.bankName || null,
          params.accountNumber || null,
          params.accountName || null,
          params.bankCode || null,
          params.monthlyTarget || null,
          params.quarterlyBonus || null,
        ]
      );

      return result.rows[0].id;
    } catch (error: any) {
      console.error('Error creating partner:', error);

      if (error.code === '23505') { // Unique violation
        throw new Error(`Partner code ${params.customCode} or email ${params.email} already exists`);
      }

      throw new Error(`Failed to create partner: ${error.message}`);
    }
  }

  /**
   * Get partner by ID
   */
  async getPartnerById(partnerId: string): Promise<AggregatorPartner | null> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<AggregatorPartner>(
        `SELECT * FROM aggregators.partners WHERE id = $1`,
        [partnerId]
      );

      return result.rows[0] || null;
    } catch (error: any) {
      console.error('Error getting partner:', error);
      throw new Error(`Failed to get partner: ${error.message}`);
    }
  }

  /**
   * Get partner by custom code
   */
  async getPartnerByCode(code: string): Promise<AggregatorPartner | null> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<AggregatorPartner>(
        `SELECT * FROM aggregators.partners WHERE custom_code = $1`,
        [code.toUpperCase()]
      );

      return result.rows[0] || null;
    } catch (error: any) {
      console.error('Error getting partner by code:', error);
      throw new Error(`Failed to get partner: ${error.message}`);
    }
  }

  /**
   * Get all partners (with filters)
   */
  async getPartners(filters?: {
    status?: 'pending' | 'active' | 'paused' | 'suspended' | 'terminated';
    limit?: number;
    offset?: number;
  }): Promise<AggregatorPartner[]> {
    const pool = await this.getPool();

    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (filters?.status) {
        conditions.push(`status = $${paramIndex}`);
        values.push(filters.status);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;

      const result = await pool.query<AggregatorPartner>(
        `SELECT * FROM aggregators.partners
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, limit, offset]
      );

      return result.rows;
    } catch (error: any) {
      console.error('Error getting partners:', error);
      throw new Error(`Failed to get partners: ${error.message}`);
    }
  }

  /**
   * Update partner status
   */
  async updatePartnerStatus(
    partnerId: string,
    status: 'pending' | 'active' | 'paused' | 'suspended' | 'terminated',
    reason?: string
  ): Promise<void> {
    const pool = await this.getPool();

    try {
      await pool.query(
        `UPDATE aggregators.partners
         SET status = $1, status_reason = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [status, reason || null, partnerId]
      );
    } catch (error: any) {
      console.error('Error updating partner status:', error);
      throw new Error(`Failed to update partner status: ${error.message}`);
    }
  }

  /**
   * Update partner
   */
  async updatePartner(
    partnerId: string,
    updates: Partial<CreatePartnerParams>
  ): Promise<void> {
    const pool = await this.getPool();

    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        setClauses.push(`name = $${paramIndex}`);
        values.push(updates.name);
        paramIndex++;
      }

      if (updates.businessName !== undefined) {
        setClauses.push(`business_name = $${paramIndex}`);
        values.push(updates.businessName);
        paramIndex++;
      }

      if (updates.phone !== undefined) {
        setClauses.push(`phone = $${paramIndex}`);
        values.push(updates.phone);
        paramIndex++;
      }

      if (updates.contactPerson !== undefined) {
        setClauses.push(`contact_person = $${paramIndex}`);
        values.push(updates.contactPerson);
        paramIndex++;
      }

      if (updates.baseRate !== undefined) {
        setClauses.push(`base_rate = $${paramIndex}`);
        values.push(updates.baseRate);
        paramIndex++;
      }

      if (updates.bankName !== undefined) {
        setClauses.push(`bank_name = $${paramIndex}`);
        values.push(updates.bankName);
        paramIndex++;
      }

      if (updates.accountNumber !== undefined) {
        setClauses.push(`account_number = $${paramIndex}`);
        values.push(updates.accountNumber);
        paramIndex++;
      }

      if (updates.accountName !== undefined) {
        setClauses.push(`account_name = $${paramIndex}`);
        values.push(updates.accountName);
        paramIndex++;
      }

      if (updates.bankCode !== undefined) {
        setClauses.push(`bank_code = $${paramIndex}`);
        values.push(updates.bankCode);
        paramIndex++;
      }

      if (updates.monthlyTarget !== undefined) {
        setClauses.push(`monthly_target = $${paramIndex}`);
        values.push(updates.monthlyTarget);
        paramIndex++;
      }

      if (updates.quarterlyBonus !== undefined) {
        setClauses.push(`quarterly_bonus = $${paramIndex}`);
        values.push(updates.quarterlyBonus);
        paramIndex++;
      }

      if (setClauses.length === 0) {
        return;
      }

      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(partnerId);

      await pool.query(
        `UPDATE aggregators.partners
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex}`,
        values
      );
    } catch (error: any) {
      console.error('Error updating partner:', error);
      throw new Error(`Failed to update partner: ${error.message}`);
    }
  }

  /**
   * Calculate compensation for partner
   */
  async calculateCompensation(
    partnerId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<{
    totalCompensation: number;
    referralCount: number;
    tierName: string;
  }> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{
        total_compensation: string;
        referral_count: number;
        tier_name: string;
      }>(
        `SELECT * FROM aggregators.calculate_compensation($1, $2, $3)`,
        [partnerId, periodStart, periodEnd]
      );

      const row = result.rows[0];

      return {
        totalCompensation: parseFloat(row.total_compensation),
        referralCount: row.referral_count,
        tierName: row.tier_name,
      };
    } catch (error: any) {
      console.error('Error calculating compensation:', error);
      throw new Error(`Failed to calculate compensation: ${error.message}`);
    }
  }

  /**
   * Generate monthly payouts for all partners
   */
  async generateMonthlyPayouts(year: number, month: number): Promise<number> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{ generate_monthly_payouts: number }>(
        `SELECT aggregators.generate_monthly_payouts($1, $2) as generate_monthly_payouts`,
        [year, month]
      );

      return result.rows[0].generate_monthly_payouts;
    } catch (error: any) {
      console.error('Error generating monthly payouts:', error);
      throw new Error(`Failed to generate monthly payouts: ${error.message}`);
    }
  }

  /**
   * Get partner payouts
   */
  async getPartnerPayouts(
    partnerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Payout[]> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<Payout>(
        `SELECT * FROM aggregators.payouts
         WHERE partner_id = $1
         ORDER BY period_end DESC
         LIMIT $2 OFFSET $3`,
        [partnerId, limit, offset]
      );

      return result.rows;
    } catch (error: any) {
      console.error('Error getting partner payouts:', error);
      throw new Error(`Failed to get partner payouts: ${error.message}`);
    }
  }

  /**
   * Get payout by ID
   */
  async getPayoutById(payoutId: string): Promise<Payout | null> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<Payout>(
        `SELECT * FROM aggregators.payouts WHERE id = $1`,
        [payoutId]
      );

      return result.rows[0] || null;
    } catch (error: any) {
      console.error('Error getting payout:', error);
      throw new Error(`Failed to get payout: ${error.message}`);
    }
  }

  /**
   * Approve payout
   */
  async approvePayout(
    payoutId: string,
    approvedBy: string,
    paymentReference?: string
  ): Promise<boolean> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{ approve_payout: boolean }>(
        `SELECT aggregators.approve_payout($1, $2, $3) as approve_payout`,
        [payoutId, approvedBy, paymentReference || null]
      );

      return result.rows[0].approve_payout;
    } catch (error: any) {
      console.error('Error approving payout:', error);
      throw new Error(`Failed to approve payout: ${error.message}`);
    }
  }

  /**
   * Reject payout
   */
  async rejectPayout(
    payoutId: string,
    rejectedBy: string,
    reason: string
  ): Promise<void> {
    const pool = await this.getPool();

    try {
      await pool.query(
        `UPDATE aggregators.payouts
         SET status = 'rejected',
             rejected_by = $1,
             rejected_at = CURRENT_TIMESTAMP,
             rejection_reason = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [rejectedBy, reason, payoutId]
      );
    } catch (error: any) {
      console.error('Error rejecting payout:', error);
      throw new Error(`Failed to reject payout: ${error.message}`);
    }
  }

  /**
   * Mark payout as paid
   */
  async markPayoutPaid(
    payoutId: string,
    paymentDate: Date,
    paymentReference: string
  ): Promise<void> {
    const pool = await this.getPool();

    try {
      await pool.query(
        `UPDATE aggregators.payouts
         SET status = 'paid',
             payment_date = $1,
             payment_reference = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [paymentDate, paymentReference, payoutId]
      );
    } catch (error: any) {
      console.error('Error marking payout as paid:', error);
      throw new Error(`Failed to mark payout as paid: ${error.message}`);
    }
  }

  /**
   * Get partner statistics
   */
  async getPartnerStats(partnerId: string): Promise<PartnerStats> {
    const pool = await this.getPool();

    try {
      // Get partner info
      const partner = await this.getPartnerById(partnerId);
      if (!partner) {
        throw new Error('Partner not found');
      }

      // Get current tier
      const tierResult = await pool.query<{ tier_name: string }>(
        `SELECT t.tier_name
         FROM aggregators.compensation_tiers t
         WHERE t.id = $1`,
        [partner.compensationTierId]
      );

      const currentTier = tierResult.rows[0]?.tier_name || 'Starter';

      // Get conversion rate
      const conversionRate = partner.totalReferrals > 0
        ? (partner.activeReferrals / partner.totalReferrals) * 100
        : 0;

      // Get this month's referrals
      const thisMonthResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM tenant.referrals
         WHERE referrer_id IN (
           SELECT id FROM tenant.users WHERE referral_code = $1
         )
         AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
        [partner.customCode]
      );

      const thisMonthReferrals = parseInt(thisMonthResult.rows[0].count);

      // Get last month's referrals
      const lastMonthResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM tenant.referrals
         WHERE referrer_id IN (
           SELECT id FROM tenant.users WHERE referral_code = $1
         )
         AND created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
         AND created_at < DATE_TRUNC('month', CURRENT_DATE)`,
        [partner.customCode]
      );

      const lastMonthReferrals = parseInt(lastMonthResult.rows[0].count);

      // Get referrals by month for last 12 months
      const monthlyResult = await pool.query<{ month: string; count: string }>(
        `SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count
         FROM tenant.referrals
         WHERE referrer_id IN (
           SELECT id FROM tenant.users WHERE referral_code = $1
         )
         AND created_at >= CURRENT_DATE - INTERVAL '12 months'
         GROUP BY TO_CHAR(created_at, 'YYYY-MM')
         ORDER BY month DESC`,
        [partner.customCode]
      );

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        currentTier,
        totalReferrals: partner.totalReferrals,
        activeReferrals: partner.activeReferrals,
        fundedReferrals: partner.fundedReferrals,
        pendingReferrals: partner.pendingReferrals,
        totalEarned: partner.totalCompensationEarned,
        totalPaid: partner.totalCompensationPaid,
        pendingAmount: partner.pendingCompensation,
        conversionRate,
        thisMonthReferrals,
        lastMonthReferrals,
        referralsByMonth: monthlyResult.rows.map(r => ({
          month: r.month,
          count: parseInt(r.count),
        })),
      };
    } catch (error: any) {
      console.error('Error getting partner stats:', error);
      throw new Error(`Failed to get partner stats: ${error.message}`);
    }
  }

  /**
   * Get all compensation tiers
   */
  async getCompensationTiers(): Promise<CompensationTier[]> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<CompensationTier>(
        `SELECT * FROM aggregators.compensation_tiers ORDER BY tier_level ASC`
      );

      return result.rows;
    } catch (error: any) {
      console.error('Error getting compensation tiers:', error);
      throw new Error(`Failed to get compensation tiers: ${error.message}`);
    }
  }

  /**
   * Get payouts by status
   */
  async getPayoutsByStatus(
    status: 'draft' | 'pending' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'cancelled',
    limit: number = 50,
    offset: number = 0
  ): Promise<Payout[]> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<Payout>(
        `SELECT * FROM aggregators.payouts
         WHERE status = $1
         ORDER BY period_end DESC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      );

      return result.rows;
    } catch (error: any) {
      console.error('Error getting payouts by status:', error);
      throw new Error(`Failed to get payouts by status: ${error.message}`);
    }
  }
}
