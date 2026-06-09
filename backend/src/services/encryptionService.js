const crypto = require('crypto');

const getRawKey = () => {
  const key = process.env.API_KEY_SECRET || process.env.ENCRYPTION_KEY;
  if (key) {
    // If hex string (64 chars), convert to buffer directly
    if (/^[0-9a-f]{64}$/i.test(key)) {
      return Buffer.from(key, 'hex');
    }
    // Otherwise use as UTF-8, pad/slice to 32 bytes
    return Buffer.from(key.padEnd(32, '0').slice(0, 32), 'utf8');
  }
  // Last resort: random (bad for production)
  console.warn('[Encryption] No key set in .env! Using random key.');
  return crypto.randomBytes(32);
};

const ENCRYPTION_KEY = getRawKey();
const IV_LENGTH = 16;

const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption failed', error);
    return null;
  }
};

const decrypt = (text) => {
  if (!text) return null;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed', error);
    return null;
  }
};

module.exports = { encrypt, decrypt };
