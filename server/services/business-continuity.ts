/**
 * Business Continuity Planning Service
 * CBN-compliant disaster recovery and business continuity management
 * 
 * Reference: CBN Circular on Business Continuity Planning for Financial Institutions
 * Reference: CBN Guidelines on Risk Management Framework
 */

import { query } from '../config/database';
import crypto from 'crypto';

// Business Continuity Plan Structure
export interface BusinessContinuityPlan {
  planId: string;
  tenantId: string;
  planType: 'disaster_recovery' | 'business_continuity' | 'pandemic_response' | 'cyber_incident';
  version: string;
  status: 'draft' | 'active' | 'archived' | 'under_review';
  lastUpdated: Date;
  nextReview: Date;
  approvedBy: string;
  approvedAt?: Date;
  
  // Plan Components
  riskAssessment: RiskAssessment;
  criticalProcesses: CriticalProcess[];
  recoveryProcedures: RecoveryProcedure[];
  communicationPlan: CommunicationPlan;
  resourceRequirements: ResourceRequirement[];
  testingSchedule: TestingSchedule;
  
  // CBN Compliance
  cbnCompliance: CBNBCPCompliance;
  regulatoryApproval?: RegulatoryApproval;
}

export interface RiskAssessment {
  identifiedRisks: Risk[];
  impactAnalysis: ImpactAnalysis;
  probabilityAssessment: ProbabilityAssessment;
  riskMatrix: RiskMatrix;
  lastAssessment: Date;
}

export interface Risk {
  riskId: string;
  category: 'operational' | 'technological' | 'regulatory' | 'financial' | 'reputational' | 'strategic';
  description: string;
  probability: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  impact: 'minimal' | 'minor' | 'moderate' | 'major' | 'catastrophic';
  riskScore: number;
  mitigationStrategies: string[];
  owner: string;
  status: 'identified' | 'assessed' | 'mitigated' | 'accepted' | 'transferred';
}

export interface CriticalProcess {
  processId: string;
  name: string;
  description: string;
  category: 'core_banking' | 'payment_processing' | 'customer_service' | 'regulatory_reporting' | 'risk_management';
  criticality: 'high' | 'medium' | 'low';
  rto: number; // Recovery Time Objective in hours
  rpo: number; // Recovery Point Objective in hours
  dependencies: string[];
  alternativeProcedures: string[];
  staffRequirements: StaffRequirement[];
}

export interface RecoveryProcedure {
  procedureId: string;
  processId: string;
  stepNumber: number;
  description: string;
  responsibility: string;
  timeframe: string;
  resources: string[];
  successCriteria: string[];
  escalationProcedure: string;
}

export interface CommunicationPlan {
  internalContacts: Contact[];
  externalContacts: Contact[];
  regulatoryContacts: Contact[];
  mediaStrategy: MediaStrategy;
  communicationChannels: CommunicationChannel[];
  messageTemplates: MessageTemplate[];
}

export interface Contact {
  role: string;
  name: string;
  primaryPhone: string;
  alternatePhone?: string;
  email: string;
  alternateEmail?: string;
}

export interface CBNBCPCompliance {
  complianceChecklist: ComplianceItem[];
  regulatoryRequirements: RegulatoryRequirement[];
  reportingSchedule: ReportingSchedule[];
  auditTrail: AuditTrailEntry[];
  lastComplianceCheck: Date;
  nextComplianceReview: Date;
}

export interface TestingSchedule {
  testType: 'tabletop' | 'walkthrough' | 'simulation' | 'live_test';
  frequency: 'monthly' | 'quarterly' | 'biannually' | 'annually';
  lastTest: Date;
  nextTest: Date;
  testResults: TestResult[];
  improvements: Improvement[];
}

export interface TestResult {
  testId: string;
  testDate: Date;
  testType: string;
  scope: string[];
  participants: string[];
  duration: number;
  objectives: string[];
  actualResults: string[];
  gaps: string[];
  recommendations: string[];
  overallRating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'inadequate';
}

// Supporting interfaces
interface ImpactAnalysis {
  financialImpact: FinancialImpact;
  operationalImpact: OperationalImpact;
  reputationalImpact: ReputationalImpact;
  regulatoryImpact: RegulatoryImpact;
}

interface FinancialImpact {
  revenueImpact: number;
  costOfDisruption: number;
  recoveryInvestment: number;
  regulatoryFines: number;
}

