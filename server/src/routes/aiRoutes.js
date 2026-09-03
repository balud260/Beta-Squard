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

/**
 * Helper function to build rich, role-specific operational platform context for Gemini AI
 */
function getRoleContextData(user, disasterId = null) {
  const { role, id: userId, name: userName, university_id } = user;

  let activeDisaster = null;
  if (disasterId) {
    activeDisaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(disasterId);
  } else {
    activeDisaster = db.prepare('SELECT * FROM disasters WHERE status = "RESPONSE_ACTIVE" ORDER BY id DESC LIMIT 1').get();
  }

  const disasterIdToUse = activeDisaster ? activeDisaster.id : 1;

  const relocationSites = db.prepare('SELECT name, capacity, current_occupancy, status, road_status, risk_level, score FROM relocation_sites WHERE disaster_id = ?').all(disasterIdToUse);
  
  const requirements = db.prepare(`
    SELECT dr.*,
           (SELECT count(*) FROM volunteer_responses vr WHERE vr.requirement_id = dr.id AND vr.status = 'CONFIRMED') as confirmed_count
    FROM disaster_requirements dr
    WHERE dr.disaster_id = ?
  `).all(disasterIdToUse);

  const hospitals = db.prepare('SELECT name, location, available_beds, total_beds, emergency_capacity, status FROM hospitals').all();
  const universities = db.prepare('SELECT id, name, location, nss_capacity, ncc_capacity, total_students FROM universities').all();

  const responsibleProblems = db.prepare(`
    SELECT p.id, p.title, p.category, p.urgency, p.status, p.government_department,
           (SELECT count(*) FROM university_problem_acceptances upa WHERE upa.problem_id = p.id AND upa.status = 'ACCEPTED') as accepted_count,
           (SELECT count(*) FROM proposals pr WHERE pr.problem_id = p.id) as proposal_count
    FROM problems p
  `).all();

  const proposalsUnderReview = db.prepare(`
    SELECT pr.id, pr.summary, pr.approach, pr.status, pr.created_at, p.title as problem_title, u.name as university_name
    FROM proposals pr
    JOIN problems p ON pr.problem_id = p.id
    JOIN universities u ON pr.university_id = u.id
  `).all();

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

    const recentNotifications = db.prepare(`
      SELECT title, message, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
    `).all(userId);

    return { myProblems, proposalsReceived, recentNotifications, currentUser: user };
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

    const myProposals = db.prepare(`
      SELECT pr.id, pr.summary, pr.status, p.title as problem_title
      FROM proposals pr
      JOIN problems p ON pr.problem_id = p.id
      WHERE pr.university_id = ?
    `).all(univId);

    return { acceptedProblems, availableProblems, myProposals, currentUser: user };
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
    const { role, name: userName } = req.user;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query string is required.' });
    }

    const contextData = getRoleContextData(req.user);
    const result = await handleRoleAwareChat(query, role, contextData, userName);

    res.json(result);
  } catch (error) {
    console.error('Role aware chat error:', error.message);
    
    if (error.message.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing on server.' });
    }
    if (error.message.includes('404')) {
      return res.status(404).json({ error: 'Gemini model unavailable or deprecated.' });
    }
    if (error.message.includes('401') || error.message.includes('403')) {
      return res.status(401).json({ error: 'Gemini API key unauthorized.' });
    }
    if (error.message.includes('429')) {
      return res.status(429).json({ error: 'Gemini API rate limit reached. Please retry.' });
    }

    res.status(500).json({ error: 'AI Assistant is temporarily unavailable. Please try again.', details: error.message });
  }
});

/**
 * POST /api/ai/assistant - Disaster Command Center Decision Assistant
 */
router.post('/assistant', authenticateToken, async (req, res) => {
  try {
    const query = req.body.query || req.body.message;
    const disaster_id = req.body.disaster_id;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query prompt is required.' });
    }

    const platformContext = getRoleContextData(req.user, disaster_id);
    const aiResult = await disasterAssistantQuery(query, req.user.role, platformContext, req.user.name);

    res.json(aiResult);
  } catch (error) {
    console.error('AI assistant error:', error.message);
    res.status(500).json({ error: 'AI Assistant is temporarily unavailable. Please try again.', details: error.message });
  }
});

/**
 * POST /api/ai/team-skill-gap - AI Team Skill Gap Analysis
 */
router.post('/team-skill-gap', authenticateToken, async (req, res) => {
  try {
    const { problem_id, team_members } = req.body;
    
    let problemRequirements = {};
    if (problem_id) {
      const problem = db.prepare('SELECT title, description, category FROM problems WHERE id = ?').get(problem_id);
      const analysis = db.prepare('SELECT required_skills_json, required_departments_json FROM problem_analysis WHERE problem_id = ?').get(problem_id);
      problemRequirements = { problem, analysis };
    }

    const gapAnalysis = await analyzeTeamSkillGap(team_members || [], problemRequirements);

    res.json({
      is_ai_analysis: true,
      analysis: gapAnalysis
    });
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

    res.json({
      is_ai_analysis: true,
      comparison
    });
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
    const totalProjects = db.prepare('SELECT count(*) as count FROM projects').get();
    const totalDisasters = db.prepare('SELECT count(*) as count FROM disasters').get();
    const totalUniversities = db.prepare('SELECT count(*) as count FROM universities').get();

    const impactData = { totalProjects, totalDisasters, totalUniversities };

    const impactAnalysis = await analyzeImpactMetrics(impactData);

    res.json({
      is_ai_analysis: true,
      analysis: impactAnalysis
    });
  } catch (error) {
    console.error('AI impact analysis error:', error.message);
    res.status(500).json({ error: 'AI Impact Analysis failed.', details: error.message });
  }
});

module.exports = router;
