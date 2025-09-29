"use strict";
/**
 * OrokiiPay Multi-Tenant Banking Platform
 * Backend API Server with Authentication
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = require("express-rate-limit");
const path_1 = __importDefault(require("path"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const registration_1 = __importDefault(require("./routes/registration"));
const tenants_1 = __importDefault(require("./routes/tenants"));
const users_1 = __importDefault(require("./routes/users"));
const transfers_1 = __importStar(require("./routes/transfers"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const wallets_1 = __importDefault(require("./routes/wallets"));
const assets_1 = __importDefault(require("./routes/assets"));
const kyc_1 = __importDefault(require("./routes/kyc"));
const cbn_compliance_1 = __importDefault(require("./routes/cbn-compliance"));
const pci_dss_compliance_1 = __importDefault(require("./routes/pci-dss-compliance"));
const security_monitoring_1 = __importDefault(require("./routes/security-monitoring"));
const transaction_limits_1 = __importDefault(require("./routes/transaction-limits"));
const ai_chat_1 = __importDefault(require("./routes/ai-chat"));
const rbac_1 = require("./routes/rbac");
const accounts_1 = __importDefault(require("./routes/accounts"));
const bills_1 = __importDefault(require("./routes/bills"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const savings_1 = __importDefault(require("./routes/savings"));
const loans_1 = __importDefault(require("./routes/loans"));
const banks_1 = __importDefault(require("./routes/banks"));
const tenantThemes_1 = __importDefault(require("./routes/tenantThemes"));
// Import middleware
const errorHandler_1 = require("./middleware/errorHandler");
const auth_2 = require("./middleware/auth");
const tenant_1 = require("./middleware/tenant");
const database_1 = require("./config/database");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));
// CORS configuration for multi-tenant
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
        // Allow localhost and orokii.com subdomains
        const allowedOrigins = [
            'http://localhost:3000',
            'https://localhost:3000',
            'http://localhost:8083', // New frontend port
            'https://localhost:8083', // New frontend port (HTTPS)
            /^https?:\/\/.*\.orokii\.com$/,
            'https://fmfb.orokii.com',
            'http://localhost:8080', // React Native debugger
        ];
        const isAllowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return origin === allowedOrigin;
            }
            return allowedOrigin.test(origin);
        });
        callback(null, isAllowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Requested-With'],
}));
// Compression and parsing
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Logging
app.use((0, morgan_1.default)('combined'));
// Environment-based rate limiting configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
// Rate limiting - Relaxed for development, strict for production
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 1000 : 100, // Dev: 1000 requests, Prod: 100 requests per 15min
    message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
// Apply rate limiting to all requests
app.use(limiter);
// Auth rate limiting - Relaxed for development/QA, strict for production
const authLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 100 : 5, // Dev: 100 logins, Prod: 5 logins per 15min
    skipSuccessfulRequests: true,
    message: {
        error: isDevelopment
            ? 'Rate limit reached. For QA/testing: 100 attempts per 15min allowed.'
            : 'Too many authentication attempts, please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
});
// Log rate limit configuration on startup
console.log(`🔒 Rate Limiting: ${isDevelopment ? 'RELAXED (Development/QA)' : 'STRICT (Production)'}`);
console.log(`   - General: ${isDevelopment ? '1000' : '100'} requests per 15min`);
console.log(`   - Auth: ${isDevelopment ? '100' : '5'} attempts per 15min`);
// Serve static files (HTML mockups)
app.use('/mockups', express_1.default.static(path_1.default.join(__dirname, '../public/mockups')));
// Serve design system files
app.use('/design-system', express_1.default.static(path_1.default.join(__dirname, '../public/design-system')));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
    });
});
// API routes
app.use('/api/auth', authLimiter, tenant_1.tenantMiddleware, auth_1.default);
app.use('/api/registration', authLimiter, tenant_1.tenantMiddleware, registration_1.default); // Public registration - no auth required
app.use('/api/tenants', assets_1.default); // Public asset serving - no auth required
app.use('/api/tenants/theme', tenantThemes_1.default); // Public tenant theme API - no auth required (moved up to avoid auth)
app.use('/api/tenants', auth_2.authenticateToken, tenants_1.default);
app.use('/api/users', auth_2.authenticateToken, tenant_1.tenantMiddleware, users_1.default);
app.use('/api/transfers', auth_2.authenticateToken, tenant_1.tenantMiddleware, transfers_1.default);
app.use('/api/transactions', auth_2.authenticateToken, tenant_1.tenantMiddleware, transactions_1.default);
app.use('/api/wallets', auth_2.authenticateToken, tenant_1.tenantMiddleware, wallets_1.default);
app.use('/api/kyc', kyc_1.default);
app.use('/api/cbn-compliance', auth_2.authenticateToken, tenant_1.tenantMiddleware, cbn_compliance_1.default);
app.use('/api/pci-dss-compliance', auth_2.authenticateToken, tenant_1.tenantMiddleware, pci_dss_compliance_1.default);
app.use('/api/security-monitoring', auth_2.authenticateToken, tenant_1.tenantMiddleware, security_monitoring_1.default);
app.use('/api/transaction-limits', auth_2.authenticateToken, tenant_1.tenantMiddleware, transaction_limits_1.default);
app.use('/api/ai', auth_2.authenticateToken, tenant_1.tenantMiddleware, ai_chat_1.default);
app.use('/api/rbac', tenant_1.tenantMiddleware, (0, rbac_1.createRBACRouter)(database_1.pool));
app.use('/api/accounts', auth_2.authenticateToken, tenant_1.tenantMiddleware, accounts_1.default);
app.use('/api/bills', auth_2.authenticateToken, tenant_1.tenantMiddleware, bills_1.default);
app.use('/api/analytics', auth_2.authenticateToken, tenant_1.tenantMiddleware, analytics_1.default);
app.use('/api/notifications', auth_2.authenticateToken, tenant_1.tenantMiddleware, notifications_1.default);
app.use('/api/savings', auth_2.authenticateToken, tenant_1.tenantMiddleware, savings_1.default);
app.use('/api/loans', auth_2.authenticateToken, tenant_1.tenantMiddleware, loans_1.default);
app.use('/api/banks', auth_2.authenticateToken, tenant_1.tenantMiddleware, banks_1.default);
// Error handling
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT. Shutting down gracefully...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM. Shutting down gracefully...');
    process.exit(0);
});
// Initialize transfer services with database pool
(0, transfers_1.initializeTransferServices)(database_1.pool);
// Start server
app.listen(PORT, () => {
    console.log('🚀 OrokiiPay API Server started successfully!');
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🎯 Health check: http://localhost:${PORT}/health`);
    console.log(`🏦 Multi-tenant banking platform ready`);
});
exports.default = app;
//# sourceMappingURL=index.js.map