import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { QueryResult } from 'pg';

// Helper function to create proper QueryResult mock
function createQueryResult<T>(rows: T[]): QueryResult<T> {
  return {
    rows,
    command: 'SELECT',
    rowCount: rows.length,
    oid: 0,
    fields: []
  } as QueryResult<T>;
}

// Mock database dependencies
jest.mock('../../server/config/database', () => ({
  query: jest.fn(),
}));

// Mock filesystem operations
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  unlink: jest.fn(),
}));

// Mock authentication middleware
const mockAuthenticateToken = jest.fn((req: any, res: any, next: any) => {
  req.user = {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'customer',
    status: 'active',
    tenantId: 'test-tenant-id',
    tenantName: 'test-tenant',
    tenantDisplayName: 'Test Tenant',
  };
  next();
});

jest.mock('../../server/middleware/auth', () => ({
  authenticateToken: mockAuthenticateToken,
}));

// Mock tenant middleware
jest.mock('../../server/middleware/tenant', () => ({
  validateTenantAccess: jest.fn((req: any, res: any, next: any) => {
    req.tenant = { id: 'test-tenant-id', name: 'test-tenant' };
    next();
  }),
  tenantMiddleware: jest.fn((req: any, res: any, next: any) => {
    req.tenant = { id: 'test-tenant-id', name: 'test-tenant' };
    next();
  }),
}));

import { query } from '../../server/config/database';
import { mkdir, unlink } from 'fs/promises';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockMkdir = mkdir as jest.MockedFunction<typeof mkdir>;
const mockUnlink = unlink as jest.MockedFunction<typeof unlink>;

