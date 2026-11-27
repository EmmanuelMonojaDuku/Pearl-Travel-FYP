// Generates an Ed25519 signing key for QR passes. Put the output in api/.env as QR_SIGNING_PRIVATE_KEY.
import { generateKeyPairSync } from 'node:crypto';
const { privateKey } = generateKeyPairSync('ed25519');
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
console.log('QR_SIGNING_PRIVATE_KEY=' + Buffer.from(pem).toString('base64'));
console.error('Keep this secret. Never commit it or expose it to the front end.');
