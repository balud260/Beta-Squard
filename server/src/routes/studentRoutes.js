const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * POST /api/students/solutions - Student submits a solution idea for a problem available to their university
 */
router.post('/solutions', authenticateToken, authorizeRoles('STUDENT'), (req, res) => {
  try {
    const { problem_id, title, description, technology, approach, expected_impact, estimated_timeline } = req.body;

    if (!problem_id || !title || !description) {
      return res.status(400).json({ error: 'Problem ID, title, and description are required.' });
    }

    // Get student record for authenticated user
    const student = db.prepare('SELECT id, university_id FROM students WHERE user_id = ?').get(req.user.id);
    if (!student) {
      return res.status(404).json({ error: 'Student record not found for authenticated user.' });
    }

    const stmt = db.prepare(`
      INSERT INTO student_solution_submissions (problem_id, student_id, university_id, title, description, technology, approach, expected_impact, estimated_timeline, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
    `);

    const result = stmt.run(
      problem_id,
      student.id,
      student.university_id,
      title,
      description,
      technology || 'React, Node.js',
      approach || '',
      expected_impact || 'Positive societal impact',
      estimated_timeline || '3 Months'
    );

    res.status(201).json({
      message: 'Solution idea submitted to your university innovation desk!',
      submissionId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Submit student solution error:', error);
    res.status(500).json({ error: 'Failed to submit solution idea.' });
  }
});

/**
 * GET /api/students/solutions - Get authenticated student's submitted solution ideas
 */
router.get('/solutions', authenticateToken, authorizeRoles('STUDENT'), (req, res) => {
  try {
    const student = db.prepare('SELECT id FROM students WHERE user_id = ?').get(req.user.id);
    if (!student) {
      return res.json({ solutions: [] });
    }

    const solutions = db.prepare(`
      SELECT sss.*, p.title as problem_title, p.category as problem_category
      FROM student_solution_submissions sss
      JOIN problems p ON sss.problem_id = p.id
      WHERE sss.student_id = ?
      ORDER BY sss.created_at DESC
    `).all(student.id);

    res.json({ solutions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student solutions.' });
  }
});

/**
 * GET /api/students/contributions - University Admin/Faculty reviews student solution ideas
 */
router.get('/contributions', authenticateToken, authorizeRoles('UNIVERSITY_ADMIN', 'FACULTY'), (req, res) => {
  try {
    const univId = req.user.university_id || 1;
    const contributions = db.prepare(`
      SELECT sss.*, p.title as problem_title, u.name as student_name, d.name as department_name
      FROM student_solution_submissions sss
      JOIN problems p ON sss.problem_id = p.id
      JOIN students s ON sss.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE sss.university_id = ?
      ORDER BY sss.created_at DESC
    `).all(univId);

    res.json({ contributions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch university student contributions.' });
  }
});

/**
 * GET /api/students/profile - Get student's verified profile & contribution stats
 */
router.get('/profile', authenticateToken, authorizeRoles('STUDENT'), (req, res) => {
  try {
    const student = db.prepare(`
      SELECT s.*, u.name as student_name, u.email, univ.name as university_name, d.name as department_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN universities univ ON s.university_id = univ.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE s.user_id = ?
    `).get(req.user.id);

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    try {
      student.skills = JSON.parse(student.skills_json || '[]');
    } catch (e) {
      student.skills = [];
    }

    // Get mission history
    const missions = db.prepare(`
      SELECT vr.*, dr.role_type, d.title as disaster_title, d.location
      FROM volunteer_responses vr
      JOIN disaster_requirements dr ON vr.requirement_id = dr.id
      JOIN disasters d ON dr.disaster_id = d.id
      WHERE vr.student_id = ?
    `).all(student.id);

    res.json({
      student,
      missions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student profile.' });
  }
});

module.exports = router;