describe('KYC Routes', () => {
  let app: express.Application;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock returns
    mockMkdir.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);
    
    // Dynamically import the routes to ensure mocks are applied
    const kycRoutes = await import('../../server/routes/kyc');
    
    app = express();
    app.use(express.json());
    app.use(mockAuthenticateToken);
    app.use((req: any, res: any, next: any) => {
      req.tenant = { id: 'test-tenant-id', name: 'test-tenant' };
      next();
    });
    app.use('/api/kyc', kycRoutes.default);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/kyc/requirements', () => {
    it('should return KYC requirements for tenant', async () => {
      const mockTenant = {
        id: 'test-tenant-id',
        settings: {
          kyc: {
            required: true,
            levels: ['tier1', 'tier2', 'tier3'],
            documents: ['government_id', 'proof_of_address', 'selfie_with_id']
          }
        }
      };

      mockQuery.mockResolvedValueOnce(createQueryResult([mockTenant]));

      const response = await request(app)
        .get('/api/kyc/requirements');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.kyc_required).toBe(true);
      expect(response.body.data.required_documents).toEqual(['government_id', 'proof_of_address', 'selfie_with_id']);
      expect(response.body.data.accepted_formats).toEqual(['jpg', 'jpeg', 'png', 'pdf']);
      expect(response.body.data.max_file_size).toBe('5MB');
    });

    it('should return default requirements when tenant settings are missing', async () => {
      const mockTenant = {
        id: 'test-tenant-id',
        settings: {}
      };

      mockQuery.mockResolvedValueOnce(createQueryResult([mockTenant]));

      const response = await request(app)
        .get('/api/kyc/requirements');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.kyc_required).toBe(true);
      expect(response.body.data.levels).toEqual(['tier1', 'tier2', 'tier3']);
    });

    it('should handle tenant not found', async () => {
      mockQuery.mockResolvedValueOnce(createQueryResult([]));

      const response = await request(app)
        .get('/api/kyc/requirements');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Tenant not found');
      expect(response.body.code).toBe('TENANT_NOT_FOUND');
    });
  });

  describe('GET /api/kyc/documents', () => {
    it('should return user KYC documents and status', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          document_type: 'government_id',
          document_number: '1234567890',
          status: 'approved',
          uploaded_at: '2025-01-01T00:00:00Z',
          verified_at: '2025-01-02T00:00:00Z',
          rejected_reason: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      ];

      const mockUser = {
        kyc_status: 'completed',
        kyc_level: 2,
        kyc_completed_at: '2025-01-02T00:00:00Z'
      };

      mockQuery
        .mockResolvedValueOnce(createQueryResult(mockDocuments))
        .mockResolvedValueOnce(createQueryResult([mockUser]));

      const response = await request(app)
        .get('/api/kyc/documents');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.documents).toHaveLength(1);
      expect(response.body.data.documents[0].documentType).toBe('government_id');
      expect(response.body.data.documents[0].documentNumber).toBe('****7890');
      expect(response.body.data.documents[0].status).toBe('approved');
      expect(response.body.data.overall_status.kyc_status).toBe('completed');
      expect(response.body.data.overall_status.kyc_level).toBe(2);
    });

    it('should handle empty documents list', async () => {
      const mockUser = {
        kyc_status: 'pending',
        kyc_level: 1,
        kyc_completed_at: null
      };

      mockQuery
        .mockResolvedValueOnce(createQueryResult([]))
        .mockResolvedValueOnce(createQueryResult([mockUser]));

      const response = await request(app)
        .get('/api/kyc/documents');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.documents).toHaveLength(0);
      expect(response.body.data.overall_status.kyc_status).toBe('pending');
    });
  });

  describe('POST /api/kyc/submit', () => {
    it('should submit KYC for review when all required documents are uploaded', async () => {
      const mockDocuments = [
        { document_type: 'government_id', status: 'pending' },
        { document_type: 'proof_of_address', status: 'pending' },
        { document_type: 'selfie_with_id', status: 'pending' }
      ];

      mockQuery
        .mockResolvedValueOnce(createQueryResult(mockDocuments))
        .mockResolvedValueOnce({ query: 'UPDATE users' })
        .mockResolvedValueOnce({ query: 'UPDATE kyc_documents' })
        .mockResolvedValueOnce({ query: 'INSERT INTO user_activity_logs' });

      const response = await request(app)
        .post('/api/kyc/submit');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('KYC submitted for review successfully');
      expect(response.body.data.status).toBe('in_progress');
      expect(response.body.data.estimated_review_time).toBe('24-48 hours');
    });

    it('should reject submission when required documents are missing', async () => {
      const mockDocuments = [
        { document_type: 'government_id', status: 'pending' }
      ];

      mockQuery.mockResolvedValueOnce(createQueryResult(mockDocuments));

      const response = await request(app)
        .post('/api/kyc/submit');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Please upload all required documents first');
      expect(response.body.code).toBe('MISSING_DOCUMENTS');
      expect(response.body.details.missing).toEqual(['proof_of_address', 'selfie_with_id']);
    });
  });

  describe('GET /api/kyc/status', () => {
    it('should return detailed KYC status', async () => {
      const mockUser = {
        kyc_status: 'completed',
        kyc_level: 2,
        kyc_completed_at: '2025-01-02T00:00:00Z',
        daily_limit: 100000,
        monthly_limit: 2000000
      };

      const mockDocuments = [
        {
          document_type: 'government_id',
          status: 'approved',
          uploaded_at: '2025-01-01T00:00:00Z',
          verified_at: '2025-01-02T00:00:00Z',
          rejected_reason: null
        },
        {
          document_type: 'proof_of_address',
          status: 'approved',
          uploaded_at: '2025-01-01T00:00:00Z',
          verified_at: '2025-01-02T00:00:00Z',
          rejected_reason: null
        },
        {
          document_type: 'selfie_with_id',
          status: 'approved',
          uploaded_at: '2025-01-01T00:00:00Z',
          verified_at: '2025-01-02T00:00:00Z',
          rejected_reason: null
        }
      ];

      mockQuery
        .mockResolvedValueOnce(createQueryResult([mockUser]))
        .mockResolvedValueOnce(createQueryResult(mockDocuments));

      const response = await request(app)
        .get('/api/kyc/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.kyc_status).toBe('completed');
      expect(response.body.data.kyc_level).toBe(2);
      expect(response.body.data.completion_percentage).toBe(100);
      expect(response.body.data.daily_limit).toBe(100000);
      expect(response.body.data.documents).toHaveLength(3);
      expect(response.body.data.next_steps).toEqual(['KYC verification completed successfully']);
    });

    it('should calculate correct completion percentage', async () => {
      const mockUser = {
        kyc_status: 'pending',
        kyc_level: 1,
        kyc_completed_at: null,
        daily_limit: 50000,
        monthly_limit: 1000000
      };

      const mockDocuments = [
        {
          document_type: 'government_id',
          status: 'pending',
          uploaded_at: '2025-01-01T00:00:00Z',
          verified_at: null,
          rejected_reason: null
        }
      ];

      mockQuery
        .mockResolvedValueOnce(createQueryResult([mockUser]))
        .mockResolvedValueOnce(createQueryResult(mockDocuments));

      const response = await request(app)
        .get('/api/kyc/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.completion_percentage).toBe(33); // 1/3 * 100 rounded
      expect(response.body.data.next_steps).toContain('Upload missing documents: proof_of_address, selfie_with_id');
    });

    it('should provide correct next steps for failed KYC', async () => {
      const mockUser = {
        kyc_status: 'failed',
        kyc_level: 1,
        kyc_completed_at: null,
        daily_limit: 50000,
        monthly_limit: 1000000
      };

      const mockDocuments = [
        {
          document_type: 'government_id',
          status: 'rejected',
          uploaded_at: '2025-01-01T00:00:00Z',
          verified_at: null,
          rejected_reason: 'Document is blurry'
        }
      ];

      mockQuery
        .mockResolvedValueOnce(createQueryResult([mockUser]))
        .mockResolvedValueOnce(createQueryResult(mockDocuments));

      const response = await request(app)
        .get('/api/kyc/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.next_steps).toContain('Fix and re-upload rejected documents: government_id');
      expect(response.body.data.next_steps).toContain('Submit KYC for re-review');
    });

    it('should handle user not found', async () => {
      mockQuery.mockResolvedValueOnce(createQueryResult([]));

      const response = await request(app)
        .get('/api/kyc/status');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
      expect(response.body.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('DELETE /api/kyc/documents/:documentId', () => {
    it('should delete pending document successfully', async () => {
      const mockDocument = {
        document_image_url: 'kyc/test-tenant-id/test-user-id/government_id_123456.jpg',
        status: 'pending',
        document_type: 'government_id'
      };

      mockQuery
        .mockResolvedValueOnce(createQueryResult([mockDocument]))
        .mockResolvedValueOnce({ query: 'DELETE FROM kyc_documents' })
        .mockResolvedValueOnce({ query: 'INSERT INTO user_activity_logs' });

      const response = await request(app)
        .delete('/api/kyc/documents/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Document deleted successfully');
      expect(mockUnlink).toHaveBeenCalled();
    });

    it('should not allow deletion of approved documents', async () => {
      const mockDocument = {
        document_image_url: 'kyc/test-tenant-id/test-user-id/government_id_123456.jpg',
        status: 'approved',
        document_type: 'government_id'
      };

      mockQuery.mockResolvedValueOnce(createQueryResult([mockDocument]));

      const response = await request(app)
        .delete('/api/kyc/documents/123e4567-e89b-12d3-a456-426614174001');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Only pending documents can be deleted');
      expect(response.body.code).toBe('CANNOT_DELETE_PROCESSED');
    });

    it('should handle document not found', async () => {
      mockQuery.mockResolvedValueOnce(createQueryResult([]));

      const response = await request(app)
        .delete('/api/kyc/documents/123e4567-e89b-12d3-a456-426614174002');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Document not found');
      expect(response.body.code).toBe('DOCUMENT_NOT_FOUND');
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid document type in upload', async () => {
      const response = await request(app)
        .post('/api/kyc/documents/invalid_type/upload');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid UUID in delete', async () => {
      const response = await request(app)
        .delete('/api/kyc/documents/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in documents fetch', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/kyc/documents');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch documents');
      expect(response.body.code).toBe('FETCH_ERROR');
    });

    it('should handle database errors in KYC submit', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/kyc/submit');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to submit KYC for review');
      expect(response.body.code).toBe('SUBMIT_ERROR');
    });

    it('should handle file system errors gracefully', async () => {
      const mockDocument = {
        document_image_url: 'kyc/test-tenant-id/test-user-id/government_id_123456.jpg',
        status: 'pending',
        document_type: 'government_id'
      };

      mockQuery
        .mockResolvedValueOnce(createQueryResult([mockDocument]))
        .mockResolvedValueOnce({ query: 'DELETE FROM kyc_documents' })
        .mockResolvedValueOnce({ query: 'INSERT INTO user_activity_logs' });

      mockUnlink.mockRejectedValueOnce(new Error('File not found'));

      const response = await request(app)
        .delete('/api/kyc/documents/123e4567-e89b-12d3-a456-426614174003');

      // Should still succeed even if file deletion fails
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});