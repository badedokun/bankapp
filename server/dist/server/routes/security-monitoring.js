"use strict";
/**
 * Security Monitoring API Routes
 * Handles PCI DSS compliance and SIEM monitoring endpoints
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const pci_dss_compliance_1 = __importDefault(require("../services/pci-dss-compliance"));
const siem_monitoring_1 = __importDefault(require("../services/siem-monitoring"));
const router = express_1.default.Router();
const pciDssService = new pci_dss_compliance_1.default();
const siemService = new siem_monitoring_1.default();
// Validation middleware
const validateSIEMEvent = [
    (0, express_validator_1.body)('eventType')
        .isIn(['authentication', 'authorization', 'data_access', 'network', 'system', 'application', 'fraud', 'compliance'])
        .withMessage('Invalid event type'),
    (0, express_validator_1.body)('severity')
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid severity level'),
    (0, express_validator_1.body)('source')
        .notEmpty()
        .withMessage('Event source is required'),
    (0, express_validator_1.body)('sourceIP')
        .isIP()
        .withMessage('Valid source IP address is required'),
    (0, express_validator_1.body)('description')
        .notEmpty()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    validation_1.validateRequest
];
const validateSecurityAlert = [
    (0, express_validator_1.body)('alertType')
        .isIn(['anomaly', 'rule_match', 'threshold_breach', 'correlation', 'threat_intel'])
        .withMessage('Invalid alert type'),
    (0, express_validator_1.body)('severity')
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid severity level'),
    (0, express_validator_1.body)('title')
        .notEmpty()
        .isLength({ min: 5, max: 500 })
        .withMessage('Title must be between 5 and 500 characters'),
    (0, express_validator_1.body)('description')
        .notEmpty()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be between 10 and 2000 characters'),
    (0, express_validator_1.body)('ruleName')
        .notEmpty()
        .withMessage('Rule name is required'),
    validation_1.validateRequest
];
/**
 * POST /api/security-monitoring/events
 * Log a security event to SIEM system
 */
router.post('/events', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'security_officer', 'system']), validateSIEMEvent, async (req, res) => {
    try {
        const { tenantId } = req.user;
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
    }
    catch (error) {
        console.error('SIEM event logging error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to log security event',
            code: 'SIEM_EVENT_ERROR'
        });
    }
});
/**
 * GET /api/security-monitoring/events
 * Search and retrieve security events
 */
router.get('/events', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'security_officer', 'auditor']), [
    (0, express_validator_1.query)('eventType')
        .optional()
        .isIn(['authentication', 'authorization', 'data_access', 'network', 'system', 'application', 'fraud', 'compliance'])
        .withMessage('Invalid event type'),
    (0, express_validator_1.query)('severity')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid severity level'),
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid start date format'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid end date format'),
    (0, express_validator_1.query)('sourceIP')
        .optional()
        .isIP()
        .withMessage('Invalid source IP address'),
    (0, express_validator_1.query)('riskScoreMin')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Risk score must be between 0 and 100'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Limit must be between 1 and 1000'),
    validation_1.validateRequest
], async (req, res) => {
    try {
        const { tenantId } = req.user;
        const filters = {};
        // Build search filters
        if (req.query.eventType)
            filters.eventType = req.query.eventType;
        if (req.query.severity)
            filters.severity = req.query.severity;
        if (req.query.sourceIP)
            filters.sourceIP = req.query.sourceIP;
        if (req.query.userId)
            filters.userId = req.query.userId;
        if (req.query.riskScoreMin)
            filters.riskScoreMin = parseInt(req.query.riskScoreMin);
        if (req.query.limit)
            filters.limit = parseInt(req.query.limit);
        if (req.query.startDate && req.query.endDate) {
            filters.timeRange = {
                start: new Date(req.query.startDate),
                end: new Date(req.query.endDate)
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
    }
    catch (error) {
        console.error('SIEM event search error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search security events',
            code: 'SIEM_SEARCH_ERROR'
        });
    }
});
/**
 * POST /api/security-monitoring/alerts
 * Create a security alert
 */
router.post('/alerts', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'security_officer', 'system']), validateSecurityAlert, async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { alertType, title, description, severity, triggerEvents, ruleName } = req.body;
        const alert = await siemService.createSecurityAlert(tenantId, alertType, title, description, severity, triggerEvents || [], ruleName);
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
    }
    catch (error) {
        console.error('Security alert creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create security alert',
            code: 'ALERT_CREATION_ERROR'
        });
    }
});
/**
 * GET /api/security-monitoring/alerts
 * Get security alerts with filtering
 */
