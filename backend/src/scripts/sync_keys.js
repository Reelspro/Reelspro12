require('dotenv').config();
const db = require('../config/db');
const { encrypt } = require('../services/encryptionService');

const keys = [
  { provider: 'groq', key: process.env.GROQ_API_KEY },
  { provider: 'gemini', key: process.env.GEMINI_API_KEY },
  { provider: 'openrouter', key: process.env.OPENROUTER_API_KEY },
  { provider: 'huggingface', key: process.env.HUGGINGFACE_API_KEY },
];

async function sync() {
  console.log('[SyncKeys] Starting key synchronization from .env to DB...');
  
  for (const item of keys) {
    if (item.key && item.key.trim() !== '') {
      try {
        const encrypted = encrypt(item.key.trim());
        // Check if exists
        const existing = db.prepare('SELECT id FROM api_keys WHERE provider = ? AND type = ?').get(item.provider, 'system');
        
        if (existing) {
          db.prepare('UPDATE api_keys SET api_key = ? WHERE id = ?').run(encrypted, existing.id);
          console.log(`[SyncKeys] Updated ${item.provider} key.`);
        } else {
          db.prepare('INSERT INTO api_keys (provider, api_key, type) VALUES (?, ?, ?)').run(item.provider, encrypted, 'system');
          console.log(`[SyncKeys] Inserted ${item.provider} key.`);
        }
      } catch (err) {
        console.error(`[SyncKeys] Failed to sync ${item.provider}:`, err.message);
      }
    } else {
      console.log(`[SyncKeys] Skipping ${item.provider} (no key in .env).`);
    }
  }
  
  console.log('[SyncKeys] Done.');
}

sync();
