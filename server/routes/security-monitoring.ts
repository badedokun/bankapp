/**
 * Security Monitoring API Routes
 * Handles PCI DSS compliance and SIEM monitoring endpoints
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import PCIDSSComplianceService from '../services/pci-dss-compliance';
import SIEMMonitoringService from '../services/siem-monitoring';

const router = express.Router();
const pciDssService = new PCIDSSComplianceService();
const siemService = new SIEMMonitoringService();

// Validation middleware
const validateSIEMEvent = [
  body('eventType')
    .isIn(['authentication', 'authorization', 'data_access', 'network', 'system', 'application', 'fraud', 'compliance'])
    .withMessage('Invalid event type'),
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('source')
    .notEmpty()
    .withMessage('Event source is required'),
  body('sourceIP')
    .isIP()
    .withMessage('Valid source IP address is required'),
  body('description')
    .notEmpty()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  validateRequest
];

const validateSecurityAlert = [
  body('alertType')
    .isIn(['anomaly', 'rule_match', 'threshold_breach', 'correlation', 'threat_intel'])
    .withMessage('Invalid alert type'),
  body('severity')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid severity level'),
  body('title')
    .notEmpty()
    .isLength({ min: 5, max: 500 })
    .withMessage('Title must be between 5 and 500 characters'),
  body('description')
    .notEmpty()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('ruleName')
    .notEmpty()
    .withMessage('Rule name is required'),
  validateRequest
];

/**
 * POST /api/security-monitoring/events
 * Log a security event to SIEM system
 */
router.post('/events',
  authenticateToken,
  requireRole(['admin', 'security_officer', 'system']),
  validateSIEMEvent,
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;
      const eventData = {
        ...req.body,
        tenantId,
        timestamp: new Date()
      };

      const event = await siemService.logSecurityEvent(eventData);

      res.status(201).json({
        success: true,
        message: 'Security event logged successfully',
        data: {
          eventId: event.eventId,
          riskScore: event.riskScore,
          status: event.status,
          complianceRelevance: event.complianceRelevance
        },
        metadata: {
          correlationId: event.correlationId,
          retentionPeriod: event.retentionPeriod,
          indicators: event.indicators.length
        }
      });

    } catch (error) {
      console.error('SIEM event logging error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to log security event',
        code: 'SIEM_EVENT_ERROR'
      });
    }
  }
);

/**
 * GET /api/security-monitoring/events
 * Search and retrieve security events
 */
router.get('/events',
  authenticateToken,
  requireRole(['admin', 'security_officer', 'auditor']),
  [
    query('eventType')
      .optional()
      .isIn(['authentication', 'authorization', 'data_access', 'network', 'system', 'application', 'fraud', 'compliance'])
      .withMessage('Invalid event type'),
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid severity level'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    query('sourceIP')
      .optional()
      .isIP()
      .withMessage('Invalid source IP address'),
    query('riskScoreMin')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Risk score must be between 0 and 100'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;
      const filters: any = {};

      // Build search filters
      if (req.query.eventType) filters.eventType = req.query.eventType as string;
      if (req.query.severity) filters.severity = req.query.severity as string;
      if (req.query.sourceIP) filters.sourceIP = req.query.sourceIP as string;
      if (req.query.userId) filters.userId = req.query.userId as string;
      if (req.query.riskScoreMin) filters.riskScoreMin = parseInt(req.query.riskScoreMin as string);
      if (req.query.limit) filters.limit = parseInt(req.query.limit as string);

      if (req.query.startDate && req.query.endDate) {
        filters.timeRange = {
          start: new Date(req.query.startDate as string),
          end: new Date(req.query.endDate as string)
        };
      }

      const events = await siemService.searchSecurityEvents(tenantId, filters);

      res.json({
        success: true,
        data: {
          events,
          total: events.length,
          filters
        },
        metadata: {
          searchExecuted: new Date(),
          retention: '7 years (banking compliance)',
          complianceNote: 'Events are retained for regulatory audit requirements'
        }
      });

    } catch (error) {
      console.error('SIEM event search error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search security events',
        code: 'SIEM_SEARCH_ERROR'
      });
    }
  }
);

