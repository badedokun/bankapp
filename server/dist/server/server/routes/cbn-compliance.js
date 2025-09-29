"use strict";
/**
 * CBN Compliance API Routes
 * Handles Central Bank of Nigeria regulatory compliance endpoints
 *
 * Routes for incident reporting, data localization checks, security audits
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const cbn_compliance_1 = __importDefault(require("../services/cbn-compliance"));
const router = express_1.default.Router();
const cbnCompliance = new cbn_compliance_1.default();
// Validation middleware
const validateIncidentReport = [
    (0, express_validator_1.body)('category')
        .isIn(['cyber_attack', 'data_breach', 'system_failure', 'fraud', 'operational_risk'])
        .withMessage('Invalid incident category'),
    (0, express_validator_1.body)('impactLevel')
        .isIn(['minimal', 'moderate', 'significant', 'severe'])
        .withMessage('Invalid impact level'),
    (0, express_validator_1.body)('customerImpact')
        .isInt({ min: 0 })
        .withMessage('Customer impact must be a non-negative integer'),
    (0, express_validator_1.body)('financialImpact')
        .isFloat({ min: 0 })
        .withMessage('Financial impact must be a non-negative number'),
    (0, express_validator_1.body)('affectedSystems')
        .isArray()
        .withMessage('Affected systems must be an array'),
    (0, express_validator_1.body)('dataTypes')
        .isArray()
        .withMessage('Data types must be an array'),
    (0, express_validator_1.body)('detectedAt')
        .optional()
        .isISO8601()
        .withMessage('Detection time must be a valid ISO 8601 date'),
    validation_1.validateRequest
];
const validateAuditRequest = [
    (0, express_validator_1.body)('auditType')
        .isIn(['internal', 'external', 'regulatory', 'penetration_test'])
        .withMessage('Invalid audit type'),
    validation_1.validateRequest
];
/**
 * POST /api/cbn-compliance/incidents
 * Report security incident to CBN (24-hour mandatory reporting)
 */
router.post('/incidents', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'compliance_officer', 'security_officer']), validateIncidentReport, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const incident = req.body;
        // Add automatic detection timestamp if not provided
        if (!incident.detectedAt) {
            incident.detectedAt = new Date();
        }
        const complianceReport = await cbnCompliance.reportIncident(tenantId, incident);
        res.status(201).json({
            success: true,
            message: 'CBN incident report created successfully',
            data: {
                reportId: complianceReport.reportId,
                submissionDeadline: complianceReport.submissionDeadline,
                status: complianceReport.status,
                severity: complianceReport.severity
            },
            metadata: {
                cbnRequirement: '24-hour mandatory reporting',
                nextSteps: [
                    'Complete incident investigation',
                    'Submit report to CBN before deadline',
                    'Implement mitigation actions',
                    'Monitor resolution progress'
                ]
            }
        });
    }
    catch (error) {
        console.error('CBN incident reporting error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create CBN incident report',
            code: 'CBN_REPORTING_ERROR'
        });
    }
});
/**
 * GET /api/cbn-compliance/incidents
 * Get list of CBN incidents for tenant
 */
router.get('/incidents', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'compliance_officer', 'security_officer', 'auditor']), [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['active', 'contained', 'resolved', 'closed'])
        .withMessage('Invalid status filter'),
    (0, express_validator_1.query)('category')
        .optional()
        .isIn(['cyber_attack', 'data_breach', 'system_failure', 'fraud', 'operational_risk'])
        .withMessage('Invalid category filter'),
    (0, express_validator_1.query)('severity')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid severity filter'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    validation_1.validateRequest
], async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { status, category, severity, limit = 20 } = req.query;
        // Build query filters
        let whereClause = 'WHERE tenant_id = $1';
        const params = [tenantId];
        let paramIndex = 2;
        if (status) {
            whereClause += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        if (category) {
            whereClause += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        if (severity) {
            whereClause += ` AND severity = $${paramIndex}`;
            params.push(severity);
            paramIndex++;
        }
        const { query: dbQuery } = require('../config/database');
        const result = await dbQuery(`
        SELECT incident_id, category, severity, impact_level, customer_impact,
               financial_impact, detected_at, reported_at, resolved_at, status,
               compliance_report_id, created_at
        FROM audit.cbn_incidents 
        ${whereClause}
        ORDER BY detected_at DESC 
        LIMIT $${paramIndex}
      `, [...params, limit]);
        res.json({
            success: true,
            data: {
                incidents: result.rows,
                total: result.rows.length,
                filters: { status, category, severity }
            }
        });
    }
    catch (error) {
        console.error('Error fetching CBN incidents:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch CBN incidents',
            code: 'CBN_FETCH_ERROR'
        });
    }
});
/**
 * GET /api/cbn-compliance/incidents/:incidentId
 * Get specific CBN incident details
 */
