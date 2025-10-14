"use strict";
/**
 * Transfer Reference Generator (Server-side)
 * Generates secure, unique, time-sortable transfer references
 * Format: BANK_CODE + ULID(12) + HMAC(6) + CHECK(2)
 * Example: FM01H7ZK9A2X3F7Y3298
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTransferRef = generateTransferRef;
exports.validateTransferRef = validateTransferRef;
exports.extractBankCode = extractBankCode;
exports.extractTimestamp = extractTimestamp;
const crypto = __importStar(require("crypto"));
// ULID implementation (monotonic factory)
class UlidGenerator {
    static encodeTime(now, len) {
        if (now > UlidGenerator.TIME_MAX) {
            throw new Error('Time too large');
        }
        let str = '';
        for (let i = len - 1; i >= 0; i--) {
            const mod = now % UlidGenerator.ENCODING_LEN;
            str = UlidGenerator.ENCODING.charAt(mod) + str;
            now = Math.floor(now / UlidGenerator.ENCODING_LEN);
        }
        return str;
    }
    static encodeRandom(len) {
        let str = '';
        for (let i = 0; i < len; i++) {
            str += UlidGenerator.ENCODING.charAt(Math.floor(Math.random() * UlidGenerator.ENCODING_LEN));
        }
        return str;
    }
    static generate() {
        const now = Date.now();
        if (now === UlidGenerator.lastTime) {
            // Increment random portion for monotonicity
            for (let i = UlidGenerator.lastRandom.length - 1; i >= 0; i--) {
                const val = UlidGenerator.ENCODING.indexOf(UlidGenerator.lastRandom[i]);
                if (val < UlidGenerator.ENCODING_LEN - 1) {
                    UlidGenerator.lastRandom[i] = UlidGenerator.ENCODING.charAt(val + 1);
                    break;
                }
                else {
                    UlidGenerator.lastRandom[i] = UlidGenerator.ENCODING.charAt(0);
                }
            }
        }
        else {
            UlidGenerator.lastTime = now;
            UlidGenerator.lastRandom = UlidGenerator.encodeRandom(16).split('');
        }
        return UlidGenerator.encodeTime(now, 10) + UlidGenerator.lastRandom.join('').slice(0, 16);
    }
}
UlidGenerator.TIME_MAX = Math.pow(2, 48) - 1;
UlidGenerator.ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford's Base32
UlidGenerator.ENCODING_LEN = UlidGenerator.ENCODING.length;
UlidGenerator.lastTime = 0;
UlidGenerator.lastRandom = [];
// HMAC-SHA256 implementation using Node.js crypto
function hmacSha256(message, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message);
    return hmac.digest('hex');
}
// Compute Mod-97 check digits for alphanumeric string (ISO 7064)
function mod97Check(str) {
    // Map letters A=10 ... Z=35, digits stay digits
    let mapped = '';
    for (const ch of str.toUpperCase()) {
        if (/[0-9]/.test(ch)) {
            mapped += ch;
        }
        else if (/[A-Z]/.test(ch)) {
            mapped += (ch.charCodeAt(0) - 55).toString(); // A=10, B=11, ..., Z=35
        }
    }
    // Calculate mod 97 using BigInt for large numbers
    const remainder = BigInt(mapped) % 97n;
    return String(98n - remainder).padStart(2, '0');
}
// --- Config ---
const SECRET = process.env.TRANSFER_REF_SECRET || 'orokiipay-transfer-ref-secret-2025';
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
function generateTransferRef(bankCode = 'FM') {
    // 1. Generate ULID (26 chars, time-sortable)
    const ulid = UlidGenerator.generate();
    // 2. Truncate to 12 chars for compactness
    const coreId = ulid.slice(0, 12);
    // 3. Compute HMAC suffix (6 chars)
    const hmac = hmacSha256(coreId, SECRET);
    const suffix = hmac.slice(0, 6).toUpperCase();
    // 4. Build raw reference (bank code + coreId + suffix)
    const rawRef = `${bankCode}${coreId}${suffix}`;
    // 5. Add check digits (Mod-97)
    const check = mod97Check(rawRef);
    // Final reference
    return `${rawRef}${check}`;
}
/**
 * Validate a transfer reference
 * Checks if the reference has valid check digits
 *
 * @param {string} reference - Transfer reference to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateTransferRef(reference) {
    if (!reference || reference.length < 22) {
        return false;
    }
    // Extract parts (last 2 chars are check digits)
    const rawRef = reference.slice(0, -2);
    const providedCheck = reference.slice(-2);
    // Calculate expected check digits
    const expectedCheck = mod97Check(rawRef);
    return providedCheck === expectedCheck;
}
/**
 * Extract bank code from transfer reference
 *
 * @param {string} reference - Transfer reference
 * @returns {string} Bank code
 */
function extractBankCode(reference) {
    // Bank code is first 2-3 characters before ULID portion
    // ULID always starts with base32 digits, so we can identify the boundary
    const match = reference.match(/^([A-Z0-9]{2,3})/);
    return match ? match[1] : '';
}
/**
 * Extract timestamp from transfer reference (from ULID portion)
 *
 * @param {string} reference - Transfer reference
 * @returns {Date | null} Date object or null if invalid
 */
function extractTimestamp(reference) {
    try {
        // ULID starts after bank code (2-3 chars)
        const bankCode = extractBankCode(reference);
        const ulidPortion = reference.slice(bankCode.length, bankCode.length + 12);
        // Decode ULID timestamp (first 10 chars)
        const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
        const timeStr = ulidPortion.slice(0, 10);
        let timestamp = 0;
        for (let i = 0; i < timeStr.length; i++) {
            const char = timeStr[i];
            const value = ENCODING.indexOf(char);
            if (value === -1)
                return null;
            timestamp = timestamp * ENCODING.length + value;
        }
        return new Date(timestamp);
    }
    catch (error) {
        return null;
    }
}
//# sourceMappingURL=referenceGenerator.js.map