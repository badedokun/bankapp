/**
 * Loan Products Routes
 * Complete implementation of all 3 loan products from MidasTap requirements
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { query as dbQuery, transaction } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validateTenantAccess } from '../middleware/tenant';
import { asyncHandler, errors } from '../middleware/errorHandler';

const router = express.Router();

// Loan configuration based on MidasTap requirements
const LOAN_CONFIG = {
  personal: {
    minAmount: 10000,
    maxAmount: 5000000,
    interestRate: 15, // 15% per month
    serviceFee: 2, // 2% service fee
    tenureOptions: [30, 60, 90, 120, 180, 365], // Days
    requiredDocuments: ['valid_id', 'bank_statement', 'proof_of_income'],
    processingTime: 48, // Hours
  },
  business: {
    minAmount: 50000,
    maxAmount: 20000000,
    interestRate: 12, // 12% per month
    serviceFee: 2.5, // 2.5% service fee
    tenureOptions: [90, 180, 365, 730], // Days
    requiredDocuments: ['cac_certificate', 'bank_statement', 'business_plan', 'tax_clearance'],
    processingTime: 72, // Hours
  },
  quick: {
    firstTimerLimit: 2000, // First time borrowers
    maxLimit: 50000, // After successful repayments
    progressiveLimits: [2000, 5000, 10000, 20000, 50000], // Progressive increase
    interestRate: 20, // 20% per month (higher due to instant approval)
    serviceFee: 3, // 3% service fee
    maxTenure: 30, // 30 days maximum
    instantApproval: true,
    latePaymentFee: 3.5, // 3.5% daily after due date
  }
};

// Helper function to calculate loan eligibility based on transaction history
async function calculateEligibility(userId: string, tenantId: string, loanType: string) {
  // Get user's transaction history
  const transactionHistory = await dbQuery(`
    SELECT
      COUNT(*) as total_transactions,
      AVG(amount) as avg_transaction,
      MAX(amount) as max_transaction,
      MIN(created_at) as first_transaction
    FROM tenant.transactions
    WHERE user_id = $1 AND tenant_id = $2 AND status = 'completed'
  `, [userId, tenantId]);

  // Get user's loan repayment history
  const repaymentHistory = await dbQuery(`
    SELECT
      COUNT(*) as total_loans,
      COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_loans,
      COUNT(CASE WHEN status = 'defaulted' THEN 1 END) as defaulted_loans
    FROM tenant.loans
    WHERE user_id = $1 AND tenant_id = $2
  `, [userId, tenantId]);

  const stats = transactionHistory.rows[0];
  const loanStats = repaymentHistory.rows[0];

  // Calculate eligibility score
  let eligibilityScore = 0;
  let maxLoanAmount = 0;

  if (loanType === 'quick') {
    // Quick loan eligibility based on repayment history
    if (loanStats.defaulted_loans > 0) {
      return { eligible: false, reason: 'Previous loan default', maxAmount: 0 };
    }

    const loanLevel = Math.min(loanStats.paid_loans, LOAN_CONFIG.quick.progressiveLimits.length - 1);
    maxLoanAmount = LOAN_CONFIG.quick.progressiveLimits[loanLevel];
    eligibilityScore = loanStats.paid_loans > 0 ? 80 : 60;

  } else if (loanType === 'personal') {
    // Personal loan eligibility based on transaction volume
    const monthsActive = stats.first_transaction ?
      Math.floor((Date.now() - new Date(stats.first_transaction).getTime()) / (30 * 24 * 60 * 60 * 1000)) : 0;

    if (monthsActive < 3) {
      return { eligible: false, reason: 'Account must be active for at least 3 months', maxAmount: 0 };
    }

    maxLoanAmount = Math.min(stats.avg_transaction * 10, LOAN_CONFIG.personal.maxAmount);
    eligibilityScore = Math.min((monthsActive * 10) + (stats.total_transactions), 100);

  } else if (loanType === 'business') {
    // Business loan requires higher transaction volume
    if (stats.total_transactions < 50) {
      return { eligible: false, reason: 'Insufficient business transaction history', maxAmount: 0 };
    }

    maxLoanAmount = Math.min(stats.avg_transaction * 20, LOAN_CONFIG.business.maxAmount);
    eligibilityScore = Math.min((stats.total_transactions / 5) + 50, 100);
  }

  return {
    eligible: eligibilityScore >= 60,
    eligibilityScore,
    maxAmount: Math.floor(maxLoanAmount),
    reason: eligibilityScore < 60 ? 'Eligibility score too low' : null
  };
}

/**
 * POST /api/loans/personal/apply
 * Apply for a personal loan
 */