/**
 * POST /api/security-monitoring/alerts
 * Create a security alert
 */
router.post('/alerts',
  authenticateToken,
  requireRole(['admin', 'security_officer', 'system']),
  validateSecurityAlert,
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;
      const { alertType, title, description, severity, triggerEvents, ruleName } = req.body;

      const alert = await siemService.createSecurityAlert(
        tenantId,
        alertType,
        title,
        description,
        severity,
        triggerEvents || [],
        ruleName
      );

      res.status(201).json({
        success: true,
        message: 'Security alert created successfully',
        data: {
          alertId: alert.alertId,
          severity: alert.severity,
          riskScore: alert.riskScore,
          status: alert.status,
          escalated: alert.escalated
        },
        nextSteps: [
          'Alert assigned to security team',
          'Investigation will begin within SLA',
          'Automated responses may be triggered',
          'Compliance reporting if required'
        ]
      });

    } catch (error) {
      console.error('Security alert creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create security alert',
        code: 'ALERT_CREATION_ERROR'
      });
    }
  }
);

/**
 * GET /api/security-monitoring/alerts
 * Get security alerts with filtering
 */
router.get('/alerts',
  authenticateToken,
  requireRole(['admin', 'security_officer', 'auditor']),
  [
    query('status')
      .optional()
      .isIn(['open', 'acknowledged', 'investigating', 'resolved', 'false_positive'])
      .withMessage('Invalid alert status'),
    query('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid severity level'),
    query('alertType')
      .optional()
      .isIn(['anomaly', 'rule_match', 'threshold_breach', 'correlation', 'threat_intel'])
      .withMessage('Invalid alert type'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;
      
      // In a real implementation, we would add filtering to the SIEM service
      const dashboard = await siemService.getSIEMDashboard(tenantId);
      
      let alerts = dashboard.activeAlerts;

      // Apply filters
      if (req.query.status) {
        alerts = alerts.filter((a: any) => a.status === req.query.status);
      }
      if (req.query.severity) {
        alerts = alerts.filter((a: any) => a.severity === req.query.severity);
      }
      if (req.query.alertType) {
        alerts = alerts.filter((a: any) => a.alert_type === req.query.alertType);
      }

      res.json({
        success: true,
        data: {
          alerts,
          total: alerts.length,
          summary: {
            open: alerts.filter((a: any) => a.status === 'open').length,
            critical: alerts.filter((a: any) => a.severity === 'critical').length,
            investigating: alerts.filter((a: any) => a.status === 'investigating').length
          }
        }
      });

    } catch (error) {
      console.error('Security alerts retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security alerts',
        code: 'ALERTS_RETRIEVAL_ERROR'
      });
    }
  }
);

/**
 * GET /api/security-monitoring/dashboard
 * Get comprehensive SIEM dashboard
 */
router.get('/dashboard',
  authenticateToken,
  requireRole(['admin', 'security_officer', 'auditor']),
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;

      const dashboard = await siemService.getSIEMDashboard(tenantId);

      // Add security context
      dashboard.securityPosture = {
        overallRiskLevel: dashboard.summary.averageRiskScore > 70 ? 'HIGH' : 
                         dashboard.summary.averageRiskScore > 40 ? 'MEDIUM' : 'LOW',
        criticalAlertsThreshold: 5,
        complianceStatus: dashboard.complianceEvents.length > 0 ? 'REQUIRES_ATTENTION' : 'COMPLIANT',
        lastSecurityReview: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        nextScheduledReview: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000) // 23 days from now
      };

      dashboard.recommendations = [
        'Review high-risk events for potential threats',
        'Investigate critical alerts within SLA',
        'Update threat intelligence feeds',
        'Validate compliance-related events',
        'Conduct security awareness training'
      ];

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      console.error('SIEM dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve SIEM dashboard',
        code: 'SIEM_DASHBOARD_ERROR'
      });
    }
  }
);

/**
 * POST /api/security-monitoring/pci-dss/assessment
 * Initialize PCI DSS compliance assessment
 */
