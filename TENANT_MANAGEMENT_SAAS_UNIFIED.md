# 🏛️ Tenant Management System - SaaS Unified Platform Approach

**Document Version:** 3.0
**Updated:** September 25, 2025
**Status:** Critical Business Requirement - Industry Best Practices
**Priority:** 🚨 **HIGHEST** - Required for B2B SaaS Operations
**Architecture:** **Unified Application with Subdomain-Based Role Separation**

---

## 🎯 **EXECUTIVE SUMMARY**

Based on comprehensive research of SaaS industry best practices (Slack, GitHub, GitLab, Atlassian), the **optimal approach** is to use the **same application and infrastructure** with **subdomain-based access control** and **JWT token context** for role separation.

**🏆 INDUSTRY-PROVEN ARCHITECTURE:**
- **Same Application:** Single codebase, same database, same infrastructure
- **Subdomain Routing:** `admin.orokiipay.com` vs `{tenant}.orokiipay.com`
- **JWT Context:** Role-based access control through token claims
- **Dynamic UI:** Interface adapts based on user role and subdomain context

**Examples of This Approach:**
- **Slack:** `{workspace}.slack.com` vs `admin.slack.com`
- **GitHub:** `github.com/{org}` with enterprise admin roles
- **GitLab:** Same application with admin area access based on role
- **Atlassian:** Custom domains with organization admin delegation

---

## 🏗️ **UNIFIED PLATFORM ARCHITECTURE**

### **Single Application with Role-Based Interface Adaptation**

```typescript
interface UnifiedPlatformArchitecture {
  application: {
    codebase: 'src/ (single React Native + Web application)';
    database: 'Same PostgreSQL database with role-based queries';
    infrastructure: 'Same servers, same deployment';
    domains: ['admin.orokiipay.com', '{tenant}.orokiipay.com'];
  };

  accessControl: {
    method: 'JWT token claims + subdomain context';
    authentication: 'Same auth system with different role claims';
    authorization: 'Role-based UI rendering and API access';
    security: 'Enhanced for admin roles, standard for tenant roles';
  };

  userInterface: {
    adaptation: 'Dynamic UI based on role and subdomain';
    navigation: 'Different menus based on user permissions';
    features: 'Show/hide features based on role claims';
    branding: 'Tenant-specific branding vs OrokiiPay branding';
  };
}
```

### **Subdomain-Based Access Control**

#### **Platform Admin Access: admin.orokiipay.com**
```typescript
interface PlatformAdminAccess {
  subdomain: 'admin.orokiipay.com';
  userRoles: ['platform_admin', 'orokii_executive', 'orokii_technical', 'orokii_sales'];
  jwtClaims: {
    role: 'platform_admin';
    permissions: ['manage_all_tenants', 'view_platform_analytics', 'billing_management'];
    tenant_id: null; // Platform-level access
    platform_admin: true;
  };
  uiFeatures: [
    'Cross-tenant dashboard',
    'Tenant onboarding workflow',
    'Platform analytics and billing',
    'System health monitoring',
    'All tenant management'
  ];
  security: {
    mfa: true;
    ipRestriction: true;
    auditLogging: 'comprehensive';
    sessionTimeout: '4_hours';
  };
}
```

#### **Tenant Banking Access: {tenant}.orokiipay.com**
```typescript
interface TenantBankingAccess {
  subdomain: '{tenant}.orokiipay.com'; // e.g., fmfb.orokiipay.com
  userRoles: ['bank_admin', 'bank_user', 'bank_customer'];
  jwtClaims: {
    role: 'bank_admin';
    permissions: ['manage_bank_users', 'configure_bank_settings', 'view_bank_analytics'];
    tenant_id: 'fmfb_uuid'; // Tenant-specific access
    platform_admin: false;
  };
  uiFeatures: [
    'Bank-specific dashboard',
    'Customer management',
    'Bank user administration',
    'Bank configuration',
    'Tenant-scoped analytics'
  ];
  security: {
    mfa: 'configurable_per_tenant';
    ipRestriction: false;
    auditLogging: 'tenant_specific';
    sessionTimeout: 'configurable';
  };
}
```

---

