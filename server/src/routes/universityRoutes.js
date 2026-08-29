const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/universities - List universities with capabilities
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const universities = db.prepare('SELECT * FROM universities ORDER BY name ASC').all();
    
    // Attach departments & counts
    const enriched = universities.map(u => {
      const depts = db.prepare('SELECT * FROM departments WHERE university_id = ?').all(u.id);
      return {
        ...u,
        departments: depts
      };
    });

    res.json({ universities: enriched });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch universities.' });
  }
});

/**
 * GET /api/universities/:id - Detailed university capability profile
 */
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const univId = req.params.id;
    const university = db.prepare('SELECT * FROM universities WHERE id = ?').get(univId);

    if (!university) {
      return res.status(404).json({ error: 'University not found.' });
    }

    const departments = db.prepare('SELECT * FROM departments WHERE university_id = ?').all(univId);
    const activeProjects = db.prepare(`
      SELECT proj.*, p.title as problem_title
      FROM projects proj
      JOIN problems p ON proj.problem_id = p.id
      WHERE proj.university_id = ?
    `).all(univId);

    res.json({
      university,
      departments,
      activeProjects
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch university details.' });
  }
});

module.exports = router;
