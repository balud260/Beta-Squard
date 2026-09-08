/**
 * Experiential Labs Provider Client (PRIMARY AI)
 * Models: gpt-5.6-luna via OpenAI-compatible endpoint
 * Base URL: https://api.experientiallabs.ai/v1
 */

function getExperientialConfig() {
  const apiKey = process.env.EXPERIENTIAL_API_KEY || '';
  const baseUrl = (process.env.EXPERIENTIAL_BASE_URL || 'https://api.experientiallabs.ai/v1').replace(/\/+$/, '');
  const model = process.env.EXPERIENTIAL_MODEL || 'gpt-5.6-luna';
  return { apiKey, baseUrl, model };
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
    throw new Error(`Failed to parse Experiential AI JSON response: ${err.message}`);
  }
}

function formatCleanAIResponse(text) {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text.trim();

  // Strip code blocks
  cleaned = cleaned.replace(/^```[a-z]*\n?/gi, '').replace(/\n?```$/gi, '').trim();

  // Strip markdown headings (### Heading -> Heading)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // Strip bold (**text** -> text) and italic (*text* -> text)
  cleaned = cleaned.replace(/\*{2,}(.*?)\*{2,}/g, '$1');
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
  cleaned = cleaned.replace(/_{2,}(.*?)_{2,}/g, '$1');
  cleaned = cleaned.replace(/_(.*?)_/g, '$1');

  // Normalize bullet markers
  cleaned = cleaned.replace(/^\s*\*\s+/gm, '• ');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
}

/**
 * Executes a Chat Completion request against Experiential Labs (GPT-5.6 Luna)
 */
async function callExperiential(prompt, options = {}) {
  const { apiKey, baseUrl, model } = getExperientialConfig();
  const startTime = Date.now();

  if (!apiKey) {
    const err = new Error('EXPERIENTIAL_API_KEY is not configured on server.');
    err.category = 'AI_AUTH';
    throw err;
  }

  const systemPrompt = options.systemPrompt || 'You are SolveLink AI / SANKALP AI assistant. You answer based on verified context provided.';
  const timeoutMs = options.timeoutMs || 25000;
  const maxRetries = options.retries !== undefined ? options.retries : 1;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const endpoint = `${baseUrl}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature || 0.3
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        let errJson = {};
        try { errJson = JSON.parse(errText); } catch (_) {}
        const msg = errJson.error?.message || errJson.message || `Experiential API HTTP ${response.status}: ${errText}`;
        const err = new Error(msg);
        err.status = response.status;
        
        if (response.status === 429) {
          err.category = 'AI_QUOTA';
        } else if (response.status === 401 || response.status === 403) {
          err.category = 'AI_AUTH';
        } else {
          err.category = 'AI_INTERNAL_ERROR';
        }
        throw err;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const duration = Date.now() - startTime;
      console.log(`[AI EXPERIENTIAL] provider: EXPERIENTIAL | model: ${model} | duration: ${duration}ms | status: SUCCESS`);
      return content.trim();

    } catch (err) {
      lastError = err;
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Experiential API timed out after ${timeoutMs}ms`);
        timeoutErr.category = 'AI_TIMEOUT';
        lastError = timeoutErr;
      }

      console.error(`[AI EXPERIENTIAL] attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError.message}`);

      if (lastError.category === 'AI_AUTH') {
        break; // Do not retry auth errors
      }

      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  throw lastError || new Error('Experiential Labs API call failed.');
}

module.exports = {
  callExperiential,
  getExperientialConfig,
  cleanAndParseJSON,
  formatCleanAIResponse
};
