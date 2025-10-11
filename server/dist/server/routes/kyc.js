"use strict";
/**
 * KYC Document Upload and Management Routes
 * Handles document verification, upload, and status management
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const database_1 = require("../config/database");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const tenant_1 = require("../middleware/tenant");
const router = (0, express_1.Router)();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: async (req, file, cb) => {
        const user = req.user;
        const tenant = req.tenant;
        // Create tenant-specific upload directory
        const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'kyc', tenant.id, user.id);
        try {
            await promises_1.default.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        }
        catch (error) {
            cb(error, uploadDir);
        }
    },
    filename: (req, file, cb) => {
        const user = req.user;
        const timestamp = Date.now();
        const docType = req.params.documentType || 'unknown';
        const extension = path_1.default.extname(file.originalname);
        const filename = `${docType}_${user.id}_${timestamp}${extension}`;
        cb(null, filename);
    }
});
const fileFilter = (req, file, cb) => {
    // Accept images and PDFs only
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = /^(image\/(jpeg|jpg|png)|application\/pdf)$/.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    }
    else {
        cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
};
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1 // One file at a time
    },
    fileFilter
});
// Apply authentication and tenant middleware to all routes
router.use(auth_1.authenticateToken);
router.use(tenant_1.tenantMiddleware);
/**
 * POST /api/kyc/documents/:documentType/upload
 * Upload a KYC document
 */
router.post('/documents/:documentType/upload', (0, express_validator_1.param)('documentType')
    .isIn(['government_id', 'proof_of_address', 'selfie_with_id', 'signature', 'nin', 'bvn', 'passport', 'drivers_license', 'voters_card'])
    .withMessage('Invalid document type'), (0, express_validator_1.body)('document_number')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Document number must be between 1 and 50 characters'), validation_1.validateRequest, upload.single('document'), async (req, res) => {
    const client = await (0, database_1.query)('BEGIN');
    try {
        const { documentType } = req.params;
        const { document_number } = req.body;
        const user = req.user;
        const file = req.file;
        if (!file) {
            await (0, database_1.query)('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'No file uploaded',
                code: 'NO_FILE'
            });
        }
        // Check if user already has this document type
        const existingDoc = await (0, database_1.query)('SELECT id, status FROM tenant.kyc_documents WHERE user_id = $1 AND document_type = $2', [user.id, documentType]);
        if (existingDoc.rows.length > 0 && existingDoc.rows[0].status === 'approved') {
            await (0, database_1.query)('ROLLBACK');
            return res.status(400).json({
                success: false,
                error: 'Document already approved',
                code: 'DOCUMENT_ALREADY_APPROVED'
            });
        }
        // Generate secure file path (relative from uploads folder)
        const relativePath = path_1.default.relative(path_1.default.join(process.cwd(), 'uploads'), file.path);
        // Insert or update document record
        let documentId;
        if (existingDoc.rows.length > 0) {
            // Update existing document
            const result = await (0, database_1.query)(`
          UPDATE tenant.kyc_documents 
          SET document_number = $1, 
              document_image_url = $2,
              status = 'pending',
              uploaded_at = NOW(),
              verified_at = NULL,
              rejected_reason = NULL,
              updated_at = NOW()
          WHERE user_id = $3 AND document_type = $4
          RETURNING id
        `, [document_number, relativePath, user.id, documentType]);
            documentId = result.rows[0].id;
        }
        else {
            // Insert new document
            const result = await (0, database_1.query)(`
          INSERT INTO tenant.kyc_documents (
            user_id, document_type, document_number, document_image_url, 
            status, uploaded_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, 'pending', NOW(), NOW(), NOW())
          RETURNING id
        `, [user.id, documentType, document_number, relativePath]);
            documentId = result.rows[0].id;
        }
        await (0, database_1.query)('COMMIT');
        // Log the document upload
        await (0, database_1.query)(`
        INSERT INTO tenant.user_activity_logs (
          user_id, activity_type, activity_data, ip_address, user_agent, created_at
        ) VALUES ($1, 'document_upload', $2, $3, $4, NOW())
      `, [
            user.id,
            JSON.stringify({
                document_type: documentType,
                document_id: documentId,
                file_size: file.size,
                file_name: file.originalname
            }),
            req.ip,
            req.get('User-Agent')
        ]);
        res.status(200).json({
            success: true,
            message: 'Document uploaded successfully',
            data: {
                document_id: documentId,
                document_type: documentType,
                status: 'pending',
                uploaded_at: new Date().toISOString(),
                file_size: file.size,
                file_name: file.originalname
            }
        });
    }
    catch (error) {
        await (0, database_1.query)('ROLLBACK');
        console.error('Document upload error:', error);
        // Clean up uploaded file on error
        if (req.file) {
            try {
                await promises_1.default.unlink(req.file.path);
            }
            catch (cleanupError) {
                console.error('File cleanup error:', cleanupError);
            }
        }
        res.status(500).json({
            success: false,
            error: 'Failed to upload document',
            code: 'UPLOAD_ERROR'
        });
    }
});
/**
 * GET /api/kyc/documents
 * Get user's KYC documents status
 */
