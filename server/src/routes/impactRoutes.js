const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/impact - Global platform & project impact metrics
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const metrics = db.prepare(`
      SELECT im.*, p.title as project_title, u.name as university_name
      FROM impact_metrics im
      JOIN projects p ON im.project_id = p.id
      JOIN universities u ON p.university_id = u.id
      ORDER BY im.recorded_at DESC
    `).all();

    const stats = {
      challengesPosted: db.prepare('SELECT count(*) as count FROM problems').get().count,
      universityTeams: db.prepare('SELECT count(*) as count FROM universities').get().count,
      solutionsDelivered: db.prepare('SELECT count(*) as count FROM projects WHERE status IN ("DEPLOYMENT", "COMPLETED")').get().count,
      peopleImpacted: '50,000+'
    };

    res.json({ metrics, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch impact metrics.' });
  }
});

module.exports = router;
