import crypto from 'crypto';

// Secret key for HMAC-SHA256 token signing
const JWT_SECRET = process.env.JWT_SECRET || 'cebu_flood_watch_secret_key_89f3a8b29c11e74d6b2c8a19';
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 Days

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'lgu_officer' | 'responder' | 'citizen';
  name: string;
  barangay?: string;
  exp: number;
}

/**
 * Hash password with PBKDF2 (100,000 iterations of SHA-512 + unique 16-byte salt per user)
 * Meets NIST SP 800-132 standards for password protection.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verify password against combined salt:hash using constant-time comparison (timing attack safe)
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, storedHash] = combinedHash.split(':');
    if (!salt || !storedHash) return false;

    const candidateHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    const candidateBuf = Buffer.from(candidateHash, 'hex');

    if (storedBuf.length !== candidateBuf.length) return false;
    return crypto.timingSafeEqual(storedBuf, candidateBuf);
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically signed HMAC-SHA256 JWT-compatible token
 */
export function generateSignedToken(user: {
  id: string;
  email: string;
  role: 'admin' | 'lgu_officer' | 'responder' | 'citizen';
  name: string;
  barangay?: string;
}): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Date.now() + TOKEN_EXPIRY_MS;
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    barangay: user.barangay,
    exp,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${encodedPayload}`)
    .digest('base64url');

  return `${header}.${encodedPayload}.${signature}`;
}

/**
 * Verify signed token, signature integrity, and expiration
 */
export function verifySignedToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${encodedPayload}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null; // Tampered token
    }

    const payload: TokenPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) {
      return null; // Expired token
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Simple in-memory Sliding Window Rate Limiter to prevent brute-force attacks
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxAttempts = 10, windowMinutes = 15): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMinutes * 60 * 1000 });
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false; // Rate limit exceeded
  }

  entry.count += 1;
  return true;
}
