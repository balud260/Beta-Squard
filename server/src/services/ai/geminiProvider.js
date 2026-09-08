/**
 * Gemini Provider Client (FALLBACK AI)
 * Models: gemini-3.6-flash
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_MODEL = 'gemini-3.6-flash';

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

function cleanAndParseJSON(text, fallback = null) {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/i, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleaned);
  } catch (err) {
    if (fallback !== null) return fallback;
    throw new Error(`Failed to parse Gemini AI JSON response: ${err.message}`);
  }
}

function formatCleanAIResponse(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```[a-z]*\n?/gi, '').replace(/\n?```$/gi, '').trim();
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  cleaned = cleaned.replace(/\*{2,}(.*?)\*{2,}/g, '$1');
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
  cleaned = cleaned.replace(/_{2,}(.*?)_{2,}/g, '$1');
  cleaned = cleaned.replace(/_(.*?)_/g, '$1');
  cleaned = cleaned.replace(/^\s*\*\s+/gm, '• ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  return cleaned.trim();
}

async function callGemini(prompt, options = {}) {
  const startTime = Date.now();
  const genAI = getGenAIClient();

  if (!genAI) {
    const err = new Error('GEMINI_API_KEY is not configured on server.');
    err.category = 'AI_AUTH';
    throw err;
  }

  const timeoutMs = options.timeoutMs || 25000;
  const maxRetries = options.retries !== undefined ? options.retries : 1;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
          const err = new Error(`Gemini API request timed out after ${timeoutMs}ms`);
          err.category = 'AI_TIMEOUT';
          reject(err);
        }, timeoutMs);
        if (timer.unref) timer.unref();
      });

      const generatePromise = model.generateContent(prompt);
      const result = await Promise.race([generatePromise, timeoutPromise]);

      const responseText = result.response.text();
      const duration = Date.now() - startTime;
      console.log(`[AI GEMINI] provider: GEMINI | model: ${GEMINI_MODEL} | duration: ${duration}ms | status: SUCCESS`);
      return responseText.trim();
    } catch (error) {
      lastError = error;
      const isRateLimit = error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota exceeded');
      const isTimeout = error.category === 'AI_TIMEOUT' || error.message?.includes('timed out');
      
      const errorCategory = isRateLimit ? 'AI_QUOTA' : isTimeout ? 'AI_TIMEOUT' : (error.message?.includes('401') || error.message?.includes('403')) ? 'AI_AUTH' : 'AI_INTERNAL_ERROR';
      error.category = errorCategory;

      console.error(`[AI GEMINI] attempt: ${attempt + 1}/${maxRetries + 1} | category: ${errorCategory} | error: ${error.message}`);
      
      if (errorCategory === 'AI_AUTH') {
        break;
      }
      
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  throw lastError || new Error('Gemini API call failed.');
}

module.exports = {
  callGemini,
  getGenAIClient,
  cleanAndParseJSON,
  formatCleanAIResponse
};
