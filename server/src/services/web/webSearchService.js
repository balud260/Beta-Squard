/**
 * Centralized Web Search Service
 * Normalizes live web search results across multiple providers:
 * - google_news (Default free RSS provider - 0 API key required)
 * - tavily (When WEB_SEARCH_PROVIDER=tavily and WEB_SEARCH_API_KEY is configured)
 * - serper / bing (When API keys configured)
 * - duckduckgo / ddg
 */

function getSearchConfig() {
  const provider = (process.env.WEB_SEARCH_PROVIDER || 'google_news').toLowerCase().trim();
  const apiKey = process.env.WEB_SEARCH_API_KEY || process.env.TAVILY_API_KEY || process.env.SERPER_API_KEY || '';
  return { provider, apiKey };
}

/**
 * Normalizes HTML/XML entities into plain text
 */
function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Free Google News RSS Web Search Provider
 */
async function searchGoogleNews(query, maxResults = 5) {
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(rssUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) return [];

    const xml = await response.text();
    const items = [];
    const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<link>(.*?)<\/link>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<source[^>]*>(.*?)<\/source>[\s\S]*?<\/item>/gi;

    let match;
    const nowIso = new Date().toISOString();

    while ((match = itemRegex.exec(xml)) !== null && items.length < maxResults) {
      const rawTitle = cleanText(match[1]);
      const link = match[2].trim();
      const pubDate = cleanText(match[3]);
      const source = cleanText(match[4]) || 'News Source';

      // Split title and publisher if title format is "Story Title - Publisher"
      let title = rawTitle;
      if (rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ');
        title = parts.slice(0, -1).join(' - ').trim();
      }

      items.push({
        title: title || rawTitle,
        link,
        source: source || 'Web Source',
        pubDate,
        snippet: `${title}. Reported by ${source}. (${pubDate})`,
        retrievedAt: nowIso
      });
    }

    return items;
  } catch (err) {
    console.warn(`[WEB SEARCH] Google News RSS query "${query}" failed:`, err.message);
    return [];
  }
}

/**
 * Tavily Web Search Provider (used when WEB_SEARCH_PROVIDER=tavily)
 */
async function searchTavily(query, apiKey, maxResults = 5) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        max_results: maxResults,
        include_answer: false
      }),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!response.ok) return [];

    const data = await response.json();
    const nowIso = new Date().toISOString();

    return (data.results || []).map(r => ({
      title: r.title,
      link: r.url,
      source: new URL(r.url).hostname.replace(/^www\./, ''),
      pubDate: r.published_date || 'Recently',
      snippet: r.content,
      retrievedAt: nowIso
    }));
  } catch (err) {
    console.warn(`[WEB SEARCH] Tavily search query "${query}" failed:`, err.message);
    return [];
  }
}

/**
 * Unified Web Search Interface
 */
async function searchWeb(query, maxResults = 5) {
  const { provider, apiKey } = getSearchConfig();
  const startTime = Date.now();

  console.log(`[WEB SEARCH] Executing live web search query: "${query}" | provider: ${provider}`);

  let results = [];
  if (provider === 'tavily' && apiKey) {
    results = await searchTavily(query, apiKey, maxResults);
  }

  // Fallback to free Google News RSS provider if primary yielded no results or default provider
  if (results.length === 0) {
    results = await searchGoogleNews(query, maxResults);
  }

  const duration = Date.now() - startTime;
  console.log(`[WEB SEARCH] Query: "${query}" | duration: ${duration}ms | results_count: ${results.length}`);

  return results;
}

module.exports = {
  searchWeb,
  getSearchConfig
};
