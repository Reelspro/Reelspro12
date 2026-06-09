const { Groq } = require('groq-sdk');
const { GoogleGenAI } = require('@google/genai');
const { HfInference } = require('@huggingface/inference');
const OpenAI = require('openai'); // For OpenRouter
const db = require('../config/db');
const { decrypt } = require('../services/encryptionService');

// Priorities: 1 = Groq, 2 = Gemini, 3 = OpenRouter, 4 = HuggingFace
const PROVIDER_PRIORITY = ['groq', 'gemini', 'openrouter', 'huggingface'];

const getDecryptedKey = (provider, userId) => {
  // 1. Try User API Key
  let stmt = db.prepare(`SELECT api_key FROM api_keys WHERE provider = ? AND owner_id = ? AND type = 'user'`);
  let record = stmt.get(provider, userId);
  
  // 2. Fallback to Admin/System API Key
  if (!record) {
    stmt = db.prepare(`SELECT api_key FROM api_keys WHERE provider = ? AND type IN ('system', 'admin')`);
    record = stmt.get(provider);
  }

  if (record && record.api_key) {
    return decrypt(record.api_key);
  }
  return null;
};

const executeWithProvider = async (provider, prompt, userId) => {
  const apiKey = getDecryptedKey(provider, userId);
  if (!apiKey) {
    throw new Error(`API Key not found for provider: ${provider}`);
  }

  try {
    switch (provider) {
      case 'groq':
        const groq = new Groq({ apiKey });
        const groqRes = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
        });
        return groqRes.choices[0]?.message?.content;

      case 'gemini':
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
        });
        return response.text;

      case 'openrouter':
        const openrouter = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: apiKey,
        });
        const orRes = await openrouter.chat.completions.create({
          model: "mistralai/mixtral-8x7b-instruct",
          messages: [{ role: "user", content: prompt }]
        });
        return orRes.choices[0]?.message?.content;

      case 'huggingface':
        const hf = new HfInference(apiKey);
        const hfRes = await hf.textGeneration({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          inputs: prompt,
          parameters: { max_new_tokens: 500 }
        });
        return hfRes.generated_text;

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    // Determine if quota exceeded (status 429) to trigger rotate
    if (error.status === 429 || error.message.includes('quota') || error.message.includes('rate limit')) {
      throw { type: 'QUOTA_EXCEEDED', provider, message: error.message };
    }
    throw error;
  }
};

/**
 * AI Rotation System
 * Attempts to generate content using providers in priority order.
 * NEVER crashes application.
 */
const generateSuspenseScript = async (prompt, userId) => {
  let lastError = null;

  for (const provider of PROVIDER_PRIORITY) {
    console.log(`[AI Engine] Attempting generation with ${provider}...`);
    try {
      // Basic validation if we have the key before even executing
      const hasKey = getDecryptedKey(provider, userId);
      if (!hasKey) {
        console.log(`[AI Engine] Skip ${provider}: No API key configured.`);
        continue;
      }

      const result = await executeWithProvider(provider, prompt, userId);
      if (result) {
        console.log(`[AI Engine] Success with ${provider}.`);
        return result;
      }
    } catch (error) {
      console.error(`[AI Engine] Failed with ${provider}:`, error.message || error);
      lastError = error;
      // If it's a quota error, we continue to the next provider automatically
      // If it's something else, we also continue as per "NEVER crash if providers fail" rule
    }
  }

  // Fallback to local templates if all AI providers fail
  console.log(`[AI Engine] All AI providers failed. Falling back to local templates.`);
  return generateLocalFallbackScript();
};

const generateLocalFallbackScript = () => {
  return [
    "You won't believe what happened next...",
    "The truth was finally revealed.",
    "Everything changed in an instant.",
    "Read the full story to find out."
  ].join('\n');
};

module.exports = {
  generateSuspenseScript
};
