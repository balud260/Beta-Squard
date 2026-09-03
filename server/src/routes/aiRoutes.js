const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const {
  disasterAssistantQuery,
  handleRoleAwareChat,
  analyzeTeamSkillGap,
  compareProposals,
  analyzeImpactMetrics
} = require('../services/aiService');
const { getCachedAI, setCachedAI, getCacheKey } = require('../services/aiCache');

// Per-user cooldown tracker (enforces 3s minimum between Gemini calls per user)
const userAiCooldown = new Map();

function checkUserAiCooldown(userId) {
  const lastTime = userAiCooldown.get(userId);
  const now = Date.now();
  if (lastTime && (now - lastTime) < 3000) {
    return false;
  }
  userAiCooldown.set(userId, now);
  return true;
}

/**
 * Hybrid Query Engine: Factual Deterministic DB Query Intent Handler
 * Intercepts common deterministic questions and answers directly from SQLite database facts
 * WITHOUT consuming Gemini API quota!
 */
function handleDeterministicFactualQuery(queryText, role, user) {
  const q = (queryText || '').toLowerCase().trim();

  // 1. Universities responding
  if (q.includes('universit') || q.includes('college') || q.includes('responding') || q.includes('institution')) {
    const activeAcceptances = db.prepare(`
      SELECT DISTINCT u.name, count(upa.id) as accepted_count
      FROM university_problem_acceptances upa
      JOIN universities u ON upa.university_id = u.id
      WHERE upa.status = 'ACCEPTED'
      GROUP BY u.name
    `).all();

    const proposalsSubmitted = db.prepare(`
      SELECT DISTINCT u.name, count(pr.id) as proposal_count
      FROM proposals pr
      JOIN universities u ON pr.university_id = u.id
      GROUP BY u.name
    `).all();

    if (activeAcceptances.length === 0 && proposalsSubmitted.length === 0) {
      return {
        answer: 'Currently, no universities have submitted active problem acceptances or proposals in the live platform feed.',
        groundedDataUsed: true,
        isDeterministic: true
      };
    }

    const items = activeAcceptances.map(a => `${a.name} (${a.accepted_count} challenge${a.accepted_count > 1 ? 's' : ''} accepted)`);
    proposalsSubmitted.forEach(p => {
      if (!items.some(i => i.includes(p.name))) {
        items.push(`${p.name} (${p.proposal_count} proposal${p.proposal_count > 1 ? 's' : ''} submitted)`);
      }
    });

    if (items.length === 1) {
      return {
        answer: `Currently 1 university is actively responding on the platform: ${items[0]}.`,
        groundedDataUsed: true,
        isDeterministic: true
      };
    }

    const formattedList = items.map(item => `• ${item}`).join('\n');
    return {
      answer: `Currently ${items.length} universities are actively responding on SANKALP platform:\n${formattedList}`,
      groundedDataUsed: true,
      isDeterministic: true
    };
  }

  // 2. Hospitals near capacity / pressure
  if (q.includes('hospital') || q.includes('bed') || q.includes('capacity') || q.includes('health center')) {
    const hospitals = db.prepare(`
      SELECT name, available_beds, total_beds, emergency_capacity, status
      FROM hospitals
    `).all();

    const highPressure = hospitals.filter(h => h.status === 'HIGH_PRESSURE' || (h.available_beds / (h.total_beds || 1)) <= 0.3);

    if (highPressure.length === 0) {
      return {
        answer: 'All monitored district hospitals are currently operating within normal capacity limits.',
        groundedDataUsed: true,
        isDeterministic: true
      };
    }

    const items = highPressure.map(h => `${h.name}: ${h.available_beds}/${h.total_beds} beds available (${h.status.replace(/_/g, ' ')})`);
    if (items.length === 1) {
      return {
        answer: `1 hospital is currently under operational pressure: ${items[0]}.`,
        groundedDataUsed: true,
        isDeterministic: true
      };
    }

    const formattedList = items.map(item => `• ${item}`).join('\n');
    return {
      answer: `Currently ${items.length} hospitals are under operational pressure:\n${formattedList}`,
      groundedDataUsed: true,
      isDeterministic: true
    };
  }

  // 3. Unfilled requirements
  if (q.includes('requirement') || q.includes('unfilled') || q.includes('volunteer') || q.includes('responder')) {
    const unfilled = db.prepare(`
      SELECT dr.role_needed, dr.required_count, dr.location,
             (SELECT count(*) FROM volunteer_responses vr WHERE vr.requirement_id = dr.id AND vr.status = 'CONFIRMED') as confirmed_count
      FROM disaster_requirements dr
      WHERE (SELECT count(*) FROM volunteer_responses vr WHERE vr.requirement_id = dr.id AND vr.status = 'CONFIRMED') < dr.required_count
    `).all();

    if (unfilled.length === 0) {
      return {
        answer: 'All active emergency response volunteer requirements have been fully filled by university teams.',
        groundedDataUsed: true,
        isDeterministic: true
      };
    }

    const items = unfilled.map(u => `${u.role_needed} at ${u.location}: ${u.required_count - u.confirmed_count} responders still needed (${u.confirmed_count}/${u.required_count} confirmed)`);
    if (items.length === 1) {
      return {
        answer: `1 emergency response requirement remains unfilled: ${items[0]}.`,
        groundedDataUsed: true,
        isDeterministic: true
      };
    }

    const formattedList = items.map(item => `• ${item}`).join('\n');
    return {
      answer: `Currently ${items.length} emergency response requirements are unfilled:\n${formattedList}`,
      groundedDataUsed: true,
      isDeterministic: true
    };
  }

  // 4. Critical problems
  if (q.includes('critical') || q.includes('urgency') || q.includes('severe problem')) {
    const criticalProblems = db.prepare(`
      SELECT title, category, location, status
      FROM problems
      WHERE urgency = 'CRITICAL'
    `).all();

    if (criticalProblems.length === 0) {
      return {
        answer: 'There are currently no active problems flagged with critical urgency.',
        groundedDataUsed: true,
        isDeterministic: true
      };
    }

    const items = criticalProblems.map(p => `${p.title} (${p.category}) - Location: ${p.location} [Status: ${p.status}]`);
    if (items.length === 1) {
      return {
        answer: `1 societal problem is flagged with critical urgency: ${items[0]}.`,
        groundedDataUsed: true,
        isDeterministic: true
      };
    }

    const formattedList = items.map(item => `• ${item}`).join('\n');
    return {
      answer: `Currently ${items.length} problems are flagged with critical urgency:\n${formattedList}`,
      groundedDataUsed: true,
      isDeterministic: true
    };
  }

  // 5. Solutions under review / proposals under review
  if (q.includes('solution') || q.includes('proposal') || q.includes('review') || q.includes('submission')) {
    const pendingProposals = db.prepare(`
      SELECT pr.summary, p.title as problem_title, u.name as university_name
      FROM proposals pr
      JOIN problems p ON pr.problem_id = p.id
      JOIN universities u ON pr.university_id = u.id
      WHERE pr.status = 'SUBMITTED'
    `).all();

    if (pendingProposals.length === 0) {
      return {
        answer: 'There are currently no university proposals awaiting government or problem-owner review.',
        groundedDataUsed: true,
        isDeterministic: true
      };
    }

    const items = pendingProposals.map(p => `${p.problem_title} by ${p.university_name}: ${p.summary}`);
    if (items.length === 1) {
      return {
        answer: `1 proposal is currently under review: ${items[0]}.`,
        groundedDataUsed: true,
        isDeterministic: true
      };
    }

    const formattedList = items.map(item => `• ${item}`).join('\n');
    return {
      answer: `Currently ${items.length} university proposals are under review:\n${formattedList}`,
      groundedDataUsed: true,
      isDeterministic: true
    };
  }

  return null;
}

