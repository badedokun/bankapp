/**
 * PCI DSS Compliance API Routes
 * Handles Payment Card Industry Data Security Standard compliance endpoints
 * 
 * Routes for compliance status, assessments, vulnerability scans, and reporting
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import PCIDSSComplianceService from '../services/pci-dss-compliance';

const router = express.Router();
const pciCompliance = new PCIDSSComplianceService();

// Validation middleware
const validateAssessmentRequest = [
  body('assessmentType')
    .isIn(['self_assessment', 'internal_scan', 'external_scan', 'penetration_test'])
    .withMessage('Invalid assessment type'),
  body('scope')
    .isArray()
    .withMessage('Scope must be an array'),
  validateRequest
];

const validateVulnerabilityReport = [
  body('scanType')
    .isIn(['internal', 'external', 'network', 'application'])
    .withMessage('Invalid scan type'),
  body('findings')
    .isArray()
    .withMessage('Findings must be an array'),
  validateRequest
];

/**
 * GET /api/pci-dss-compliance/status
 * Get current PCI DSS compliance status
 */
router.get('/status',
  authenticateToken,
  requireRole(['admin', 'compliance_officer', 'security_officer', 'auditor']),
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;

      const dashboard = await pciCompliance.getPCIDSSDashboard(tenantId);
      const status = dashboard.summary;

      res.json({
        success: true,
        data: status,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error fetching PCI DSS compliance status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch PCI DSS compliance status',
        code: 'PCI_STATUS_ERROR'
      });
    }
  }
);

/**
 * GET /api/pci-dss-compliance/dashboard
 * Get comprehensive PCI DSS compliance dashboard
 */
router.get('/dashboard',
  authenticateToken,
  requireRole(['admin', 'compliance_officer', 'security_officer', 'auditor']),
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;

      const dashboard = await pciCompliance.getPCIDSSDashboard(tenantId);

      // Add PCI DSS context
      dashboard.standards = {
        version: 'PCI DSS v4.0',
        requirements: [
          'Requirement 1: Install and maintain network security controls',
          'Requirement 2: Apply secure configurations to all system components',
          'Requirement 3: Protect stored account data',
          'Requirement 4: Protect cardholder data with strong cryptography',
          'Requirement 5: Protect all systems and networks from malicious software',
          'Requirement 6: Develop and maintain secure systems and software',
          'Requirement 7: Restrict access to system components and cardholder data',
          'Requirement 8: Identify users and authenticate access to system components',
          'Requirement 9: Restrict physical access to cardholder data',
          'Requirement 10: Log and monitor all access to system components',
          'Requirement 11: Test security of systems and networks regularly',
          'Requirement 12: Support information security with organizational policies'
        ],
        levels: {
          'Level 1': 'Merchants processing over 6 million card transactions annually',
          'Level 2': 'Merchants processing 1-6 million transactions annually',
          'Level 3': 'Merchants processing 20,000-1 million e-commerce transactions annually',
          'Level 4': 'All other merchants processing fewer than 20,000 e-commerce transactions annually'
        }
      };

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      console.error('Error fetching PCI DSS compliance dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch PCI DSS compliance dashboard',
        code: 'PCI_DASHBOARD_ERROR'
      });
    }
  }
);

/**
 * POST /api/pci-dss-compliance/assessments
 * Create new PCI DSS assessment
 */
router.post('/assessments',
  authenticateToken,
  requireRole(['admin', 'compliance_officer', 'security_officer']),
  validateAssessmentRequest,
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;
      const { assessmentType, scope } = req.body;

      const assessment = await pciCompliance.initializePCIDSSAssessment(
        tenantId,
        1 // Default merchant level
      );

      res.status(201).json({
        success: true,
        message: 'PCI DSS assessment created successfully',
        data: {
          assessmentId: assessment.complianceId,
          assessmentType: assessment.assessmentType,
          status: assessment.complianceStatus,
          merchantLevel: assessment.merchantLevel,
          validUntil: assessment.validUntil
        },
        nextSteps: [
          'Assessment team will be assigned',
          'Gather required documentation',
          'Schedule assessment activities',
          'Complete assessment questionnaire'
        ]
      });

    } catch (error) {
      console.error('PCI DSS assessment creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create PCI DSS assessment',
        code: 'PCI_ASSESSMENT_ERROR'
      });
    }
  }
);

