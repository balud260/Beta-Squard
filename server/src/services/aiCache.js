/**
 * In-Memory AI Analysis Cache with TTL & Data Invalidation
 * Prevents redundant Gemini API calls for identical queries & unchanged analysis objects
 */
const aiCache = new Map();
const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes default TTL

function getCacheKey(feature, idOrUser, query = '') {
  return `${feature}:${idOrUser}:${(query || '').toLowerCase().trim()}`;
}

function getCachedAI(key) {
  const entry = aiCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    aiCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedAI(key, data, ttlMs = DEFAULT_TTL_MS) {
  aiCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  });
}

function invalidateCache(featurePrefix = '') {
  if (!featurePrefix) {
    aiCache.clear();
    return;
  }
  for (const k of aiCache.keys()) {
    if (k.startsWith(featurePrefix)) {
      aiCache.delete(k);
    }
  }
}

module.exports = {
  getCachedAI,
  setCachedAI,
  invalidateCache,
  getCacheKey
};
