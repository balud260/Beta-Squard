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

/**
 * GET /api/students/emergency-alerts - Fetch active campus disaster alerts for student's university
 */
router.get('/emergency-alerts', authenticateToken, authorizeRoles('STUDENT'), (req, res) => {
  try {
    const student = db.prepare('SELECT id, university_id FROM students WHERE user_id = ?').get(req.user.id);
    if (!student || !student.university_id) {
      return res.json({ alerts: [] });
    }

    // Query active disasters affecting student's university
    const risks = db.prepare(`
      SELECT udr.*, d.title as disaster_title, d.type as disaster_type, d.severity as disaster_severity,
             d.location as disaster_location, d.hazard_info, d.hazard_info as disaster_description,
             d.affected_radius_km, d.lat as disaster_lat, d.lng as disaster_lng,
             u.name as university_name
      FROM university_disaster_risks udr
      JOIN disasters d ON udr.disaster_id = d.id
      JOIN universities u ON udr.university_id = u.id
      WHERE udr.university_id = ? AND d.status = 'RESPONSE_ACTIVE'
      ORDER BY d.created_at DESC
    `).all(student.university_id);

    const alerts = risks.map((r) => {
      let requiredAction = 'Monitor local news updates & maintain awareness.';
      if (r.risk_level === 'HIGH') {
        requiredAction = 'CRITICAL INSTRUCTION: Your university emergency response is ACTIVE. Follow campus safety instructions & remain available for NSS/NCC volunteer deployment.';
      } else if (r.risk_level === 'MEDIUM') {
        requiredAction = 'PREPARATION INSTRUCTION: Review emergency updates, check campus safety status & stay on standby.';
      }

      // Check if student has responded
      const existingResp = db.prepare(`
        SELECT * FROM volunteer_responses vr
        JOIN disaster_requirements dr ON vr.requirement_id = dr.id
        WHERE dr.disaster_id = ? AND vr.student_id = ?
      `).get(r.disaster_id, student.id);

      return {
        disaster_id: r.disaster_id,
        disaster_title: r.disaster_title,
        disaster_type: r.disaster_type,
        disaster_severity: r.disaster_severity,
        disaster_location: r.disaster_location,
        hazard_info: r.hazard_info || r.disaster_description,
        university_name: r.university_name,
        university_risk_level: r.risk_level,
        distance_km: r.distance_km,
        risk_reason: r.risk_reason,
        university_acknowledged: r.acknowledged === 1,
        university_response_status: r.response_status || 'READY',
        required_student_action: requiredAction,
        student_responded: Boolean(existingResp),
        student_response_status: existingResp?.status || null
      };
    });

    res.json({ alerts });
  } catch (error) {
    console.error('Fetch student emergency alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch student emergency alerts.' });
  }
});

/**
 * POST /api/students/emergency-alerts/:disasterId/respond - Student responds to active campus disaster alert
 */
router.post('/emergency-alerts/:disasterId/respond', authenticateToken, authorizeRoles('STUDENT'), (req, res) => {
  try {
    const disasterId = req.params.disasterId;
    const { status, notes } = req.body;

    const student = db.prepare('SELECT id, university_id FROM students WHERE user_id = ?').get(req.user.id);
    if (!student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    // Find first requirement for this disaster or create standard response requirement
    let reqRow = db.prepare('SELECT id, role_type FROM disaster_requirements WHERE disaster_id = ? ORDER BY id ASC LIMIT 1').get(disasterId);
    if (!reqRow) {
      const insReq = db.prepare(`
        INSERT INTO disaster_requirements (disaster_id, role_type, required_count, fulfilled_count, urgency)
        VALUES (?, 'Student Campus Responder', 50, 0, 'HIGH')
      `).run(disasterId);
      reqRow = { id: insReq.lastInsertRowid, role_type: 'Student Campus Responder' };
    }

    // Upsert volunteer response
    const existing = db.prepare('SELECT id FROM volunteer_responses WHERE requirement_id = ? AND student_id = ?').get(reqRow.id, student.id);
    const respStatus = status || 'CONFIRMED';

    if (existing) {
      db.prepare('UPDATE volunteer_responses SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?').run(respStatus, existing.id);
    } else {
      db.prepare(`
        INSERT INTO volunteer_responses (requirement_id, student_id, role_type, status)
        VALUES (?, ?, ?, ?)
      `).run(reqRow.id, student.id, reqRow.role_type, respStatus);

      // Increment requirement fulfilled count
      db.prepare('UPDATE disaster_requirements SET fulfilled_count = fulfilled_count + 1 WHERE id = ?').run(reqRow.id);
    }

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'STUDENT_DISASTER_RESPONSE', 'DISASTER', disasterId, `Student #${student.id} registered availability: ${respStatus}`);

    res.json({
      message: 'Your emergency response availability has been registered and reported to your University Command Desk!',
      disasterId,
      status: respStatus
    });
  } catch (error) {
    console.error('Student disaster response error:', error);
    res.status(500).json({ error: 'Failed to register emergency response availability.' });
  }
});

module.exports = router;