## 🔐 **JWT TOKEN CONTEXT IMPLEMENTATION**

### **Token Structure for Role-Based Access**

```typescript
interface OrokiiPayJWT {
  // Standard JWT claims
  iss: 'orokiipay.com';
  sub: string; // user_id
  iat: number;
  exp: number;

  // Custom claims for role-based access
  user: {
    id: string;
    email: string;
    full_name: string;
  };

  // Role and permissions
  role: 'platform_admin' | 'bank_admin' | 'bank_user' | 'bank_customer';
  permissions: string[]; // Fine-grained permissions array

  // Tenant context (null for platform admins)
  tenant_id: string | null;
  tenant_name: string | null;

  // Platform admin flag
  platform_admin: boolean;

  // Enhanced security for admins
  security_level: 'standard' | 'enhanced';

  // Subdomain context
  access_domain: string; // admin.orokiipay.com or {tenant}.orokiipay.com
}
```

### **Dynamic Interface Rendering**

```typescript
// React component that adapts based on JWT context
export const DynamicDashboard: React.FC = () => {
  const { user, isPlatformAdmin, tenantId, permissions } = useAuth();

  // Platform admin sees cross-tenant dashboard
  if (isPlatformAdmin) {
    return (
      <PlatformAdminDashboard>
        <TenantOverviewWidget />
        <PlatformAnalyticsWidget />
        <RevenueTrackingWidget />
        <SystemHealthWidget />
        <TenantOnboardingPanel />
      </PlatformAdminDashboard>
    );
  }

  // Tenant admin sees bank-specific dashboard
  return (
    <TenantBankingDashboard tenantId={tenantId}>
      <BankMetricsWidget />
      <CustomerOverviewWidget />
      <TransactionVolumeWidget />
      <BankUserManagementPanel />
    </TenantBankingDashboard>
  );
};

// Navigation that adapts to user role
export const DynamicNavigation: React.FC = () => {
  const { isPlatformAdmin, permissions } = useAuth();

  const platformAdminMenuItems = [
    { title: 'Platform Dashboard', path: '/admin/dashboard' },
    { title: 'Tenant Management', path: '/admin/tenants' },
    { title: 'Analytics & Revenue', path: '/admin/analytics' },
    { title: 'System Health', path: '/admin/system' },
    { title: 'Billing Management', path: '/admin/billing' }
  ];

  const tenantBankingMenuItems = [
    { title: 'Bank Dashboard', path: '/dashboard' },
    { title: 'Customers', path: '/customers' },
    { title: 'Transactions', path: '/transactions' },
    { title: 'Bank Settings', path: '/bank-settings' },
    { title: 'User Management', path: '/users' }
  ];

  return (
    <NavigationMenu
      items={isPlatformAdmin ? platformAdminMenuItems : tenantBankingMenuItems}
    />
  );
};
```

---

## 🛡️ **SECURITY IMPLEMENTATION**

### **Role-Based Middleware**

```typescript
// Enhanced auth middleware that handles both platform and tenant access
export const authMiddleware = (requiredRole?: string, requiredPermissions?: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract and verify JWT token
      const token = extractJWTFromRequest(req);
      const decoded = await verifyJWT(token) as OrokiiPayJWT;

      // Determine access context from subdomain
      const subdomain = extractSubdomain(req.hostname);
      const isPlatformAdminRequest = subdomain === 'admin';

      // Platform admin access validation
      if (isPlatformAdminRequest) {
        if (!decoded.platform_admin) {
          return res.status(403).json({ error: 'Platform admin access required' });
        }

        // Enhanced security for platform admin
        await validateEnhancedSecurity(decoded, req);

        // Set platform admin context
        req.user = decoded;
        req.platformAdmin = true;
        req.tenantId = null; // Platform-level access
      }
      // Tenant banking access validation
      else {
        if (decoded.platform_admin && !decoded.tenant_id) {
          // Platform admins can access tenant areas for support
          const requestedTenant = await getTenantFromSubdomain(subdomain);
          req.supportAccess = true;
          req.tenantId = requestedTenant.id;
        } else {
          // Regular tenant access
          const requestedTenant = await getTenantFromSubdomain(subdomain);
          if (decoded.tenant_id !== requestedTenant.id) {
            return res.status(403).json({ error: 'Tenant access denied' });
          }
          req.tenantId = decoded.tenant_id;
        }

        req.user = decoded;
        req.platformAdmin = false;
      }

      // Validate specific role and permissions
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ error: `Role ${requiredRole} required` });
      }

      if (requiredPermissions) {
        const hasPermissions = requiredPermissions.every(permission =>
          decoded.permissions.includes(permission)
        );
        if (!hasPermissions) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
  };
};
```