/**
 * Helper function to build minimal, topic-routed operational platform context for Gemini AI
 */
function getRoleContextData(user, disasterId = null, queryText = '') {
  const { role, id: userId, name: userName, university_id } = user;
  const q = (queryText || '').toLowerCase();

  let activeDisaster = null;
  if (disasterId) {
    activeDisaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(disasterId);
  } else {
    activeDisaster = db.prepare('SELECT * FROM disasters WHERE status = "RESPONSE_ACTIVE" ORDER BY id DESC LIMIT 1').get();
  }

  const disasterIdToUse = activeDisaster ? activeDisaster.id : 1;

  // Topic-routed context selection
  let relocationSites = [];
  let requirements = [];
  let hospitals = [];
  let universities = [];
  let responsibleProblems = [];
  let proposalsUnderReview = [];

  if (q.includes('relocation') || q.includes('shelter') || q.includes('evacuat') || q.includes('disaster') || !q) {
    relocationSites = db.prepare('SELECT name, capacity, current_occupancy, status, road_status, risk_level, score FROM relocation_sites WHERE disaster_id = ?').all(disasterIdToUse);
  }
  
  if (q.includes('requirement') || q.includes('volunteer') || q.includes('disaster') || !q) {
    requirements = db.prepare(`
      SELECT dr.role_needed, dr.required_count, dr.location,
             (SELECT count(*) FROM volunteer_responses vr WHERE vr.requirement_id = dr.id AND vr.status = 'CONFIRMED') as confirmed_count
      FROM disaster_requirements dr
      WHERE dr.disaster_id = ?
    `).all(disasterIdToUse);
  }

  if (q.includes('hospital') || q.includes('bed') || q.includes('health') || !q) {
    hospitals = db.prepare('SELECT name, location, available_beds, total_beds, emergency_capacity, status FROM hospitals').all();
  }

  if (q.includes('university') || q.includes('proposal') || !q) {
    universities = db.prepare('SELECT id, name, location, nss_capacity, ncc_capacity, total_students FROM universities').all();
  }

  if (q.includes('problem') || q.includes('challenge') || q.includes('urgency') || !q) {
    responsibleProblems = db.prepare(`
      SELECT p.id, p.title, p.category, p.urgency, p.status, p.government_department,
             (SELECT count(*) FROM university_problem_acceptances upa WHERE upa.problem_id = p.id AND upa.status = 'ACCEPTED') as accepted_count,
             (SELECT count(*) FROM proposals pr WHERE pr.problem_id = p.id) as proposal_count
      FROM problems p
    `).all();
  }

  if (q.includes('proposal') || q.includes('solution') || q.includes('review') || !q) {
    proposalsUnderReview = db.prepare(`
      SELECT pr.id, pr.summary, pr.approach, pr.status, pr.created_at, p.title as problem_title, u.name as university_name
      FROM proposals pr
      JOIN problems p ON pr.problem_id = p.id
      JOIN universities u ON pr.university_id = u.id
    `).all();
  }

  if (role === 'GOVERNMENT') {
    return {
      activeDisaster,
      relocationSites,
      requirements,
      hospitals,
      universities,
      responsibleProblems,
      proposalsUnderReview,
      currentUser: {
        name: userName,
        role: role,
        department: 'District Disaster & Welfare Command Authority',
        jurisdiction: 'District X'
      }
    };
  }

  if (role === 'PROBLEM_OWNER') {
    const myProblems = db.prepare(`
      SELECT p.id, p.title, p.category, p.urgency, p.status, p.created_at,
             (SELECT count(*) FROM university_problem_acceptances upa WHERE upa.problem_id = p.id AND upa.status = 'ACCEPTED') as accepted_count,
             (SELECT count(*) FROM university_problem_acceptances upa WHERE upa.problem_id = p.id) as total_responses,
             (SELECT count(*) FROM proposals pr WHERE pr.problem_id = p.id) as proposal_count
      FROM problems p
      WHERE p.owner_id = ?
    `).all(userId);

    const proposalsReceived = db.prepare(`
      SELECT pr.id, pr.summary, pr.approach, pr.cost, pr.timeline, pr.status, p.title as problem_title, u.name as university_name
      FROM proposals pr
      JOIN problems p ON pr.problem_id = p.id
      JOIN universities u ON pr.university_id = u.id
      WHERE p.owner_id = ?
    `).all(userId);

    return { myProblems, proposalsReceived, currentUser: user };
  }

  if (role === 'UNIVERSITY_ADMIN' || role === 'FACULTY') {
    const univId = university_id || 1;
    const acceptedProblems = db.prepare(`
      SELECT p.id, p.title, p.category, p.urgency, upa.accepted_at, upa.status
      FROM university_problem_acceptances upa
      JOIN problems p ON upa.problem_id = p.id
      WHERE upa.university_id = ?
    `).all(univId);

    const availableProblems = db.prepare(`
      SELECT p.id, p.title, p.category, p.urgency, p.location
      FROM problems p
      WHERE p.status IN ('PUBLISHED', 'SUBMITTED', 'ANALYZED')
    `).all();

    return { acceptedProblems, availableProblems, currentUser: user };
  }

  if (role === 'STUDENT') {
    const mySubmissions = db.prepare(`
      SELECT s.title, s.status, s.created_at, p.title as problem_title, p.category
      FROM student_solution_submissions s
      JOIN problems p ON s.problem_id = p.id
      WHERE s.student_id = ?
    `).all(userId);

    return { mySubmissions, emergencyMissions: requirements, currentUser: user };
  }

  return { activeDisaster, hospitals, universities, currentUser: user };
}

