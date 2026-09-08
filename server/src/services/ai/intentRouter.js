/**
 * Centralized Intent & Source Router
 * Classifies user questions into four distinct intent categories:
 * 1. APPLICATION_DATA  -> SANKALP SQLite Database Facts (0 LLM quota used)
 * 2. LIVE_WEB          -> Real-world current events, news, weather, sports, recent incidents (Live Web Search + GPT-5.6 Luna)
 * 3. GENERAL_KNOWLEDGE -> Concepts, science, definitions, coding (GPT-5.6 Luna direct)
 * 4. HYBRID             -> Real-world news + SANKALP capabilities/teams (Web Search + SANKALP SQLite + GPT-5.6 Luna)
 */

function classifyQuestionIntent(questionText, userRole = '', contextData = {}) {
  const q = (questionText || '').toLowerCase().trim();

  // Keyword indicators for Live Web Search
  const liveWebKeywords = [
    'nepal', 'flood', 'earthquake', 'cyclone', 'tsunami', 'disaster in', 'incident in',
    'latest news', 'breaking news', 'news on', 'current news', 'recent event', 'recent news',
    'ai news', 'tech news', 'cricket', 'match', 'election', 'who won', 'weather in',
    'what is happening in', 'recent incident', 'ongoing conflict', 'today news'
  ];

  // Temporal indicators requiring fresh live data
  const temporalKeywords = [
    'today', 'currently', 'latest', 'recent', 'happening now', 'this week',
    'this month', 'breaking', 'live situation', 'right now'
  ];

  // SANKALP Application data keywords
  const applicationKeywords = [
    'sankalp', 'our university', 'our universities', 'our team', 'our teams', 'our shelter',
    'our challenge', 'our problem', 'accepted challenge', 'unfilled requirement',
    'assigned student', 'proposal submitted', 'hospital bed', 'disaster status'
  ];

  const hasLiveWebKeyword = liveWebKeywords.some(kw => q.includes(kw));
  const hasTemporalKeyword = temporalKeywords.some(kw => q.includes(kw));
  const hasApplicationKeyword = applicationKeywords.some(kw => q.includes(kw));

  // HYBRID INTENT: Combines real-world event/news AND SANKALP capabilities/teams
  if (hasLiveWebKeyword && (hasApplicationKeyword || q.includes('help') || q.includes('respond') || q.includes('could help') || q.includes('what should we do'))) {
    return {
      intent: 'HYBRID',
      reason: 'Question links real-world event/news with SANKALP application capabilities.',
      requiresWebSearch: true,
      requiresApplicationData: true
    };
  }

  // LIVE_WEB INTENT: Real-world news, recent events, breaking updates
  if (hasLiveWebKeyword || (hasTemporalKeyword && !hasApplicationKeyword && (q.includes('news') || q.includes('happening') || q.includes('incident') || q.includes('situation')))) {
    return {
      intent: 'LIVE_WEB',
      reason: 'Question asks about real-world current events or live news.',
      requiresWebSearch: true,
      requiresApplicationData: false
    };
  }

  // General concept / educational / coding questions -> GENERAL_KNOWLEDGE
  const generalKnowledgeKeywords = [
    'what is', 'explain', 'how does', 'difference between', 'who invented',
    'definition', 'python example', 'code example', 'tutorial', 'meaning of'
  ];

  const hasGeneralKnowledgeKeyword = generalKnowledgeKeywords.some(kw => q.includes(kw));
  
  if (hasGeneralKnowledgeKeyword && !hasApplicationKeyword && !hasLiveWebKeyword) {
    return {
      intent: 'GENERAL_KNOWLEDGE',
      reason: 'Question asks for general concepts, definitions, or technical knowledge.',
      requiresWebSearch: false,
      requiresApplicationData: false
    };
  }

  // Explicit SANKALP application database facts -> APPLICATION_DATA
  if (
    q.includes('universit') ||
    q.includes('challenge') ||
    q.includes('shelter') ||
    q.includes('proposal') ||
    q.includes('hospital') ||
    q.includes('unfilled') ||
    q.includes('assigned') ||
    q.includes('active problems') ||
    q.includes('disaster status')
  ) {
    return {
      intent: 'APPLICATION_DATA',
      reason: 'Question targets live SANKALP application operational database facts.',
      requiresWebSearch: false,
      requiresApplicationData: true
    };
  }

  // Default Fallback Intent
  if (hasTemporalKeyword) {
    return {
      intent: 'LIVE_WEB',
      reason: 'Temporal query defaults to live web search for fresh information.',
      requiresWebSearch: true,
      requiresApplicationData: false
    };
  }

  return {
    intent: 'GENERAL_KNOWLEDGE',
    reason: 'Standard conversational question routed to GPT-5.6 Luna.',
    requiresWebSearch: false,
    requiresApplicationData: false
  };
}

module.exports = {
  classifyQuestionIntent
};
