/**
 * User Management Service
 * Handles user registration, KYC, and profile management
 */
export interface UserRegistrationData {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    password: string;
    transactionPin: string;
    tenantId: string;
    referralCode?: string;
}
export interface KYCDocumentData {
    tenantId: string;
    userId: string;
    documentType: 'nin' | 'passport' | 'drivers_license' | 'voters_card';
    documentNumber: string;
    documentImage: string;
    selfieImage: string;
}
export interface KYCVerificationResult {
    success: boolean;
    kycLevel: number;
    message: string;
    verificationId?: string;
    matchScore?: number;
}
export interface UserProfile {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    accountNumber: string;
    kycStatus: 'pending' | 'tier1' | 'tier2' | 'tier3' | 'rejected';
    kycLevel: number;
    profileImage?: string;
    address?: {
        street: string;
        city: string;
        state: string;
        country: string;
    };
    limits: {
        dailyLimit: number;
        monthlyLimit: number;
    };
    createdAt: string;
    updatedAt: string;
}
export declare class UserService {
    /**
     * Register a new user with initial KYC tier 1
     */
    registerUser(userData: UserRegistrationData): Promise<{
        success: boolean;
        userId?: string;
        accountNumber?: string;
        message: string;
    }>;
    /**
     * Submit KYC documents for verification
     */
    submitKYCDocuments(kycData: KYCDocumentData): Promise<KYCVerificationResult>;
    /**
     * Get user profile with complete information
     */
    getUserProfile(tenantId: string, userId: string): Promise<UserProfile | null>;
    /**
     * Update user profile information
     */
    updateUserProfile(tenantId: string, userId: string, updates: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        address?: {
            street: string;
            city: string;
            state: string;
            country: string;
        };
        profileImage?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    private generateAccountNumber;
    private processReferral;
    private performKYCVerification;
    private getKycStatusFromLevel;
    private getLimitsForKycLevel;
}
export declare const userService: UserService;
//# sourceMappingURL=users.d.ts.map