/**
 * POST /api/ai/chat - Persistent Role-Aware Conversational AI Assistant
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const query = req.body.query || req.body.message;
    const { role, id: userId, name: userName } = req.user;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query string is required.' });
    }

    // STEP 1: Check Deterministic Hybrid Query Engine (DB Facts - 0 Gemini Quota!)
    const deterministicResult = handleDeterministicFactualQuery(query, role, req.user);
    if (deterministicResult) {
      console.log(`[AI HYBRID] query: "${query}" | routed_to: SQLITE_DATABASE_DETERMINISTIC | gemini_quota_used: 0`);
      return res.json(deterministicResult);
    }

    // STEP 2: Check Server In-Memory Cache
    const cacheKey = getCacheKey('chat', userId, query);
    const cachedResponse = getCachedAI(cacheKey);
    if (cachedResponse) {
      console.log(`[AI CACHE HIT] query: "${query}" | user_id: ${userId} | gemini_quota_used: 0`);
      return res.json(cachedResponse);
    }

    // STEP 3: Enforce Per-User AI Cooldown (3s gap)
    if (!checkUserAiCooldown(userId)) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'AI_RATE_LIMITED',
          message: 'Please wait a moment between AI queries.'
        }
      });
    }

    // STEP 4: Call Gemini for Complex Reasoning / Summarization
    const contextData = getRoleContextData(req.user, null, query);
    const result = await handleRoleAwareChat(query, role, contextData, userName);

    // Save to Cache
    setCachedAI(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Role aware chat error:', error.message);

    if (error.category === 'AI_QUOTA' || error.message.includes('429') || error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'AI_RATE_LIMITED',
          message: 'Gemini AI usage limit reached. Please wait a moment before trying again.'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: error.category || 'AI_INTERNAL_ERROR',
        message: 'AI Assistant is temporarily unavailable. Please click Retry.'
      }
    });
  }
});

/**
 * POST /api/ai/assistant - Disaster Command Center Decision Assistant
 */
