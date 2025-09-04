# Book 2: Backend Microservices, Deployment & DevOps Guide
## Nigerian PoS System - Enterprise Infrastructure Implementation

**Version:** 1.0  
**Date:** August 2025  
**Target Audience:** Backend Developers, DevOps Engineers, System Architects  

---

## Table of Contents

1. [Node.js Microservices Architecture](#1-nodejs-microservices-architecture)
2. [Database Design and Implementation](#2-database-design-and-implementation)
3. [Integration with Nigerian Payment Systems](#3-integration-with-nigerian-payment-systems)
4. [Security Implementation and PCI DSS Compliance](#4-security-implementation-and-pci-dss-compliance)
5. [Deployment Strategies](#5-deployment-strategies)
6. [Monitoring, Logging, and Maintenance](#6-monitoring-logging-and-maintenance)
7. [DevOps and CI/CD Pipelines](#7-devops-and-cicd-pipelines)
8. [Scaling and Performance Optimization](#8-scaling-and-performance-optimization)

---

## 1. Node.js Microservices Architecture

### 1.1 Microservices Foundation

#### 1.1.1 Project Structure for Microservices

```bash
nigerian-pos-backend/
├── services/
│   ├── api-gateway/           # API Gateway service
│   ├── auth-service/          # Authentication service
│   ├── user-service/          # User management service
│   ├── transaction-service/   # Transaction processing
│   ├── wallet-service/        # Wallet management
│   ├── fraud-service/         # Fraud detection
│   ├── notification-service/  # Notifications
│   ├── settlement-service/    # Settlement processing
│   ├── reporting-service/     # Analytics and reporting
│   └── compliance-service/    # AML/Compliance
├── shared/                    # Shared libraries
│   ├── types/                # Common TypeScript types
│   ├── utils/                # Utility functions
│   ├── middleware/           # Common middleware
│   └── config/               # Configuration management
├── infrastructure/           # Infrastructure as code
│   ├── docker/              # Docker configurations
│   ├── kubernetes/          # K8s manifests
│   └── terraform/           # Infrastructure provisioning
├── docs/                    # API documentation
└── scripts/                 # Deployment scripts
```

#### 1.1.2 Base Microservice Template

**shared/base-service/BaseService.ts:**
```typescript
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './Logger';
import { DatabaseConnection } from './DatabaseConnection';
import { MessageQueue } from './MessageQueue';
import { HealthCheck } from './HealthCheck';

export interface ServiceConfig {
  name: string;
  port: number;
  version: string;
  database?: {
    url: string;
    name: string;
  };
  redis?: {
    url: string;
  };
  messageQueue?: {
    url: string;
  };
}

export abstract class BaseService {
  protected app: Application;
  protected logger: Logger;
  protected db?: DatabaseConnection;
  protected messageQueue?: MessageQueue;
  protected healthCheck: HealthCheck;

  constructor(protected config: ServiceConfig) {
    this.app = express();
    this.logger = new Logger(config.name);
    this.healthCheck = new HealthCheck(config.name);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Request ID middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.id = req.headers['x-request-id'] as string || uuidv4();
      res.setHeader('x-request-id', req.id);
      next();
    });

    // Logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logger.info('HTTP Request', {
          requestId: req.id,
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
        });
      });
      
      next();
    });

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json(this.healthCheck.getStatus());
    });

    // Service info endpoint
    this.app.get('/info', (req: Request, res: Response) => {
      res.json({
        service: this.config.name,
        version: this.config.version,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });
  }

  private setupRoutes(): void {
    // Abstract method to be implemented by child classes
    this.initializeRoutes();
  }

  protected abstract initializeRoutes(): void;

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        requestId: req.id,
      });
    });

    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      this.logger.error('Unhandled error', {
        requestId: req.id,
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
      });

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        requestId: req.id,
      });
    });
  }

  protected async initializeDatabase(): Promise<void> {
    if (this.config.database) {
      this.db = new DatabaseConnection(this.config.database);
      await this.db.connect();
      this.healthCheck.addCheck('database', () => this.db!.isHealthy());
    }
  }

  protected async initializeMessageQueue(): Promise<void> {
    if (this.config.messageQueue) {
      this.messageQueue = new MessageQueue(this.config.messageQueue);
      await this.messageQueue.connect();
      this.healthCheck.addCheck('messageQueue', () => this.messageQueue!.isHealthy());
    }
  }

  public async start(): Promise<void> {
    try {
      await this.initializeDatabase();
      await this.initializeMessageQueue();
      
      this.app.listen(this.config.port, () => {
        this.logger.info(`🚀 ${this.config.name} service started on port ${this.config.port}`);
      });
    } catch (error) {
      this.logger.error('Failed to start service', { error });
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down service...');
    
    if (this.db) {
      await this.db.disconnect();
    }
    
    if (this.messageQueue) {
      await this.messageQueue.disconnect();
    }
    
    this.logger.info('Service shutdown complete');
  }
}

// Extend Request interface to include request ID
declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}
```

### 1.2 Individual Microservices Implementation

#### 1.2.1 Authentication Service

**services/auth-service/src/AuthService.ts:**
```typescript
import { BaseService, ServiceConfig } from '../../../shared/base-service/BaseService';
import { Router } from 'express';
import { AuthController } from './controllers/AuthController';
import { AuthMiddleware } from './middleware/AuthMiddleware';
import { TokenService } from './services/TokenService';
import { BiometricService } from './services/BiometricService';

export class AuthService extends BaseService {
  private authController: AuthController;
  private authMiddleware: AuthMiddleware;

  constructor(config: ServiceConfig) {
    super(config);
    
    const tokenService = new TokenService();
    const biometricService = new BiometricService();
    
    this.authController = new AuthController(tokenService, biometricService);
    this.authMiddleware = new AuthMiddleware(tokenService);
  }

  protected initializeRoutes(): void {
    const router = Router();

    // Authentication routes
    router.post('/auth/login', this.authController.login);
    router.post('/auth/logout', this.authMiddleware.authenticate, this.authController.logout);
    router.post('/auth/refresh', this.authController.refreshToken);
    router.post('/auth/verify-otp', this.authController.verifyOTP);
    router.post('/auth/send-otp', this.authController.sendOTP);
    
    // Biometric authentication
    router.post('/auth/biometric/register', this.authMiddleware.authenticate, this.authController.registerBiometric);
    router.post('/auth/biometric/verify', this.authController.verifyBiometric);
    router.delete('/auth/biometric', this.authMiddleware.authenticate, this.authController.removeBiometric);
    
    // Password management
    router.post('/auth/forgot-password', this.authController.forgotPassword);
    router.post('/auth/reset-password', this.authController.resetPassword);
    router.post('/auth/change-password', this.authMiddleware.authenticate, this.authController.changePassword);
    
    // Session management
    router.get('/auth/sessions', this.authMiddleware.authenticate, this.authController.getSessions);
    router.delete('/auth/sessions/:sessionId', this.authMiddleware.authenticate, this.authController.removeSession);
    
    // Token validation (for other services)
    router.post('/auth/validate', this.authController.validateToken);

    this.app.use('/api/v1', router);
  }
}

// Start the service
const config: ServiceConfig = {
  name: 'auth-service',
  port: parseInt(process.env.PORT || '3001'),
  version: process.env.npm_package_version || '1.0.0',
  database: {
    url: process.env.DATABASE_URL!,
    name: 'auth_db',
  },
  redis: {
    url: process.env.REDIS_URL!,
  },
  messageQueue: {
    url: process.env.MESSAGE_QUEUE_URL!,
  },
};

const authService = new AuthService(config);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await authService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await authService.shutdown();
  process.exit(0);
});

authService.start();
```

**services/auth-service/src/controllers/AuthController.ts:**
```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { TokenService } from '../services/TokenService';
import { BiometricService } from '../services/BiometricService';
import { UserRepository } from '../repositories/UserRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import { OTPService } from '../services/OTPService';
import { RateLimitService } from '../services/RateLimitService';
import { AuditService } from '../services/AuditService';

export class AuthController {
  constructor(
    private tokenService: TokenService,
    private biometricService: BiometricService,
    private userRepository = new UserRepository(),
    private sessionRepository = new SessionRepository(),
    private otpService = new OTPService(),
    private rateLimitService = new RateLimitService(),
    private auditService = new AuditService()
  ) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, otp, deviceId } = req.body;
      const clientIP = req.ip;

      // Rate limiting
      const rateLimitKey = `login:${clientIP}:${email}`;
      const isRateLimited = await this.rateLimitService.checkRateLimit(rateLimitKey, 5, 900); // 5 attempts per 15 minutes
      
      if (isRateLimited) {
        res.status(429).json({
          success: false,
          message: 'Too many login attempts. Please try again later.',
        });
        return;
      }

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      // Find user
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        await this.auditService.log({
          userId: null,
          action: 'LOGIN_FAILED',
          details: { email, reason: 'User not found' },
          ipAddress: clientIP,
          userAgent: req.get('User-Agent'),
        });

        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      // Check if account is locked
      if (user.isLocked) {
        res.status(423).json({
          success: false,
          message: 'Account is locked. Please contact support.',
        });
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        await this.userRepository.incrementFailedLogins(user.id);
        await this.auditService.log({
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: { reason: 'Invalid password' },
          ipAddress: clientIP,
          userAgent: req.get('User-Agent'),
        });

        res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
        return;
      }

      // Check if OTP is required
      const requiresOTP = user.mfaEnabled || this.shouldRequireOTP(user, clientIP);
      
      if (requiresOTP && !otp) {
        // Send OTP
        await this.otpService.sendOTP(user.phoneNumber, user.id);
        
        res.status(200).json({
          success: true,
          message: 'OTP sent to your registered phone number',
          requiresOTP: true,
          tempToken: await this.tokenService.generateTempToken(user.id),
        });
        return;
      }

      if (requiresOTP && otp) {
        const isOTPValid = await this.otpService.verifyOTP(user.id, otp);
        if (!isOTPValid) {
          res.status(401).json({
            success: false,
            message: 'Invalid OTP',
          });
          return;
        }
      }

      // Generate tokens
      const accessToken = await this.tokenService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = await this.tokenService.generateRefreshToken(user.id);

      // Create session
      const sessionId = uuidv4();
      await this.sessionRepository.create({
        id: sessionId,
        userId: user.id,
        deviceId: deviceId || 'unknown',
        ipAddress: clientIP,
        userAgent: req.get('User-Agent'),
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      // Reset failed login attempts
      await this.userRepository.resetFailedLogins(user.id);
      await this.userRepository.updateLastLogin(user.id);

      // Audit log
      await this.auditService.log({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        details: { sessionId },
        ipAddress: clientIP,
        userAgent: req.get('User-Agent'),
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phoneNumber: user.phoneNumber,
          },
          accessToken,
          refreshToken,
          sessionId,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId } = req.body;
      const userId = (req as any).user.userId;

      if (sessionId) {
        await this.sessionRepository.invalidate(sessionId);
        await this.tokenService.blacklistToken(sessionId);
      } else {
        // Logout all sessions for user
        await this.sessionRepository.invalidateAllForUser(userId);
      }

      await this.auditService.log({
        userId,
        action: 'LOGOUT',
        details: { sessionId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      // Verify refresh token
      const payload = await this.tokenService.verifyRefreshToken(refreshToken);
      if (!payload) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
        return;
      }

      // Check if session exists and is valid
      const session = await this.sessionRepository.findByRefreshToken(refreshToken);
      if (!session || session.isRevoked) {
        res.status(401).json({
          success: false,
          message: 'Session expired or invalid',
        });
        return;
      }

      // Get user
      const user = await this.userRepository.findById(payload.userId);
      if (!user || user.isLocked) {
        res.status(401).json({
          success: false,
          message: 'User not found or account locked',
        });
        return;
      }

      // Generate new tokens
      const newAccessToken = await this.tokenService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const newRefreshToken = await this.tokenService.generateRefreshToken(user.id);

      // Update session
      await this.sessionRepository.updateTokens(session.id, newAccessToken, newRefreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  verifyOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tempToken, otp } = req.body;

      if (!tempToken || !otp) {
        res.status(400).json({
          success: false,
          message: 'Temporary token and OTP are required',
        });
        return;
      }

      // Verify temp token
      const payload = await this.tokenService.verifyTempToken(tempToken);
      if (!payload) {
        res.status(401).json({
          success: false,
          message: 'Invalid temporary token',
        });
        return;
      }

      // Verify OTP
      const isOTPValid = await this.otpService.verifyOTP(payload.userId, otp);
      if (!isOTPValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid OTP',
        });
        return;
      }

      // Get user
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      // Generate tokens
      const accessToken = await this.tokenService.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = await this.tokenService.generateRefreshToken(user.id);

      // Create session
      const sessionId = uuidv4();
      await this.sessionRepository.create({
        id: sessionId,
        userId: user.id,
        deviceId: 'unknown',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      await this.auditService.log({
        userId: user.id,
        action: 'OTP_VERIFIED',
        details: { sessionId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            phoneNumber: user.phoneNumber,
          },
          accessToken,
          refreshToken,
          sessionId,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  validateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token is required',
        });
        return;
      }

      const payload = await this.tokenService.verifyAccessToken(token);
      if (!payload) {
        res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
        return;
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.tokenService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        res.status(401).json({
          success: false,
          message: 'Token is blacklisted',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  private shouldRequireOTP(user: any, clientIP: string): boolean {
    // Implement logic to determine if OTP should be required
    // Based on risk factors like unknown IP, device, etc.
    return !user.trustedIPs?.includes(clientIP);
  }

  // Additional methods for biometric authentication, password management, etc.
  // ... (implementation continues)
}
```

#### 1.2.2 Transaction Service

**services/transaction-service/src/TransactionService.ts:**
```typescript
import { BaseService, ServiceConfig } from '../../../shared/base-service/BaseService';
import { Router } from 'express';
import { TransactionController } from './controllers/TransactionController';
import { TransactionMiddleware } from './middleware/TransactionMiddleware';
import { PaymentProcessor } from './services/PaymentProcessor';
import { FraudDetector } from './services/FraudDetector';
import { SettlementService } from './services/SettlementService';

export class TransactionService extends BaseService {
  private transactionController: TransactionController;
  private transactionMiddleware: TransactionMiddleware;

  constructor(config: ServiceConfig) {
    super(config);
    
    const paymentProcessor = new PaymentProcessor();
    const fraudDetector = new FraudDetector();
    const settlementService = new SettlementService();
    
    this.transactionController = new TransactionController(
      paymentProcessor,
      fraudDetector,
      settlementService
    );
    
    this.transactionMiddleware = new TransactionMiddleware();
  }

  protected initializeRoutes(): void {
    const router = Router();

    // Transaction processing routes
    router.post('/transactions/process', 
      this.transactionMiddleware.authenticate,
      this.transactionMiddleware.validateTransaction,
      this.transactionController.processTransaction
    );

    router.get('/transactions/:id',
      this.transactionMiddleware.authenticate,
      this.transactionController.getTransaction
    );

    router.get('/transactions',
      this.transactionMiddleware.authenticate,
      this.transactionController.getTransactions
    );

    router.post('/transactions/:id/reverse',
      this.transactionMiddleware.authenticate,
      this.transactionMiddleware.requireRole(['ADMIN', 'SUPER_AGENT']),
      this.transactionController.reverseTransaction
    );

    // Settlement routes
    router.get('/settlements',
      this.transactionMiddleware.authenticate,
      this.transactionController.getSettlements
    );

    router.post('/settlements/batch',
      this.transactionMiddleware.authenticate,
      this.transactionMiddleware.requireRole(['ADMIN']),
      this.transactionController.processBatchSettlement
    );

    // Balance and wallet routes
    router.get('/balance',
      this.transactionMiddleware.authenticate,
      this.transactionController.getBalance
    );

    router.get('/transactions/stats',
      this.transactionMiddleware.authenticate,
      this.transactionController.getTransactionStats
    );

    this.app.use('/api/v1', router);
  }
}
```

**services/transaction-service/src/controllers/TransactionController.ts:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PaymentProcessor } from '../services/PaymentProcessor';
import { FraudDetector } from '../services/FraudDetector';
import { SettlementService } from '../services/SettlementService';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { WalletRepository } from '../repositories/WalletRepository';
import { AuditService } from '../services/AuditService';
import { NotificationService } from '../services/NotificationService';
import { TransactionType, TransactionStatus } from '../types/Transaction';

export class TransactionController {
  constructor(
    private paymentProcessor: PaymentProcessor,
    private fraudDetector: FraudDetector,
    private settlementService: SettlementService,
    private transactionRepository = new TransactionRepository(),
    private walletRepository = new WalletRepository(),
    private auditService = new AuditService(),
    private notificationService = new NotificationService()
  ) {}

  processTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const transactionId = uuidv4();
    
    try {
      const { type, amount, sourceAccount, destinationAccount, cardNumber, pin, description, metadata } = req.body;
      const userId = (req as any).user.userId;

      // Create pending transaction record
      const transaction = await this.transactionRepository.create({
        id: transactionId,
        reference: this.generateReference(),
        type,
        amount,
        currency: 'NGN',
        status: TransactionStatus.PENDING,
        userId,
        sourceAccount,
        destinationAccount,
        cardNumber: cardNumber ? this.maskCardNumber(cardNumber) : null,
        description,
        metadata,
        createdAt: new Date(),
      });

      // Audit log
      await this.auditService.log({
        userId,
        action: 'TRANSACTION_INITIATED',
        entityType: 'TRANSACTION',
        entityId: transactionId,
        details: { type, amount, reference: transaction.reference },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      // Fraud detection
      const fraudScore = await this.fraudDetector.assessRisk({
        userId,
        transactionId,
        type,
        amount,
        sourceAccount,
        destinationAccount,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata,
      });

      if (fraudScore > 80) {
        await this.transactionRepository.updateStatus(transactionId, TransactionStatus.BLOCKED);
        
        res.status(403).json({
          success: false,
          message: 'Transaction blocked due to fraud detection',
          transactionId,
        });
        return;
      }

      // Process transaction based on type
      let processingResult;
      
      switch (type) {
        case TransactionType.CASH_WITHDRAWAL:
          processingResult = await this.paymentProcessor.processCashWithdrawal({
            transactionId,
            amount,
            cardNumber,
            pin,
            metadata,
          });
          break;

        case TransactionType.MONEY_TRANSFER:
          processingResult = await this.paymentProcessor.processMoneyTransfer({
            transactionId,
            amount,
            sourceAccount,
            destinationAccount,
            description,
            metadata,
          });
          break;

        case TransactionType.BILL_PAYMENT:
          processingResult = await this.paymentProcessor.processBillPayment({
            transactionId,
            amount,
            billerId: destinationAccount,
            customerReference: sourceAccount,
            metadata,
          });
          break;

        case TransactionType.AIRTIME_PURCHASE:
          processingResult = await this.paymentProcessor.processAirtimePurchase({
            transactionId,
            amount,
            phoneNumber: destinationAccount,
            network: metadata?.network,
          });
          break;

        default:
          throw new Error(`Unsupported transaction type: ${type}`);
      }

      // Update transaction status based on processing result
      if (processingResult.success) {
        await this.transactionRepository.updateStatus(transactionId, TransactionStatus.COMPLETED);
        await this.transactionRepository.updateProcessingDetails(transactionId, {
          processedAt: new Date(),
          externalReference: processingResult.externalReference,
          providerResponse: processingResult.providerResponse,
        });

        // Update wallet balances if applicable
        if (type === TransactionType.CASH_WITHDRAWAL || type === TransactionType.BILL_PAYMENT || type === TransactionType.AIRTIME_PURCHASE) {
          await this.walletRepository.debitBalance(userId, amount);
        }

        // Send notification
        await this.notificationService.sendTransactionNotification(userId, {
          transactionId,
          type,
          amount,
          status: TransactionStatus.COMPLETED,
          reference: transaction.reference,
        });

        // Audit log
        await this.auditService.log({
          userId,
          action: 'TRANSACTION_COMPLETED',
          entityType: 'TRANSACTION',
          entityId: transactionId,
          details: { 
            amount, 
            type, 
            externalReference: processingResult.externalReference 
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.status(200).json({
          success: true,
          message: 'Transaction processed successfully',
          data: {
            transactionId,
            reference: transaction.reference,
            status: TransactionStatus.COMPLETED,
            amount,
            type,
            externalReference: processingResult.externalReference,
          },
        });
      } else {
        await this.transactionRepository.updateStatus(transactionId, TransactionStatus.FAILED);
        await this.transactionRepository.updateProcessingDetails(transactionId, {
          processedAt: new Date(),
          failureReason: processingResult.message,
          providerResponse: processingResult.providerResponse,
        });

        // Audit log
        await this.auditService.log({
          userId,
          action: 'TRANSACTION_FAILED',
          entityType: 'TRANSACTION',
          entityId: transactionId,
          details: { 
            amount, 
            type, 
            failureReason: processingResult.message 
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.status(400).json({
          success: false,
          message: processingResult.message,
          data: {
            transactionId,
            reference: transaction.reference,
            status: TransactionStatus.FAILED,
          },
        });
      }
    } catch (error) {
      // Update transaction status to failed
      await this.transactionRepository.updateStatus(transactionId, TransactionStatus.FAILED);
      await this.transactionRepository.updateProcessingDetails(transactionId, {
        processedAt: new Date(),
        failureReason: error instanceof Error ? error.message : 'Processing failed',
      });

      next(error);
    }
  };

  getTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;
      const userRole = (req as any).user.role;

      const transaction = await this.transactionRepository.findById(id);
      
      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found',
        });
        return;
      }

      // Authorization check - users can only see their own transactions unless they're admin
      if (transaction.userId !== userId && !['ADMIN', 'SUPER_AGENT'].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Transaction retrieved successfully',
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const userRole = (req as any).user.role;
      const { page = 1, limit = 20, status, type, startDate, endDate } = req.query;

      const filters: any = {};
      
      // Regular users can only see their own transactions
      if (!['ADMIN', 'SUPER_AGENT'].includes(userRole)) {
        filters.userId = userId;
      }

      if (status) filters.status = status;
      if (type) filters.type = type;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const { transactions, total, totalPages } = await this.transactionRepository.findWithFilters(
        filters,
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        }
      );

      res.status(200).json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: {
          transactions,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            totalPages,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.userId;

      const wallet = await this.walletRepository.findByUserId(userId);
      
      if (!wallet) {
        res.status(404).json({
          success: false,
          message: 'Wallet not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Balance retrieved successfully',
        data: {
          balance: wallet.balance,
          currency: wallet.currency,
          lastUpdated: wallet.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  private generateReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString