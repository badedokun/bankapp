# RBAC Backend Endpoints Documentation

## Overview
This document outlines the required backend API endpoints to support the Role-Based Access Control (RBAC) implementation for the Nigerian banking application.

## Authentication & Authorization Endpoints

### 1. Enhanced User Authentication

#### POST /api/auth/login
Enhanced login endpoint with role and permission context.

**Request Body:**
```json
{
  "email": "admin@fmfb.com",
  "password": "secure_password",
  "tenantId": "fmfb_bank", // Optional for multi-tenant routing
  "deviceInfo": {
    "type": "web|mobile",
    "fingerprint": "unique_device_id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": "19769e1e-b7c7-437a-b0c4-c242d82e8e3f",
      "email": "admin@fmfb.com",
      "fullName": "Admin User",
      "role": "ceo",
      "permissions": {
        "internal_transfers": "full",
        "external_transfers": "full",
        "view_customer_accounts": "full",
        "manage_users": "full",
        // ... all 67 permissions
      },
      "tenantId": "fmfb_bank",
      "branchId": "main_branch",
      "department": "management",
      "isActive": true,
      "lastLogin": "2025-09-25T10:00:00Z",
      "sessionTimeout": 3600,
      "requiresMFA": true
    },
    "tenantConfig": {
      "bankName": "First Microfinance Bank",
      "logo": "https://...",
      "theme": "default",
      "features": ["ai_assistant", "mobile_banking", "loan_management"]
    }
  }
}
```

#### GET /api/auth/user/context
Get current user's role and permission context.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "19769e1e-b7c7-437a-b0c4-c242d82e8e3f",
      "email": "admin@fmfb.com",
      "fullName": "Admin User",
      "role": "ceo",
      "permissions": { /* all permissions */ },
      "tenantId": "fmfb_bank",
      "branchId": "main_branch",
      "department": "management",
      "isActive": true,
      "lastLogin": "2025-09-25T10:00:00Z"
    },
    "sessionInfo": {
      "createdAt": "2025-09-25T09:00:00Z",
      "expiresAt": "2025-09-25T18:00:00Z",
      "deviceType": "web",
      "ipAddress": "192.168.1.1"
    }
  }
}
```

## Dashboard Data Endpoints

### 2. Role-Based Dashboard Stats

#### GET /api/dashboard/stats
Get dashboard statistics based on user role and permissions.

**Query Parameters:**
- `period`: daily|weekly|monthly|yearly
- `branchId`: (optional) specific branch filter

**Response for CEO:**
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "id": "total_customers",
        "title": "Total Customers",
        "value": "15,847",
        "change": "+5.2%",
        "changeType": "positive",
        "icon": "👥",
        "description": "Active customer base across all branches"
      },
      {
        "id": "transaction_volume",
        "title": "Transaction Volume",
        "value": "₦2.4B",
        "change": "+12.8%",
        "changeType": "positive",
        "icon": "💰",
        "description": "Monthly transaction volume"
      },
      {
        "id": "loan_portfolio",
        "title": "Loan Portfolio",
        "value": "₦850M",
        "change": "+8.4%",
        "changeType": "positive",
        "icon": "📊",
        "description": "Outstanding loan portfolio"
      },
      {
        "id": "deposit_growth",
        "title": "Deposit Growth",
        "value": "₦1.2B",
        "change": "+15.6%",
        "changeType": "positive",
        "icon": "📈",
        "description": "Total customer deposits"
      }
    ],
    "roleSpecificInsights": {
      "pendingApprovals": 23,
      "highValueTransactions": 5,
      "complianceAlerts": 2,
      "performanceRating": "Excellent"
    }
  }
}
```