router.post('/assistant', authenticateToken, async (req, res) => {
  try {
    const query = req.body.query || req.body.message;
    const disaster_id = req.body.disaster_id;
    const { role, id: userId, name: userName } = req.user;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query prompt is required.' });
    }

    // STEP 1: Check Deterministic Hybrid Query Engine
    const deterministicResult = handleDeterministicFactualQuery(query, role, req.user);
    if (deterministicResult) {
      console.log(`[AI HYBRID] query: "${query}" | routed_to: SQLITE_DATABASE_DETERMINISTIC | gemini_quota_used: 0`);
      return res.json(deterministicResult);
    }

    // STEP 2: Check Cache
    const cacheKey = getCacheKey('assistant', userId, query);
    const cachedResponse = getCachedAI(cacheKey);
    if (cachedResponse) {
      console.log(`[AI CACHE HIT] query: "${query}" | user_id: ${userId} | gemini_quota_used: 0`);
      return res.json(cachedResponse);
    }

    // STEP 3: Enforce Cooldown
    if (!checkUserAiCooldown(userId)) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'AI_RATE_LIMITED',
          message: 'Please wait a moment between AI queries.'
        }
      });
    }

    // STEP 4: Call Gemini
    const platformContext = getRoleContextData(req.user, disaster_id, query);
    const aiResult = await disasterAssistantQuery(query, role, platformContext, userName);

    setCachedAI(cacheKey, aiResult);
    res.json(aiResult);
  } catch (error) {
    console.error('AI assistant error:', error.message);
    if (error.category === 'AI_QUOTA' || error.message.includes('429') || error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'AI_RATE_LIMITED',
          message: 'Gemini AI usage limit reached. Please wait a moment before trying again.'
        }
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: error.category || 'AI_INTERNAL_ERROR',
        message: 'AI Assistant is temporarily unavailable. Please click Retry.'
      }
    });
  }
});

