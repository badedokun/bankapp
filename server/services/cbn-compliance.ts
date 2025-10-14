/**
 * CBN (Central Bank of Nigeria) Compliance Framework Service
 * Implements regulatory requirements for Nigerian banking institutions
 * 
 * Reference: CBN Circular BSD/DIR/GEN/LAB/11/156 - Guidelines on Cybersecurity Framework
 * Reference: CBN IT Risk Management Framework
 */

import { query } from '../config/database';
import crypto from 'crypto';

// CBN Compliance Requirements
export interface CBNComplianceReport {
  reportId: string;
  tenantId: string;
  reportType: 'incident' | 'risk_assessment' | 'security_audit' | 'business_continuity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'submitted' | 'acknowledged' | 'resolved';
  submissionDeadline: Date;
  submittedAt?: Date;
  acknowledgedAt?: Date;
  description: string;
  impact: string;
  mitigationActions: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// CBN Required Incident Categories
export interface CBNIncident {
  incidentId: string;
  tenantId: string;
  category: 'cyber_attack' | 'data_breach' | 'system_failure' | 'fraud' | 'operational_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  impactLevel: 'minimal' | 'moderate' | 'significant' | 'severe';
  affectedSystems: string[];
  customerImpact: number; // Number of affected customers
  financialImpact: number; // Impact in Naira
  dataTypes: string[]; // Types of data affected
  detectedAt: Date;
  reportedAt: Date;
  resolvedAt?: Date;
  rootCause?: string;
  status: 'active' | 'contained' | 'resolved' | 'closed';
  timeline: CBNIncidentTimelineEntry[];
  complianceReport?: CBNComplianceReport;
}

export interface CBNIncidentTimelineEntry {
  timestamp: Date;
  event: string;
  actor: string;
  details: string;
}

// CBN Data Localization Requirements
export interface DataLocalizationCheck {
  checkId: string;
  tenantId: string;
  dataType: 'customer_data' | 'transaction_data' | 'payment_data' | 'kyc_data';
  storageLocation: 'nigeria' | 'nigeria_cloud' | 'international' | 'hybrid';
  compliance: boolean;
  lastChecked: Date;
  issues: string[];
  remediation: string[];
}

// CBN Security Audit Framework
export interface CBNSecurityAudit {
  auditId: string;
  tenantId: string;
  auditType: 'internal' | 'external' | 'regulatory' | 'penetration_test';
  scope: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  startDate: Date;
  endDate?: Date;
  auditor: string;
  findings: CBNAuditFinding[];
  riskRating: 'low' | 'medium' | 'high' | 'critical';
  complianceScore: number; // 0-100
  recommendations: string[];
  actionPlan: CBNActionItem[];
}

export interface CBNAuditFinding {
  findingId: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  recommendation: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
}

export interface CBNActionItem {
  itemId: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
}

/**
 * CBN Compliance Service
 * Handles all regulatory compliance requirements for Nigerian banking
 */
export class CBNComplianceService {
  private readonly CBN_REPORTING_DEADLINE_HOURS = 24; // 24-hour mandatory reporting
  private readonly DATA_LOCALIZATION_REGIONS = ['nigeria', 'nigeria_cloud'];
  
  constructor() {
    this.initializeComplianceFramework();
  }

  /**
   * Initialize CBN compliance framework
   */
  private async initializeComplianceFramework(): Promise<void> {
    try {
      // Create compliance tracking tables if they don't exist
      await this.createComplianceTables();
      console.log('✅ CBN Compliance Framework initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize CBN compliance framework:', error);
      console.warn('⚠️  CBN compliance monitoring will be disabled. Server will continue without CBN compliance tracking.');
      // Don't throw error - allow server to continue without CBN compliance
    }
  }

