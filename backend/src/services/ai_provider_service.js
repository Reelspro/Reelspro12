const { Groq } = require('groq-sdk');
const { GoogleGenAI } = require('@google/genai');
const { HfInference } = require('@huggingface/inference');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../config/db');
const crypto = require('crypto');
const winston = require('winston');

// Winston Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

function encryptApiKey(text) {
  if (!process.env.ENCRYPTION_KEY || text.includes(':')) return text; // already encrypted or no key
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY.padEnd(32).slice(0,32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptApiKey(text) {
  try {
    if (!process.env.ENCRYPTION_KEY || !text.includes(':')) return text;
    const parts = text.split(':');
    if (parts.length !== 2) return text;
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY.padEnd(32).slice(0,32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return text; // fallback: return as-is if decryption fails
  }
}

const PROVIDER_ORDER = ['groq', 'gemini', 'kimi', 'qwen', 'openrouter', 'huggingface'];
const ROTATION_PROVIDERS = ['openai', 'anthropic', 'gemini'];
const unavailableProviders = new Map();
let rotationIndex = 0;

const getDecryptedKeyRecord = (provider, userId) => {
  // If memory-blocked (unavailable map)
  if (unavailableProviders.get(provider) > Date.now()) {
    return null;
  }

  // Priority 1: User's own active key
  let record;
  if (userId) {
    record = db.prepare(
      `SELECT api_key, quota_exceeded, quota_reset_at FROM api_keys WHERE provider = ? AND owner_id = ? AND type = 'user' AND is_active = 1 LIMIT 1`
    ).get(provider, userId);
  }

  // Priority 2: Admin/system key
  if (!record) {
    record = db.prepare(
      `SELECT api_key, quota_exceeded, quota_reset_at FROM api_keys WHERE provider = ? AND type IN ('admin', 'system') AND is_active = 1 ORDER BY CASE type WHEN 'admin' THEN 0 ELSE 1 END LIMIT 1`
    ).get(provider);
  }

  // Check quota reset
  if (record && record.quota_exceeded === 1) {
    if (record.quota_reset_at) {
      const resetTime = new Date(record.quota_reset_at).getTime();
      if (Date.now() > resetTime) {
        // Reset quota in database
        try {
          db.prepare(`UPDATE api_keys SET quota_exceeded = 0, quota_reset_at = NULL WHERE provider = ? AND api_key = ?`).run(provider, record.api_key);
          logger.info(`Quota reset time reached for ${provider}. Resetting in database.`);
          record.quota_exceeded = 0;
          record.quota_reset_at = null;
        } catch (err) {
          logger.error(`Failed to reset key quota in database: ${err.message}`);
        }
      } else {
        return null; // Quota still exceeded
      }
    } else {
      return null; // Quota marked exceeded but no reset time
    }
  }

  return record ? { encryptedKey: record.api_key, apiKey: decryptApiKey(record.api_key) } : null;
};

function getAvailableProvider(userId) {
  // Try round-robin AI providers first
  for (let i = 0; i < ROTATION_PROVIDERS.length; i++) {
    const idx = (rotationIndex + i) % ROTATION_PROVIDERS.length;
    const provider = ROTATION_PROVIDERS[idx];
    const keyData = getDecryptedKeyRecord(provider, userId);
    if (keyData) {
      return { provider, apiKey: keyData.apiKey };
    }
  }

  // Fallback order for other API providers
  for (const provider of PROVIDER_ORDER) {
    const keyData = getDecryptedKeyRecord(provider, userId);
    if (keyData) return { provider, apiKey: keyData.apiKey };
  }

  return null;
}

async function callOpenAI(prompt, model = 'gpt-4o-mini', apiKey) {
  logger.info(`Calling OpenAI using model: ${model || 'gpt-4o-mini'}`);
  const openai = new OpenAI({ apiKey });
  const res = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: model || 'gpt-4o-mini',
  });
  return { text: res.choices[0]?.message?.content, model: model || 'gpt-4o-mini', provider: 'openai' };
}

async function callAnthropic(prompt, model = 'claude-3-5-haiku-20241022', apiKey) {
  logger.info(`Calling Anthropic using model: ${model || 'claude-3-5-haiku-20241022'}`);
  const anthropic = new Anthropic({ apiKey });
  const res = await anthropic.messages.create({
    model: model || 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });
  return { text: res.content[0]?.text, model: model || 'claude-3-5-haiku-20241022', provider: 'anthropic' };
}

async function callGroq(prompt, model = 'llama-3.3-70b-versatile', apiKey) {
  logger.info(`Calling Groq using model: ${model || 'llama-3.3-70b-versatile'}`);
  const groq = new Groq({ apiKey });
  const res = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: model || 'llama-3.3-70b-versatile',
  });
  return { text: res.choices[0]?.message?.content, model: model || 'llama-3.3-70b-versatile', provider: 'groq' };
}