/**
 * POST /api/ai/team-skill-gap - AI Team Skill Gap Analysis
 */
router.post('/team-skill-gap', authenticateToken, async (req, res) => {
  try {
    const { problem_id, team_members } = req.body;
    const cacheKey = getCacheKey('skill_gap', problem_id || 'general', JSON.stringify(team_members || []));

    const cached = getCachedAI(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let problemRequirements = {};
    if (problem_id) {
      const problem = db.prepare('SELECT title, description, category FROM problems WHERE id = ?').get(problem_id);
      const analysis = db.prepare('SELECT required_skills_json, required_departments_json FROM problem_analysis WHERE problem_id = ?').get(problem_id);
      problemRequirements = { problem, analysis };
    }

    const gapAnalysis = await analyzeTeamSkillGap(team_members || [], problemRequirements);
    const response = { is_ai_analysis: true, analysis: gapAnalysis };

    setCachedAI(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('Team skill gap error:', error.message);
    res.status(500).json({ error: 'AI Team Skill Gap Analysis failed.', details: error.message });
  }
});

/**
 * POST /api/ai/proposal-analysis - AI Proposal Evaluation & Comparison
 */
router.post('/proposal-analysis', authenticateToken, async (req, res) => {
  try {
    const { problem_id } = req.body;
    const cacheKey = getCacheKey('proposal_comp', problem_id);

    const cached = getCachedAI(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(problem_id);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    const proposals = db.prepare(`
      SELECT pr.*, u.name as university_name
      FROM proposals pr
      JOIN universities u ON pr.university_id = u.id
      WHERE pr.problem_id = ?
    `).all(problem_id);

    const comparison = await compareProposals(problem, proposals);
    const response = { is_ai_analysis: true, comparison };

    setCachedAI(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('AI proposal analysis error:', error.message);
    res.status(500).json({ error: 'AI Proposal Analysis failed.', details: error.message });
  }
});

/**
 * GET /api/ai/impact-analysis - AI Impact Analysis
 */
router.get('/impact-analysis', authenticateToken, async (req, res) => {
  try {
    const cacheKey = 'impact_analysis_global';
    const cached = getCachedAI(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const totalProjects = db.prepare('SELECT count(*) as count FROM projects').get();
    const totalDisasters = db.prepare('SELECT count(*) as count FROM disasters').get();
    const totalUniversities = db.prepare('SELECT count(*) as count FROM universities').get();

    const impactData = { totalProjects, totalDisasters, totalUniversities };
    const impactAnalysis = await analyzeImpactMetrics(impactData);
    const response = { is_ai_analysis: true, analysis: impactAnalysis };

    setCachedAI(cacheKey, response);
    res.json(response);
  } catch (error) {
    console.error('AI impact analysis error:', error.message);
    res.status(500).json({ error: 'AI Impact Analysis failed.', details: error.message });
  }
});

module.exports = router;
