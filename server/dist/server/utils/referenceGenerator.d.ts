/**
 * Transfer Reference Generator (Server-side)
 * Generates secure, unique, time-sortable transfer references
 * Format: BANK_CODE + ULID(12) + HMAC(6) + CHECK(2)
 * Example: FM01H7ZK9A2X3F7Y3298
 */
/**
 * Generate a secure, unique transfer reference
 * Format: BANK_CODE(2-3) + ULID(12) + HMAC(6) + CHECK(2)
 * Total length: 22-23 characters
 *
 * @param {string} bankCode - Bank code (2-3 characters, e.g., 'FM' for FMFB, '513' for First Midas)
 * @returns {string} Generated transfer reference
 *
 * @example
 * const ref = generateTransferRef('FM');
 * // Returns: "FM01H7ZK9A2X3F7Y3298"
 *
 * const ref2 = generateTransferRef('513');
 * // Returns: "51301H7ZK9A2X3F7Y3299"
 */
export declare function generateTransferRef(bankCode?: string): string;
/**
 * Validate a transfer reference
 * Checks if the reference has valid check digits
 *
 * @param {string} reference - Transfer reference to validate
 * @returns {boolean} True if valid, false otherwise
 */
export declare function validateTransferRef(reference: string): boolean;
/**
 * Extract bank code from transfer reference
 *
 * @param {string} reference - Transfer reference
 * @returns {string} Bank code
 */
export declare function extractBankCode(reference: string): string;
/**
 * Extract timestamp from transfer reference (from ULID portion)
 *
 * @param {string} reference - Transfer reference
 * @returns {Date | null} Date object or null if invalid
 */
export declare function extractTimestamp(reference: string): Date | null;
//# sourceMappingURL=referenceGenerator.d.ts.map