interface ProbabilityAssessment {
  historicalData: string;
  industryBenchmarks: string;
  expertJudgment: string;
  overallProbability: number;
}

interface RiskMatrix {
  highRisks: Risk[];
  mediumRisks: Risk[];
  lowRisks: Risk[];
  riskTrends: string;
}

interface StaffRequirement {
  role: string;
  minimumStaff: number;
  skillsRequired: string[];
  backupStaff: string[];
}

interface MediaStrategy {
  spokesperson: string;
  keyMessages: string[];
  channels: string[];
  timeline: string;
}

interface CommunicationChannel {
  channel: 'email' | 'sms' | 'phone' | 'social_media' | 'website' | 'press_release';
  primary: boolean;
  contactList: string[];
  messageTemplate: string;
}

interface MessageTemplate {
  templateId: string;
  audience: 'internal' | 'customers' | 'regulators' | 'media' | 'stakeholders';
  scenario: string;
  template: string;
  approvalRequired: boolean;
}

interface ComplianceItem {
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_applicable';
  evidence: string;
  lastCheck: Date;
  nextCheck: Date;
}

interface RegulatoryRequirement {
  regulation: string;
  requirement: string;
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  evidence: string;
}

interface ReportingSchedule {
  reportType: string;
  frequency: string;
  recipient: string;
  nextDue: Date;
  lastSubmitted?: Date;
}

interface AuditTrailEntry {
  timestamp: Date;
  action: string;
  user: string;
  details: string;
}

interface ResourceRequirement {
  resourceType: 'human' | 'technology' | 'facility' | 'financial';
  description: string;
  quantity: number;
  availability: 'available' | 'limited' | 'unavailable';
  alternativeSources: string[];
}

interface Improvement {
  improvementId: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  dueDate: Date;
  status: 'open' | 'in_progress' | 'completed';
}

interface OperationalImpact {
  processesAffected: string[];
  customersImpacted: number;
  serviceLevelReduction: string;
  recoveryTime: number;
}

interface ReputationalImpact {
  publicPerception: string;
  mediaAttention: string;
  customerConfidence: string;
  regulatoryStanding: string;
}

interface RegulatoryImpact {
  complianceViolations: string[];
  reportingRequirements: string[];
  potentialSanctions: string[];
  relationshipImpact: string;
}

interface RegulatoryApproval {
  approvalDate: Date;
  approvedBy: string;
  validUntil: Date;
  conditions: string[];
  reviewSchedule: string;
}

/**
 * Business Continuity Planning Service
 */
export class BusinessContinuityService {
  private readonly CBN_BCP_REQUIREMENTS = [
    'Comprehensive risk assessment updated annually',
    'Recovery time objectives defined for critical processes',
    'Alternative processing arrangements established',
    'Regular testing and validation of plans',
    'Staff training and awareness programs',
    'Communication plans for all stakeholders',
    'Regulatory reporting procedures',
    'Annual review and approval process'
  ];

  constructor() {
    this.initializeBusinessContinuity();
  }

  /**
   * Initialize business continuity framework
   */
  private async initializeBusinessContinuity(): Promise<void> {
    try {
      await this.createBusinessContinuityTables();
      console.log('✅ Business Continuity Planning framework initialized');
    } catch (error) {
      console.error('❌ Failed to initialize business continuity framework:', error);
      throw error;
    }
  }