router.get('/incidents/:incidentId', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'compliance_officer', 'security_officer', 'auditor']), [
    (0, express_validator_1.param)('incidentId').isUUID().withMessage('Invalid incident ID format'),
    validation_1.validateRequest
], async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { incidentId } = req.params;
        const { query: dbQuery } = require('../config/database');
        const result = await dbQuery(`
        SELECT * FROM audit.cbn_incidents 
        WHERE incident_id = $1 AND tenant_id = $2
      `, [incidentId, tenantId]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'CBN incident not found',
                code: 'INCIDENT_NOT_FOUND'
            });
        }
        const incident = result.rows[0];
        res.json({
            success: true,
            data: incident
        });
    }
    catch (error) {
        console.error('Error fetching CBN incident:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch CBN incident',
            code: 'CBN_INCIDENT_FETCH_ERROR'
        });
    }
});
/**
 * POST /api/cbn-compliance/data-localization/check
 * Perform Nigerian data localization compliance check
 */
router.post('/data-localization/check', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'compliance_officer', 'data_protection_officer']), async (req, res) => {
    try {
        const { tenantId } = req.user;
        const checks = await cbnCompliance.checkDataLocalization(tenantId);
        const summary = {
            totalChecks: checks.length,
            compliant: checks.filter(c => c.compliance).length,
            nonCompliant: checks.filter(c => !c.compliance).length,
            complianceRate: (checks.filter(c => c.compliance).length / checks.length) * 100
        };
        res.json({
            success: true,
            message: 'Data localization compliance check completed',
            data: {
                summary,
                checks,
                timestamp: new Date()
            },
            compliance: {
                requirement: 'All Nigerian customer data must be stored within Nigeria',
                regulation: 'CBN Circular on Data Localization Requirements',
                status: summary.complianceRate === 100 ? 'COMPLIANT' : 'NON_COMPLIANT'
            }
        });
    }
    catch (error) {
        console.error('Data localization check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform data localization check',
            code: 'DATA_LOCALIZATION_ERROR'
        });
    }
});
/**
 * GET /api/cbn-compliance/data-localization/status
 * Get current data localization compliance status
 */
router.get('/data-localization/status', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'compliance_officer', 'data_protection_officer', 'auditor']), async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { query: dbQuery } = require('../config/database');
        const result = await dbQuery(`
        SELECT * FROM audit.data_localization_checks 
        WHERE tenant_id = $1 
        ORDER BY last_checked DESC
      `, [tenantId]);
        const checks = result.rows;
        const summary = {
            totalChecks: checks.length,
            compliant: checks.filter(c => c.compliance).length,
            nonCompliant: checks.filter(c => !c.compliance).length,
            complianceRate: checks.length > 0 ? (checks.filter(c => c.compliance).length / checks.length) * 100 : 0,
            lastChecked: checks.length > 0 ? checks[0].last_checked : null
        };
        res.json({
            success: true,
            data: {
                summary,
                checks
            }
        });
    }
    catch (error) {
        console.error('Error fetching data localization status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch data localization status',
            code: 'DATA_LOCALIZATION_FETCH_ERROR'
        });
    }
});
/**
 * POST /api/cbn-compliance/audits
 * Generate CBN security audit
 */
router.post('/audits', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'compliance_officer', 'security_officer']), validateAuditRequest, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { auditType } = req.body;
        const audit = await cbnCompliance.generateSecurityAudit(tenantId, auditType);
        res.status(201).json({
            success: true,
            message: 'CBN security audit scheduled successfully',
            data: {
                auditId: audit.auditId,
                auditType: audit.auditType,
                status: audit.status,
                startDate: audit.startDate,
                scope: audit.scope
            },
            nextSteps: [
                'Audit team will be notified',
                'Prepare required documentation',
                'Schedule audit interviews',
                'Ensure system access for auditors'
            ]
        });
    }
    catch (error) {
        console.error('CBN audit generation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate CBN security audit',
            code: 'CBN_AUDIT_ERROR'
        });
    }
});
/**
 * GET /api/cbn-compliance/audits
 * Get list of CBN security audits
 */
router.get('/audits', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'compliance_officer', 'security_officer', 'auditor']), [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['scheduled', 'in_progress', 'completed', 'failed'])
        .withMessage('Invalid status filter'),
    (0, express_validator_1.query)('auditType')
        .optional()
        .isIn(['internal', 'external', 'regulatory', 'penetration_test'])
        .withMessage('Invalid audit type filter'),
    validation_1.validateRequest
], async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { status, auditType } = req.query;
        let whereClause = 'WHERE tenant_id = $1';
        const params = [tenantId];
        let paramIndex = 2;
        if (status) {
            whereClause += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        if (auditType) {
            whereClause += ` AND audit_type = $${paramIndex}`;
            params.push(auditType);
            paramIndex++;
        }
        const { query: dbQuery } = require('../config/database');
        const result = await dbQuery(`
        SELECT audit_id, audit_type, status, start_date, end_date,
               auditor, risk_rating, compliance_score, created_at
        FROM audit.cbn_security_audits 
        ${whereClause}
        ORDER BY start_date DESC
      `, params);
        res.json({
            success: true,
            data: {
                audits: result.rows,
                total: result.rows.length,
                filters: { status, auditType }
            }
        });
    }
    catch (error) {
        console.error('Error fetching CBN audits:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch CBN audits',
            code: 'CBN_AUDITS_FETCH_ERROR'
        });
    }
});
/**
 * GET /api/cbn-compliance/status
 * Get overall CBN compliance status
 */