async function callGemini(prompt, model = 'gemini-2.0-flash', apiKey) {
  logger.info(`Calling Gemini using model: ${model || 'gemini-2.0-flash'}`);
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({ model, contents: prompt });
  return { text: response.text, model, provider: 'gemini' };
}

async function callOpenRouter(prompt, model = 'mistralai/mistral-7b-instruct:free', apiKey) {
  logger.info(`Calling OpenRouter using model: ${model || 'mistralai/mistral-7b-instruct:free'}`);
  const client = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey });
  const res = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
  });
  return { text: res.choices[0]?.message?.content, model, provider: 'openrouter' };
}

async function callHuggingFace(prompt, model = 'mistralai/Mistral-7B-Instruct-v0.2', apiKey) {
  logger.info(`Calling HuggingFace using model: ${model || 'mistralai/Mistral-7B-Instruct-v0.2'}`);
  const hf = new HfInference(apiKey);
  const res = await hf.textGeneration({
    model,
    inputs: prompt,
    parameters: { max_new_tokens: 600, return_full_text: false },
  });
  return { text: res.generated_text, model, provider: 'huggingface' };
}

async function callQwen(prompt, model = 'qwen-turbo', apiKey) {
  logger.info(`Calling Qwen using model: ${model || 'qwen-turbo'}`);
  const client = new OpenAI({ baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1', apiKey });
  const res = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
  });
  return { text: res.choices[0]?.message?.content, model, provider: 'qwen' };
}

async function callKimi(prompt, model = 'moonshot-v1-8k', apiKey) {
  logger.info(`Calling Kimi using model: ${model || 'moonshot-v1-8k'}`);
  const client = new OpenAI({ baseURL: 'https://api.moonshot.cn/v1', apiKey });
  const res = await client.chat.completions.create({
    model: model || 'moonshot-v1-8k',
    messages: [{ role: 'user', content: prompt }],
  });
  return { text: res.choices[0]?.message?.content, model: model || 'moonshot-v1-8k', provider: 'kimi' };
}