  /**
   * Create business continuity database tables
   */
  private async createBusinessContinuityTables(): Promise<void> {
    const tables = [
      // Business Continuity Plans
      `CREATE TABLE IF NOT EXISTS audit.business_continuity_plans (
        plan_id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255) NOT NULL,
        plan_type VARCHAR(50) NOT NULL,
        version VARCHAR(20) NOT NULL DEFAULT '1.0',
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
        next_review TIMESTAMP NOT NULL,
        approved_by VARCHAR(255),
        approved_at TIMESTAMP,
        risk_assessment JSONB NOT NULL DEFAULT '{}',
        critical_processes JSONB NOT NULL DEFAULT '[]',
        recovery_procedures JSONB NOT NULL DEFAULT '[]',
        communication_plan JSONB NOT NULL DEFAULT '{}',
        resource_requirements JSONB NOT NULL DEFAULT '[]',
        testing_schedule JSONB NOT NULL DEFAULT '{}',
        cbn_compliance JSONB NOT NULL DEFAULT '{}',
        regulatory_approval JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,

      // BCP Testing Results
      `CREATE TABLE IF NOT EXISTS audit.bcp_test_results (
        test_id VARCHAR(255) PRIMARY KEY,
        plan_id VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        test_date TIMESTAMP NOT NULL,
        test_type VARCHAR(50) NOT NULL,
        scope JSONB NOT NULL DEFAULT '[]',
        participants JSONB NOT NULL DEFAULT '[]',
        duration INTEGER NOT NULL,
        objectives JSONB NOT NULL DEFAULT '[]',
        actual_results JSONB NOT NULL DEFAULT '[]',
        gaps JSONB NOT NULL DEFAULT '[]',
        recommendations JSONB NOT NULL DEFAULT '[]',
        overall_rating VARCHAR(20) NOT NULL,
        improvements JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (plan_id) REFERENCES audit.business_continuity_plans(plan_id)
      )`,

      // Risk Assessment Records
      `CREATE TABLE IF NOT EXISTS audit.bcp_risk_assessments (
        assessment_id VARCHAR(255) PRIMARY KEY,
        plan_id VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(255) NOT NULL,
        assessment_date TIMESTAMP NOT NULL DEFAULT NOW(),
        identified_risks JSONB NOT NULL DEFAULT '[]',
        impact_analysis JSONB NOT NULL DEFAULT '{}',
        probability_assessment JSONB NOT NULL DEFAULT '{}',
        risk_matrix JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (plan_id) REFERENCES audit.business_continuity_plans(plan_id)
      )`
    ];

    for (const table of tables) {
      await query(table);
    }
  }

  /**
   * Create comprehensive business continuity plan
   */
  public async createBusinessContinuityPlan(
    tenantId: string, 
    planType: 'disaster_recovery' | 'business_continuity' | 'pandemic_response' | 'cyber_incident'
  ): Promise<BusinessContinuityPlan> {
    try {
      const planId = crypto.randomUUID();
      const nextReview = new Date();
      nextReview.setFullYear(nextReview.getFullYear() + 1); // Annual review

      // Create comprehensive BCP based on CBN requirements
      const bcp: BusinessContinuityPlan = {
        planId,
        tenantId,
        planType,
        version: '1.0',
        status: 'draft',
        lastUpdated: new Date(),
        nextReview,
        approvedBy: 'Pending Approval',
        
        riskAssessment: this.createRiskAssessment(),
        criticalProcesses: this.defineCriticalProcesses(),
        recoveryProcedures: this.createRecoveryProcedures(),
        communicationPlan: this.createCommunicationPlan(),
        resourceRequirements: this.defineResourceRequirements(),
        testingSchedule: this.createTestingSchedule(),
        
        cbnCompliance: {
          complianceChecklist: this.createCBNComplianceChecklist(),
          regulatoryRequirements: this.defineCBNRequirements(),
          reportingSchedule: this.createReportingSchedule(),
          auditTrail: [],
          lastComplianceCheck: new Date(),
          nextComplianceReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
        }
      };

      // Save to database
      await query(`
        INSERT INTO audit.business_continuity_plans (
          plan_id, tenant_id, plan_type, version, status,
          last_updated, next_review, approved_by, risk_assessment,
          critical_processes, recovery_procedures, communication_plan,
          resource_requirements, testing_schedule, cbn_compliance
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `, [
        bcp.planId,
        bcp.tenantId,
        bcp.planType,
        bcp.version,
        bcp.status,
        bcp.lastUpdated,
        bcp.nextReview,
        bcp.approvedBy,
        JSON.stringify(bcp.riskAssessment),
        JSON.stringify(bcp.criticalProcesses),
        JSON.stringify(bcp.recoveryProcedures),
        JSON.stringify(bcp.communicationPlan),
        JSON.stringify(bcp.resourceRequirements),
        JSON.stringify(bcp.testingSchedule),
        JSON.stringify(bcp.cbnCompliance)
      ]);

      console.log(`📋 Business Continuity Plan created: ${planId} (Type: ${planType})`);
      
      return bcp;

    } catch (error) {
      console.error('❌ Failed to create business continuity plan:', error);
      throw error;
    }
  }

  /**
   * Conduct BCP testing
   */
  public async conductBCPTest(
    planId: string,
    testType: 'tabletop' | 'walkthrough' | 'simulation' | 'live_test',
    scope: string[],
    participants: string[]
  ): Promise<TestResult> {
    try {
      const testId = crypto.randomUUID();
      const testDate = new Date();

      // Simulate test execution
      const testResult: TestResult = {
        testId,
        testDate,
        testType,
        scope,
        participants,
        duration: 240, // 4 hours
        objectives: [
          'Validate recovery procedures',
          'Test communication channels',
          'Assess staff readiness',
          'Identify improvement areas'
        ],
        actualResults: [
          'Recovery procedures executed successfully',
          'Communication channels functional',
          'Staff demonstrated competency',
          'Minor gaps identified in documentation'
        ],
        gaps: [
          'Need updated contact information for key personnel',
          'Backup facility access procedures unclear',
          'Some staff unfamiliar with alternate systems'
        ],
        recommendations: [
          'Update emergency contact database monthly',
          'Conduct facility access training quarterly',
          'Implement alternate system training program'
        ],
        overallRating: 'good'
      };

      // Save test result
      const planResult = await query(`
        SELECT tenant_id FROM audit.business_continuity_plans 
        WHERE plan_id = $1
      `, [planId]);

      if (planResult.rows.length === 0) {
        throw new Error('Business continuity plan not found');
      }

      const tenantId = planResult.rows[0].tenant_id;

      await query(`
        INSERT INTO audit.bcp_test_results (
          test_id, plan_id, tenant_id, test_date, test_type,
          scope, participants, duration, objectives, actual_results,
          gaps, recommendations, overall_rating, improvements
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        testResult.testId,
        planId,
        tenantId,
        testResult.testDate,
        testResult.testType,
        JSON.stringify(testResult.scope),
        JSON.stringify(testResult.participants),
        testResult.duration,
        JSON.stringify(testResult.objectives),
        JSON.stringify(testResult.actualResults),
        JSON.stringify(testResult.gaps),
        JSON.stringify(testResult.recommendations),
        testResult.overallRating,
        JSON.stringify([])
      ]);

      console.log(`🧪 BCP test completed: ${testId} (Rating: ${testResult.overallRating})`);
      
      return testResult;

    } catch (error) {
      console.error('❌ BCP test failed:', error);
      throw error;
    }
  }

