import { ValueTransformer } from 'typeorm';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// AES-256-GCM
const key = () => Buffer.from(process.env.FIELD_ENCRYPTION_KEY ?? '', 'base64');

export const encrypted: ValueTransformer = {
  to(value?: string | null) {
    if (value == null) return value;
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key(), iv);
    const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map((b) => b.toString('base64')).join('.');
  },
  from(value?: string | null) {
    if (value == null) return value;
    const [iv, tag, data] = value.split('.').map((s) => Buffer.from(s, 'base64'));
    const decipher = createDecipheriv('aes-256-gcm', key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  },
};