router.get('/documents', async (req, res) => {
    try {
        const user = req.user;
        const result = await (0, database_1.query)(`
      SELECT 
        id,
        document_type,
        document_number,
        status,
        uploaded_at,
        verified_at,
        rejected_reason,
        created_at,
        updated_at
      FROM tenant.kyc_documents 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [user.id]);
        // Get user's overall KYC status
        const userResult = await (0, database_1.query)('SELECT kyc_status, kyc_level, kyc_completed_at FROM tenant.users WHERE id = $1', [user.id]);
        const userKyc = userResult.rows[0];
        res.status(200).json({
            success: true,
            data: {
                documents: result.rows.map(doc => ({
                    id: doc.id,
                    documentType: doc.document_type,
                    documentNumber: doc.document_number ? '****' + doc.document_number.slice(-4) : null,
                    status: doc.status,
                    uploadedAt: doc.uploaded_at,
                    verifiedAt: doc.verified_at,
                    rejectedReason: doc.rejected_reason,
                    createdAt: doc.created_at,
                    updatedAt: doc.updated_at
                })),
                overall_status: {
                    kyc_status: userKyc?.kyc_status || 'pending',
                    kyc_level: userKyc?.kyc_level || 1,
                    kyc_completed_at: userKyc?.kyc_completed_at
                }
            }
        });
    }
    catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch documents',
            code: 'FETCH_ERROR'
        });
    }
});
/**
 * DELETE /api/kyc/documents/:documentId
 * Delete a pending KYC document
 */
router.delete('/documents/:documentId', (0, express_validator_1.param)('documentId').isUUID().withMessage('Invalid document ID'), validation_1.validateRequest, async (req, res) => {
    try {
        const { documentId } = req.params;
        const user = req.user;
        // Get document info
        const docResult = await (0, database_1.query)(`
        SELECT document_image_url, status, document_type 
        FROM tenant.kyc_documents 
        WHERE id = $1 AND user_id = $2
      `, [documentId, user.id]);
        if (docResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Document not found',
                code: 'DOCUMENT_NOT_FOUND'
            });
        }
        const document = docResult.rows[0];
        // Only allow deletion of pending documents
        if (document.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Only pending documents can be deleted',
                code: 'CANNOT_DELETE_PROCESSED'
            });
        }
        // Delete from database
        await (0, database_1.query)('DELETE FROM tenant.kyc_documents WHERE id = $1', [documentId]);
        // Delete file from filesystem
        if (document.document_image_url) {
            const fullPath = path_1.default.join(process.cwd(), 'uploads', document.document_image_url);
            try {
                await promises_1.default.unlink(fullPath);
            }
            catch (fileError) {
                console.warn('Could not delete file:', fileError);
            }
        }
        // Log the deletion
        await (0, database_1.query)(`
        INSERT INTO tenant.user_activity_logs (
          user_id, activity_type, activity_data, ip_address, user_agent, created_at
        ) VALUES ($1, 'document_delete', $2, $3, $4, NOW())
      `, [
            user.id,
            JSON.stringify({
                document_type: document.document_type,
                document_id: documentId
            }),
            req.ip,
            req.get('User-Agent')
        ]);
        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    }
    catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete document',
            code: 'DELETE_ERROR'
        });
    }
});
/**
 * GET /api/kyc/requirements
 * Get KYC requirements for the current tenant
 */
router.get('/requirements', async (req, res) => {
    try {
        const tenant = req.tenant;
        // Get tenant KYC requirements
        const tenantResult = await (0, database_1.query)('SELECT settings FROM platform.tenants WHERE id = $1', [tenant.id]);
        if (tenantResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Tenant not found',
                code: 'TENANT_NOT_FOUND'
            });
        }
        const settings = tenantResult.rows[0].settings;
        const kycRequirements = settings?.kyc || {
            required: true,
            levels: ['tier1', 'tier2', 'tier3'],
            documents: ['government_id', 'proof_of_address', 'selfie_with_id']
        };
        res.status(200).json({
            success: true,
            data: {
                kyc_required: kycRequirements.required,
                levels: kycRequirements.levels,
                required_documents: kycRequirements.documents,
                accepted_formats: ['jpg', 'jpeg', 'png', 'pdf'],
                max_file_size: '5MB',
                document_descriptions: {
                    government_id: 'National ID, Driver\'s License, Voter\'s Card, or International Passport',
                    proof_of_address: 'Utility bill, bank statement, or rent agreement (not older than 3 months)',
                    selfie_with_id: 'Clear photo of yourself holding your government ID next to your face',
                    signature: 'Clear photo of your signature on white paper',
                    nin: 'National Identification Number card',
                    bvn: 'Bank Verification Number slip',
                    passport: 'International passport',
                    drivers_license: 'Driver\'s license',
                    voters_card: 'Voter\'s registration card'
                }
            }
        });
    }
    catch (error) {
        console.error('Get KYC requirements error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch KYC requirements',
            code: 'FETCH_ERROR'
        });
    }
});
/**
 * POST /api/kyc/submit
 * Submit KYC for review (after all required documents are uploaded)
 */
router.post('/submit', async (req, res) => {
    try {
        const user = req.user;
        // Check if user has uploaded required documents
        const documentsResult = await (0, database_1.query)(`
      SELECT document_type, status 
      FROM tenant.kyc_documents 
      WHERE user_id = $1
    `, [user.id]);
        const uploadedDocs = documentsResult.rows;
        const requiredDocs = ['government_id', 'proof_of_address', 'selfie_with_id'];
        const hasAllRequired = requiredDocs.every(docType => uploadedDocs.some(doc => doc.document_type === docType));
        if (!hasAllRequired) {
            return res.status(400).json({
                success: false,
                error: 'Please upload all required documents first',
                code: 'MISSING_DOCUMENTS',
                details: {
                    required: requiredDocs,
                    uploaded: uploadedDocs.map(doc => doc.document_type),
                    missing: requiredDocs.filter(docType => !uploadedDocs.some(doc => doc.document_type === docType))
                }
            });
        }
        // Update user KYC status to in_progress
        await (0, database_1.query)(`
      UPDATE tenant.users 
      SET kyc_status = 'in_progress', updated_at = NOW()
      WHERE id = $1
    `, [user.id]);
        // Update all documents to processing status
        await (0, database_1.query)(`
      UPDATE tenant.kyc_documents 
      SET status = 'processing', updated_at = NOW()
      WHERE user_id = $1 AND status = 'pending'
    `, [user.id]);
        // Log the submission
        await (0, database_1.query)(`
      INSERT INTO tenant.user_activity_logs (
        user_id, activity_type, activity_data, ip_address, user_agent, created_at
      ) VALUES ($1, 'kyc_submit', $2, $3, $4, NOW())
    `, [
            user.id,
            JSON.stringify({
                documents_count: uploadedDocs.length,
                document_types: uploadedDocs.map(doc => doc.document_type)
            }),
            req.ip,
            req.get('User-Agent')
        ]);
        res.status(200).json({
            success: true,
            message: 'KYC submitted for review successfully',
            data: {
                status: 'in_progress',
                estimated_review_time: '24-48 hours',
                submitted_at: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('KYC submit error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit KYC for review',
            code: 'SUBMIT_ERROR'
        });
    }
});
/**
 * GET /api/kyc/status
 * Get detailed KYC status for user
 */
router.get('/status', async (req, res) => {
    try {
        const user = req.user;
        // Get user KYC status
        const userResult = await (0, database_1.query)(`
      SELECT 
        kyc_status, 
        kyc_level, 
        kyc_completed_at,
        daily_limit,
        monthly_limit
      FROM tenant.users 
      WHERE id = $1
    `, [user.id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }
        const userKyc = userResult.rows[0];
        // Get document statuses
        const documentsResult = await (0, database_1.query)(`
      SELECT 
        document_type,
        status,
        uploaded_at,
        verified_at,
        rejected_reason
      FROM tenant.kyc_documents 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [user.id]);
        // Calculate completion percentage
        const requiredDocs = ['government_id', 'proof_of_address', 'selfie_with_id'];
        const uploadedDocs = documentsResult.rows.filter(doc => doc.status !== 'rejected');
        const completionPercentage = Math.round((uploadedDocs.length / requiredDocs.length) * 100);
        res.status(200).json({
            success: true,
            data: {
                kyc_status: userKyc.kyc_status,
                kyc_level: userKyc.kyc_level,
                kyc_completed_at: userKyc.kyc_completed_at,
                completion_percentage: Math.min(completionPercentage, 100),
                daily_limit: userKyc.daily_limit,
                monthly_limit: userKyc.monthly_limit,
                documents: documentsResult.rows.map(doc => ({
                    document_type: doc.document_type,
                    status: doc.status,
                    uploaded_at: doc.uploaded_at,
                    verified_at: doc.verified_at,
                    rejected_reason: doc.rejected_reason
                })),
                next_steps: getNextSteps(userKyc.kyc_status, documentsResult.rows, requiredDocs)
            }
        });
    }
    catch (error) {
        console.error('Get KYC status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch KYC status',
            code: 'FETCH_ERROR'
        });
    }
});
// Helper function to determine next steps
function getNextSteps(kycStatus, documents, requiredDocs) {
    const steps = [];
    if (kycStatus === 'pending') {
        const uploadedTypes = documents.map(doc => doc.document_type);
        const missingDocs = requiredDocs.filter(type => !uploadedTypes.includes(type));
        if (missingDocs.length > 0) {
            steps.push(`Upload missing documents: ${missingDocs.join(', ')}`);
        }
        const rejectedDocs = documents.filter(doc => doc.status === 'rejected');
        if (rejectedDocs.length > 0) {
            steps.push(`Re-upload rejected documents: ${rejectedDocs.map(doc => doc.document_type).join(', ')}`);
        }
        if (missingDocs.length === 0 && rejectedDocs.length === 0) {
            steps.push('Submit KYC for review');
        }
    }
    else if (kycStatus === 'in_progress') {
        steps.push('Wait for document review (24-48 hours)');
    }
    else if (kycStatus === 'failed') {
        const rejectedDocs = documents.filter(doc => doc.status === 'rejected');
        if (rejectedDocs.length > 0) {
            steps.push(`Fix and re-upload rejected documents: ${rejectedDocs.map(doc => doc.document_type).join(', ')}`);
            steps.push('Submit KYC for re-review');
        }
    }
    else if (kycStatus === 'completed') {
        steps.push('KYC verification completed successfully');
    }
    return steps;
}
exports.default = router;
//# sourceMappingURL=kyc.js.map