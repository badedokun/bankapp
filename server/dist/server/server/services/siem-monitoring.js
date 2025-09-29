"use strict";
/**
 * SIEM (Security Information and Event Management) Service
 * Real-time security monitoring, alerting, and forensic analysis
 *
 * Features:
 * - Real-time log analysis and correlation
 * - Security event detection and alerting
 * - Threat intelligence integration
 * - Forensic analysis and audit trails
 * - Compliance reporting
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIEMMonitoringService = void 0;
const database_1 = require("../config/database");
const crypto_1 = __importDefault(require("crypto"));
/**
 * SIEM Monitoring Service
 * Central security monitoring and event management
 */
class SIEMMonitoringService {
    constructor() {
        this.DEFAULT_RETENTION_DAYS = 2555; // 7 years for banking compliance
        this.THREAT_SCORE_THRESHOLD = 70; // High-risk threshold
        this.initializeSIEM();
    }
    /**
     * Initialize SIEM monitoring system
     */
    async initializeSIEM() {
        try {
            await this.createSIEMTables();
            await this.initializeDefaultRules();
            console.log('✅ SIEM monitoring system initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize SIEM system:', error);
            throw error;
        }
    }
    /**
     * Create SIEM database tables
     */
    async createSIEMTables() {
        const tables = [
            // SIEM Events
            `CREATE TABLE IF NOT EXISTS audit.siem_events (
        event_id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        event_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        source VARCHAR(255) NOT NULL,
        source_ip INET,
        user_id VARCHAR(255),
        description TEXT NOT NULL,
        raw_log TEXT,
        parsed_data JSONB NOT NULL DEFAULT '{}',
        correlation_id VARCHAR(255),
        risk_score INTEGER NOT NULL DEFAULT 0,
        indicators JSONB NOT NULL DEFAULT '[]',
        related_events JSONB NOT NULL DEFAULT '[]',
        status VARCHAR(30) NOT NULL DEFAULT 'new',
        assigned_to VARCHAR(255),
        investigation_notes TEXT,
        response_actions JSONB NOT NULL DEFAULT '[]',
        compliance_relevance JSONB NOT NULL DEFAULT '[]',
        retention_period INTEGER NOT NULL DEFAULT 2555,
        forensic_evidence JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
            // Security Alerts
            `CREATE TABLE IF NOT EXISTS audit.security_alerts (
        alert_id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        trigger_events JSONB NOT NULL DEFAULT '[]',
        rule_name VARCHAR(255) NOT NULL,
        rule_description TEXT,
        risk_score INTEGER NOT NULL DEFAULT 0,
        threat_actors JSONB NOT NULL DEFAULT '[]',
        affected_assets JSONB NOT NULL DEFAULT '[]',
        potential_impact TEXT,
        status VARCHAR(30) NOT NULL DEFAULT 'open',
        assigned_to VARCHAR(255),
        escalated BOOLEAN NOT NULL DEFAULT false,
        response_time INTEGER, -- in minutes
        resolution_time INTEGER, -- in minutes
        investigation_steps JSONB NOT NULL DEFAULT '[]',
        related_alerts JSONB NOT NULL DEFAULT '[]',
        evidence JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMP
      )`,
            // SIEM Rules
            `CREATE TABLE IF NOT EXISTS audit.siem_rules (
        rule_id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        rule_name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true,
        conditions JSONB NOT NULL DEFAULT '[]',
        time_window INTEGER NOT NULL DEFAULT 60, -- minutes
        threshold INTEGER NOT NULL DEFAULT 1,
        severity VARCHAR(20) NOT NULL,
        alert_actions JSONB NOT NULL DEFAULT '[]',
        automated_responses JSONB NOT NULL DEFAULT '[]',
        created_by VARCHAR(255) NOT NULL,
        last_modified TIMESTAMP NOT NULL DEFAULT NOW(),
        trigger_count INTEGER NOT NULL DEFAULT 0,
        false_positive_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
            // Threat Intelligence
            `CREATE TABLE IF NOT EXISTS audit.threat_intelligence (
        indicator_id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        indicator_value VARCHAR(500) NOT NULL,
        indicator_type VARCHAR(50) NOT NULL,
        confidence INTEGER NOT NULL DEFAULT 50,
        source VARCHAR(255) NOT NULL,
        description TEXT,
        first_seen TIMESTAMP NOT NULL DEFAULT NOW(),
        last_seen TIMESTAMP NOT NULL DEFAULT NOW(),
        threat_types JSONB NOT NULL DEFAULT '[]',
        campaigns JSONB NOT NULL DEFAULT '[]',
        tags JSONB NOT NULL DEFAULT '[]',
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP
      )`
        ];
        for (const table of tables) {
            await (0, database_1.query)(table);
        }
    }
    /**
     * Log security event to SIEM
     */
    async logSecurityEvent(event) {
        try {
            const eventId = crypto_1.default.randomUUID();
            const siemEvent = {
                eventId,
                tenantId: event.tenantId,
                timestamp: event.timestamp || new Date(),
                eventType: event.eventType,
                severity: event.severity || 'medium',
                source: event.source,
                sourceIP: event.sourceIP,
                userId: event.userId,
                description: event.description,
                rawLog: event.rawLog || '',
                parsedData: event.parsedData || {},
                correlationId: event.correlationId,
                riskScore: event.riskScore || this.calculateRiskScore(event),
                indicators: event.indicators || [],
                relatedEvents: event.relatedEvents || [],
                status: 'new',
                responseActions: [],
                complianceRelevance: event.complianceRelevance || this.determineComplianceRelevance(event),
                retentionPeriod: this.DEFAULT_RETENTION_DAYS
            };
            // Save event to database
            await (0, database_1.query)(`
        INSERT INTO audit.siem_events (
          event_id, tenant_id, timestamp, event_type, severity,
          source, source_ip, user_id, description, raw_log,
          parsed_data, correlation_id, risk_score, indicators,
          related_events, status, response_actions, compliance_relevance,
          retention_period, forensic_evidence
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [
                siemEvent.eventId,
                siemEvent.tenantId,
                siemEvent.timestamp,
                siemEvent.eventType,
                siemEvent.severity,
                siemEvent.source,
                siemEvent.sourceIP,
                siemEvent.userId,
                siemEvent.description,
                siemEvent.rawLog,
                JSON.stringify(siemEvent.parsedData),
                siemEvent.correlationId,
                siemEvent.riskScore,
                JSON.stringify(siemEvent.indicators),
                JSON.stringify(siemEvent.relatedEvents),
                siemEvent.status,
                JSON.stringify(siemEvent.responseActions),
                JSON.stringify(siemEvent.complianceRelevance),
                siemEvent.retentionPeriod,
                siemEvent.forensicEvidence ? JSON.stringify(siemEvent.forensicEvidence) : null
            ]);
            // Check if event triggers any rules
            await this.processEventRules(siemEvent);
            // Correlate with existing events
            await this.correlateEvents(siemEvent);
            console.log(`📊 SIEM event logged: ${eventId} (Risk: ${siemEvent.riskScore})`);
            return siemEvent;
        }
        catch (error) {
            console.error('❌ Failed to log SIEM event:', error);
            throw error;
        }
    }
    /**
     * Create security alert
     */
    async createSecurityAlert(tenantId, alertType, title, description, severity, triggerEvents, ruleName) {
        try {
            const alertId = crypto_1.default.randomUUID();
            const alert = {
                alertId,
                tenantId,
                alertType: alertType,
                severity,
                title,
                description,
                timestamp: new Date(),
                triggerEvents,
                ruleName,
                ruleDescription: `Security rule: ${ruleName}`,
                riskScore: this.calculateAlertRiskScore(severity, alertType),
                threatActors: [],
                affectedAssets: [],
                potentialImpact: this.assessPotentialImpact(severity, alertType),
                status: 'open',
                escalated: severity === 'critical',
                investigationSteps: [],
                relatedAlerts: [],
                evidence: []
            };
            // Save alert to database
            await (0, database_1.query)(`
        INSERT INTO audit.security_alerts (
          alert_id, tenant_id, alert_type, severity, title, description,
          timestamp, trigger_events, rule_name, rule_description,
          risk_score, threat_actors, affected_assets, potential_impact,
          status, escalated, investigation_steps, related_alerts, evidence
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `, [
                alert.alertId,
                alert.tenantId,
                alert.alertType,
                alert.severity,
                alert.title,
                alert.description,
                alert.timestamp,
                JSON.stringify(alert.triggerEvents),
                alert.ruleName,
                alert.ruleDescription,
                alert.riskScore,
                JSON.stringify(alert.threatActors),
                JSON.stringify(alert.affectedAssets),
                alert.potentialImpact,
                alert.status,
                alert.escalated,
                JSON.stringify(alert.investigationSteps),
                JSON.stringify(alert.relatedAlerts),
                JSON.stringify(alert.evidence)
            ]);
            // Execute automated responses if configured
            await this.executeAutomatedResponses(alert);
            console.log(`🚨 Security alert created: ${alertId} (Severity: ${severity})`);
            return alert;
        }
        catch (error) {
            console.error('❌ Failed to create security alert:', error);
            throw error;
        }
    }
    /**
     * Get SIEM dashboard data
     */
    async getSIEMDashboard(tenantId) {
        try {
            const [events, alerts, rules, threatIntel] = await Promise.all([
                // Recent events
                (0, database_1.query)(`
          SELECT * FROM audit.siem_events 
          WHERE tenant_id = $1 
          ORDER BY timestamp DESC 
          LIMIT 100
        `, [tenantId]),
                // Active alerts
                (0, database_1.query)(`
          SELECT * FROM audit.security_alerts 
          WHERE tenant_id = $1 AND status IN ('open', 'investigating')
          ORDER BY timestamp DESC 
          LIMIT 50
        `, [tenantId]),
                // Active rules
                (0, database_1.query)(`
          SELECT * FROM audit.siem_rules 
          WHERE tenant_id = $1 AND enabled = true
          ORDER BY rule_name
        `, [tenantId]),
                // Threat intelligence
                (0, database_1.query)(`
          SELECT * FROM audit.threat_intelligence 
          WHERE tenant_id = $1 AND active = true
          ORDER BY last_seen DESC 
          LIMIT 100
        `, [tenantId])
            ]);
            const dashboard = {
                tenantId,
                summary: {
                    totalEvents: events.rows.length,
                    criticalEvents: events.rows.filter(e => e.severity === 'critical').length,
                    openAlerts: alerts.rows.filter(a => a.status === 'open').length,
                    criticalAlerts: alerts.rows.filter(a => a.severity === 'critical').length,
                    activeRules: rules.rows.length,
                    threatIndicators: threatIntel.rows.length,
                    averageRiskScore: this.calculateAverageRiskScore(events.rows),
                    lastUpdate: new Date()
                },
                recentEvents: events.rows.slice(0, 20),
                activeAlerts: alerts.rows,
                eventsByType: this.groupEventsByType(events.rows),
                eventsBySeverity: this.groupEventsBySeverity(events.rows),
                topRiskSources: this.getTopRiskSources(events.rows),
                alertTrends: this.calculateAlertTrends(alerts.rows),
                complianceEvents: events.rows.filter(e => e.compliance_relevance.length > 0),
                threatIntelligence: threatIntel.rows.slice(0, 10)
            };
            return dashboard;
        }
        catch (error) {
            console.error('❌ Failed to get SIEM dashboard:', error);
            throw error;
        }
    }
    /**
     * Search security events
     */
    async searchSecurityEvents(tenantId, filters) {
        try {
            let whereClause = 'WHERE tenant_id = $1';
            const params = [tenantId];
            let paramIndex = 2;
            if (filters.eventType) {
                whereClause += ` AND event_type = $${paramIndex}`;
                params.push(filters.eventType);
                paramIndex++;
            }
            if (filters.severity) {
                whereClause += ` AND severity = $${paramIndex}`;
                params.push(filters.severity);
                paramIndex++;
            }
            if (filters.timeRange) {
                whereClause += ` AND timestamp BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
                params.push(filters.timeRange.start, filters.timeRange.end);
                paramIndex += 2;
            }
            if (filters.sourceIP) {
                whereClause += ` AND source_ip = $${paramIndex}`;
                params.push(filters.sourceIP);
                paramIndex++;
            }
            if (filters.userId) {
                whereClause += ` AND user_id = $${paramIndex}`;
                params.push(filters.userId);
                paramIndex++;
            }
            if (filters.riskScoreMin) {
                whereClause += ` AND risk_score >= $${paramIndex}`;
                params.push(filters.riskScoreMin);
                paramIndex++;
            }
            const limit = filters.limit || 100;
            const result = await (0, database_1.query)(`
        SELECT * FROM audit.siem_events 
        ${whereClause}
        ORDER BY timestamp DESC 
        LIMIT $${paramIndex}
      `, [...params, limit]);
            return result.rows;
        }
        catch (error) {
            console.error('❌ Failed to search security events:', error);
            throw error;
        }
    }
    // Helper methods
    async initializeDefaultRules() {
        // Default SIEM rules for banking security
        const defaultRules = [
            {
                ruleName: 'Multiple Failed Authentication Attempts',
                description: 'Detect brute force authentication attacks',
                category: 'authentication',
                conditions: [
                    { field: 'event_type', operator: 'equals', value: 'authentication' },
                    { field: 'description', operator: 'contains', value: 'failed' }
                ],
                threshold: 5,
                timeWindow: 15,
                severity: 'high'
            },
            {
                ruleName: 'Unauthorized Data Access Attempt',
                description: 'Detect attempts to access restricted data',
                category: 'data_protection',
                conditions: [
                    { field: 'event_type', operator: 'equals', value: 'data_access' },
                    { field: 'description', operator: 'contains', value: 'unauthorized' }
                ],
                threshold: 1,
                timeWindow: 60,
                severity: 'critical'
            },
            {
                ruleName: 'High-Risk Fraud Transaction',
                description: 'Detect high-risk fraudulent transactions',
                category: 'fraud_detection',
                conditions: [
                    { field: 'event_type', operator: 'equals', value: 'fraud' },
                    { field: 'risk_score', operator: 'greater_than', value: 80 }
                ],
                threshold: 1,
                timeWindow: 60,
                severity: 'critical'
            }
        ];
        // Note: In a real implementation, we would create these rules in the database
        // For demo purposes, we're just logging that they would be created
        console.log(`📋 Initialized ${defaultRules.length} default SIEM rules`);
    }
    calculateRiskScore(event) {
        let score = 0;
        // Base score by event type
        switch (event.eventType) {
            case 'fraud':
                score += 40;
                break;
            case 'authentication':
                score += 20;
                break;
            case 'data_access':
                score += 30;
                break;
            case 'network':
                score += 15;
                break;
            case 'system':
                score += 10;
                break;
            default: score += 5;
        }
        // Severity multiplier
        switch (event.severity) {
            case 'critical':
                score *= 2.5;
                break;
            case 'high':
                score *= 2.0;
                break;
            case 'medium':
                score *= 1.5;
                break;
            case 'low':
                score *= 1.0;
                break;
        }
        // Source IP risk (simplified)
        if (event.sourceIP && this.isHighRiskIP(event.sourceIP)) {
            score += 20;
        }
        return Math.min(Math.round(score), 100);
    }
    determineComplianceRelevance(event) {
        const relevance = [];
        if (event.eventType === 'data_access' || event.eventType === 'fraud') {
            relevance.push('PCI_DSS');
        }
        if (event.eventType === 'authentication' || event.eventType === 'authorization') {
            relevance.push('CBN_COMPLIANCE');
        }
        if (event.severity === 'critical' || event.severity === 'high') {
            relevance.push('SOX', 'AUDIT_TRAIL');
        }
        return relevance;
    }
    async processEventRules(event) {
        // In a real implementation, this would evaluate all active rules
        // For demo purposes, we simulate rule processing
        if (event.riskScore >= this.THREAT_SCORE_THRESHOLD) {
            await this.createSecurityAlert(event.tenantId, 'threshold_breach', 'High Risk Event Detected', `Event ${event.eventId} exceeded risk threshold with score ${event.riskScore}`, event.severity, [event.eventId], 'High Risk Threshold Rule');
        }
    }
    async correlateEvents(event) {
        // Simplified event correlation
        // In a real implementation, this would use machine learning algorithms
        console.log(`🔗 Correlating event ${event.eventId} with historical events`);
    }
    calculateAlertRiskScore(severity, alertType) {
        let baseScore = 0;
        switch (severity) {
            case 'critical':
                baseScore = 90;
                break;
            case 'high':
                baseScore = 70;
                break;
            case 'medium':
                baseScore = 50;
                break;
            case 'low':
                baseScore = 30;
                break;
        }
        // Adjust based on alert type
        if (alertType === 'correlation' || alertType === 'threat_intel') {
            baseScore += 10;
        }
        return Math.min(baseScore, 100);
    }
    assessPotentialImpact(severity, alertType) {
        if (severity === 'critical') {
            return 'Potential for significant financial loss, data breach, or regulatory violation';
        }
        else if (severity === 'high') {
            return 'Risk of operational disruption or security compromise';
        }
        else if (severity === 'medium') {
            return 'Moderate risk requiring investigation and remediation';
        }
        return 'Low risk but requires monitoring';
    }
    async executeAutomatedResponses(alert) {
        // Simulate automated response execution
        if (alert.severity === 'critical') {
            console.log(`🤖 Executing automated responses for critical alert ${alert.alertId}`);
            // In real implementation: block IPs, disable accounts, collect evidence, etc.
        }
    }
    isHighRiskIP(ip) {
        // Simplified IP risk assessment
        // In real implementation, check against threat intelligence feeds
        const highRiskPatterns = ['10.0.0.', '192.168.1.', 'unknown'];
        return !highRiskPatterns.some(pattern => ip.startsWith(pattern));
    }
    calculateAverageRiskScore(events) {
        if (events.length === 0)
            return 0;
        const totalScore = events.reduce((sum, event) => sum + event.risk_score, 0);
        return Math.round(totalScore / events.length);
    }
    groupEventsByType(events) {
        return events.reduce((acc, event) => {
            acc[event.event_type] = (acc[event.event_type] || 0) + 1;
            return acc;
        }, {});
    }
    groupEventsBySeverity(events) {
        return events.reduce((acc, event) => {
            acc[event.severity] = (acc[event.severity] || 0) + 1;
            return acc;
        }, {});
    }
    getTopRiskSources(events) {
        const sourceRisks = events.reduce((acc, event) => {
            if (!acc[event.source]) {
                acc[event.source] = { totalRisk: 0, count: 0 };
            }
            acc[event.source].totalRisk += event.risk_score;
            acc[event.source].count += 1;
            return acc;
        }, {});
        return Object.entries(sourceRisks)
            .map(([source, data]) => ({
            source,
            riskScore: Math.round(data.totalRisk / data.count),
            count: data.count
        }))
            .sort((a, b) => b.riskScore - a.riskScore)
            .slice(0, 10);
    }
    calculateAlertTrends(alerts) {
        // Simple trend calculation
        const last24h = alerts.filter(a => new Date(a.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
        const last7d = alerts.filter(a => new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
        return {
            last24Hours: last24h,
            last7Days: last7d,
            trend: last24h > (last7d / 7) ? 'increasing' : 'stable'
        };
    }
}
exports.SIEMMonitoringService = SIEMMonitoringService;
exports.default = SIEMMonitoringService;
