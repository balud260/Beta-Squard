const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const {
  disasterAssistantQuery,
  handleRoleAwareChat,
  classifyQuestionIntent,
  analyzeTeamSkillGap,
  compareProposals,
  analyzeImpactMetrics
} = require('../services/aiService');
const { getCachedAI, setCachedAI, getCacheKey } = require('../services/ai/aiCache');

// Per-user cooldown tracker (enforces 3s minimum between AI calls per user)
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
 * Helper function to build minimal, topic-routed operational platform context for AI
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
      SELECT dr.role_type, dr.required_count, dr.fulfilled_count, dr.urgency,
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
 * POST /api/ai/intent-check - Inspect intent classification
 */
router.post('/intent-check', authenticateToken, (req, res) => {
  const query = req.body.query || req.body.message || req.body.prompt;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Query string is required.' });
  }
  const classification = classifyQuestionIntent(query.trim(), req.user.role, {});
  res.json(classification);
});

/**
 * POST /api/ai/chat - Persistent Role-Aware & Hybrid Intelligence AI Assistant
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const query = req.body.query || req.body.message || req.body.prompt;
    const history = req.body.history || [];
    const { role, id: userId, name: userName } = req.user;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Please provide a valid question or message.'
        }
      });
    }

    const cleanQuery = query.trim();

    // STEP 1: Check Server In-Memory Cache (Uses exact normalized query key)
    const cacheKey = getCacheKey('chat', userId, cleanQuery);
    const cachedResponse = getCachedAI(cacheKey);
    if (cachedResponse && (!history || history.length === 0)) {
      console.log(`[AI CACHE HIT] query: "${cleanQuery}" | user_id: ${userId}`);
      return res.json(cachedResponse);
    }

    // STEP 2: Enforce Per-User AI Cooldown (3s gap)
    if (!checkUserAiCooldown(userId)) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'AI_RATE_LIMITED',
          message: 'Please wait a moment between AI queries.'
        }
      });
    }

    // STEP 3: Execute Hybrid Intelligence Orchestration
    const contextData = getRoleContextData(req.user, null, cleanQuery);
    const result = await handleRoleAwareChat(cleanQuery, role, contextData, userName, history);

    // Save to Cache if successful and no conversation history
    if (result && result.answer && (!history || history.length === 0) && result.intent !== 'GENERAL_CONVERSATION') {
      setCachedAI(cacheKey, result);
    }

    res.json(result);
  } catch (error) {
    console.error('Role aware chat error:', error.message);

    if (error.category === 'AI_QUOTA' || error.message.includes('429') || error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'AI_RATE_LIMITED',
          message: 'AI usage limit reached. Please wait a moment before trying again.'
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: error.category || 'AI_UNAVAILABLE',
        message: 'SANKALP AI is temporarily unavailable. Please try again shortly.'
      }
    });
  }
});

/**
 * POST /api/ai/assistant - Disaster Command Center Decision Assistant
 */
router.post('/assistant', authenticateToken, async (req, res) => {
  try {
    const query = req.body.query || req.body.message || req.body.prompt;
    const disaster_id = req.body.disaster_id;
    const history = req.body.history || [];
    const { role, id: userId, name: userName } = req.user;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUERY',
          message: 'Please provide a valid question or message.'
        }
      });
    }

    const cleanQuery = query.trim();

    // STEP 1: Check Cache
    const cacheKey = getCacheKey('assistant', userId, cleanQuery);
    const cachedResponse = getCachedAI(cacheKey);
    if (cachedResponse && (!history || history.length === 0)) {
      console.log(`[AI CACHE HIT] query: "${cleanQuery}" | user_id: ${userId}`);
      return res.json(cachedResponse);
    }

    // STEP 2: Enforce Cooldown
    if (!checkUserAiCooldown(userId)) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'AI_RATE_LIMITED',
          message: 'Please wait a moment between AI queries.'
        }
      });
    }

    // STEP 3: Call Hybrid Intelligence Orchestrator
    const platformContext = getRoleContextData(req.user, disaster_id, cleanQuery);
    const aiResult = await disasterAssistantQuery(cleanQuery, role, platformContext, userName, history);

    if (aiResult && aiResult.answer && (!history || history.length === 0) && aiResult.intent !== 'GENERAL_CONVERSATION') {
      setCachedAI(cacheKey, aiResult);
    }
    res.json(aiResult);
  } catch (error) {
    console.error('AI assistant error:', error.message);
    if (error.category === 'AI_QUOTA' || error.message.includes('429') || error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'AI_RATE_LIMITED',
          message: 'AI usage limit reached. Please wait a moment before trying again.'
        }
      });
    }
    res.status(500).json({
      success: false,
      error: {
        code: error.category || 'AI_UNAVAILABLE',
        message: 'SANKALP AI is temporarily unavailable. Please click Retry.'
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
    res.status(500).json({ error: 'AI Team Skill Gap Analysis failed.', message: 'SANKALP AI is temporarily unavailable. Please try again shortly.' });
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
    res.status(500).json({ error: 'AI Proposal Analysis failed.', message: 'SANKALP AI is temporarily unavailable. Please try again shortly.' });
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
    res.status(500).json({ error: 'AI Impact Analysis failed.', message: 'SANKALP AI is temporarily unavailable. Please try again shortly.' });
  }
});

module.exports = router;
