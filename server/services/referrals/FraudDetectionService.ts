/**
 * ============================================================================
 * FRAUD DETECTION SERVICE
 * ============================================================================
 * Purpose: Detect and prevent referral fraud
 * Created: October 5, 2025
 * Phase: 2 - Backend Services
 * ============================================================================
 */

import { Pool } from 'pg';
import { getTenantPool } from '../../config/database';

export interface FraudCheckResult {
  isFraudRisk: boolean;
  riskReason: string;
  riskScore: number; // 0-100
  blockedReasons: string[];
}

export interface RateLimitCheck {
  withinLimits: boolean;
  limitType: string;
  currentCount: number;
  limitValue: number;
}

export interface DeviceFingerprintCheck {
  deviceFingerprint: string;
  matchCount: number;
  isExceeded: boolean;
  matchedUsers: string[];
}

export interface IPAddressCheck {
  ipAddress: string;
  matchCount: number;
  isExceeded: boolean;
  matchedUsers: string[];
}

export class FraudDetectionService {
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
   * Comprehensive fraud check
   */
  async checkFraudRisk(
    referrerId: string,
    refereeId: string,
    deviceFingerprint?: string,
    ipAddress?: string
  ): Promise<FraudCheckResult> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{
        is_fraud_risk: boolean;
        risk_reason: string;
        risk_score: number;
      }>(
        `SELECT * FROM rewards.check_fraud_risk($1, $2, $3, $4, $5)`,
        [referrerId, refereeId, deviceFingerprint || null, ipAddress || null, this.tenantId]
      );

      const row = result.rows[0];

      const blockedReasons: string[] = [];
      if (row.is_fraud_risk) {
        blockedReasons.push(row.risk_reason);
      }

