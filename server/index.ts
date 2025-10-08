/**
 * OrokiiPay Multi-Tenant Banking Platform
 * Backend API Server with Authentication
 */

import dotenv from 'dotenv';
// Override environment variables with .env file values to ensure correct database configuration
dotenv.config({ override: true });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import registrationRoutes from './routes/registration';
import tenantRoutes from './routes/tenants';
import userRoutes from './routes/users';
import transferRoutes, { initializeTransferServices } from './routes/transfers';
import transactionRoutes from './routes/transactions';
import walletRoutes from './routes/wallets';
import assetRoutes from './routes/assets';
import kycRoutes from './routes/kyc';
import cbnComplianceRoutes from './routes/cbn-compliance';
import pciDssComplianceRoutes from './routes/pci-dss-compliance';
import securityMonitoringRoutes from './routes/security-monitoring';
import transactionLimitsRoutes from './routes/transaction-limits';
import aiChatRoutes from './routes/ai-chat';
// TEMP: Disabled due to TypeScript errors
// import { createRBACRouter } from './routes/rbac';
import accountRoutes from './routes/accounts';
import billRoutes from './routes/bills';
import analyticsRoutes from './routes/analytics';
import notificationRoutes from './routes/notifications';
import savingsRoutes from './routes/savings';
import loansRoutes from './routes/loans';
import banksRoutes from './routes/banks';
import tenantThemesRoutes from './routes/tenantThemes';
import rewardsRoutes from './routes/rewards';
import referralRoutes from './routes/referrals';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import { tenantMiddleware } from './middleware/tenant';
import { pool } from './config/database';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for multi-tenant
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
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
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Environment-based rate limiting configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Rate limiting - Relaxed for development, strict for production
const limiter = rateLimit({
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
const authLimiter = rateLimit({
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
app.use('/mockups', express.static(path.join(__dirname, '../public/mockups')));

// Serve design system files
app.use('/design-system', express.static(path.join(__dirname, '../public/design-system')));

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
app.use('/api/auth', authLimiter, tenantMiddleware, authRoutes);
app.use('/api/registration', authLimiter, tenantMiddleware, registrationRoutes); // Public registration - no auth required
app.use('/api/tenants', assetRoutes); // Public asset serving - no auth required
app.use('/api/tenants/theme', tenantThemesRoutes); // Public tenant theme API - no auth required (moved up to avoid auth)
app.use('/api/tenants', authenticateToken, tenantRoutes);
app.use('/api/users', authenticateToken, tenantMiddleware, userRoutes);
app.use('/api/transfers', authenticateToken, tenantMiddleware, transferRoutes);
app.use('/api/transactions', authenticateToken, tenantMiddleware, transactionRoutes);
app.use('/api/wallets', authenticateToken, tenantMiddleware, walletRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/cbn-compliance', authenticateToken, tenantMiddleware, cbnComplianceRoutes);
app.use('/api/pci-dss-compliance', authenticateToken, tenantMiddleware, pciDssComplianceRoutes);
app.use('/api/security-monitoring', authenticateToken, tenantMiddleware, securityMonitoringRoutes);
app.use('/api/transaction-limits', authenticateToken, tenantMiddleware, transactionLimitsRoutes);
app.use('/api/ai', authenticateToken, tenantMiddleware, aiChatRoutes);
// TEMP: Disabled due to TypeScript errors
// app.use('/api/rbac', tenantMiddleware, createRBACRouter(pool));
app.use('/api/accounts', authenticateToken, tenantMiddleware, accountRoutes);
app.use('/api/bills', authenticateToken, tenantMiddleware, billRoutes);
app.use('/api/analytics', authenticateToken, tenantMiddleware, analyticsRoutes);
app.use('/api/notifications', authenticateToken, tenantMiddleware, notificationRoutes);
app.use('/api/savings', authenticateToken, tenantMiddleware, savingsRoutes);
app.use('/api/loans', authenticateToken, tenantMiddleware, loansRoutes);
app.use('/api/banks', authenticateToken, tenantMiddleware, banksRoutes);
app.use('/api/rewards', authenticateToken, tenantMiddleware, rewardsRoutes);
app.use('/api/referrals', tenantMiddleware, referralRoutes); // Mixed auth (some endpoints public)

// Error handling
app.use(notFound);
app.use(errorHandler);

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
initializeTransferServices(pool);

// Start server
app.listen(PORT, () => {
  console.log('🚀 OrokiiPay API Server started successfully!');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Health check: http://localhost:${PORT}/health`);
  console.log(`🏦 Multi-tenant banking platform ready`);
});

export default app;