function fallbackToTemplate(articleTitle, emotion = 'suspense') {
  logger.warn('Falling back to local template rendering.');
  const templates = {
    horror: [
      { id: 1, type: 'hook', text: 'Something dark was discovered...', duration: 2.0, start_time: 0, end_time: 2.0 },
      { id: 2, type: 'beat', text: 'Nobody expected this.', duration: 2.0, start_time: 2.0, end_time: 4.0 },
      { id: 3, type: 'beat', text: 'The truth is terrifying.', duration: 2.0, start_time: 4.0, end_time: 6.0 },
      { id: 4, type: 'cliffhanger', text: 'This changed everything.', duration: 2.0, start_time: 6.0, end_time: 8.0 },
      { id: 5, type: 'cta', text: 'Full Read Story Details In Comments', duration: 2.0, start_time: 8.0, end_time: 10.0 },
    ],
    mystery: [
      { id: 1, type: 'hook', text: 'Something went missing...', duration: 2.0, start_time: 0, end_time: 2.0 },
      { id: 2, type: 'beat', text: 'No one knows the truth.', duration: 2.0, start_time: 2.0, end_time: 4.0 },
      { id: 3, type: 'beat', text: 'Clues point to one person.', duration: 2.0, start_time: 4.0, end_time: 6.0 },
      { id: 4, type: 'cliffhanger', text: 'The secret is shocking.', duration: 2.0, start_time: 6.0, end_time: 8.0 },
      { id: 5, type: 'cta', text: 'Full Read Story Details In Comments', duration: 2.0, start_time: 8.0, end_time: 10.0 },
    ],
    crime: [
      { id: 1, type: 'hook', text: 'A crime no one saw coming.', duration: 2.0, start_time: 0, end_time: 2.0 },
      { id: 2, type: 'beat', text: 'Police were shocked.', duration: 2.0, start_time: 2.0, end_time: 4.0 },
      { id: 3, type: 'beat', text: 'Evidence points to insider.', duration: 2.0, start_time: 4.0, end_time: 6.0 },
      { id: 4, type: 'cliffhanger', text: 'The arrest is coming.', duration: 2.0, start_time: 6.0, end_time: 8.0 },
      { id: 5, type: 'cta', text: 'Full Read Story Details In Comments', duration: 2.0, start_time: 8.0, end_time: 10.0 },
    ],
    emotional: [
      { id: 1, type: 'hook', text: 'A heartbreaking story...', duration: 2.0, start_time: 0, end_time: 2.0 },
      { id: 2, type: 'beat', text: 'Family torn apart.', duration: 2.0, start_time: 2.0, end_time: 4.0 },
      { id: 3, type: 'beat', text: 'No one could help.', duration: 2.0, start_time: 4.0, end_time: 6.0 },
      { id: 4, type: 'cliffhanger', text: 'But then... this happened.', duration: 2.0, start_time: 6.0, end_time: 8.0 },
      { id: 5, type: 'cta', text: 'Full Read Story Details In Comments', duration: 2.0, start_time: 8.0, end_time: 10.0 },
    ],
    shocking: [
      { id: 1, type: 'hook', text: 'Nobody believed it was real.', duration: 2.0, start_time: 0, end_time: 2.0 },
      { id: 2, type: 'beat', text: 'Video caught everything.', duration: 2.0, start_time: 2.0, end_time: 4.0 },
      { id: 3, type: 'beat', text: 'The internet exploded.', duration: 2.0, start_time: 4.0, end_time: 6.0 },
      { id: 4, type: 'cliffhanger', text: 'What happens next?', duration: 2.0, start_time: 6.0, end_time: 8.0 },
      { id: 5, type: 'cta', text: 'Full Read Story Details In Comments', duration: 2.0, start_time: 8.0, end_time: 10.0 },
    ],
    suspense: [
      { id: 1, type: 'hook', text: 'Something is very wrong.', duration: 2.0, start_time: 0, end_time: 2.0 },
      { id: 2, type: 'beat', text: 'Time is running out.', duration: 2.0, start_time: 2.0, end_time: 4.0 },
      { id: 3, type: 'beat', text: 'No escape in sight.', duration: 2.0, start_time: 4.0, end_time: 6.0 },
      { id: 4, type: 'cliffhanger', text: 'The clock hits zero.', duration: 2.0, start_time: 6.0, end_time: 8.0 },
      { id: 5, type: 'cta', text: 'Full Read Story Details In Comments', duration: 2.0, start_time: 8.0, end_time: 10.0 },
    ],
    funny: [
      { id: 1, type: 'hook', text: 'This will make you laugh.', duration: 2.0, start_time: 0, end_time: 2.0 },
      { id: 2, type: 'beat', text: 'Wait for it...', duration: 2.0, start_time: 2.0, end_time: 4.0 },
      { id: 3, type: 'beat', text: 'Nobody saw this coming.', duration: 2.0, start_time: 4.0, end_time: 6.0 },
      { id: 4, type: 'cliffhanger', text: 'The ending is everything.', duration: 2.0, start_time: 6.0, end_time: 8.0 },
      { id: 5, type: 'cta', text: 'Full Read Story Details In Comments', duration: 2.0, start_time: 8.0, end_time: 10.0 },
    ],
    motivational: [
      { id: 1, type: 'hook', text: 'From zero to everything.', duration: 2.0, start_time: 0, end_time: 2.0 },
      { id: 2, type: 'beat', text: 'Nobody believed in him.', duration: 2.0, start_time: 2.0, end_time: 4.0 },
      { id: 3, type: 'beat', text: 'Then one decision changed it.', duration: 2.0, start_time: 4.0, end_time: 6.0 },
      { id: 4, type: 'cliffhanger', text: 'The result? Millions.', duration: 2.0, start_time: 6.0, end_time: 8.0 },
      { id: 5, type: 'cta', text: 'Full Read Story Details In Comments', duration: 2.0, start_time: 8.0, end_time: 10.0 },
    ],
  };
  const scenes = templates[emotion] || templates.suspense;
  const title = (articleTitle || '').substring(0, 60);
  const fullStoryText = scenes.map(s => s.text).join(' ');
  return {
    text: JSON.stringify({ scenes, fullStoryText }),
    provider: 'template',
    model: 'local',
    caption: `${scenes[0].text}\n\n${title}\n\nFull Read Story Details In Comments\n\n#viral #fyp #trending #shocking #reels`,
    hashtags: ['#viral', '#fyp', '#trending', '#shocking', '#reels', '#story', '#suspense', '#mustwatch'],
  };
}