**Response for Bank Teller:**
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "id": "daily_transactions",
        "title": "Today's Transactions",
        "value": "127",
        "change": "+8",
        "changeType": "positive",
        "icon": "💳",
        "description": "Transactions processed today"
      },
      {
        "id": "cash_position",
        "title": "Cash Position",
        "value": "₦2.4M",
        "change": "-₦150K",
        "changeType": "neutral",
        "icon": "💰",
        "description": "Current till balance"
      }
    ],
    "roleSpecificInsights": {
      "transactionGoal": 150,
      "achievementRate": "85%",
      "customersSoToday": 45,
      "averageTransactionTime": "2.5 mins"
    }
  }
}
```

### 3. Recent Activity with Role-Based Filtering

#### GET /api/dashboard/recent-activity
Get recent banking activity filtered by user role and permissions.

**Query Parameters:**
- `limit`: number of transactions (default: 10)
- `type`: sent|received|all
- `period`: 24h|7d|30d

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn_001",
        "type": "sent",
        "title": "Transfer to John Doe",
        "subtitle": "GTB - 1234567890",
        "amount": 50000,
        "time": "2 hours ago",
        "status": "completed",
        "requiresApproval": false,
        "approvedBy": null,
        "originalTransaction": {
          "reference": "TXN202509250001",
          "channel": "mobile_app",
          "fee": 100
        }
      },
      {
        "id": "txn_002",
        "type": "pending",
        "title": "High-Value Transfer",
        "subtitle": "Requires CEO approval",
        "amount": 5000000,
        "time": "30 minutes ago",
        "status": "pending_approval",
        "requiresApproval": true,
        "approvedBy": null,
        "originalTransaction": {
          "reference": "TXN202509250002",
          "channel": "web_portal",
          "initiatedBy": "branch_manager_001"
        }
      }
    ],
    "summary": {
      "totalTransactions": 2,
      "totalAmount": 5050000,
      "pendingApprovals": 1,
      "completedToday": 1
    }
  }
}
```

### 4. Transaction Limits

#### GET /api/dashboard/transaction-limits
Get role-based transaction limits and current usage.

**Response:**
```json
{
  "success": true,
  "data": {
    "limits": [
      {
        "type": "High-Value Transfers",
        "dailyLimit": 50000000,
        "weeklyLimit": 200000000,
        "monthlyLimit": 800000000,
        "singleTransactionLimit": 25000000,
        "requiresApproval": 5000000,
        "currency": "NGN",
        "currentUsage": {
          "daily": {
            "used": 15000000,
            "percentage": 30
          },
          "weekly": {
            "used": 45000000,
            "percentage": 22.5
          },
          "monthly": {
            "used": 120000000,
            "percentage": 15
          }
        }
      }
    ],
    "approvalRequests": [
      {
        "id": "approval_001",
        "amount": 10000000,
        "reason": "Exceeds single transaction limit",
        "requestedBy": "branch_manager_001",
        "requestedAt": "2025-09-25T08:30:00Z",
        "status": "pending"
      }
    ]
  }
}
```

#### POST /api/dashboard/request-limit-increase
Request transaction limit increase.

**Request Body:**
```json
{
  "limitType": "daily|weekly|monthly|single_transaction",
  "currentLimit": 50000000,
  "requestedLimit": 75000000,
  "justification": "Increased business volume for Q4 operations",
  "urgency": "normal|high|urgent"
}
```

## Banking Operations Endpoints

### 5. Role-Based Feature Access

#### GET /api/features/available
Get available features based on user role and permissions.

**Response:**
```json
{
  "success": true,
  "data": {
    "features": [
      {
        "id": "money_transfer",
        "title": "Money Transfer",
        "subtitle": "Send money instantly",
        "icon": "💸",
        "category": "transfers",
        "available": true,
        "permissionLevel": "full",
        "dailyLimit": 50000000,
        "requiresApproval": 5000000
      },
      {
        "id": "loan_management",
        "title": "Loan Management",
        "subtitle": "Manage customer loans",
        "icon": "📊",
        "category": "loans",
        "available": true,
        "permissionLevel": "full",
        "specialRequirements": ["credit_approval"]
      }
    ],
    "categories": [
      {
        "id": "transfers",
        "name": "Money Transfers",
        "icon": "💸",
        "features": 5
      },
      {
        "id": "savings",
        "name": "Savings & Deposits",
        "icon": "💰",
        "features": 4
      },
      {
        "id": "loans",
        "name": "Loans & Credit",
        "icon": "📊",
        "features": 3
      }
    ]
  }
}
```

