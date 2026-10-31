// Encrypts the AI keys customers connect (AES-256-GCM). The stored value is
// "v1:<iv>:<tag>:<ciphertext>", all base64. Only the server can read it.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { config, HttpError } from './config';

function key(): Buffer {
  if (!config.encryptionSecret || config.encryptionSecret.length < 32) {
    throw new HttpError(503, 'Connecting your own AI key isn’t switched on yet.', 'not_configured');
  }
  return createHash('sha256').update(config.encryptionSecret).digest();
}

export function seal(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), enc.toString('base64')].join(':');
}

export function open(sealed: string): string {
  const [v, iv, tag, data] = sealed.split(':');
  if (v !== 'v1' || !iv || !tag || !data) throw new Error('Unknown key format');
  const d = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8');
}

/** Last four characters, for "•••• 1a2b" in the UI. */
export const last4 = (k: string) => k.slice(-4);