### **Database Query Context**

```typescript
// Database service that automatically applies tenant context
export class DatabaseService {
  async query(sql: string, params: any[], context: QueryContext): Promise<any> {
    // Platform admin gets cross-tenant access
    if (context.isPlatformAdmin && !context.supportAccess) {
      // No tenant filtering - can see all data
      return await this.executeQuery(sql, params);
    }

    // Tenant-scoped access - automatically inject tenant_id filter
    const tenantId = context.tenantId;
    if (!tenantId) {
      throw new Error('Tenant context required');
    }

    // Automatically inject tenant_id into WHERE clause
    const modifiedSql = this.injectTenantFilter(sql, tenantId);
    return await this.executeQuery(modifiedSql, params);
  }

  private injectTenantFilter(sql: string, tenantId: string): string {
    // Smart SQL modification to ensure tenant isolation
    if (sql.toLowerCase().includes('select') && !sql.toLowerCase().includes('where')) {
      return sql + ` WHERE tenant_id = '${tenantId}'`;
    }

    if (sql.toLowerCase().includes('where')) {
      return sql + ` AND tenant_id = '${tenantId}'`;
    }

    return sql;
  }
}
```

---

## 🖥️ **FRONTEND IMPLEMENTATION**

### **Subdomain-Based Routing**

```typescript
// Router that adapts based on subdomain context
export const AppRouter: React.FC = () => {
  const subdomain = useSubdomain();
  const { isPlatformAdmin, isAuthenticated } = useAuth();

  // Platform admin routing (admin.orokiipay.com)
  if (subdomain === 'admin') {
    return (
      <Router>
        <Route path="/admin/dashboard" component={PlatformDashboardScreen} />
        <Route path="/admin/tenants" component={TenantManagementScreen} />
        <Route path="/admin/analytics" component={PlatformAnalyticsScreen} />
        <Route path="/admin/billing" component={BillingManagementScreen} />
        <Route path="/admin/system" component={SystemHealthScreen} />

        {/* Tenant onboarding workflow */}
        <Route path="/admin/onboarding" component={TenantOnboardingScreen} />
        <Route path="/admin/tenants/:id/configure" component={TenantConfigurationScreen} />
      </Router>
    );
  }

  // Tenant banking routing ({tenant}.orokiipay.com)
  return (
    <Router>
      <Route path="/dashboard" component={TenantDashboardScreen} />
      <Route path="/customers" component={CustomerManagementScreen} />
      <Route path="/transactions" component={TransactionHistoryScreen} />
      <Route path="/transfers" component={TransferScreen} />
      <Route path="/bank-settings" component={BankSettingsScreen} />

      {/* Bank admin features (role-based) */}
      {isPlatformAdmin || hasRole('bank_admin') ? (
        <Route path="/users" component={BankUserManagementScreen} />
      ) : null}
    </Router>
  );
};
```

### **Context-Aware Components**

```typescript
// Authentication context that handles both platform and tenant access
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isPlatformAdmin: false,
    tenantId: null,
    permissions: []
  });

  const login = async (email: string, password: string, subdomain: string) => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        subdomain, // Include subdomain for context
        requestedAccess: subdomain === 'admin' ? 'platform' : 'tenant'
      })
    });

    const { token } = await response.json();
    const decoded = jwt.decode(token) as OrokiiPayJWT;

    // Validate access context matches subdomain
    const isPlatformAdminRequest = subdomain === 'admin';
    if (isPlatformAdminRequest && !decoded.platform_admin) {
      throw new Error('Platform admin access required');
    }

    // Store token and set auth state
    localStorage.setItem('authToken', token);
    setAuthState({
      isAuthenticated: true,
      user: decoded.user,
      isPlatformAdmin: decoded.platform_admin,
      tenantId: decoded.tenant_id,
      permissions: decoded.permissions
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 📊 **API ENDPOINTS WITH UNIFIED APPROACH**

### **Same API with Role-Based Access**

```typescript
// Unified API that serves both platform admin and tenant requests
interface UnifiedAPIStructure {
  // Authentication (same endpoint, different context)
  'POST /api/v1/auth/login': {
    body: { email: string; password: string; subdomain: string; requestedAccess: 'platform' | 'tenant' };
    response: { token: string; user: User; context: 'platform' | 'tenant' };
  };