function rotateOnQuotaExceeded(failedProvider) {
  unavailableProviders.set(failedProvider, Date.now() + 15 * 60 * 1000);
}

function isQuotaError(err, provider) {
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.statusCode || (err.response && err.response.status);
  if (status === 429) return true;
  if (msg.includes('quota') || msg.includes('rate limit') || msg.includes('limit exceeded') || msg.includes('credit') || msg.includes('insufficient')) {
    return true;
  }
  return false;
}

function handleQuotaExceeded(provider, encryptedKey, error) {
  logger.warn(`Quota exceeded or rate limit hit for ${provider}. Marking key as exceeded.`);
  // Quota resets in 1 hour by default
  const resetAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  try {
    db.prepare(
      `UPDATE api_keys SET quota_exceeded = 1, quota_reset_at = ? WHERE provider = ? AND api_key = ?`
    ).run(resetAt, provider, encryptedKey);
    logger.info(`Successfully updated database status for ${provider} key.`);
  } catch (dbErr) {
    logger.error(`Failed to update key status in database: ${dbErr.message}`);
  }
}

async function generateScript(prompt, options = {}) {
  const userId = options.userId || null;
  const preferredProvider = options.provider || null;

  logger.info(`Generating script. Preferred provider: ${preferredProvider || 'none'}`);

  // 1. If preferred provider is requested, try that first
  if (preferredProvider) {
    const keyData = getDecryptedKeyRecord(preferredProvider, userId);
    if (keyData) {
      try {
        let result;
        const model = options.model;
        switch (preferredProvider) {
          case 'openai': result = await callOpenAI(prompt, model, keyData.apiKey); break;
          case 'anthropic': result = await callAnthropic(prompt, model, keyData.apiKey); break;
          case 'gemini': result = await callGemini(prompt, model, keyData.apiKey); break;
          case 'groq': result = await callGroq(prompt, model, keyData.apiKey); break;
          case 'kimi': result = await callKimi(prompt, model, keyData.apiKey); break;
          case 'qwen': result = await callQwen(prompt, model, keyData.apiKey); break;
          case 'openrouter': result = await callOpenRouter(prompt, model, keyData.apiKey); break;
          case 'huggingface': result = await callHuggingFace(prompt, model, keyData.apiKey); break;
          default: throw new Error(`Unknown provider: ${preferredProvider}`);
        }
        if (result && result.text) {
          logger.info(`Script generated successfully using preferred provider ${preferredProvider}`);
          return result;
        }
      } catch (err) {
        logger.error(`Preferred provider ${preferredProvider} failed: ${err.message}`);
        if (isQuotaError(err, preferredProvider)) {
          handleQuotaExceeded(preferredProvider, keyData.encryptedKey, err);
        }
      }
    } else {
      logger.warn(`Preferred provider ${preferredProvider} requested, but no active/available key found.`);
    }
  }

  // 2. Round-robin rotation through ROTATION_PROVIDERS
  for (let i = 0; i < ROTATION_PROVIDERS.length; i++) {
    const idx = (rotationIndex + i) % ROTATION_PROVIDERS.length;
    const provider = ROTATION_PROVIDERS[idx];
    
    // Increment rotation index for the next call to ensure round-robin
    if (i === 0) {
      rotationIndex = (rotationIndex + 1) % ROTATION_PROVIDERS.length;
    }

    const keyData = getDecryptedKeyRecord(provider, userId);
    if (!keyData) continue;

    try {
      let result;
      const model = options.model;
      switch (provider) {
        case 'openai': result = await callOpenAI(prompt, model, keyData.apiKey); break;
        case 'anthropic': result = await callAnthropic(prompt, model, keyData.apiKey); break;
        case 'gemini': result = await callGemini(prompt, model, keyData.apiKey); break;
      }
      if (result && result.text) {
        logger.info(`Script generated successfully using rotated provider ${provider}`);
        return result;
      }
    } catch (err) {
      logger.error(`Rotated provider ${provider} failed: ${err.message}`);
      if (isQuotaError(err, provider)) {
        handleQuotaExceeded(provider, keyData.encryptedKey, err);
      }
    }
  }

  // 3. Fallback to any other active provider (Groq, Qwen, etc.)
  const fallbacks = PROVIDER_ORDER;
  for (const provider of fallbacks) {
    const keyData = getDecryptedKeyRecord(provider, userId);
    if (!keyData) continue;

    try {
      let result;
      const model = options.model;
      switch (provider) {
        case 'groq': result = await callGroq(prompt, model, keyData.apiKey); break;
        case 'gemini': result = await callGemini(prompt, model, keyData.apiKey); break;
        case 'kimi': result = await callKimi(prompt, model, keyData.apiKey); break;
        case 'qwen': result = await callQwen(prompt, model, keyData.apiKey); break;
        case 'openrouter': result = await callOpenRouter(prompt, model, keyData.apiKey); break;
        case 'huggingface': result = await callHuggingFace(prompt, model, keyData.apiKey); break;
      }
      if (result && result.text) {
        logger.info(`Script generated successfully using fallback provider ${provider}`);
        return result;
      }
    } catch (err) {
      logger.error(`Fallback provider ${provider} failed: ${err.message}`);
      if (isQuotaError(err, provider)) {
        handleQuotaExceeded(provider, keyData.encryptedKey, err);
      }
    }
  }

  // 4. Ultimate fallback to local template
  return fallbackToTemplate(prompt.slice(0, 80));
}

async function generateWithRotation(prompt, userId) {
  return generateScript(prompt, { userId });
}

module.exports = {
  getAvailableProvider,
  callOpenAI,
  callAnthropic,
  callGroq,
  callGemini,
  callQwen,
  callKimi,
  callOpenRouter,
  callHuggingFace,
  fallbackToTemplate,
  rotateOnQuotaExceeded,
  generateScript,
  generateWithRotation,
  encryptApiKey,
  decryptApiKey
};