/**
 * GET /api/pci-dss-compliance/assessments
 * Get list of PCI DSS assessments
 */
router.get('/assessments',
  authenticateToken,
  requireRole(['admin', 'compliance_officer', 'security_officer', 'auditor']),
  [
    query('status')
      .optional()
      .isIn(['scheduled', 'in_progress', 'completed', 'failed'])
      .withMessage('Invalid status filter'),
    query('assessmentType')
      .optional()
      .isIn(['self_assessment', 'internal_scan', 'external_scan', 'penetration_test'])
      .withMessage('Invalid assessment type filter'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;
      const { status, assessmentType } = req.query;

      // Mock response for assessments list
      const assessments = [];

      res.json({
        success: true,
        data: {
          assessments,
          total: assessments.length,
          filters: { status, assessmentType }
        }
      });

    } catch (error) {
      console.error('Error fetching PCI DSS assessments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch PCI DSS assessments',
        code: 'PCI_ASSESSMENTS_FETCH_ERROR'
      });
    }
  }
);

/**
 * POST /api/pci-dss-compliance/vulnerability-scans
 * Submit vulnerability scan results
 */
router.post('/vulnerability-scans',
  authenticateToken,
  requireRole(['admin', 'compliance_officer', 'security_officer']),
  validateVulnerabilityReport,
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;
      const { scanType, findings } = req.body;

      // Mock response for vulnerability scan submission
      const scan = {
        scanId: 'scan-' + Date.now(),
        scanType,
        riskScore: 5.0,
        status: 'completed'
      };

      res.status(201).json({
        success: true,
        message: 'Vulnerability scan submitted successfully',
        data: {
          scanId: scan.scanId,
          scanType: scan.scanType,
          findingsCount: findings.length,
          riskScore: scan.riskScore,
          status: scan.status
        },
        remediation: {
          highPriorityFindings: findings.filter((f: any) => f.severity === 'critical' || f.severity === 'high').length,
          requiresImmedateAction: scan.riskScore > 7.0
        }
      });

    } catch (error) {
      console.error('PCI DSS vulnerability scan submission error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit vulnerability scan',
        code: 'PCI_VULNERABILITY_ERROR'
      });
    }
  }
);

/**
 * GET /api/pci-dss-compliance/vulnerability-scans
 * Get vulnerability scan results
 */
router.get('/vulnerability-scans',
  authenticateToken,
  requireRole(['admin', 'compliance_officer', 'security_officer', 'auditor']),
  [
    query('scanType')
      .optional()
      .isIn(['internal', 'external', 'network', 'application'])
      .withMessage('Invalid scan type filter'),
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid severity filter'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;
      const { scanType, severity } = req.query;

      // Mock response for vulnerability scans list
      const scans = [];

      res.json({
        success: true,
        data: {
          scans,
          total: scans.length,
          filters: { scanType, severity }
        }
      });

    } catch (error) {
      console.error('Error fetching vulnerability scans:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch vulnerability scans',
        code: 'PCI_SCANS_FETCH_ERROR'
      });
    }
  }
);

/**
 * GET /api/pci-dss-compliance/requirements/:requirementId
 * Get specific PCI DSS requirement compliance status
 */
router.get('/requirements/:requirementId',
  authenticateToken,
  requireRole(['admin', 'compliance_officer', 'security_officer', 'auditor']),
  [
    param('requirementId')
      .isInt({ min: 1, max: 12 })
      .withMessage('Invalid requirement ID - must be between 1 and 12'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;
      const { requirementId } = req.params;

      const dashboard = await pciCompliance.getPCIDSSDashboard(tenantId);
      const requirement = dashboard.requirements?.find(
        (req: any) => req.requirement_number === parseInt(requirementId)
      ) || { error: 'Requirement not found' };

      res.json({
        success: true,
        data: requirement
      });

    } catch (error) {
      console.error('Error fetching PCI DSS requirement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch PCI DSS requirement',
        code: 'PCI_REQUIREMENT_FETCH_ERROR'
      });
    }
  }
);

export default router;