      return {
        isFraudRisk: row.is_fraud_risk,
        riskReason: row.risk_reason,
        riskScore: row.risk_score,
        blockedReasons,
      };
    } catch (error: any) {
      console.error('Error checking fraud risk:', error);
      throw new Error(`Failed to check fraud risk: ${error.message}`);
    }
  }

  /**
   * Check if user has exceeded referral limits
   */
  async checkRateLimits(userId: string): Promise<RateLimitCheck> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{
        within_limits: boolean;
        limit_type: string;
        current_count: number;
        limit_value: number;
      }>(
        `SELECT * FROM rewards.check_referral_limits($1, $2)`,
        [userId, this.tenantId]
      );

      const row = result.rows[0];

      return {
        withinLimits: row.within_limits,
        limitType: row.limit_type,
        currentCount: row.current_count,
        limitValue: row.limit_value,
      };
    } catch (error: any) {
      console.error('Error checking rate limits:', error);
      throw new Error(`Failed to check rate limits: ${error.message}`);
    }
  }

  /**
   * Check for circular referrals (A refers B, B refers A)
   */
  async checkCircularReferral(referrerId: string, refereeId: string): Promise<boolean> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{ exists: boolean }>(
        `SELECT EXISTS(
          SELECT 1 FROM tenant.referrals
          WHERE referrer_id = $1 AND referee_id = $2
        ) as exists`,
        [refereeId, referrerId]
      );

      return result.rows[0].exists;
    } catch (error: any) {
      console.error('Error checking circular referral:', error);
      throw new Error(`Failed to check circular referral: ${error.message}`);
    }
  }

  /**
   * Check device fingerprint for duplicates
   */
  async checkDeviceFingerprint(
    deviceFingerprint: string,
    maxAllowed: number = 3
  ): Promise<DeviceFingerprintCheck> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{ referrer_id: string }>(
        `SELECT DISTINCT referrer_id
         FROM tenant.referrals
         WHERE device_fingerprint = $1
           AND device_fingerprint IS NOT NULL`,
        [deviceFingerprint]
      );

      const matchedUsers = result.rows.map(r => r.referrer_id);
      const matchCount = matchedUsers.length;

      return {
        deviceFingerprint,
        matchCount,
        isExceeded: matchCount > maxAllowed,
        matchedUsers,
      };
    } catch (error: any) {
      console.error('Error checking device fingerprint:', error);
      throw new Error(`Failed to check device fingerprint: ${error.message}`);
    }
  }

  /**
   * Check IP address for duplicates
   */
  async checkIPAddress(ipAddress: string, maxAllowed: number = 5): Promise<IPAddressCheck> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{ referrer_id: string }>(
        `SELECT DISTINCT referrer_id
         FROM tenant.referrals
         WHERE ip_address = $1
           AND ip_address IS NOT NULL`,
        [ipAddress]
      );

      const matchedUsers = result.rows.map(r => r.referrer_id);
      const matchCount = matchedUsers.length;

      return {
        ipAddress,
        matchCount,
        isExceeded: matchCount > maxAllowed,
        matchedUsers,
      };
    } catch (error: any) {
      console.error('Error checking IP address:', error);
      throw new Error(`Failed to check IP address: ${error.message}`);
    }
  }

  /**
   * Check velocity (rapid referrals in short time)
   */
  async checkVelocity(
    userId: string,
    timeWindowMinutes: number = 60,
    maxReferrals: number = 3
  ): Promise<{
    isExceeded: boolean;
    currentCount: number;
    maxAllowed: number;
  }> {
    const pool = await this.getPool();

    try {
      const result = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM tenant.referrals
         WHERE referrer_id = $1
           AND created_at >= CURRENT_TIMESTAMP - ($2 || ' minutes')::INTERVAL`,
        [userId, timeWindowMinutes]
      );

      const currentCount = parseInt(result.rows[0].count);

      return {
        isExceeded: currentCount >= maxReferrals,
        currentCount,
        maxAllowed: maxReferrals,
      };
    } catch (error: any) {
      console.error('Error checking velocity:', error);
      throw new Error(`Failed to check velocity: ${error.message}`);
    }
  }

  /**
   * Flag referral as fraud
   */
  async flagReferralAsFraud(
    referralId: string,
    reason: string,
    flaggedBy?: string
  ): Promise<void> {
    const pool = await this.getPool();

    try {
      await pool.query(
        `UPDATE tenant.referrals
         SET bonus_status = 'fraud_flagged',
             eligibility_notes = $1,
             updated_at = CURRENT_TIMESTAMP,
             metadata = metadata || jsonb_build_object(
               'fraud_flagged_at', CURRENT_TIMESTAMP::text,
               'fraud_flagged_by', $2,
               'fraud_reason', $1
             )
         WHERE id = $3`,
        [reason, flaggedBy || 'system', referralId]
      );
    } catch (error: any) {
      console.error('Error flagging referral as fraud:', error);
      throw new Error(`Failed to flag referral as fraud: ${error.message}`);
    }
  }

  /**
   * Get fraud statistics
   */
  async getFraudStats(): Promise<{
    totalReferrals: number;
    fraudFlagged: number;
    fraudRate: number;
    circularReferrals: number;
    velocityViolations: number;
    deviceDuplicates: number;
    ipDuplicates: number;
  }> {
    const pool = await this.getPool();

    try {
      const totalResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM tenant.referrals`
      );

      const fraudResult = await pool.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM tenant.referrals WHERE bonus_status = 'fraud_flagged'`
      );

      const circularResult = await pool.query<{ count: string }>(
        `SELECT COUNT(DISTINCT r1.id) as count
         FROM tenant.referrals r1
         INNER JOIN tenant.referrals r2
           ON r1.referrer_id = r2.referee_id
           AND r1.referee_id = r2.referrer_id
         WHERE r1.id < r2.id`
      );

      const velocityResult = await pool.query<{ count: string }>(
        `SELECT COUNT(DISTINCT referrer_id) as count
         FROM (
           SELECT referrer_id, created_at,
                  created_at - LAG(created_at) OVER (PARTITION BY referrer_id ORDER BY created_at) as time_diff
           FROM tenant.referrals
         ) subq
         WHERE time_diff < INTERVAL '20 minutes'`
      );

      const deviceResult = await pool.query<{ count: string }>(
        `SELECT COUNT(DISTINCT device_fingerprint) as count
         FROM tenant.referrals
         WHERE device_fingerprint IN (
           SELECT device_fingerprint
           FROM tenant.referrals
           WHERE device_fingerprint IS NOT NULL
           GROUP BY device_fingerprint
           HAVING COUNT(DISTINCT referrer_id) > 3
         )`
      );

      const ipResult = await pool.query<{ count: string }>(
        `SELECT COUNT(DISTINCT ip_address) as count
         FROM tenant.referrals
         WHERE ip_address IN (
           SELECT ip_address
           FROM tenant.referrals
           WHERE ip_address IS NOT NULL
           GROUP BY ip_address
           HAVING COUNT(DISTINCT referrer_id) > 5
         )`
      );

      const totalReferrals = parseInt(totalResult.rows[0].count);
      const fraudFlagged = parseInt(fraudResult.rows[0].count);

      return {
        totalReferrals,
        fraudFlagged,
        fraudRate: totalReferrals > 0 ? (fraudFlagged / totalReferrals) * 100 : 0,
        circularReferrals: parseInt(circularResult.rows[0].count),
        velocityViolations: parseInt(velocityResult.rows[0].count),
        deviceDuplicates: parseInt(deviceResult.rows[0].count),
        ipDuplicates: parseInt(ipResult.rows[0].count),
      };
    } catch (error: any) {
      console.error('Error getting fraud stats:', error);
      throw new Error(`Failed to get fraud stats: ${error.message}`);
    }
  }

  /**
   * Get suspicious referrals for manual review
   */
  async getSuspiciousReferrals(limit: number = 50, offset: number = 0): Promise<Array<{
    referralId: string;
    referrerId: string;
    refereeId: string;
    suspicionReasons: string[];
    riskScore: number;
    createdAt: Date;
  }>> {
    const pool = await this.getPool();

    try {
      // Get referrals with duplicate devices or IPs
      const result = await pool.query<{
        id: string;
        referrer_id: string;
        referee_id: string;
        device_fingerprint: string | null;
        ip_address: string | null;
        created_at: Date;
      }>(
        `SELECT r.*
         FROM tenant.referrals r
         WHERE r.bonus_status NOT IN ('fraud_flagged', 'cancelled')
           AND (
             r.device_fingerprint IN (
               SELECT device_fingerprint
               FROM tenant.referrals
               WHERE device_fingerprint IS NOT NULL
               GROUP BY device_fingerprint
               HAVING COUNT(DISTINCT referrer_id) > 2
             )
             OR r.ip_address IN (
               SELECT ip_address
               FROM tenant.referrals
               WHERE ip_address IS NOT NULL
               GROUP BY ip_address
               HAVING COUNT(DISTINCT referrer_id) > 3
             )
           )
         ORDER BY r.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const suspicious = await Promise.all(
        result.rows.map(async (row) => {
          const reasons: string[] = [];
          let riskScore = 0;

          // Check device duplicates
          if (row.device_fingerprint) {
            const deviceCheck = await this.checkDeviceFingerprint(row.device_fingerprint, 2);
            if (deviceCheck.isExceeded) {
              reasons.push(`Device fingerprint matched ${deviceCheck.matchCount} times`);
              riskScore += 30;
            }
          }

          // Check IP duplicates
          if (row.ip_address) {
            const ipCheck = await this.checkIPAddress(row.ip_address, 3);
            if (ipCheck.isExceeded) {
              reasons.push(`IP address matched ${ipCheck.matchCount} times`);
              riskScore += 25;
            }
          }

          // Check circular
          const isCircular = await this.checkCircularReferral(row.referrer_id, row.referee_id);
          if (isCircular) {
            reasons.push('Circular referral detected');
            riskScore += 45;
          }

          return {
            referralId: row.id,
            referrerId: row.referrer_id,
            refereeId: row.referee_id,
            suspicionReasons: reasons,
            riskScore: Math.min(riskScore, 100),
            createdAt: row.created_at,
          };
        })
      );

      // Filter out items with no suspicion reasons
      return suspicious.filter(s => s.suspicionReasons.length > 0);
    } catch (error: any) {
      console.error('Error getting suspicious referrals:', error);
      throw new Error(`Failed to get suspicious referrals: ${error.message}`);
    }
  }

  /**
   * Validate referral before creation
   */
  async validateReferralCreation(
    referrerId: string,
    refereeId: string,
    deviceFingerprint?: string,
    ipAddress?: string
  ): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check self-referral
      if (referrerId === refereeId) {
        errors.push('Self-referral is not allowed');
        return { isValid: false, errors };
      }

      // Check circular referral
      const isCircular = await this.checkCircularReferral(referrerId, refereeId);
      if (isCircular) {
        errors.push('Circular referral detected');
      }

      // Check rate limits
      const rateLimit = await this.checkRateLimits(referrerId);
      if (!rateLimit.withinLimits) {
        errors.push(`${rateLimit.limitType} limit exceeded: ${rateLimit.currentCount}/${rateLimit.limitValue}`);
      }

      // Check velocity
      const velocity = await this.checkVelocity(referrerId, 60, 3);
      if (velocity.isExceeded) {
        errors.push(`Velocity limit exceeded: ${velocity.currentCount} referrals in last hour`);
      }

      // Check device fingerprint
      if (deviceFingerprint) {
        const deviceCheck = await this.checkDeviceFingerprint(deviceFingerprint);
        if (deviceCheck.isExceeded) {
          errors.push(`Device fingerprint matched ${deviceCheck.matchCount} times (max: 3)`);
        }
      }

      // Check IP address
      if (ipAddress) {
        const ipCheck = await this.checkIPAddress(ipAddress);
        if (ipCheck.isExceeded) {
          errors.push(`IP address matched ${ipCheck.matchCount} times (max: 5)`);
        }
      }

      // Check comprehensive fraud risk
      const fraudCheck = await this.checkFraudRisk(referrerId, refereeId, deviceFingerprint, ipAddress);
      if (fraudCheck.isFraudRisk && fraudCheck.riskScore >= 50) {
        errors.push(`High fraud risk detected: ${fraudCheck.riskReason}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error: any) {
      console.error('Error validating referral creation:', error);
      throw new Error(`Failed to validate referral creation: ${error.message}`);
    }
  }
}