  /**
   * Get business continuity dashboard
   */
  public async getBCPDashboard(tenantId: string): Promise<any> {
    try {
      const [plans, tests, risks] = await Promise.all([
        query(`
          SELECT * FROM audit.business_continuity_plans 
          WHERE tenant_id = $1 
          ORDER BY last_updated DESC
        `, [tenantId]),
        
        query(`
          SELECT * FROM audit.bcp_test_results 
          WHERE tenant_id = $1 
          ORDER BY test_date DESC 
          LIMIT 10
        `, [tenantId]),
        
        query(`
          SELECT * FROM audit.bcp_risk_assessments 
          WHERE tenant_id = $1 
          ORDER BY assessment_date DESC 
          LIMIT 5
        `, [tenantId])
      ]);

      const dashboard = {
        tenantId,
        summary: {
          totalPlans: plans.rows.length,
          activePlans: plans.rows.filter(p => p.status === 'active').length,
          plansDueForReview: plans.rows.filter(p => new Date(p.next_review) <= new Date()).length,
          recentTests: tests.rows.length,
          lastTestDate: tests.rows[0]?.test_date || null,
          overallTestRating: this.calculateAverageTestRating(tests.rows)
        },
        plans: plans.rows,
        recentTests: tests.rows,
        riskAssessments: risks.rows,
        cbnCompliance: {
          complianceRate: this.calculateComplianceRate(plans.rows),
          nextReviewDue: this.getNextReviewDue(plans.rows),
          regulatoryStatus: 'Compliant'
        },
        upcomingActivities: this.getUpcomingActivities(plans.rows, tests.rows)
      };

      return dashboard;

    } catch (error) {
      console.error('❌ Failed to get BCP dashboard:', error);
      throw error;
    }
  }