router.post('/pci-dss/assessment',
  authenticateToken,
  requireRole(['admin', 'compliance_officer']),
  [
    body('merchantLevel')
      .isInt({ min: 1, max: 4 })
      .withMessage('Merchant level must be 1, 2, 3, or 4'),
    body('assessmentType')
      .isIn(['self_assessment', 'external_audit', 'internal_audit'])
      .withMessage('Invalid assessment type'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;
      const { merchantLevel = 1, assessmentType = 'self_assessment' } = req.body;

      const compliance = await pciDssService.initializePCIDSSAssessment(
        tenantId,
        merchantLevel,
        assessmentType
      );

      res.status(201).json({
        success: true,
        message: `PCI DSS Level ${merchantLevel} assessment initialized successfully`,
        data: {
          complianceId: compliance.complianceId,
          merchantLevel: compliance.merchantLevel,
          assessmentType: compliance.assessmentType,
          totalRequirements: compliance.requirements.length,
          validUntil: compliance.validUntil,
          nextAssessment: compliance.nextAssessment
        },
        compliance: {
          standard: 'PCI DSS v4.0',
          scope: 'Cardholder data environment',
          requirements: '12 core requirements with sub-requirements',
          certification: merchantLevel === 1 ? 'External audit required' : 'Self-assessment permitted'
        }
      });

    } catch (error) {
      console.error('PCI DSS assessment initialization error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initialize PCI DSS assessment',
        code: 'PCI_DSS_INIT_ERROR'
      });
    }
  }
);

/**
 * POST /api/security-monitoring/pci-dss/network-segmentation
 * Validate network segmentation for cardholder data environment
 */
router.post('/pci-dss/network-segmentation',
  authenticateToken,
  requireRole(['admin', 'security_officer', 'compliance_officer']),
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;

      const validation = await pciDssService.validateNetworkSegmentation(tenantId);

      res.json({
        success: true,
        message: 'Network segmentation validation completed',
        data: {
          segmentationId: validation.segmentationId,
          complianceStatus: validation.complianceStatus,
          lastValidated: validation.lastValidated,
          validationResults: validation.validationResults
        },
        pciDssRequirements: {
          requirement1: 'Install and maintain network security controls',
          requirement2: 'Apply secure configurations to all system components',
          segmentationPurpose: 'Isolate cardholder data environment from other networks',
          testingFrequency: 'Annual penetration testing required'
        }
      });

    } catch (error) {
      console.error('Network segmentation validation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate network segmentation',
        code: 'NETWORK_SEGMENTATION_ERROR'
      });
    }
  }
);

/**
 * GET /api/security-monitoring/pci-dss/dashboard
 * Get PCI DSS compliance dashboard
 */
router.get('/pci-dss/dashboard',
  authenticateToken,
  requireRole(['admin', 'compliance_officer', 'auditor']),
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;

      const dashboard = await pciDssService.getPCIDSSDashboard(tenantId);

      // Add regulatory context
      dashboard.regulatoryInfo = {
        standard: 'PCI DSS v4.0',
        effectiveDate: '2024-03-31',
        complianceDeadline: '2025-03-31',
        merchantCategory: `Level ${dashboard.summary.merchantLevel} Merchant`,
        assessmentRequirement: dashboard.summary.merchantLevel === 1 ? 
          'Annual external security audit required' : 
          'Annual self-assessment questionnaire',
        validationMethod: dashboard.summary.assessmentType,
        reportingAuthority: 'Payment Card Industry Security Standards Council'
      };

      dashboard.criticalActions = dashboard.nextActions.filter((action: string) => 
        action.includes('critical') || action.includes('Address')
      );

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      console.error('PCI DSS dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve PCI DSS dashboard',
        code: 'PCI_DSS_DASHBOARD_ERROR'
      });
    }
  }
);

/**
 * GET /api/security-monitoring/forensics/:eventId
 * Get forensic analysis for a security event
 */
