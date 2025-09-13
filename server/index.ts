/**
 * OrokiiPay Multi-Tenant Banking Platform
 * Backend API Server with Authentication
 */

import 'dotenv/config';
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
import transferRoutes from './routes/transfers';
import transactionRoutes from './routes/transactions';
import walletRoutes from './routes/wallets';
import assetRoutes from './routes/assets';
import kycRoutes from './routes/kyc';
import cbnComplianceRoutes from './routes/cbn-compliance';
import pciDssComplianceRoutes from './routes/pci-dss-compliance';
import securityMonitoringRoutes from './routes/security-monitoring';
import transactionLimitsRoutes from './routes/transaction-limits';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import { tenantMiddleware } from './middleware/tenant';

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all requests
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

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

// Start server
app.listen(PORT, () => {
  console.log('🚀 OrokiiPay API Server started successfully!');
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎯 Health check: http://localhost:${PORT}/health`);
  console.log(`🏦 Multi-tenant banking platform ready`);
});

export default app;