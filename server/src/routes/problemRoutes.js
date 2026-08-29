const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { analyzeProblem, matchUniversities } = require('../services/aiService');

/**
 * GET /api/problems - List problems based on role & privacy rules
 * CLIENT (PROBLEM_OWNER): Returns ONLY problems owned by authenticated user.
 * UNIVERSITY: Returns public multi-client discovery catalog.
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const { role, id: userId, university_id } = req.user;
    let problems = [];

    if (role === 'PROBLEM_OWNER') {
      // STRICT IDOR ISOLATION: Problem owner sees ONLY own problems
      problems = db.prepare(`
        SELECT p.*, o.name as organization_name, pa.category as ai_category, pa.difficulty as ai_difficulty,
               (SELECT count(*) FROM university_problem_acceptances upa WHERE upa.problem_id = p.id AND upa.status = 'ACCEPTED') as accepted_count,
               (SELECT count(*) FROM university_problem_acceptances upa WHERE upa.problem_id = p.id AND upa.status = 'REJECTED') as rejected_count,
               (SELECT count(*) FROM university_problem_acceptances upa WHERE upa.problem_id = p.id) as total_responses,
               (SELECT count(*) FROM proposals pr WHERE pr.problem_id = p.id) as proposal_count
        FROM problems p
        LEFT JOIN organizations o ON p.owner_id = o.id
        LEFT JOIN problem_analysis pa ON p.id = pa.problem_id
        WHERE p.owner_id = ?
        ORDER BY p.created_at DESC
      `).all(userId);
    } else if (role === 'UNIVERSITY_ADMIN' || role === 'FACULTY' || role === 'STUDENT') {
      // Universities see public multi-client catalog
      problems = db.prepare(`
        SELECT p.*, u_owner.name as client_name, o.name as organization_name, pa.category as ai_category, pa.difficulty as ai_difficulty,
               (SELECT count(*) FROM proposals pr WHERE pr.problem_id = p.id) as proposal_count,
               (SELECT upa.status FROM university_problem_acceptances upa WHERE upa.problem_id = p.id AND upa.university_id = ?) as user_acceptance_status
        FROM problems p
        LEFT JOIN users u_owner ON p.owner_id = u_owner.id
        LEFT JOIN organizations o ON u_owner.organization_id = o.id
        LEFT JOIN problem_analysis pa ON p.id = pa.problem_id
        WHERE p.status IN ('PUBLISHED', 'PROPOSALS_RECEIVED', 'SOLUTION_SELECTED', 'DEVELOPMENT', 'DEPLOYED')
        ORDER BY p.created_at DESC
      `).all(university_id || 1);
    } else {
      // Government / Admin view
      problems = db.prepare(`
        SELECT p.*, u_owner.name as client_name, o.name as organization_name, pa.category as ai_category, pa.difficulty as ai_difficulty,
               (SELECT count(*) FROM proposals pr WHERE pr.problem_id = p.id) as proposal_count
        FROM problems p
        LEFT JOIN users u_owner ON p.owner_id = u_owner.id
        LEFT JOIN organizations o ON u_owner.organization_id = o.id
        LEFT JOIN problem_analysis pa ON p.id = pa.problem_id
        ORDER BY p.created_at DESC
      `).all();
    }

    res.json({ problems });
  } catch (error) {
    console.error('Fetch problems error:', error);
    res.status(500).json({ error: 'Failed to retrieve problems.' });
  }
});

/**
 * GET /api/problems/public - Multi-client public catalog for universities
 */