  // Dashboard data (context-aware)
  'GET /api/v1/dashboard': {
    platformAdmin: 'Cross-tenant metrics, revenue analytics, system health';
    tenantUser: 'Bank-specific metrics, customer data, transaction volumes';
  };

  // User management (scope-aware)
  'GET /api/v1/users': {
    platformAdmin: 'All users across all tenants (with tenant context)';
    tenantAdmin: 'Users within their tenant only';
  };

  // Analytics (permission-based)
  'GET /api/v1/analytics': {
    platformAdmin: 'Cross-tenant analytics, revenue trends, platform metrics';
    tenantUser: 'Tenant-specific analytics, bank performance metrics';
  };

  // Tenant management (platform admin only)
  'GET /api/v1/tenants': {
    platformAdmin: 'List all tenants, onboarding status, health metrics';
    tenantUser: 'Access denied (403)';
  };

  // Configuration (context-dependent)
  'PUT /api/v1/configuration': {
    platformAdmin: 'Platform-wide settings, tenant configurations';
    tenantAdmin: 'Bank-specific settings and customization';
  };
}
```

### **Middleware Implementation**

```typescript
// API routes with role-based middleware
app.get('/api/v1/dashboard',
  authMiddleware(),
  contextAwareMiddleware(),
  async (req, res) => {
    if (req.platformAdmin) {
      // Platform admin dashboard data
      const data = await getPlatformDashboardData();
      return res.json(data);
    } else {
      // Tenant dashboard data (automatically scoped by tenant_id)
      const data = await getTenantDashboardData(req.tenantId);
      return res.json(data);
    }
  }
);

app.get('/api/v1/tenants',
  authMiddleware('platform_admin'),
  async (req, res) => {
    // Platform admin only endpoint
    const tenants = await getAllTenants();
    return res.json(tenants);
  }
);