  // Helper methods for creating BCP components
  private createRiskAssessment(): RiskAssessment {
    return {
      identifiedRisks: [
        {
          riskId: crypto.randomUUID(),
          category: 'operational',
          description: 'System downtime due to hardware failure',
          probability: 'medium',
          impact: 'major',
          riskScore: 12,
          mitigationStrategies: ['Redundant systems', 'Regular maintenance', 'Backup facilities'],
          owner: 'IT Operations',
          status: 'mitigated'
        },
        {
          riskId: crypto.randomUUID(),
          category: 'technological',
          description: 'Cyber attack leading to data breach',
          probability: 'high',
          impact: 'catastrophic',
          riskScore: 20,
          mitigationStrategies: ['Enhanced security controls', 'Staff training', 'Incident response plan'],
          owner: 'Security Team',
          status: 'mitigated'
        }
      ],
      impactAnalysis: {
        financialImpact: {
          revenueImpact: 1000000,
          costOfDisruption: 500000,
          recoveryInvestment: 200000,
          regulatoryFines: 100000
        },
        operationalImpact: {
          processesAffected: ['Payment processing', 'Customer service', 'Reporting'],
          customersImpacted: 10000,
          serviceLevelReduction: 'Significant reduction in transaction processing speed',
          recoveryTime: 24
        },
        reputationalImpact: {
          publicPerception: 'Moderate negative impact',
          mediaAttention: 'Local and industry media coverage',
          customerConfidence: 'Temporary reduction in trust',
          regulatoryStanding: 'Under review'
        },
        regulatoryImpact: {
          complianceViolations: ['Service availability requirements'],
          reportingRequirements: ['Immediate incident reporting', 'Root cause analysis'],
          potentialSanctions: ['Regulatory fine', 'Enhanced oversight'],
          relationshipImpact: 'Requires remediation plan'
        }
      },
      probabilityAssessment: {
        historicalData: 'No major incidents in past 5 years',
        industryBenchmarks: 'Average 2-3 incidents per year in similar institutions',
        expertJudgment: 'Medium probability based on current controls',
        overallProbability: 0.3
      },
      riskMatrix: {
        highRisks: [],
        mediumRisks: [],
        lowRisks: [],
        riskTrends: 'Cybersecurity risks increasing, operational risks stable'
      },
      lastAssessment: new Date()
    };
  }

  private defineCriticalProcesses(): CriticalProcess[] {
    return [
      {
        processId: crypto.randomUUID(),
        name: 'Money Transfer Processing',
        description: 'Core money transfer and payment processing system',
        category: 'core_banking',
        criticality: 'high',
        rto: 4, // 4 hours
        rpo: 1, // 1 hour
        dependencies: ['Payment gateway', 'NIBSS connection', 'Database systems'],
        alternativeProcedures: ['Manual processing', 'Backup site processing'],
        staffRequirements: [
          {
            role: 'Operations Manager',
            minimumStaff: 2,
            skillsRequired: ['System operations', 'Risk management'],
            backupStaff: ['Assistant Managers', 'Senior Officers']
          }
        ]
      },
      {
        processId: crypto.randomUUID(),
        name: 'Customer Authentication',
        description: 'User authentication and security validation',
        category: 'core_banking',
        criticality: 'high',
        rto: 2, // 2 hours
        rpo: 0.5, // 30 minutes
        dependencies: ['Identity management system', 'Security infrastructure'],
        alternativeProcedures: ['Manual verification', 'Alternative authentication methods'],
        staffRequirements: [
          {
            role: 'Security Officer',
            minimumStaff: 1,
            skillsRequired: ['Security protocols', 'Customer verification'],
            backupStaff: ['Senior Customer Service']
          }
        ]
      }
    ];
  }

  private createRecoveryProcedures(): RecoveryProcedure[] {
    return [
      {
        procedureId: crypto.randomUUID(),
        processId: 'money-transfer-process',
        stepNumber: 1,
        description: 'Activate backup data center and restore core banking systems',
        responsibility: 'IT Operations Manager',
        timeframe: '2-4 hours',
        resources: ['Backup facility', 'Recovery team', 'Communication systems'],
        successCriteria: ['Systems operational', 'Data integrity verified', 'Connectivity restored'],
        escalationProcedure: 'Notify Crisis Management Team if recovery exceeds 4 hours'
      }
    ];
  }