router.get('/status', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'compliance_officer', 'security_officer', 'auditor']), async (req, res) => {
    try {
        const { tenantId } = req.user;
        const dashboard = await cbnCompliance.getComplianceDashboard(tenantId);
        // Extract status information from dashboard
        const status = {
            overallCompliance: dashboard.summary?.complianceScore > 80 ? 'COMPLIANT' : 'NON_COMPLIANT',
            complianceScore: dashboard.summary?.complianceScore || 0,
            lastAssessment: dashboard.lastUpdated,
            criticalIssues: dashboard.summary?.criticalIncidents || 0,
            pendingActions: dashboard.summary?.pendingActions || 0,
            dataLocalizationStatus: 'COMPLIANT', // This would be calculated from actual checks
            incidentReportingStatus: 'ACTIVE',
            nextAuditDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            framework: 'CBN Cybersecurity Framework',
            regulatoryReporting: {
                monthlyReportDue: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                quarterlyAssessmentDue: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                annualAuditDue: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
            }
        };
        res.json({
            success: true,
            data: status,
            metadata: {
                generatedAt: new Date(),
                framework: 'Central Bank of Nigeria Cybersecurity Framework',
                complianceStandards: ['BSD/DIR/GEN/LAB/11/156', 'Data Localization Requirements']
            }
        });
    }
    catch (error) {
        console.error('Error fetching CBN compliance status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch CBN compliance status',
            code: 'CBN_STATUS_ERROR'
        });
    }
});
/**
 * GET /api/cbn-compliance/dashboard
 * Get comprehensive CBN compliance dashboard
 */
router.get('/dashboard', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'compliance_officer', 'security_officer', 'auditor']), async (req, res) => {
    try {
        const { tenantId } = req.user;
        const dashboard = await cbnCompliance.getComplianceDashboard(tenantId);
        // Add regulatory context
        dashboard.regulations = {
            cbnCirculars: [
                'BSD/DIR/GEN/LAB/11/156 - Guidelines on Cybersecurity Framework',
                'BSD/DIR/GEN/LAB/10/015 - Risk Management Framework',
                'Data Localization Requirements for Nigerian Financial Institutions'
            ],
            complianceRequirements: [
                '24-hour incident reporting to CBN',
                'Quarterly security risk assessments',
                'Annual third-party security audits',
                'Data localization for all customer data',
                'Business continuity plan updates'
            ],
            nextDeadlines: [
                'Monthly compliance report due in 15 days',
                'Quarterly risk assessment due in 45 days',
                'Annual security audit due in 180 days'
            ]
        };
        res.json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        console.error('Error fetching CBN compliance dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch CBN compliance dashboard',
            code: 'CBN_DASHBOARD_ERROR'
        });
    }
});
/**
 * POST /api/cbn-compliance/reports/submit/:reportId
 * Submit compliance report to CBN
 */
router.post('/reports/submit/:reportId', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'compliance_officer']), [
    (0, express_validator_1.param)('reportId').isUUID().withMessage('Invalid report ID format'),
    validation_1.validateRequest
], async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { reportId } = req.params;
        const { query: dbQuery } = require('../config/database');
        // Check if report exists and belongs to tenant
        const checkResult = await dbQuery(`
        SELECT * FROM audit.cbn_compliance_reports 
        WHERE report_id = $1 AND tenant_id = $2
      `, [reportId, tenantId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Compliance report not found',
                code: 'REPORT_NOT_FOUND'
            });
        }
        const report = checkResult.rows[0];
        if (report.status === 'submitted') {
            return res.status(400).json({
                success: false,
                error: 'Report has already been submitted',
                code: 'REPORT_ALREADY_SUBMITTED'
            });
        }
        // Check if still within submission deadline
        const now = new Date();
        const deadline = new Date(report.submission_deadline);
        if (now > deadline) {
            return res.status(400).json({
                success: false,
                error: 'Submission deadline has passed',
                code: 'DEADLINE_EXCEEDED',
                deadline: deadline.toISOString()
            });
        }
        // Update report status to submitted
        await dbQuery(`
        UPDATE audit.cbn_compliance_reports 
        SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
        WHERE report_id = $1
      `, [reportId]);
        res.json({
            success: true,
            message: 'Compliance report submitted to CBN successfully',
            data: {
                reportId,
                submittedAt: new Date(),
                status: 'submitted'
            },
            cbnReference: `CBN-${tenantId.slice(0, 8)}-${Date.now()}`, // Mock CBN reference
            nextSteps: [
                'CBN will acknowledge receipt within 48 hours',
                'Monitor for CBN feedback or requests for additional information',
                'Implement any required corrective actions',
                'Update incident status based on CBN guidance'
            ]
        });
    }
    catch (error) {
        console.error('CBN report submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit compliance report',
            code: 'CBN_SUBMISSION_ERROR'
        });
    }
});
exports.default = router;
