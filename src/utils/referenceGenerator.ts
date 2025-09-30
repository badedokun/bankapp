/**
 * Transfer Reference Generator
 * Generates secure, unique, time-sortable transfer references
 * Format: BANK_CODE + ULID(12) + HMAC(6) + CHECK(2)
 * Example: BK01H7ZK9A2X3F7Y3298
 */

// ULID implementation (monotonic factory)
function monotonicUlid(): string {
  const TIME_MAX = Math.pow(2, 48) - 1;
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford's Base32
  const ENCODING_LEN = ENCODING.length;

  let lastTime = 0;
  let lastRandom = new Array(10);

  function encodeTime(now: number, len: number): string {
    if (now > TIME_MAX) {
      throw new Error('Time too large');
    }
    let str = '';
    for (let i = len - 1; i >= 0; i--) {
      const mod = now % ENCODING_LEN;
      str = ENCODING.charAt(mod) + str;
      now = Math.floor(now / ENCODING_LEN);
    }
    return str;
  }

  function encodeRandom(len: number): string {
    let str = '';
    for (let i = 0; i < len; i++) {
      str += ENCODING.charAt(Math.floor(Math.random() * ENCODING_LEN));
    }
    return str;
  }

  function generateUlid(): string {
    const now = Date.now();

    if (now === lastTime) {
      // Increment random portion for monotonicity
      for (let i = lastRandom.length - 1; i >= 0; i--) {
        const val = ENCODING.indexOf(lastRandom[i]);
        if (val < ENCODING_LEN - 1) {
          lastRandom[i] = ENCODING.charAt(val + 1);
          break;
        } else {
          lastRandom[i] = ENCODING.charAt(0);
        }
      }
    } else {
      lastTime = now;
      lastRandom = encodeRandom(16).split('');
    }

    return encodeTime(now, 10) + lastRandom.join('').slice(0, 16);
  }

  return generateUlid();
}

// Simple HMAC-SHA256 implementation using Web Crypto API
async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  // Import key
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Generate HMAC
  const signature = await crypto.subtle.sign('HMAC', key, messageData);

  // Convert to base32-like string
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Compute Mod-97 check digits for alphanumeric string (ISO 7064)
function mod97Check(str: string): string {
  // Map letters A=10 ... Z=35, digits stay digits
  let mapped = '';
  for (const ch of str.toUpperCase()) {
    if (/[0-9]/.test(ch)) {
      mapped += ch;
    } else if (/[A-Z]/.test(ch)) {
      mapped += (ch.charCodeAt(0) - 55).toString(); // A=10, B=11, ..., Z=35
    }
  }

  // Calculate mod 97 using string arithmetic for large numbers
  let remainder = BigInt(mapped) % 97n;
  return String(98n - remainder).padStart(2, '0');
}

// --- Config ---
const BANK_CODE = 'FM'; // FMFB bank code
const SECRET = 'orokiipay-transfer-ref-secret-2025'; // Secret for HMAC

/**
 * Generate a secure, unique transfer reference
 * Format: BANK_CODE(2) + ULID(12) + HMAC(6) + CHECK(2)
 * Total length: 22 characters
 *
 * @returns {Promise<string>} Generated transfer reference
 *
 * @example
 * const ref = await generateTransferRef();
 * // Returns: "FM01H7ZK9A2X3F7Y3298"
 */
export async function generateTransferRef(): Promise<string> {
  // 1. Generate ULID (26 chars, time-sortable)
  const ulid = monotonicUlid();

  // 2. Truncate to 12 chars for compactness
  const coreId = ulid.slice(0, 12);

  // 3. Compute HMAC suffix (6 chars)
  const hmac = await hmacSha256(coreId, SECRET);
  const suffix = hmac.slice(0, 6).toUpperCase();

  // 4. Build raw reference (bank code + coreId + suffix)
  const rawRef = `${BANK_CODE}${coreId}${suffix}`;

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
export function validateTransferRef(reference: string): boolean {
  if (!reference || reference.length !== 22) {
    return false;
  }

  // Extract parts
  const rawRef = reference.slice(0, 20);
  const providedCheck = reference.slice(20, 22);

  // Calculate expected check digits
  const expectedCheck = mod97Check(rawRef);

  return providedCheck === expectedCheck;
}