### 6. AI Assistant Integration

#### POST /api/ai/chat
Enhanced AI chat with role-specific responses.

**Request Body:**
```json
{
  "message": "What are my transaction limits?",
  "context": {
    "userRole": "ceo",
    "currentPage": "dashboard",
    "previousMessages": []
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "As CEO, your daily transaction limit is ₦50M with single transaction limit of ₦25M. Transactions above ₦5M require additional approval. Would you like to see your current usage or request a limit adjustment?",
    "suggestions": [
      {
        "id": "view_limits",
        "text": "View detailed limits",
        "action": "navigate",
        "target": "/dashboard/limits"
      },
      {
        "id": "request_increase",
        "text": "Request limit increase",
        "action": "modal",
        "target": "limit_increase_form"
      }
    ],
    "contextualData": {
      "currentUsage": "30%",
      "pendingApprovals": 2,
      "availableToday": "₦35M"
    }
  }
}
```

#### GET /api/ai/suggestions
Get role-specific AI suggestions.

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "regulatory_compliance_summary",
        "type": "compliance",
        "icon": "📊",
        "title": "CBN Compliance Summary",
        "description": "Generate comprehensive compliance report for board meeting and regulatory submissions.",
        "priority": "high",
        "estimatedTime": "5 minutes"
      },
      {
        "id": "performance_analytics",
        "type": "analytics",
        "icon": "📈",
        "title": "Bank Performance Analytics",
        "description": "Analyze branch performance, profitability metrics, and customer growth trends.",
        "priority": "medium",
        "estimatedTime": "3 minutes"
      }
    ]
  }
}
```

## User & Role Management Endpoints

### 7. User Management (Admin Only)

#### GET /api/admin/users
List all users with roles and permissions.

**Query Parameters:**
- `role`: filter by role
- `branch`: filter by branch
- `active`: true|false
- `page`: pagination
- `limit`: items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_001",
        "email": "teller@fmfb.com",
        "fullName": "Jane Teller",
        "role": "bank_teller",
        "department": "operations",
        "branchId": "main_branch",
        "isActive": true,
        "lastLogin": "2025-09-25T09:30:00Z",
        "permissions": { /* abbreviated */ },
        "createdAt": "2025-01-15T00:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "limit": 10
    },
    "summary": {
      "activeUsers": 48,
      "inactiveUsers": 2,
      "roleDistribution": {
        "ceo": 1,
        "branch_manager": 3,
        "bank_teller": 15,
        "customer_service": 8
      }
    }
  }
}
```

#### POST /api/admin/users
Create new user with role assignment.

**Request Body:**
```json
{
  "email": "newuser@fmfb.com",
  "fullName": "New User",
  "role": "bank_teller",
  "department": "operations",
  "branchId": "main_branch",
  "password": "temporary_password",
  "permissions": {
    "internal_transfers": "write",
    "view_customer_accounts": "read"
    // ... other permissions
  },
  "requirePasswordChange": true
}
```

#### PUT /api/admin/users/{userId}/role
Update user role and permissions.

**Request Body:**
```json
{
  "newRole": "head_teller",
  "reason": "Promotion to supervisory position",
  "effectiveDate": "2025-10-01T00:00:00Z",
  "notifyUser": true
}
```

### 8. Role & Permission Management