app.get('/api/v1/users',
  authMiddleware(),
  async (req, res) => {
    if (req.platformAdmin) {
      // Platform admin can see all users with tenant context
      const users = await getAllUsersWithTenantContext();
      return res.json(users);
    } else {
      // Tenant users see only their tenant's users
      const users = await getTenantUsers(req.tenantId);
      return res.json(users);
    }
  }
);
```

---

## 🎯 **IMPLEMENTATION ROADMAP**

### **Phase 1: JWT Context and Subdomain Routing (Week 1-2)**

#### **Backend Implementation:**
- [ ] Enhance JWT token structure with role claims and tenant context
- [ ] Implement subdomain-based request routing middleware
- [ ] Create role-based authorization middleware
- [ ] Add automatic tenant context injection to database queries
- [ ] Implement enhanced security for platform admin access

#### **Frontend Implementation:**
- [ ] Create subdomain detection and routing logic
- [ ] Implement dynamic UI rendering based on JWT claims
- [ ] Build context-aware navigation and component system
- [ ] Add role-based feature toggles and permission checks

### **Phase 2: Platform Admin Features (Week 3-4)**

#### **Platform Admin Interface:**
- [ ] Cross-tenant dashboard with platform metrics
- [ ] Tenant onboarding and approval workflow
- [ ] Platform analytics and revenue tracking
- [ ] System health monitoring and maintenance
- [ ] Billing and subscription management

#### **Enhanced Security:**
- [ ] MFA implementation for platform admin roles
- [ ] IP restriction and VPN access control
- [ ] Comprehensive audit logging for admin actions
- [ ] Session management with enhanced timeouts

### **Phase 3: Tenant Enhancement (Week 5-6)**

#### **Tenant Banking Enhancement:**
- [ ] Bank-specific branding and customization
- [ ] Tenant-scoped user management
- [ ] Bank configuration and settings management
- [ ] Tenant-specific analytics and reporting
- [ ] Integration management (NIBSS, billers, etc.)

#### **Isolation Validation:**
- [ ] Cross-tenant access prevention testing
- [ ] Tenant data isolation verification
- [ ] Performance testing with multiple tenants
- [ ] Security penetration testing

### **Phase 4: Advanced Features (Week 7-8)**

#### **Business Operations:**
- [ ] Automated tenant provisioning workflows
- [ ] Customer success tracking and metrics
- [ ] Support ticket management system
- [ ] Revenue optimization and analytics
- [ ] Platform health monitoring and alerting

---

## 🏆 **INDUSTRY BEST PRACTICES IMPLEMENTED**

### **Following Major SaaS Platforms:**

#### **Slack-Style Implementation:**
- Same application serving `admin.slack.com` and `{workspace}.slack.com`
- Role-based access with workspace admin and platform admin distinction
- JWT context determining available features and data access

#### **GitHub-Style Permissions:**
- Hierarchical role structure (organization admin, repository admin, user)
- Fine-grained permissions with custom role creation capability
- Enterprise admin access spanning multiple organizations

#### **GitLab-Style Admin Area:**
- Same application with admin area accessible based on role
- Comprehensive permission system with project-level granularity
- Integration-ready with external identity providers

#### **Atlassian-Style Multi-Product Admin:**
- Organization admin delegation with role-based access control
- Custom domain support with branded access URLs
- Centralized user management across multiple products/tenants

---

## 🎯 **SUCCESS METRICS**

### **Technical Implementation Success:**
- [ ] ✅ Single application serving multiple subdomain contexts
- [ ] ✅ JWT-based role separation working across all features
- [ ] ✅ Database queries automatically scoped by tenant context
- [ ] ✅ Dynamic UI rendering based on user role and permissions
- [ ] ✅ Enhanced security for platform admin access

### **Business Operations Success:**
- [ ] ✅ OrokiiPay team can manage all tenants via admin.orokiipay.com
- [ ] ✅ Bank teams can only access their tenant via {tenant}.orokiipay.com
- [ ] ✅ Automated tenant onboarding workflow operational
- [ ] ✅ Platform analytics providing business intelligence
- [ ] ✅ Revenue tracking and billing management functional

### **User Experience Success:**
- [ ] ✅ Seamless role-based navigation and feature access
- [ ] ✅ No confusion about access levels or permissions
- [ ] ✅ Fast response times with unified application architecture
- [ ] ✅ Professional interface adaptation per user context
- [ ] ✅ Mobile and desktop optimization maintained

---

## 🚀 **CONCLUSION**

This **unified application with subdomain-based role separation** approach follows industry best practices and provides:

**✅ Technical Benefits:**
- Single codebase to maintain and deploy
- Same database and infrastructure (cost-efficient)
- JWT-based security with role context
- Seamless feature development across user types

**✅ Security Benefits:**
- Enhanced security for platform admin access
- Automatic tenant isolation through context injection
- Role-based UI and API access control
- Comprehensive audit trails and monitoring

**✅ Business Benefits:**
- Professional SaaS operation capabilities
- Scalable tenant management and onboarding
- Revenue tracking and business intelligence
- Customer success and support workflows

**✅ Development Benefits:**
- Faster feature development (single app)
- Easier testing and quality assurance
- Shared components and utilities
- Consistent user experience patterns

This approach enables us to build a **professional, scalable, secure multi-tenant banking SaaS platform** using the same proven patterns as **Slack, GitHub, GitLab, and Atlassian** - the gold standard of SaaS platform administration.

---

*Document Status: **Industry Best Practices Implementation Plan***
*Architecture: **Unified Application with JWT Context + Subdomain Routing***
*Implementation Start: **Immediate - Week 1 JWT Context Implementation***
*Expected Completion: **8 weeks to full SaaS platform operations***
*Business Impact: **Professional SaaS platform ready for enterprise adoption***