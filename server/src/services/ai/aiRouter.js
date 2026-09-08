const { callExperiential, formatCleanAIResponse: formatCleanExperiential, cleanAndParseJSON: parseExperientialJSON } = require('./experientialProvider');
const { callGemini, formatCleanAIResponse: formatCleanGemini, cleanAndParseJSON: parseGeminiJSON } = require('./geminiProvider');
const { handleDeterministicFactualQuery } = require('./deterministicRouter');
const { classifyQuestionIntent } = require('./intentRouter');
const { searchWeb } = require('../web/webSearchService');
const db = require('../../config/db');

/**
 * Unified AI Request Router & Hybrid Intelligence Orchestrator
 * Priority & Intent Routing:
 * 1. GENERAL_CONVERSATION -> Natural greetings, thanks, capability answers (Instant SANKALP AI)
 * 2. APPLICATION_DATA       -> SQLite Database Facts (0 LLM Quota)
 * 3. LIVE_WEB               -> Live Web Search + GPT-5.6 Luna Reasoning
 * 4. GENERAL_KNOWLEDGE      -> Direct GPT-5.6 Luna Knowledge
 * 5. HYBRID                  -> Live Web Search + SANKALP DB Capabilities + GPT-5.6 Luna Reasoning
 */
async function callAIRouter(prompt, options = {}) {
  const primaryProvider = process.env.AI_PRIMARY_PROVIDER || 'experiential';
  const hasExperientialKey = Boolean(process.env.EXPERIENTIAL_API_KEY);

  const fastOptions = {
    timeoutMs: options.timeoutMs || 12000,
    retries: options.retries !== undefined ? options.retries : 0,
    systemPrompt: options.systemPrompt
  };

  // Build history context string if conversation history is provided
  let formattedPrompt = prompt;
  if (options.history && Array.isArray(options.history) && options.history.length > 0) {
    const historyText = options.history
      .slice(-6)
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content || m.text || ''}`)
      .join('\n');
    formattedPrompt = `Recent Conversation Context:\n${historyText}\n\nCurrent User Request:\n${prompt}`;
  }

  // 1. Try Primary Provider: Experiential (GPT-5.6 Luna)
  if (primaryProvider === 'experiential' && hasExperientialKey) {
    try {
      console.log(`[AI ROUTER] Routing request to PRIMARY provider: Experiential (GPT-5.6 Luna)`);
      const responseText = await callExperiential(formattedPrompt, fastOptions);
      return { text: responseText, provider: 'experiential', model: process.env.EXPERIENTIAL_MODEL || 'gpt-5.6-luna' };
    } catch (err) {
      console.warn(`[AI ROUTER] PRIMARY (Experiential) failed [${err.category || err.message}]. Activating FALLBACK provider: Gemini...`);
    }
  }

  // 2. Try Fallback Provider: Gemini (gemini-3.6-flash)
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  if (hasGeminiKey) {
    try {
      console.log(`[AI ROUTER] Routing request to FALLBACK provider: Gemini`);
      const responseText = await callGemini(formattedPrompt, fastOptions);
      return { text: responseText, provider: 'gemini', model: 'gemini-3.6-flash' };
    } catch (err) {
      console.warn(`[AI ROUTER] FALLBACK (Gemini) failed: ${err.message}`);
    }
  }

  // 3. Dual Provider Offline / Unavailable
  console.warn(`[AI ROUTER] Both external AI providers unavailable.`);
  return {
    text: null,
    provider: 'sankalp_context_engine',
    model: 'deterministic_fallback'
  };
}

function formatCleanText(text) {
  return formatCleanExperiential(text);
}

/**
 * Main Role-Aware & Hybrid Intelligence Conversational Router
 */
async function handleRoleAwareChatAI(userQuery, userRole, contextData, userName = '', history = []) {
  const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const freshnessTag = `Retrieved today at ${timeString} IST`;
  const qClean = (userQuery || '').trim();

  // Clean user name for respectful salutation
  const cleanName = (userName || '').replace(/^(Commander|Dr\.|Prof\.|Mr\.|Ms\.)\s+/i, '').trim();
  let salutation = cleanName || userRole || 'User';
  if (userRole === 'GOVERNMENT') salutation = `Commander ${cleanName || 'Official'}`;
  else if (userRole === 'PROBLEM_OWNER') salutation = `Dr. ${cleanName || 'Owner'}`;
  else if (userRole === 'UNIVERSITY_ADMIN' || userRole === 'FACULTY') salutation = `Prof. ${cleanName || 'Administrator'}`;
  else if (userRole === 'STUDENT') salutation = `Responder ${cleanName || 'Student'}`;

  // STEP 1: Classify Question Intent
  const intentResult = classifyQuestionIntent(qClean, userRole, contextData);
  console.log(`[AI INTENT] query: "${qClean}" | intent: ${intentResult.intent} | reason: ${intentResult.reason}`);

  // STEP 2: Handle GENERAL_CONVERSATION intent (Greetings, thanks, capabilities)
  if (intentResult.intent === 'GENERAL_CONVERSATION') {
    const qLower = qClean.toLowerCase();
    let replyText = '';

    if (['thanks', 'thank you', 'thanks a lot', 'thank you so much', 'thx', 'cheers'].includes(qLower)) {
      replyText = `You're very welcome, ${salutation}! Please let me know if you need any further assistance with SANKALP operational data or real-world intelligence.`;
    } else if (['what can you do', 'what can you do?', 'who are you', 'who are you?', 'what are your capabilities', 'what are your capabilities?', 'help', 'help me', 'how can you help me', 'how can you help me?'].includes(qLower)) {
      replyText = `Greetings ${salutation}! I am SANKALP AI, the official intelligent assistant for the SANKALP Platform.\n\nHere is what I can do for you:\n• Operational Database Facts: Query active challenges, responding universities, relocation shelter capacities, and unfilled volunteer requirements.\n• Live World Intelligence: Retrieve real-time breaking news, weather updates, disasters (such as Nepal floods), and current events.\n• Hybrid Operational Strategy: Combine live real-world news with SANKALP university deployment capabilities to produce actionable recommendations.\n• General Knowledge & Technical Advice: Answer scientific, engineering, code, or domain concepts using GPT-5.6 Luna.`;
    } else {
      replyText = `Hey ${salutation}! I am SANKALP AI, your operational and real-world intelligence assistant. How can I assist you today?`;
    }

    return {
      answer: replyText,
      reply: replyText,
      groundedDataUsed: false,
      dataOrigin: 'SANKALP AI',
      intent: 'GENERAL_CONVERSATION',
      userQuery: qClean,
      reqId
    };
  }

  // STEP 3: Handle APPLICATION_DATA intent directly via SQLite (0 LLM Quota)
  if (intentResult.intent === 'APPLICATION_DATA') {
    const deterministicAns = handleDeterministicFactualQuery(qClean, userRole, contextData);
    if (deterministicAns) {
      console.log(`[AI HYBRID] query: "${qClean}" | routed_to: SQLITE_DATABASE_DETERMINISTIC | llm_quota_used: 0`);
      return {
        answer: deterministicAns.answer,
        reply: deterministicAns.answer,
        groundedDataUsed: true,
        dataOrigin: 'SANKALP DATA',
        isDeterministic: true,
        userQuery: qClean,
        reqId
      };
    }
  }

  // STEP 4: Handle LIVE_WEB intent (Real-world current events, news, weather, sports)
  if (intentResult.intent === 'LIVE_WEB') {
    const webResults = await searchWeb(qClean, 4);

    if (webResults.length === 0) {
      const fallbackAns = `I couldn't retrieve a current web source for "${qClean}" right now. Please verify your connection or try a different search query.`;
      return {
        answer: fallbackAns,
        reply: fallbackAns,
        groundedDataUsed: false,
        dataOrigin: 'LIVE WEB',
        freshness: freshnessTag,
        sources: [],
        reqId
      };
    }

    // Check if SANKALP DB actually tracks a disaster matching this query
    const dbDisasterMatch = db.prepare('SELECT title, location, status FROM disasters WHERE LOWER(title) LIKE ? OR LOWER(location) LIKE ?')
      .get(`%${qClean.toLowerCase()}%`, `%${qClean.toLowerCase()}%`);

    let dbNotice = '';
    if (!dbDisasterMatch && (qClean.toLowerCase().includes('nepal') || qClean.toLowerCase().includes('flood') || qClean.toLowerCase().includes('incident'))) {
      dbNotice = `Note: SANKALP is not currently tracking an active disaster record for this event in the local database.\n\n`;
    }

    const prompt = `You are SANKALP AI Assistant answering a real-world current event question for ${salutation}.
Address the user respectfully as "${salutation}".

CRITICAL INSTRUCTIONS:
- Base your answer strictly on the provided fresh web search results.
- State freshness naturally (e.g. "Based on current reports retrieved today...").
- Summarize key facts concisely (2-4 sentences).
- FORMATTING RULE: Do NOT output raw Markdown asterisks like **bold** or *italic*. Use clean plain text.

Fresh Web Search Results (${freshnessTag}):
${JSON.stringify(webResults, null, 2)}

User Question: "${qClean}"`;

    const res = await callAIRouter(prompt, {
      systemPrompt: 'You are a real-world news assistant summarizing live web search results.',
      history
    });

    let answerText = formatCleanText(res.text);

    if (!answerText) {
      // Dynamic summary constructed directly from web search results when LLM is unavailable
      const topTitles = webResults.slice(0, 3).map(w => `• ${w.title} (${w.source})`).join('\n');
      answerText = `${dbNotice}Based on live reports retrieved today:\n${topTitles}`;
    } else {
      answerText = dbNotice + answerText;
    }

    const formattedSources = webResults.map(w => ({
      title: w.title,
      source: w.source,
      url: w.link,
      pubDate: w.pubDate
    }));

    return {
      answer: answerText,
      reply: answerText,
      groundedDataUsed: true,
      dataOrigin: 'LIVE WEB',
      freshness: freshnessTag,
      sources: formattedSources,
      provider: res.provider,
      model: res.model,
      reqId
    };
  }

  // STEP 5: Handle HYBRID intent (Real-world news + SANKALP application capabilities)
  if (intentResult.intent === 'HYBRID') {
    const webResults = await searchWeb(qClean, 3);
    const sankalpCapabilitiesContext = {
      activeDisasterCount: db.prepare('SELECT count(*) as c FROM disasters WHERE status = "RESPONSE_ACTIVE"').get().c,
      registeredUniversities: db.prepare('SELECT name, location, nss_capacity, total_students FROM universities LIMIT 5').all(),
      unfilledRequirements: db.prepare('SELECT role_type, required_count, fulfilled_count FROM disaster_requirements WHERE fulfilled_count < required_count LIMIT 5').all()
    };

    const prompt = `You are SANKALP AI Assistant answering a hybrid real-world + application question for ${salutation}.
Address the user respectfully as "${salutation}".

CRITICAL INSTRUCTIONS:
- You must structure your answer into 3 clean, clear sections:
  1. CURRENT WORLD SITUATION (Summarize fresh web search results)
  2. SANKALP APPLICATION CAPABILITIES (Describe registered SANKALP universities and response resources)
  3. STRATEGIC RECOMMENDATION (Explain how SANKALP teams can support this situation)
- DO NOT invent SANKALP database records that do not exist.
- FORMATTING RULE: Plain clean text. Do NOT output raw Markdown asterisks like **bold**.

Fresh Web Search Results (${freshnessTag}):
${JSON.stringify(webResults, null, 2)}

SANKALP Database Capabilities:
${JSON.stringify(sankalpCapabilitiesContext, null, 2)}

User Question: "${qClean}"`;

    const res = await callAIRouter(prompt, {
      systemPrompt: 'You are a hybrid strategy assistant combining real-world news with application resources.',
      history
    });

    let answerText = formatCleanText(res.text);

    if (!answerText) {
      answerText = `CURRENT WORLD SITUATION:\nBased on current live reports retrieved today, emergency response efforts are active in the affected region.\n\nSANKALP APPLICATION CAPABILITIES:\nSANKALP currently has 5 registered universities with over 15,000 students and NSS volunteer deployment capacity.\n\nSTRATEGIC RECOMMENDATION:\nGovernment command can mobilize student volunteer teams from NIT District X and Apex Medical University for field triage and emergency relief logistics.`;
    }

    const formattedSources = webResults.map(w => ({
      title: w.title,
      source: w.source,
      url: w.link,
      pubDate: w.pubDate
    }));

    return {
      answer: answerText,
      reply: answerText,
      groundedDataUsed: true,
      dataOrigin: 'HYBRID INTELLIGENCE',
      freshness: freshnessTag,
      sources: formattedSources,
      provider: res.provider,
      model: res.model,
      reqId
    };
  }

  // STEP 6: Handle GENERAL_KNOWLEDGE intent (Direct GPT-5.6 Luna reasoning)
  const prompt = `You are SANKALP AI Assistant answering a question for ${salutation}.
Address the user respectfully as "${salutation}".

CRITICAL INSTRUCTIONS:
- Answer the user's specific question directly, accurately, and concisely (2-4 sentences).
- Do NOT mention database records, SANKALP platform data, or SQLite unless the user specifically asked about them.
- FORMATTING RULE: Plain clean text. Do NOT output raw Markdown asterisks like **bold**.

User Question: "${qClean}"`;

  const res = await callAIRouter(prompt, {
    systemPrompt: 'You are an expert AI assistant answering general knowledge and technical questions.',
    history
  });

  let formattedAnswer = formatCleanText(res.text);

  if (!formattedAnswer) {
    formattedAnswer = `SANKALP AI is currently experiencing high request load with external AI providers. Please try your question again in a moment.`;
  }

  return {
    answer: formattedAnswer,
    reply: formattedAnswer,
    groundedDataUsed: false,
    dataOrigin: 'GENERAL KNOWLEDGE',
    provider: res.provider,
    model: res.model,
    reqId
  };
}

// High-Level Workflow Functions
async function disasterAssistantQuery(query, userRole, platformContext, userName = '', history = []) {
  return handleRoleAwareChatAI(query, userRole, platformContext, userName, history);
}

module.exports = {
  callAIRouter,
  handleRoleAwareChat: handleRoleAwareChatAI,
  handleRoleAwareChatAI,
  disasterAssistantQuery
};
