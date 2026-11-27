import {
  createHash,
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  randomBytes,
  sign,
  verify,
  type KeyObject,
} from 'node:crypto';

/**
 * QR pass token: PT1.<base64url(claims)>.<base64url(Ed25519 signature)>.
 * The claims hold no personal data: a random reference, expiry, score and six document status codes.
 */
export interface QrClaims {
  v: 1;
  ref: string; // random public reference, e.g. PT-7K2M9QXA4B
  kid: string;
  iat: number; // seconds
  exp: number; // seconds
  sc: number; // readiness score 0-100
  rs: 'R' | 'A' | 'C'; // Ready / Action needed / Critical
  dc: string; // 6 document status codes: c complete, m missing, e expired, n not applicable
}

export type QrVerifyFailure = 'malformed' | 'bad_signature' | 'unknown_key';

const b64u = (b: Buffer) => b.toString('base64url');
const fromB64u = (s: string) => Buffer.from(s, 'base64url');
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alike characters

export function newReference(): string {
  const bytes = randomBytes(10);
  let out = '';
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return `PT-${out}`;
}

export function tokenDigest(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class QrSigner {
  private readonly privateKey: KeyObject;
  public readonly publicKey: KeyObject;
  public readonly keyId: string;
  public readonly ephemeral: boolean;

  constructor(configuredKey: string, keyId: string, allowEphemeral: boolean) {
    this.keyId = keyId;
    if (configuredKey) {
      const pem = configuredKey.includes('BEGIN') ? configuredKey : Buffer.from(configuredKey, 'base64').toString('utf8');
      this.privateKey = createPrivateKey(pem);
      this.ephemeral = false;
    } else if (allowEphemeral) {
      // Development and tests only: passes become invalid after a restart.
      this.privateKey = generateKeyPairSync('ed25519').privateKey;
      this.ephemeral = true;
    } else {
      throw new Error('QR_SIGNING_PRIVATE_KEY is required in production. Generate one with: node api/scripts/generate-qr-key.mjs');
    }
    this.publicKey = createPublicKey(this.privateKey);
  }

  public publicKeyPem(): string {
    return this.publicKey.export({ type: 'spki', format: 'pem' }).toString();
  }

  public issue(claims: Omit<QrClaims, 'v' | 'kid'>): string {
    const full: QrClaims = { v: 1, kid: this.keyId, ...claims };
    const body = `PT1.${b64u(Buffer.from(JSON.stringify(full)))}`;
    const signature = sign(null, Buffer.from(body), this.privateKey);
    return `${body}.${b64u(signature)}`;
  }

  public verifyToken(token: string): { ok: true; claims: QrClaims } | { ok: false; reason: QrVerifyFailure } {
    const parts = token.trim().split('.');
    if (parts.length !== 3 || parts[0] !== 'PT1' || !parts[1] || !parts[2]) return { ok: false, reason: 'malformed' };
    let claims: QrClaims;
    try {
      claims = JSON.parse(fromB64u(parts[1]).toString('utf8')) as QrClaims;
    } catch {
      return { ok: false, reason: 'malformed' };
    }
    if (claims.v !== 1 || typeof claims.ref !== 'string' || typeof claims.exp !== 'number' || typeof claims.dc !== 'string') {
      return { ok: false, reason: 'malformed' };
    }
    if (claims.kid !== this.keyId) return { ok: false, reason: 'unknown_key' };
    let valid = false;
    try {
      valid = verify(null, Buffer.from(`PT1.${parts[1]}`), this.publicKey, fromB64u(parts[2]));
    } catch {
      valid = false;
    }
    return valid ? { ok: true, claims } : { ok: false, reason: 'bad_signature' };
  }
}
