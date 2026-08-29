const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { disasterAssistantQuery, handleRoleAwareChat } = require('../services/aiService');

/**
 * POST /api/ai/chat - Persistent Role-Aware Conversational AI Assistant
 * Strict IDOR Data Access Enforcement: Queries SQLite strictly for records owned/authorized for req.user
 */
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const query = req.body.query || req.body.message;
    const { role, id: userId, name: userName, university_id } = req.user;

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query string is required.' });
    }

    let contextData = {};

    // Filter database access strictly by role & ID
    if (role === 'PROBLEM_OWNER') {
      const myProblems = db.prepare(`
        SELECT p.id, p.title, p.category, p.status, p.created_at,
               (SELECT count(*) FROM university_problem_acceptances upa WHERE upa.problem_id = p.id AND upa.status = 'ACCEPTED') as accepted_count,
               (SELECT count(*) FROM university_problem_acceptances upa WHERE upa.problem_id = p.id) as total_responses,
               (SELECT count(*) FROM proposals pr WHERE pr.problem_id = p.id) as proposal_count
        FROM problems p
        WHERE p.owner_id = ?
      `).all(userId);

      const recentNotifications = db.prepare(`
        SELECT title, message, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
      `).all(userId);

      contextData = { myProblems, recentNotifications };
    } else if (role === 'UNIVERSITY_ADMIN' || role === 'FACULTY') {
      const univId = university_id || 1;
      const acceptedProblems = db.prepare(`
        SELECT p.id, p.title, p.category, upa.accepted_at, upa.status
        FROM university_problem_acceptances upa
        JOIN problems p ON upa.problem_id = p.id
        WHERE upa.university_id = ? AND upa.status = 'ACCEPTED'
      `).all(univId);

      const availableProblems = db.prepare(`
        SELECT p.id, p.title, p.category, p.urgency, p.location
        FROM problems p
        WHERE p.status = 'PUBLISHED'
      `).all();

      contextData = { acceptedProblems, availableProblems };
    } else if (role === 'STUDENT') {
      const mySubmissions = db.prepare(`
        SELECT s.title, s.status, s.created_at, p.title as problem_title, p.category
        FROM student_solution_submissions s
        JOIN problems p ON s.problem_id = p.id
        WHERE s.student_id = ?
      `).all(userId);

      contextData = { mySubmissions };
    } else if (role === 'GOVERNMENT') {
      const activeDisaster = db.prepare('SELECT * FROM disasters WHERE status = "RESPONSE_ACTIVE" LIMIT 1').get();
      const hospitals = db.prepare('SELECT name, available_beds, status FROM hospitals').all();
      const universities = db.prepare('SELECT name, location, nss_capacity, ncc_capacity FROM universities').all();

      contextData = { activeDisaster, hospitals, universities };
    }

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
      return res.status(429).json({ error: 'Gemini rate limit exceeded.' });
    }

    res.status(500).json({ error: 'AI Assistant query failed.', details: error.message });
  }
});

/**
 * POST /api/ai/assistant - Disaster Command Center Decision Assistant
 */
router.post('/assistant', authenticateToken, async (req, res) => {
  try {
    const query = req.body.query || req.body.message;
    const disaster_id = req.body.disaster_id;

    if (!query) {
      return res.status(400).json({ error: 'Query prompt is required.' });
    }

    let disaster = null;
    let relocationSites = [];
    let requirements = [];
    
    if (disaster_id) {
      disaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(disaster_id);
      relocationSites = db.prepare('SELECT * FROM relocation_sites WHERE disaster_id = ?').all(disaster_id);
      requirements = db.prepare('SELECT * FROM disaster_requirements WHERE disaster_id = ?').all(disaster_id);
    } else {
      disaster = db.prepare('SELECT * FROM disasters WHERE status = "RESPONSE_ACTIVE" ORDER BY id DESC').get();
      if (disaster) {
        relocationSites = db.prepare('SELECT * FROM relocation_sites WHERE disaster_id = ?').all(disaster.id);
        requirements = db.prepare('SELECT * FROM disaster_requirements WHERE disaster_id = ?').all(disaster.id);
      }
    }

    const hospitals = db.prepare('SELECT * FROM hospitals').all();
    const universities = db.prepare('SELECT id, name, location, nss_capacity, ncc_capacity FROM universities').all();

    const platformContext = {
      disaster,
      relocationSites,
      requirements,
      hospitals,
      universities
    };

    const aiResult = await disasterAssistantQuery(query, platformContext);

    res.json(aiResult);
  } catch (error) {
    console.error('AI assistant error:', error.message);
    res.status(500).json({ error: 'AI Assistant query failed.', details: error.message });
  }
});

module.exports = router;