router.get('/public', authenticateToken, (req, res) => {
  try {
    const universityId = req.user.university_id || 1;
    const problems = db.prepare(`
      SELECT p.*, u_owner.name as client_name, o.name as organization_name, o.type as organization_type,
             pa.category as ai_category, pa.difficulty as ai_difficulty, pa.social_impact as ai_impact,
             pa.required_skills_json, pa.required_departments_json,
             (SELECT count(*) FROM proposals pr WHERE pr.problem_id = p.id) as proposal_count,
             (SELECT upa.status FROM university_problem_acceptances upa WHERE upa.problem_id = p.id AND upa.university_id = ?) as user_acceptance_status
      FROM problems p
      LEFT JOIN users u_owner ON p.owner_id = u_owner.id
      LEFT JOIN organizations o ON u_owner.organization_id = o.id
      LEFT JOIN problem_analysis pa ON p.id = pa.problem_id
      WHERE p.status IN ('PUBLISHED', 'PROPOSALS_RECEIVED', 'SOLUTION_SELECTED', 'DEVELOPMENT', 'DEPLOYED')
      ORDER BY p.created_at DESC
    `).all(universityId);

    const formatted = problems.map(p => {
      let skills = [];
      let depts = [];
      try { skills = JSON.parse(p.required_skills_json || '[]'); } catch (e) {}
      try { depts = JSON.parse(p.required_departments_json || '[]'); } catch (e) {}
      return {
        ...p,
        required_skills: skills,
        required_departments: depts
      };
    });

    res.json({ problems: formatted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch public challenge catalog.' });
  }
});

/**
 * GET /api/problems/accepted - Challenges accepted by current university
 */
router.get('/accepted', authenticateToken, (req, res) => {
  try {
    const univId = req.user.university_id || 1;
    const accepted = db.prepare(`
      SELECT p.*, upa.status as acceptance_status, upa.accepted_at, upa.rejection_reason,
             u_owner.name as client_name, o.name as organization_name,
             (SELECT count(*) FROM proposals pr WHERE pr.problem_id = p.id AND pr.university_id = ?) as proposal_submitted
      FROM university_problem_acceptances upa
      JOIN problems p ON upa.problem_id = p.id
      LEFT JOIN users u_owner ON p.owner_id = u_owner.id
      LEFT JOIN organizations o ON u_owner.organization_id = o.id
      WHERE upa.university_id = ? AND upa.status = 'ACCEPTED'
      ORDER BY upa.accepted_at DESC
    `).all(univId, univId);

    console.log(`[DEBUG /api/problems/accepted] univId: ${univId}, user: ${req.user.name}, returned: ${accepted.length}`);
    res.json({ accepted });
  } catch (error) {
    console.error('Fetch accepted problems error:', error);
    res.status(500).json({ error: 'Failed to fetch accepted challenges.' });
  }
});

/**
 * POST /api/problems - Submit a new societal problem (Client / Problem Owner)
 * Form Validation & Automated AI Analysis + Immediate Publication Pipeline
 */
router.post('/', authenticateToken, authorizeRoles('PROBLEM_OWNER', 'GOVERNMENT'), async (req, res) => {
  try {
    const { title, description, category, subcategory, location, urgency, expected_outcome, target_users, required_skills, additional_requirements } = req.body;

    // Strict Field Validation
    if (!title || title.trim().length < 5) {
      return res.status(400).json({ error: 'Title is required (minimum 5 characters).' });
    }
    if (!description || description.trim().length < 15) {
      return res.status(400).json({ error: 'Detailed description is required (minimum 15 characters).' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Category selection is required.' });
    }
    if (!location) {
      return res.status(400).json({ error: 'Location specification is required.' });
    }

    // 1. Insert Problem Record into SQLite (owner_id derived strictly from req.user.id)
    const stmt = db.prepare(`
      INSERT INTO problems (title, description, category, subcategory, location, lat, lng, urgency, budget, timeline, target_users, owner_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
    `);

    const result = stmt.run(
      title.trim(),
      description.trim(),
      category,
      subcategory || 'General',
      location.trim(),
      28.6139,
      77.2090,
      urgency || 'MEDIUM',
      0,
      '3 Months',
      target_users || 'General Public',
      req.user.id
    );

    const problemId = result.lastInsertRowid;
    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId);

    // 2. Automated Gemini AI Analysis
    const aiResult = await analyzeProblem(problem);

    // Store AI Analysis in SQLite
    db.prepare(`
      INSERT INTO problem_analysis (
        problem_id, category, subcategory, required_skills_json, required_technologies_json,
        required_departments_json, difficulty, urgency, social_impact, estimated_resources, solution_areas_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      problemId,
      aiResult.category || category,
      aiResult.subcategory || subcategory || 'General',
      JSON.stringify(aiResult.requiredSkills || (required_skills ? required_skills.split(',') : ['Data Analysis', 'AI'])),
      JSON.stringify(aiResult.requiredTechnologies || ['Web App', 'IoT']),
      JSON.stringify(aiResult.requiredDepartments || ['CSE', 'ECE']),
      aiResult.difficulty || 'Intermediate',
      aiResult.urgency || urgency || 'MEDIUM',
      aiResult.socialImpact || 'High Impact',
      aiResult.estimatedResources || 'Academic Team (4-6 members)',
      JSON.stringify(aiResult.possibleSolutionAreas || ['Mobile App', 'Dashboard'])
    );

    // 3. Update Problem Status to PUBLISHED so it appears immediately in University Portal
    db.prepare('UPDATE problems SET status = "PUBLISHED" WHERE id = ?').run(problemId);

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'PROBLEM_CREATED', 'PROBLEM', problemId, `Problem '${title}' created & auto-published by User #${req.user.id}`);

    res.status(201).json({
      message: 'Challenge submitted successfully and published to University Portal.',
      problemId,
      status: 'PUBLISHED',
      analysis: aiResult
    });
  } catch (error) {
    console.error('Submit problem error:', error);
    res.status(500).json({ error: 'Failed to submit challenge.' });
  }
});

/**
 * POST /api/problems/:id/accept - University accepts a challenge
 */
router.post('/:id/accept', authenticateToken, authorizeRoles('UNIVERSITY_ADMIN', 'FACULTY'), (req, res) => {
  try {
    const problemId = req.params.id;
    const univId = req.user.university_id || 1;

    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    // Check if already accepted
    const existing = db.prepare('SELECT * FROM university_problem_acceptances WHERE university_id = ? AND problem_id = ?').get(univId, problemId);

    if (existing && existing.status === 'ACCEPTED') {
      return res.status(400).json({ error: 'You have already accepted this challenge.' });
    }

    if (existing) {
      db.prepare('UPDATE university_problem_acceptances SET status = "ACCEPTED", accepted_at = CURRENT_TIMESTAMP WHERE id = ?').run(existing.id);
    } else {
      db.prepare(`
        INSERT INTO university_problem_acceptances (university_id, problem_id, status)
        VALUES (?, ?, 'ACCEPTED')
      `).run(univId, problemId);
    }

    // Generate Notification for Problem Owner
    const university = db.prepare('SELECT name FROM universities WHERE id = ?').get(univId);
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, metadata_json)
      VALUES (?, '🎓 University Accepted Your Challenge', ?, 'ACCEPTANCE', ?)
    `).run(
      problem.owner_id,
      `${university?.name || 'A university'} has accepted your challenge: '${problem.title}'.`,
      JSON.stringify({ problem_id: problemId, university_id: univId, status: 'ACCEPTED' })
    );

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'PROBLEM_ACCEPTED', 'PROBLEM', problemId, `University accepted problem '${problem.title}'`);

    res.json({ message: `Challenge '${problem.title}' accepted! University workspace updated.` });
  } catch (error) {
    console.error('Accept problem error:', error);
    res.status(500).json({ error: 'Failed to accept challenge.' });
  }
});

/**
 * POST /api/problems/:id/reject - University rejects a challenge (with optional reason)
 */
router.post('/:id/reject', authenticateToken, authorizeRoles('UNIVERSITY_ADMIN', 'FACULTY'), (req, res) => {
  try {
    const problemId = req.params.id;
    const univId = req.user.university_id || 1;
    const { rejection_reason } = req.body;

    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    const existing = db.prepare('SELECT * FROM university_problem_acceptances WHERE university_id = ? AND problem_id = ?').get(univId, problemId);

    if (existing) {
      db.prepare('UPDATE university_problem_acceptances SET status = "REJECTED", rejection_reason = ? WHERE id = ?')
        .run(rejection_reason || 'Outside current department scope', existing.id);
    } else {
      db.prepare(`
        INSERT INTO university_problem_acceptances (university_id, problem_id, status, rejection_reason)
        VALUES (?, ?, 'REJECTED', ?)
      `).run(univId, problemId, rejection_reason || 'Outside current department scope');
    }

    // Generate Notification for Problem Owner
    const university = db.prepare('SELECT name FROM universities WHERE id = ?').get(univId);
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, metadata_json)
      VALUES (?, 'University Rejected Your Challenge', ?, 'REJECTION', ?)
    `).run(
      problem.owner_id,
      `${university?.name || 'A university'} declined your challenge: '${problem.title}'. Reason: ${rejection_reason || 'Not specified'}.`,
      JSON.stringify({ problem_id: problemId, university_id: univId, status: 'REJECTED', rejection_reason })
    );

    res.json({ message: `Challenge '${problem.title}' declined.` });
  } catch (error) {
    console.error('Reject problem error:', error);
    res.status(500).json({ error: 'Failed to reject challenge.' });
  }
});

/**
 * GET /api/problems/:id/responses - Get all university responses for a problem
 */
router.get('/:id/responses', authenticateToken, (req, res) => {
  try {
    const problemId = req.params.id;
    const responses = db.prepare(`
      SELECT upa.*, u.name as university_name, u.location, u.research_focus
      FROM university_problem_acceptances upa
      JOIN universities u ON upa.university_id = u.id
      WHERE upa.problem_id = ?
      ORDER BY upa.accepted_at DESC
    `).all(problemId);

    res.json({ responses });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch university responses.' });
  }
});

/**
 * GET /api/problems/:id - Problem Details & AI Analysis (Strict IDOR Check)
 */
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const problemId = req.params.id;
    const problem = db.prepare(`
      SELECT p.*, u_owner.name as client_name, o.name as organization_name
      FROM problems p
      LEFT JOIN users u_owner ON p.owner_id = u_owner.id
      LEFT JOIN organizations o ON u_owner.organization_id = o.id
      WHERE p.id = ?
    `).get(problemId);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    if (req.user.role === 'PROBLEM_OWNER' && problem.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Access forbidden. You do not own this private client problem.' });
    }

    const analysis = db.prepare('SELECT * FROM problem_analysis WHERE problem_id = ?').get(problemId);
    
    if (analysis) {
      try {
        analysis.required_skills = JSON.parse(analysis.required_skills_json || '[]');
        analysis.required_technologies = JSON.parse(analysis.required_technologies_json || '[]');
        analysis.required_departments = JSON.parse(analysis.required_departments_json || '[]');
        analysis.solution_areas = JSON.parse(analysis.solution_areas_json || '[]');
      } catch (e) {}
    }

    const responses = db.prepare(`
      SELECT upa.*, u.name as university_name
      FROM university_problem_acceptances upa
      JOIN universities u ON upa.university_id = u.id
      WHERE upa.problem_id = ?
    `).all(problemId);

    res.json({
      problem,
      analysis,
      responses
    });
  } catch (error) {
    console.error('Fetch problem detail error:', error);
    res.status(500).json({ error: 'Failed to fetch problem details.' });
  }
});

module.exports = router;