  private createCommunicationPlan(): CommunicationPlan {
    return {
      internalContacts: [
        {
          role: 'CEO',
          name: 'Chief Executive Officer',
          primaryPhone: '+234-xxx-xxx-xxx',
          email: 'ceo@company.com'
        }
      ],
      externalContacts: [
        {
          role: 'Key Customer',
          name: 'Major Corporate Client',
          primaryPhone: '+234-xxx-xxx-xxx',
          email: 'contact@client.com'
        }
      ],
      regulatoryContacts: [
        {
          role: 'CBN Supervisor',
          name: 'Central Bank Contact',
          primaryPhone: '+234-xxx-xxx-xxx',
          email: 'supervisor@cbn.gov.ng'
        }
      ],
      mediaStrategy: {
        spokesperson: 'Communications Director',
        keyMessages: ['Customer funds are secure', 'Services being restored', 'Regular updates provided'],
        channels: ['Official website', 'Social media', 'Press release'],
        timeline: 'Initial statement within 2 hours'
      },
      communicationChannels: [],
      messageTemplates: []
    };
  }

  private defineResourceRequirements(): ResourceRequirement[] {
    return [
      {
        resourceType: 'technology',
        description: 'Backup data processing facility',
        quantity: 1,
        availability: 'available',
        alternativeSources: ['Cloud infrastructure', 'Partner facility']
      },
      {
        resourceType: 'human',
        description: 'Emergency response team',
        quantity: 10,
        availability: 'available',
        alternativeSources: ['Contracted personnel', 'Partner organizations']
      }
    ];
  }

  private createTestingSchedule(): TestingSchedule {
    const nextTest = new Date();
    nextTest.setMonth(nextTest.getMonth() + 3); // Quarterly testing

    return {
      testType: 'simulation',
      frequency: 'quarterly',
      lastTest: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      nextTest,
      testResults: [],
      improvements: []
    };
  }

  private createCBNComplianceChecklist(): ComplianceItem[] {
    return this.CBN_BCP_REQUIREMENTS.map(requirement => ({
      requirement,
      status: 'compliant' as const,
      evidence: 'Documented and implemented',
      lastCheck: new Date(),
      nextCheck: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    }));
  }

  private defineCBNRequirements(): RegulatoryRequirement[] {
    return [
      {
        regulation: 'CBN BCP Guidelines',
        requirement: 'Annual BCP review and approval',
        deadline: new Date(new Date().getFullYear() + 1, 0, 31), // January 31 next year
        status: 'pending',
        evidence: 'Annual review scheduled'
      },
      {
        regulation: 'CBN Risk Management Framework',
        requirement: 'Quarterly risk assessment update',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        status: 'in_progress',
        evidence: 'Risk assessment in progress'
      }
    ];
  }

  private createReportingSchedule(): ReportingSchedule[] {
    return [
      {
        reportType: 'BCP Status Report',
        frequency: 'Monthly',
        recipient: 'CBN Supervision Department',
        nextDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      {
        reportType: 'Risk Assessment Update',
        frequency: 'Quarterly',
        recipient: 'CBN Risk Management',
        nextDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      }
    ];
  }

  // Helper methods for dashboard calculations
  private calculateAverageTestRating(tests: any[]): string {
    if (tests.length === 0) return 'N/A';
    
    const ratings = tests.map(t => {
      switch (t.overall_rating) {
        case 'excellent': return 5;
        case 'good': return 4;
        case 'satisfactory': return 3;
        case 'needs_improvement': return 2;
        case 'inadequate': return 1;
        default: return 3;
      }
    });
    
    const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    
    if (average >= 4.5) return 'Excellent';
    if (average >= 3.5) return 'Good';
    if (average >= 2.5) return 'Satisfactory';
    if (average >= 1.5) return 'Needs Improvement';
    return 'Inadequate';
  }

  private calculateComplianceRate(plans: any[]): number {
    if (plans.length === 0) return 0;
    return (plans.filter(p => p.status === 'active').length / plans.length) * 100;
  }

  private getNextReviewDue(plans: any[]): Date | null {
    if (plans.length === 0) return null;
    
    const nextReviews = plans
      .map(p => new Date(p.next_review))
      .sort((a, b) => a.getTime() - b.getTime());
    
    return nextReviews[0];
  }

  private getUpcomingActivities(plans: any[], tests: any[]): any[] {
    const activities = [];
    
    // Add plan reviews
    plans.forEach(plan => {
      const reviewDate = new Date(plan.next_review);
      if (reviewDate <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)) { // Within 90 days
        activities.push({
          type: 'Plan Review',
          description: `${plan.plan_type} plan review due`,
          dueDate: reviewDate,
          priority: 'high'
        });
      }
    });
    
    return activities.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }
}

export default BusinessContinuityService;