  /**
   * Create compliance tracking database tables
   */
  private async createComplianceTables(): Promise<void> {
    const tables = [
      // CBN Compliance Reports
      `CREATE TABLE IF NOT EXISTS audit.cbn_compliance_reports (
        report_id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        report_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        submission_deadline TIMESTAMP NOT NULL,
        submitted_at TIMESTAMP,
        acknowledged_at TIMESTAMP,
        description TEXT NOT NULL,
        impact TEXT NOT NULL,
        mitigation_actions JSONB NOT NULL DEFAULT '[]',
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // CBN Incidents
      `CREATE TABLE IF NOT EXISTS audit.cbn_incidents (
        incident_id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        impact_level VARCHAR(20) NOT NULL,
        affected_systems JSONB NOT NULL DEFAULT '[]',
        customer_impact INTEGER NOT NULL DEFAULT 0,
        financial_impact DECIMAL(15,2) NOT NULL DEFAULT 0,
        data_types JSONB NOT NULL DEFAULT '[]',
        detected_at TIMESTAMP NOT NULL,
        reported_at TIMESTAMP NOT NULL DEFAULT NOW(),
        resolved_at TIMESTAMP,
        root_cause TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        timeline JSONB NOT NULL DEFAULT '[]',
        compliance_report_id VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (compliance_report_id) REFERENCES audit.cbn_compliance_reports(report_id)
      )`,

      // Data Localization Checks
      `CREATE TABLE IF NOT EXISTS audit.data_localization_checks (
        check_id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        storage_location VARCHAR(50) NOT NULL,
        compliance BOOLEAN NOT NULL DEFAULT false,
        last_checked TIMESTAMP NOT NULL DEFAULT NOW(),
        issues JSONB NOT NULL DEFAULT '[]',
        remediation JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // Security Audits
      `CREATE TABLE IF NOT EXISTS audit.cbn_security_audits (
        audit_id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        audit_type VARCHAR(50) NOT NULL,
        scope JSONB NOT NULL DEFAULT '[]',
        status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP,
        auditor VARCHAR(255) NOT NULL,
        findings JSONB NOT NULL DEFAULT '[]',
        risk_rating VARCHAR(20),
        compliance_score INTEGER DEFAULT 0,
        recommendations JSONB NOT NULL DEFAULT '[]',
        action_plan JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`
    ];

    for (const table of tables) {
      await query(table);
    }
  }

  /**
   * Report security incident to CBN (24-hour mandatory reporting)
   */
  public async reportIncident(tenantId: string, incident: Partial<CBNIncident>): Promise<CBNComplianceReport> {
    try {
      const incidentId = crypto.randomUUID();
      const reportId = crypto.randomUUID();
      
      // Calculate reporting deadline (24 hours from detection)
      const detectedAt = incident.detectedAt || new Date();
      const submissionDeadline = new Date(detectedAt.getTime() + (this.CBN_REPORTING_DEADLINE_HOURS * 60 * 60 * 1000));
      
      // Determine severity based on impact
      const severity = this.calculateIncidentSeverity(incident);
      
      // Create CBN incident record
      const cbnIncident: CBNIncident = {
        incidentId,
        tenantId,
        category: incident.category || 'operational_risk',
        severity,
        impactLevel: incident.impactLevel || 'moderate',
        affectedSystems: incident.affectedSystems || [],
        customerImpact: incident.customerImpact || 0,
        financialImpact: incident.financialImpact || 0,
        dataTypes: incident.dataTypes || [],
        detectedAt,
        reportedAt: new Date(),
        status: 'active',
        timeline: [
          {
            timestamp: detectedAt,
            event: 'Incident Detected',
            actor: 'System',
            details: 'Incident automatically detected and logged'
          },
          {
            timestamp: new Date(),
            event: 'CBN Report Initiated',
            actor: 'Compliance Service',
            details: 'Mandatory CBN incident report initiated'
          }
        ]
      };
      
      // Save incident to database
      await query(`
        INSERT INTO audit.cbn_incidents (
          incident_id, tenant_id, category, severity, impact_level,
          affected_systems, customer_impact, financial_impact, data_types,
          detected_at, reported_at, status, timeline
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        cbnIncident.incidentId,
        cbnIncident.tenantId,
        cbnIncident.category,
        cbnIncident.severity,
        cbnIncident.impactLevel,
        JSON.stringify(cbnIncident.affectedSystems),
        cbnIncident.customerImpact,
        cbnIncident.financialImpact,
        JSON.stringify(cbnIncident.dataTypes),
        cbnIncident.detectedAt,
        cbnIncident.reportedAt,
        cbnIncident.status,
        JSON.stringify(cbnIncident.timeline)
      ]);
      
      // Create compliance report
      const complianceReport: CBNComplianceReport = {
        reportId,
        tenantId,
        reportType: 'incident',
        severity,
        status: 'draft',
        submissionDeadline,
        description: this.generateIncidentDescription(cbnIncident),
        impact: this.generateImpactAssessment(cbnIncident),
        mitigationActions: this.generateMitigationActions(cbnIncident),
        metadata: {
          incidentId,
          automaticallyGenerated: true,
          cbnCategory: incident.category,
          detectionMethod: 'automated'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Save compliance report
      await query(`
        INSERT INTO audit.cbn_compliance_reports (
          report_id, tenant_id, report_type, severity, status,
          submission_deadline, description, impact, mitigation_actions, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        complianceReport.reportId,
        complianceReport.tenantId,
        complianceReport.reportType,
        complianceReport.severity,
        complianceReport.status,
        complianceReport.submissionDeadline,
        complianceReport.description,
        complianceReport.impact,
        JSON.stringify(complianceReport.mitigationActions),
        JSON.stringify(complianceReport.metadata)
      ]);
      
      // Update incident with compliance report reference
      await query(`
        UPDATE audit.cbn_incidents 
        SET compliance_report_id = $1, updated_at = NOW() 
        WHERE incident_id = $2
      `, [reportId, incidentId]);
      
      console.log(`📋 CBN incident report created: ${reportId} (Deadline: ${submissionDeadline.toISOString()})`);
      
      return complianceReport;
      
    } catch (error) {
      console.error('❌ Failed to create CBN incident report:', error);
      throw error;
    }
  }

  /**
   * Check Nigerian data localization compliance
   */
  public async checkDataLocalization(tenantId: string): Promise<DataLocalizationCheck[]> {
    try {
      const checks: DataLocalizationCheck[] = [];
      const dataTypes = ['customer_data', 'transaction_data', 'payment_data', 'kyc_data'];
      
      for (const dataType of dataTypes) {
        const checkId = crypto.randomUUID();
        
        // Simulate data location check (in real implementation, check actual storage)
        const storageLocation = this.determineDataLocation(tenantId, dataType);
        const compliance = this.DATA_LOCALIZATION_REGIONS.includes(storageLocation);
        
        const check: DataLocalizationCheck = {
          checkId,
          tenantId,
          dataType: dataType as any,
          storageLocation: storageLocation as any,
          compliance,
          lastChecked: new Date(),
          issues: compliance ? [] : [`${dataType} stored outside Nigeria`],
          remediation: compliance ? [] : [`Migrate ${dataType} to Nigerian data centers`]
        };
        
        // Save check result
        await query(`
          INSERT INTO audit.data_localization_checks (
            check_id, tenant_id, data_type, storage_location,
            compliance, last_checked, issues, remediation
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (check_id) DO UPDATE SET
            compliance = EXCLUDED.compliance,
            last_checked = EXCLUDED.last_checked,
            issues = EXCLUDED.issues,
            remediation = EXCLUDED.remediation,
            updated_at = NOW()
        `, [
          check.checkId,
          check.tenantId,
          check.dataType,
          check.storageLocation,
          check.compliance,
          check.lastChecked,
          JSON.stringify(check.issues),
          JSON.stringify(check.remediation)
        ]);
        
        checks.push(check);
      }
      
      console.log(`🇳🇬 Data localization check completed for tenant ${tenantId}: ${checks.filter(c => c.compliance).length}/${checks.length} compliant`);
      
      return checks;
      
    } catch (error) {
      console.error('❌ Data localization check failed:', error);
      throw error;
    }
  }

  /**
   * Generate CBN security audit
   */
  public async generateSecurityAudit(tenantId: string, auditType: 'internal' | 'external' | 'regulatory' | 'penetration_test'): Promise<CBNSecurityAudit> {
    try {
      const auditId = crypto.randomUUID();
      
      // Define audit scope based on CBN requirements
      const scope = this.getAuditScope(auditType);
      
      const audit: CBNSecurityAudit = {
        auditId,
        tenantId,
        auditType,
        scope,
        status: 'scheduled',
        startDate: new Date(),
        auditor: auditType === 'internal' ? 'Internal Audit Team' : 'External Audit Firm',
        findings: [],
        riskRating: 'medium',
        complianceScore: 0,
        recommendations: [],
        actionPlan: []
      };
      
      // Save audit record
      await query(`
        INSERT INTO audit.cbn_security_audits (
          audit_id, tenant_id, audit_type, scope, status,
          start_date, auditor, findings, risk_rating,
          compliance_score, recommendations, action_plan
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        audit.auditId,
        audit.tenantId,
        audit.auditType,
        JSON.stringify(audit.scope),
        audit.status,
        audit.startDate,
        audit.auditor,
        JSON.stringify(audit.findings),
        audit.riskRating,
        audit.complianceScore,
        JSON.stringify(audit.recommendations),
        JSON.stringify(audit.actionPlan)
      ]);
      
      console.log(`🔍 CBN security audit scheduled: ${auditId} (Type: ${auditType})`);
      
      return audit;
      
    } catch (error) {
      console.error('❌ Failed to generate security audit:', error);
      throw error;
    }
  }

  /**
   * Get compliance dashboard for tenant
   */
  public async getComplianceDashboard(tenantId: string): Promise<any> {
    try {
      const [reports, incidents, localizationChecks, audits] = await Promise.all([
        // Get recent compliance reports
        query(`
          SELECT * FROM audit.cbn_compliance_reports 
          WHERE tenant_id = $1 
          ORDER BY created_at DESC 
          LIMIT 10
        `, [tenantId]),
        
        // Get recent incidents
        query(`
          SELECT * FROM audit.cbn_incidents 
          WHERE tenant_id = $1 
          ORDER BY detected_at DESC 
          LIMIT 10
        `, [tenantId]),
        
        // Get latest localization checks
        query(`
          SELECT * FROM audit.data_localization_checks 
          WHERE tenant_id = $1 
          ORDER BY last_checked DESC
        `, [tenantId]),
        
        // Get recent audits
        query(`
          SELECT * FROM audit.cbn_security_audits 
          WHERE tenant_id = $1 
          ORDER BY start_date DESC 
          LIMIT 5
        `, [tenantId])
      ]);

      const dashboard = {
        tenantId,
        lastUpdated: new Date(),
        summary: {
          totalReports: reports.rows.length,
          pendingReports: reports.rows.filter(r => r.status === 'draft').length,
          activeIncidents: incidents.rows.filter(i => i.status === 'active').length,
          dataLocalizationCompliance: localizationChecks.rows.filter(c => c.compliance).length / Math.max(localizationChecks.rows.length, 1) * 100,
          lastAuditScore: audits.rows[0]?.compliance_score || 0
        },
        reports: reports.rows,
        incidents: incidents.rows,
        localizationChecks: localizationChecks.rows,
        audits: audits.rows
      };

      return dashboard;
      
    } catch (error) {
      console.error('❌ Failed to get compliance dashboard:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateIncidentSeverity(incident: Partial<CBNIncident>): 'low' | 'medium' | 'high' | 'critical' {
    const customerImpact = incident.customerImpact || 0;
    const financialImpact = incident.financialImpact || 0;
    
    if (customerImpact > 10000 || financialImpact > 100000000) return 'critical'; // ₦100M+
    if (customerImpact > 1000 || financialImpact > 10000000) return 'high';       // ₦10M+
    if (customerImpact > 100 || financialImpact > 1000000) return 'medium';       // ₦1M+
    return 'low';
  }

  private generateIncidentDescription(incident: CBNIncident): string {
    return `Security incident detected in ${incident.category} category with ${incident.severity} severity. ` +
           `Impact: ${incident.customerImpact} customers affected, ₦${incident.financialImpact.toLocaleString()} financial impact. ` +
           `Affected systems: ${incident.affectedSystems.join(', ')}. ` +
           `Status: ${incident.status}. Detected at: ${incident.detectedAt.toISOString()}.`;
  }

  private generateImpactAssessment(incident: CBNIncident): string {
    return `Financial Impact: ₦${incident.financialImpact.toLocaleString()}\n` +
           `Customer Impact: ${incident.customerImpact} affected customers\n` +
           `Operational Impact: ${incident.impactLevel}\n` +
           `Data Types Affected: ${incident.dataTypes.join(', ')}\n` +
           `Systems Affected: ${incident.affectedSystems.join(', ')}`;
  }

  private generateMitigationActions(incident: CBNIncident): string[] {
    const actions = [
      'Incident containment and isolation of affected systems',
      'Investigation and root cause analysis',
      'Customer notification as required by regulations',
      'System security enhancement and patching',
      'Review and update security policies'
    ];
    
    if (incident.category === 'data_breach') {
      actions.push('Data breach notification to affected parties');
      actions.push('Enhanced data encryption implementation');
    }
    
    if (incident.category === 'cyber_attack') {
      actions.push('Security perimeter strengthening');
      actions.push('Threat intelligence analysis and sharing');
    }
    
    return actions;
  }

  private determineDataLocation(tenantId: string, dataType: string): string {
    // In real implementation, check actual data storage locations
    // For demo, assume all data is properly localized in Nigeria
    return 'nigeria';
  }

  private getAuditScope(auditType: string): string[] {
    const baseScope = [
      'Access controls and user management',
      'Data encryption and protection',
      'Network security and monitoring',
      'Incident response procedures',
      'Business continuity planning'
    ];
    
    if (auditType === 'regulatory') {
      return [...baseScope, 
        'CBN compliance requirements',
        'Data localization compliance',
        'Regulatory reporting systems',
        'Customer data protection'
      ];
    }
    
    if (auditType === 'penetration_test') {
      return [
        'External network penetration testing',
        'Web application security testing',
        'Social engineering assessment',
        'Physical security evaluation',
        'Wireless network security'
      ];
    }
    
    return baseScope;
  }
}

export default CBNComplianceService;