router.post('/personal/apply',
  authenticateToken,
  validateTenantAccess,
  [
    body('amount').isFloat({
      min: LOAN_CONFIG.personal.minAmount,
      max: LOAN_CONFIG.personal.maxAmount
    }).withMessage(`Amount must be between ₦${LOAN_CONFIG.personal.minAmount} and ₦${LOAN_CONFIG.personal.maxAmount}`),
    body('tenure').isIn(LOAN_CONFIG.personal.tenureOptions)
      .withMessage('Invalid tenure period'),
    body('purpose').notEmpty().withMessage('Loan purpose is required'),
    body('employmentStatus').isIn(['employed', 'self-employed', 'business-owner'])
      .withMessage('Employment status is required'),
    body('monthlyIncome').isFloat({ min: 30000 })
      .withMessage('Monthly income must be at least ₦30,000'),
  ],
  asyncHandler(async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { amount, tenure, purpose, employmentStatus, monthlyIncome } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    // Check eligibility
    const eligibility = await calculateEligibility(userId, tenantId, 'personal');
    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason
      });
    }

    if (amount > eligibility.maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Maximum eligible amount is ₦${eligibility.maxAmount.toLocaleString()}`
      });
    }

    await transaction(async (client: any) => {
      // Calculate loan details
      const interestAmount = (amount * LOAN_CONFIG.personal.interestRate / 100) * (tenure / 30);
      const serviceFee = amount * LOAN_CONFIG.personal.serviceFee / 100;
      const totalRepayment = amount + interestAmount + serviceFee;
      const monthlyRepayment = totalRepayment / (tenure / 30);

      // Create loan application
      const loanResult = await client.query(`
        INSERT INTO tenant.loans (
          tenant_id, user_id, loan_type, amount, interest_rate,
          interest_amount, service_fee, total_repayment, monthly_repayment,
          tenure_days, purpose, employment_status, monthly_income,
          eligibility_score, status, applied_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        RETURNING *
      `, [
        tenantId, userId, 'personal', amount, LOAN_CONFIG.personal.interestRate,
        interestAmount, serviceFee, totalRepayment, monthlyRepayment,
        tenure, purpose, employmentStatus, monthlyIncome,
        eligibility.eligibilityScore, 'pending'
      ]);

      res.json({
        success: true,
        data: {
          loanId: loanResult.rows[0].id,
          amount,
          interestAmount,
          serviceFee,
          totalRepayment,
          monthlyRepayment,
          status: 'pending',
          message: 'Your loan application has been submitted and is under review'
        }
      });
    });
  })
);

/**
 * GET /api/loans/personal/eligibility
 * Check personal loan eligibility
 */
router.get('/personal/eligibility',
  authenticateToken,
  validateTenantAccess,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const eligibility = await calculateEligibility(userId, tenantId, 'personal');

    res.json({
      success: true,
      data: {
        eligible: eligibility.eligible,
        maxAmount: eligibility.maxAmount,
        eligibilityScore: eligibility.eligibilityScore,
        interestRate: LOAN_CONFIG.personal.interestRate,
        serviceFee: LOAN_CONFIG.personal.serviceFee,
        tenureOptions: LOAN_CONFIG.personal.tenureOptions,
        requiredDocuments: LOAN_CONFIG.personal.requiredDocuments,
        reason: eligibility.reason
      }
    });
  })
);

/**
 * GET /api/loans/personal/offers
 * Get personalized loan offers
 */
router.get('/personal/offers',
  authenticateToken,
  validateTenantAccess,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const eligibility = await calculateEligibility(userId, tenantId, 'personal');

    if (!eligibility.eligible) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Generate loan offers based on eligibility
    const offers = LOAN_CONFIG.personal.tenureOptions.map(tenure => {
      const amounts = [
        eligibility.maxAmount * 0.3,
        eligibility.maxAmount * 0.6,
        eligibility.maxAmount
      ].filter(amt => amt >= LOAN_CONFIG.personal.minAmount);

      return amounts.map(amount => {
        const interestAmount = (amount * LOAN_CONFIG.personal.interestRate / 100) * (tenure / 30);
        const serviceFee = amount * LOAN_CONFIG.personal.serviceFee / 100;
        const totalRepayment = amount + interestAmount + serviceFee;
        const monthlyRepayment = totalRepayment / (tenure / 30);

        return {
          amount: Math.floor(amount),
          tenure,
          interestRate: LOAN_CONFIG.personal.interestRate,
          interestAmount: Math.floor(interestAmount),
          serviceFee: Math.floor(serviceFee),
          totalRepayment: Math.floor(totalRepayment),
          monthlyRepayment: Math.floor(monthlyRepayment)
        };
      });
    }).flat();

    res.json({
      success: true,
      data: offers
    });
  })
);

/**
 * POST /api/loans/business/apply
 * Apply for a business loan
 */
router.post('/business/apply',
  authenticateToken,
  validateTenantAccess,
  [
    body('amount').isFloat({
      min: LOAN_CONFIG.business.minAmount,
      max: LOAN_CONFIG.business.maxAmount
    }).withMessage(`Amount must be between ₦${LOAN_CONFIG.business.minAmount} and ₦${LOAN_CONFIG.business.maxAmount}`),
    body('tenure').isIn(LOAN_CONFIG.business.tenureOptions)
      .withMessage('Invalid tenure period'),
    body('businessName').notEmpty().withMessage('Business name is required'),
    body('businessType').notEmpty().withMessage('Business type is required'),
    body('yearsInBusiness').isInt({ min: 1 })
      .withMessage('Business must be at least 1 year old'),
    body('monthlyRevenue').isFloat({ min: 100000 })
      .withMessage('Monthly revenue must be at least ₦100,000'),
  ],
  asyncHandler(async (req: any, res: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      amount, tenure, businessName, businessType,
      yearsInBusiness, monthlyRevenue
    } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    // Check eligibility
    const eligibility = await calculateEligibility(userId, tenantId, 'business');
    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason
      });
    }

    await transaction(async (client: any) => {
      // Calculate loan details
      const interestAmount = (amount * LOAN_CONFIG.business.interestRate / 100) * (tenure / 30);
      const serviceFee = amount * LOAN_CONFIG.business.serviceFee / 100;
      const totalRepayment = amount + interestAmount + serviceFee;
      const monthlyRepayment = totalRepayment / (tenure / 30);

      // Create loan application
      const loanResult = await client.query(`
        INSERT INTO tenant.loans (
          tenant_id, user_id, loan_type, amount, interest_rate,
          interest_amount, service_fee, total_repayment, monthly_repayment,
          tenure_days, business_name, business_type, years_in_business,
          monthly_revenue, eligibility_score, status, applied_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        RETURNING *
      `, [
        tenantId, userId, 'business', amount, LOAN_CONFIG.business.interestRate,
        interestAmount, serviceFee, totalRepayment, monthlyRepayment,
        tenure, businessName, businessType, yearsInBusiness,
        monthlyRevenue, eligibility.eligibilityScore, 'pending'
      ]);

      res.json({
        success: true,
        data: {
          loanId: loanResult.rows[0].id,
          amount,
          interestAmount,
          serviceFee,
          totalRepayment,
          monthlyRepayment,
          status: 'pending',
          processingTime: LOAN_CONFIG.business.processingTime,
          message: 'Your business loan application has been submitted'
        }
      });
    });
  })
);

/**
 * POST /api/loans/business/documents
 * Upload business loan documents
 */
router.post('/business/documents',
  authenticateToken,
  validateTenantAccess,
  [
    body('loanId').notEmpty().withMessage('Loan ID is required'),
    body('documentType').isIn(LOAN_CONFIG.business.requiredDocuments)
      .withMessage('Invalid document type'),
    body('documentData').notEmpty().withMessage('Document data is required'),
  ],
  asyncHandler(async (req: any, res: any) => {
    const { loanId, documentType, documentData } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    // Verify loan ownership
    const loanCheck = await dbQuery(
      'SELECT id FROM tenant.loans WHERE id = $1 AND user_id = $2 AND tenant_id = $3',
      [loanId, userId, tenantId]
    );

    if (!loanCheck.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    // Store document reference (simplified - would normally upload to cloud storage)
    await dbQuery(`
      INSERT INTO tenant.loan_documents (
        loan_id, document_type, document_url, uploaded_at
      ) VALUES ($1, $2, $3, NOW())
      ON CONFLICT (loan_id, document_type)
      DO UPDATE SET document_url = $3, uploaded_at = NOW()
    `, [loanId, documentType, documentData]);

    res.json({
      success: true,
      message: 'Document uploaded successfully'
    });
  })
);

/**
 * GET /api/loans/business/status
 * Check business loan application status
 */
router.get('/business/status/:loanId',
  authenticateToken,
  validateTenantAccess,
  asyncHandler(async (req: any, res: any) => {
    const { loanId } = req.params;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const loan = await dbQuery(`
      SELECT
        l.*,
        COUNT(ld.id) as documents_uploaded,
        ARRAY_AGG(ld.document_type) as uploaded_documents
      FROM tenant.loans l
      LEFT JOIN tenant.loan_documents ld ON l.id = ld.loan_id
      WHERE l.id = $1 AND l.user_id = $2 AND l.tenant_id = $3
      GROUP BY l.id
    `, [loanId, userId, tenantId]);

    if (!loan.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'Loan application not found'
      });
    }

    const loanData = loan.rows[0];
    const missingDocuments = LOAN_CONFIG.business.requiredDocuments.filter(
      doc => !loanData.uploaded_documents?.includes(doc)
    );

    res.json({
      success: true,
      data: {
        ...loanData,
        missingDocuments,
        documentsComplete: missingDocuments.length === 0
      }
    });
  })
);

/**
 * POST /api/loans/quick/instant
 * Get instant quick loan
 */
router.post('/quick/instant',
  authenticateToken,
  validateTenantAccess,
  [
    body('amount').isFloat({ min: 100 })
      .withMessage('Minimum amount is ₦100'),
    body('pin').matches(/^\d{4}$/).withMessage('Invalid PIN format'),
  ],
  asyncHandler(async (req: any, res: any) => {
    const { amount, pin } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    // Verify PIN (simplified - should check against hashed PIN)
    const userPin = await dbQuery(
      'SELECT transaction_pin FROM tenant.users WHERE id = $1',
      [userId]
    );

    if (!userPin.rows[0] || userPin.rows[0].transaction_pin !== pin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid transaction PIN'
      });
    }

    // Check eligibility
    const eligibility = await calculateEligibility(userId, tenantId, 'quick');
    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason
      });
    }

    if (amount > eligibility.maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Your current limit is ₦${eligibility.maxAmount.toLocaleString()}`
      });
    }

    // Check for outstanding quick loans
    const outstandingLoans = await dbQuery(`
      SELECT COUNT(*) as count
      FROM tenant.loans
      WHERE user_id = $1 AND loan_type = 'quick'
      AND status IN ('approved', 'disbursed')
    `, [userId]);

    if (outstandingLoans.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have an outstanding quick loan'
      });
    }

    await transaction(async (client: any) => {
      // Calculate loan details
      const tenure = LOAN_CONFIG.quick.maxTenure;
      const interestAmount = amount * LOAN_CONFIG.quick.interestRate / 100;
      const serviceFee = amount * LOAN_CONFIG.quick.serviceFee / 100;
      const totalRepayment = amount + interestAmount + serviceFee;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + tenure);

      // Create and instantly approve loan
      const loanResult = await client.query(`
        INSERT INTO tenant.loans (
          tenant_id, user_id, loan_type, amount, interest_rate,
          interest_amount, service_fee, total_repayment,
          tenure_days, due_date, eligibility_score,
          status, applied_at, approved_at, disbursed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW(), NOW())
        RETURNING *
      `, [
        tenantId, userId, 'quick', amount, LOAN_CONFIG.quick.interestRate,
        interestAmount, serviceFee, totalRepayment,
        tenure, dueDate, eligibility.eligibilityScore, 'disbursed'
      ]);

      // Credit wallet immediately
      await client.query(
        'UPDATE tenant.wallets SET balance = balance + $1 WHERE user_id = $2 AND tenant_id = $3',
        [amount, userId, tenantId]
      );

      // Record transaction
      await client.query(`
        INSERT INTO tenant.transactions (
          tenant_id, user_id, type, amount, description, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        tenantId, userId, 'loan_disbursement', amount,
        'Quick loan disbursement', 'completed'
      ]);

      res.json({
        success: true,
        data: {
          loanId: loanResult.rows[0].id,
          amount,
          totalRepayment,
          dueDate,
          message: `₦${amount.toLocaleString()} has been credited to your wallet`
        }
      });
    });
  })
);

/**
 * GET /api/loans/quick/limit
 * Check quick loan limit
 */
router.get('/quick/limit',
  authenticateToken,
  validateTenantAccess,
  asyncHandler(async (req: any, res: any) => {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const eligibility = await calculateEligibility(userId, tenantId, 'quick');

    // Get loan history
    const loanHistory = await dbQuery(`
      SELECT
        COUNT(*) as total_loans,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_loans,
        MAX(amount) as highest_loan
      FROM tenant.loans
      WHERE user_id = $1 AND loan_type = 'quick'
    `, [userId]);

    res.json({
      success: true,
      data: {
        currentLimit: eligibility.maxAmount,
        eligible: eligibility.eligible,
        nextLimit: eligibility.maxAmount < LOAN_CONFIG.quick.maxLimit ?
          LOAN_CONFIG.quick.progressiveLimits[
            LOAN_CONFIG.quick.progressiveLimits.indexOf(eligibility.maxAmount) + 1
          ] || LOAN_CONFIG.quick.maxLimit : null,
        loansRepaid: loanHistory.rows[0].paid_loans || 0,
        highestLoan: loanHistory.rows[0].highest_loan || 0,
        interestRate: LOAN_CONFIG.quick.interestRate,
        maxTenure: LOAN_CONFIG.quick.maxTenure
      }
    });
  })
);

/**
 * POST /api/loans/quick/repay
 * Repay quick loan
 */
router.post('/quick/repay',
  authenticateToken,
  validateTenantAccess,
  [
    body('loanId').notEmpty().withMessage('Loan ID is required'),
    body('amount').optional().isFloat({ min: 100 }),
  ],
  asyncHandler(async (req: any, res: any) => {
    const { loanId, amount } = req.body;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    await transaction(async (client: any) => {
      // Get loan details
      const loan = await client.query(`
        SELECT * FROM tenant.loans
        WHERE id = $1 AND user_id = $2 AND loan_type = 'quick'
        AND status = 'disbursed'
      `, [loanId, userId]);

      if (!loan.rows[0]) {
        throw new Error('Active quick loan not found');
      }

      const loanData = loan.rows[0];
      const repaymentAmount = amount || loanData.total_repayment;

      // Check if overdue and calculate late fees
      const daysOverdue = Math.max(0,
        Math.floor((Date.now() - new Date(loanData.due_date).getTime()) / (24 * 60 * 60 * 1000))
      );
      const lateFees = daysOverdue * (loanData.amount * LOAN_CONFIG.quick.latePaymentFee / 100);
      const totalDue = loanData.total_repayment + lateFees;

      if (repaymentAmount < totalDue) {
        throw new Error(`Total amount due is ₦${totalDue.toLocaleString()} (includes late fees)`);
      }

      // Check wallet balance
      const wallet = await client.query(
        'SELECT balance FROM tenant.wallets WHERE user_id = $1 AND tenant_id = $2',
        [userId, tenantId]
      );

      if (!wallet.rows[0] || wallet.rows[0].balance < repaymentAmount) {
        throw new Error('Insufficient wallet balance');
      }

      // Process repayment
      await client.query(
        'UPDATE tenant.wallets SET balance = balance - $1 WHERE user_id = $2 AND tenant_id = $3',
        [repaymentAmount, userId, tenantId]
      );

      await client.query(
        'UPDATE tenant.loans SET status = $1, repaid_at = NOW(), late_fees = $2 WHERE id = $3',
        ['paid', lateFees, loanId]
      );

      // Record transaction
      await client.query(`
        INSERT INTO tenant.transactions (
          tenant_id, user_id, type, amount, description, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        tenantId, userId, 'loan_repayment', repaymentAmount,
        `Quick loan repayment${daysOverdue > 0 ? ' (includes late fees)' : ''}`, 'completed'
      ]);

      res.json({
        success: true,
        message: 'Loan repaid successfully',
        data: {
          repaidAmount: repaymentAmount,
          lateFees,
          daysOverdue
        }
      });
    });
  })
);

export default router;