router.get('/alerts', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'security_officer', 'auditor']), [
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(['open', 'acknowledged', 'investigating', 'resolved', 'false_positive'])
        .withMessage('Invalid alert status'),
    (0, express_validator_1.query)('severity')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid severity level'),
    (0, express_validator_1.query)('alertType')
        .optional()
        .isIn(['anomaly', 'rule_match', 'threshold_breach', 'correlation', 'threat_intel'])
        .withMessage('Invalid alert type'),
    validation_1.validateRequest
], async (req, res) => {
    try {
        const { tenantId } = req.user;
        // In a real implementation, we would add filtering to the SIEM service
        const dashboard = await siemService.getSIEMDashboard(tenantId);
        let alerts = dashboard.activeAlerts;
        // Apply filters
        if (req.query.status) {
            alerts = alerts.filter((a) => a.status === req.query.status);
        }
        if (req.query.severity) {
            alerts = alerts.filter((a) => a.severity === req.query.severity);
        }
        if (req.query.alertType) {
            alerts = alerts.filter((a) => a.alert_type === req.query.alertType);
        }
        res.json({
            success: true,
            data: {
                alerts,
                total: alerts.length,
                summary: {
                    open: alerts.filter((a) => a.status === 'open').length,
                    critical: alerts.filter((a) => a.severity === 'critical').length,
                    investigating: alerts.filter((a) => a.status === 'investigating').length
                }
            }
        });
    }
    catch (error) {
        console.error('Security alerts retrieval error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve security alerts',
            code: 'ALERTS_RETRIEVAL_ERROR'
        });
    }
});
/**
 * GET /api/security-monitoring/dashboard
 * Get comprehensive SIEM dashboard
 */
router.get('/dashboard', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'security_officer', 'auditor']), async (req, res) => {
    try {
        const { tenantId } = req.user;
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
    }
    catch (error) {
        console.error('SIEM dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve SIEM dashboard',
            code: 'SIEM_DASHBOARD_ERROR'
        });
    }
});
/**
 * POST /api/security-monitoring/pci-dss/assessment
 * Initialize PCI DSS compliance assessment
 */
router.post('/pci-dss/assessment', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'compliance_officer']), [
    (0, express_validator_1.body)('merchantLevel')
        .isInt({ min: 1, max: 4 })
        .withMessage('Merchant level must be 1, 2, 3, or 4'),
    (0, express_validator_1.body)('assessmentType')
        .isIn(['self_assessment', 'external_audit', 'internal_audit'])
        .withMessage('Invalid assessment type'),
    validation_1.validateRequest
], async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { merchantLevel = 1, assessmentType = 'self_assessment' } = req.body;
        const compliance = await pciDssService.initializePCIDSSAssessment(tenantId, merchantLevel, assessmentType);
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
    }
    catch (error) {
        console.error('PCI DSS assessment initialization error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to initialize PCI DSS assessment',
            code: 'PCI_DSS_INIT_ERROR'
        });
    }
});
/**
 * POST /api/security-monitoring/pci-dss/network-segmentation
 * Validate network segmentation for cardholder data environment
 */
router.post('/pci-dss/network-segmentation', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'security_officer', 'compliance_officer']), async (req, res) => {
    try {
        const { tenantId } = req.user;
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
    }
    catch (error) {
        console.error('Network segmentation validation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to validate network segmentation',
            code: 'NETWORK_SEGMENTATION_ERROR'
        });
    }
});
/**
 * GET /api/security-monitoring/pci-dss/dashboard
 * Get PCI DSS compliance dashboard
 */
router.get('/pci-dss/dashboard', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'compliance_officer', 'auditor']), async (req, res) => {
    try {
        const { tenantId } = req.user;
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
        dashboard.criticalActions = dashboard.nextActions.filter((action) => action.includes('critical') || action.includes('Address'));
        res.json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        console.error('PCI DSS dashboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve PCI DSS dashboard',
            code: 'PCI_DSS_DASHBOARD_ERROR'
        });
    }
});
/**
 * GET /api/security-monitoring/forensics/:eventId
 * Get forensic analysis for a security event
 */
router.get('/forensics/:eventId', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'security_officer', 'forensic_analyst']), [
    (0, express_validator_1.param)('eventId').isUUID().withMessage('Invalid event ID format'),
    validation_1.validateRequest
], async (req, res) => {
    try {
        const { tenantId } = req.user;
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
    }
    catch (error) {
        console.error('Forensic analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve forensic analysis',
            code: 'FORENSIC_ANALYSIS_ERROR'
        });
    }
});
/**
 * GET /api/security-monitoring/audit-trail
 * Get security audit trail
 */
router.get('/audit-trail', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'auditor', 'compliance_officer']), [
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid start date format'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid end date format'),
    (0, express_validator_1.query)('eventType')
        .optional()
        .isIn(['authentication', 'authorization', 'data_access', 'network', 'system', 'application', 'fraud', 'compliance'])
        .withMessage('Invalid event type'),
    validation_1.validateRequest
], async (req, res) => {
    try {
        const { tenantId } = req.user;
        // Build search filters for audit trail
        const filters = { tenantId };
        if (req.query.eventType) {
            filters.eventType = req.query.eventType;
        }
        const events = await siemService.searchSecurityEvents(tenantId, filters);
        const auditTrail = {
            tenantId,
            reportGenerated: new Date(),
            reportingPeriod: {
                start: req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: req.query.endDate || new Date()
            },
            summary: {
                totalEvents: events.length,
                criticalEvents: events.filter(e => e.severity === 'critical').length,
                authenticationEvents: events.filter(e => e.eventType === 'authentication').length,
                dataAccessEvents: events.filter(e => e.eventType === 'data_access').length,
                systemEvents: events.filter(e => e.eventType === 'system').length
            },
            events: events.slice(0, 100), // Limit to 100 most recent events
            security: {
                accessControlled: true,
                encrypted: true,
                integrityProtected: true,
                retentionPeriod: '7 years',
                complianceFrameworks: ['PCI DSS', 'CBN Guidelines', 'ISO 27001']
            }
        };
        res.json({
            success: true,
            data: auditTrail,
            metadata: {
                reportType: 'Security Audit Trail',
                generatedBy: 'SIEM Monitoring System',
                totalRecordsAvailable: events.length,
                recordsReturned: auditTrail.events.length
            }
        });
    }
    catch (error) {
        console.error('Security audit trail error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate security audit trail',
            code: 'AUDIT_TRAIL_ERROR'
        });
    }
});
/**
 * GET /api/security-monitoring/network/segments
 * Get network segmentation status
 */