#### GET /api/admin/roles
Get all available roles and their permissions.

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "ceo",
        "name": "Chief Executive Officer",
        "description": "Highest level of authority with full access to all banking operations and strategic oversight.",
        "level": 10,
        "category": "executive",
        "permissions": {
          "internal_transfers": "full",
          "external_transfers": "full",
          // ... all 67 permissions
        },
        "defaultLimits": {
          "dailyLimit": 50000000,
          "singleTransactionLimit": 25000000
        },
        "userCount": 1
      }
    ]
  }
}
```

#### GET /api/admin/permissions
Get all available permissions with descriptions.

**Response:**
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "id": "internal_transfers",
        "name": "Internal Transfers",
        "description": "Transfer funds between accounts within the same bank",
        "category": "transfers",
        "levels": ["none", "read", "write", "full"],
        "riskLevel": "medium",
        "requiresApproval": {
          "write": 1000000,
          "full": 5000000
        }
      }
    ],
    "categories": [
      {
        "id": "transfers",
        "name": "Money Transfers",
        "permissions": 8
      }
    ]
  }
}
```

## Audit & Compliance Endpoints

### 9. Audit Trail

#### GET /api/audit/activity-log
Get detailed audit log for compliance.

**Query Parameters:**
- `userId`: specific user
- `action`: login|transaction|approval|configuration
- `startDate`: date range start
- `endDate`: date range end
- `riskLevel`: low|medium|high

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "audit_001",
        "timestamp": "2025-09-25T10:30:00Z",
        "userId": "user_001",
        "userEmail": "admin@fmfb.com",
        "action": "high_value_transfer",
        "details": {
          "amount": 10000000,
          "recipient": "ACCT1234567890",
          "bank": "GTB",
          "reference": "TXN202509250001"
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "outcome": "approved",
        "riskScore": 7.5,
        "complianceFlags": ["high_value", "cross_border"]
      }
    ],
    "summary": {
      "totalActivities": 1250,
      "highRiskActivities": 45,
      "complianceViolations": 0,
      "averageRiskScore": 3.2
    }
  }
}
```

### 10. Approval Workflows

#### GET /api/approvals/pending
Get pending approvals for current user.

**Response:**
```json
{
  "success": true,
  "data": {
    "approvals": [
      {
        "id": "approval_001",
        "type": "high_value_transfer",
        "amount": 10000000,
        "requestedBy": {
          "id": "user_002",
          "name": "Branch Manager",
          "email": "manager@fmfb.com"
        },
        "details": {
          "recipient": "John Doe",
          "account": "1234567890",
          "bank": "GTB",
          "reference": "TXN202509250001"
        },
        "requestedAt": "2025-09-25T08:30:00Z",
        "urgency": "normal",
        "riskAssessment": {
          "score": 6.5,
          "factors": ["high_value", "new_recipient"]
        }
      }
    ]
  }
}
```

#### POST /api/approvals/{approvalId}/decision
Make approval decision.

**Request Body:**
```json
{
  "decision": "approved|rejected",
  "comment": "Approved for legitimate business transfer",
  "conditions": [
    "Monitor recipient account",
    "Verify with customer via phone"
  ]
}
```

## Implementation Notes

### Security Considerations
1. All endpoints require JWT authentication
2. Role-based middleware validates permissions
3. Rate limiting on sensitive endpoints
4. IP whitelisting for admin operations
5. Audit logging for all actions
6. Input validation and sanitization
7. HTTPS only for production

### Database Schema Updates Required
```sql
-- Enhanced user table
ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'bank_teller';
ALTER TABLE users ADD COLUMN permissions JSONB;
ALTER TABLE users ADD COLUMN branch_id UUID REFERENCES branches(id);
ALTER TABLE users ADD COLUMN department VARCHAR(100);
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Approval workflow table
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  requested_by UUID REFERENCES users(id),
  amount DECIMAL(15,2),
  details JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Caching Strategy
- Role permissions cached for 1 hour
- Dashboard stats cached for 15 minutes
- Transaction limits cached for 30 minutes
- User context cached per session

This documentation provides the foundation for implementing comprehensive RBAC support in the banking application backend.