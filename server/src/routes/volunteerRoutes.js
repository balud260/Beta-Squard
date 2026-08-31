const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/volunteers/requirements - List active emergency requirements
 */
router.get('/requirements', authenticateToken, (req, res) => {
  try {
    const requirements = db.prepare(`
      SELECT dr.*, d.title as disaster_title, d.location as disaster_location, d.severity
      FROM disaster_requirements dr
      JOIN disasters d ON dr.disaster_id = d.id
      WHERE d.status = 'RESPONSE_ACTIVE'
      ORDER BY dr.urgency DESC
    `).all();

    res.json({ requirements });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch disaster volunteer requirements.' });
  }
});

/**
 * POST /api/volunteers/respond - Student accepts or declines an emergency mission
 */
router.post('/respond', authenticateToken, (req, res) => {
  try {
    const { requirement_id, status } = req.body; // status: 'CONFIRMED' or 'DECLINED'
    const userId = req.user.id;

    // Get student record
    let student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(userId);

    // Auto-create student profile if missing for current user (demo fallback)
    if (!student) {
      const result = db.prepare(`
        INSERT INTO students (user_id, university_id, skills_json, nss_member, ncc_member, availability_status)
        VALUES (?, 1, '["Medical Support", "First Aid", "Relief Operations"]', 1, 1, 'AVAILABLE')
      `).run(userId);
      student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
    }

    const requirement = db.prepare('SELECT * FROM disaster_requirements WHERE id = ?').get(requirement_id);
    if (!requirement) {
      return res.status(404).json({ error: 'Disaster requirement not found.' });
    }

    // Check if already responded
    const existing = db.prepare('SELECT * FROM volunteer_responses WHERE requirement_id = ? AND student_id = ?').get(requirement_id, student.id);

    if (existing && existing.status === 'CONFIRMED' && (status === 'CONFIRMED' || !status)) {
      const updatedDisaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(requirement.disaster_id);
      return res.json({
        duplicate: true,
        message: "You're already registered for this mission.",
        requirement,
        disaster: updatedDisaster
      });
    }

    if (existing) {
      db.prepare('UPDATE volunteer_responses SET status = ? WHERE id = ?').run(status || 'CONFIRMED', existing.id);
    } else {
      db.prepare(`
        INSERT INTO volunteer_responses (requirement_id, student_id, role_type, status)
        VALUES (?, ?, ?, ?)
      `).run(requirement_id, student.id, requirement.role_type, status || 'CONFIRMED');

      if (status !== 'DECLINED') {
        db.prepare('UPDATE disaster_requirements SET fulfilled_count = fulfilled_count + 1 WHERE id = ?').run(requirement_id);
        db.prepare('UPDATE students SET availability_status = "DEPLOYED" WHERE id = ?').run(student.id);
      }
    }

    // Fetch updated requirement state
    const updatedRequirement = db.prepare('SELECT * FROM disaster_requirements WHERE id = ?').get(requirement_id);
    const updatedDisaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(requirement.disaster_id);

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(userId, 'VOLUNTEER_RESPONDED', 'VOLUNTEER_REQUIREMENT', requirement_id, `Student '${req.user.name}' responded ${status || 'CONFIRMED'} for role '${requirement.role_type}'`);

    res.json({
      message: status === 'DECLINED' ? "Mission declined." : "You're confirmed for this emergency mission.",
      requirement: updatedRequirement,
      disaster: updatedDisaster
    });

  } catch (error) {
    console.error('Volunteer response error:', error);
    res.status(500).json({ error: 'Failed to record volunteer response.' });
  }
});

module.exports = router;