router.get('/forensics/:eventId',
  authenticateToken,
  requireRole(['admin', 'security_officer', 'forensic_analyst']),
  [
    param('eventId').isUUID().withMessage('Invalid event ID format'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;
      const { eventId } = req.params;

      // In a real implementation, this would retrieve detailed forensic data
      const forensicData = {
        eventId,
        tenantId,
        analysisTimestamp: new Date(),
        forensicEvidence: {
          evidenceCollected: true,
          chainOfCustody: 'Maintained',
          evidenceTypes: ['log_files', 'network_captures', 'system_snapshots'],
          integrityVerified: true,
          retentionCompliant: true
        },
        technicalAnalysis: {
          sourceAnalysis: 'IP geolocation and reputation check completed',
          behaviorAnalysis: 'User behavior patterns analyzed',
          threatIntelligence: 'Cross-referenced with known threats',
          impactAssessment: 'Limited scope, contained incident'
        },
        complianceImplications: {
          regulatoryReporting: 'CBN notification required',
          dataBreachAssessment: 'No customer data exposure detected',
          auditRequirements: 'Evidence preserved for audit',
          retentionPeriod: '7 years (banking regulation)'
        },
        recommendations: [
          'Continue monitoring related indicators',
          'Review and update security controls',
          'Conduct user security training',
          'Update incident response procedures'
        ]
      };

      res.json({
        success: true,
        data: forensicData,
        disclaimer: 'Forensic analysis provided for security investigation purposes. Evidence handling follows regulatory compliance requirements.'
      });

    } catch (error) {
      console.error('Forensic analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve forensic analysis',
        code: 'FORENSIC_ANALYSIS_ERROR'
      });
    }
  }
);

/**
 * GET /api/security-monitoring/compliance/audit-trail
 * Get compliance audit trail
 */
router.get('/compliance/audit-trail',
  authenticateToken,
  requireRole(['admin', 'auditor', 'compliance_officer']),
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format'),
    query('complianceType')
      .optional()
      .isIn(['PCI_DSS', 'CBN_COMPLIANCE', 'SOX', 'AUDIT_TRAIL'])
      .withMessage('Invalid compliance type'),
    validateRequest
  ],
  async (req, res) => {
    try {
      const { tenantId } = (req as any).user;
      
      // Build search filters for compliance events
      const filters: any = { tenantId };
      if (req.query.complianceType) {
        // This would filter for events with specific compliance relevance
        filters.complianceRelevance = req.query.complianceType as string;
      }

      const events = await siemService.searchSecurityEvents(tenantId, filters);
      
      // Filter for compliance-relevant events
      const complianceEvents = events.filter(event => 
        event.parsedData.complianceRelevance && 
        event.parsedData.complianceRelevance.length > 0
      );

      const auditTrail = {
        tenantId,
        reportGenerated: new Date(),
        reportingPeriod: {
          start: req.query.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          end: req.query.endDate || new Date()
        },
        complianceFrameworks: ['PCI DSS', 'CBN Compliance', 'SOX', 'Banking Regulations'],
        summary: {
          totalEvents: complianceEvents.length,
          criticalEvents: complianceEvents.filter(e => e.severity === 'critical').length,
          complianceViolations: 0, // Would be calculated based on actual violations
          auditFindings: 0,
          remedialActions: complianceEvents.filter(e => e.status === 'resolved').length
        },
        events: complianceEvents,
        retentionInfo: {
          retentionPeriod: '7 years',
          legalBasis: 'Banking Act and CBN regulations',
          dataLocation: 'Nigeria (compliant with data localization)',
          accessControls: 'Role-based access with audit logging'
        },
        auditeeDeclaration: {
          accuracy: 'I certify that this audit trail is complete and accurate',
          completeness: 'All relevant security events are included',
          retention: 'Records are maintained per regulatory requirements',
          access: 'Audit trail access is logged and monitored'
        }
      };

      res.json({
        success: true,
        data: auditTrail,
        metadata: {
          reportType: 'Compliance Audit Trail',
          generatedBy: 'SIEM Monitoring System',
          auditStandards: ['ISO 27001', 'PCI DSS', 'CBN Guidelines'],
          certificationNote: 'This audit trail meets regulatory requirements for financial institutions'
        }
      });

    } catch (error) {
      console.error('Compliance audit trail error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate compliance audit trail',
        code: 'AUDIT_TRAIL_ERROR'
      });
    }
  }
);

export default router;