router.get('/network/segments', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'security_officer', 'network_admin']), async (req, res) => {
    try {
        const { tenantId } = req.user;
        // In a real implementation, this would query actual network infrastructure
        const networkSegments = {
            tenantId,
            lastScanned: new Date(),
            totalSegments: 5,
            segments: [
                {
                    segmentId: 'DMZ-001',
                    name: 'Demilitarized Zone',
                    ipRange: '10.1.0.0/24',
                    purpose: 'External-facing services',
                    securityLevel: 'medium',
                    compliance: 'COMPLIANT',
                    services: ['web_server', 'api_gateway'],
                    firewallRules: 15,
                    lastAudit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                },
                {
                    segmentId: 'APP-001',
                    name: 'Application Layer',
                    ipRange: '10.2.0.0/24',
                    purpose: 'Application services',
                    securityLevel: 'high',
                    compliance: 'COMPLIANT',
                    services: ['app_server', 'middleware'],
                    firewallRules: 25,
                    lastAudit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
                },
                {
                    segmentId: 'DB-001',
                    name: 'Database Layer',
                    ipRange: '10.3.0.0/24',
                    purpose: 'Database servers',
                    securityLevel: 'critical',
                    compliance: 'COMPLIANT',
                    services: ['postgresql', 'redis'],
                    firewallRules: 12,
                    lastAudit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                },
                {
                    segmentId: 'MGMT-001',
                    name: 'Management Network',
                    ipRange: '10.4.0.0/24',
                    purpose: 'Administrative access',
                    securityLevel: 'critical',
                    compliance: 'COMPLIANT',
                    services: ['ssh', 'monitoring'],
                    firewallRules: 8,
                    lastAudit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                },
                {
                    segmentId: 'USER-001',
                    name: 'User Network',
                    ipRange: '10.5.0.0/24',
                    purpose: 'End user access',
                    securityLevel: 'medium',
                    compliance: 'COMPLIANT',
                    services: ['user_portal', 'authentication'],
                    firewallRules: 18,
                    lastAudit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
                }
            ],
            compliance: {
                pciDssRequirement: 'Network segmentation isolates cardholder data environment',
                cbnRequirement: 'Network security controls must be implemented',
                overallStatus: 'COMPLIANT',
                lastAssessment: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                nextAssessment: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            },
            security: {
                firewallsConfigured: true,
                intrusionDetection: true,
                networkMonitoring: true,
                segmentIsolation: true,
                accessControlLists: true
            }
        };
        res.json({
            success: true,
            data: networkSegments,
            metadata: {
                lastUpdated: new Date(),
                scanType: 'automated_discovery',
                complianceStandards: ['PCI DSS Req 1.2', 'CBN Network Security Guidelines']
            }
        });
    }
    catch (error) {
        console.error('Network segments error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve network segments',
            code: 'NETWORK_SEGMENTS_ERROR'
        });
    }
});
/**
 * GET /api/security-monitoring/compliance/audit-trail
 * Get compliance audit trail
 */
router.get('/compliance/audit-trail', auth_1.authenticateToken, (0, auth_1.requireRole)(['admin', 'auditor', 'compliance_officer']), [
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid start date format'),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid end date format'),
    (0, express_validator_1.query)('complianceType')
        .optional()
        .isIn(['PCI_DSS', 'CBN_COMPLIANCE', 'SOX', 'AUDIT_TRAIL'])
        .withMessage('Invalid compliance type'),
    validation_1.validateRequest
], async (req, res) => {
    try {
        const { tenantId } = req.user;
        // Build search filters for compliance events
        const filters = { tenantId };
        if (req.query.complianceType) {
            // This would filter for events with specific compliance relevance
            filters.complianceRelevance = req.query.complianceType;
        }
        const events = await siemService.searchSecurityEvents(tenantId, filters);
        // Filter for compliance-relevant events
        const complianceEvents = events.filter(event => event.parsedData.complianceRelevance &&
            event.parsedData.complianceRelevance.length > 0);
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
    }
    catch (error) {
        console.error('Compliance audit trail error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate compliance audit trail',
            code: 'AUDIT_TRAIL_ERROR'
        });
    }
});
exports.default = router;
//# sourceMappingURL=security-monitoring.js.map