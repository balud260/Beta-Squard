const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/projects - List active projects
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT proj.*, p.title as problem_title, u.name as university_name
      FROM projects proj
      JOIN problems p ON proj.problem_id = p.id
      JOIN universities u ON proj.university_id = u.id
      ORDER BY proj.created_at DESC
    `).all();

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

/**
 * GET /api/projects/:id - Project details with updates & impact metrics
 */
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const projectId = req.params.id;
    const project = db.prepare(`
      SELECT proj.*, p.title as problem_title, p.description as problem_description,
             u.name as university_name
      FROM projects proj
      JOIN problems p ON proj.problem_id = p.id
      JOIN universities u ON proj.university_id = u.id
      WHERE proj.id = ?
    `).get(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const updates = db.prepare('SELECT * FROM project_updates WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
    const impact = db.prepare('SELECT * FROM impact_metrics WHERE project_id = ?').all(projectId);

    res.json({
      project,
      updates,
      impact
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project details.' });
  }
});

/**
 * POST /api/projects/:id/updates - Post a project progress update or prototype version
 */
router.post('/:id/updates', authenticateToken, (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, content, version, progress_pct, feedback } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO project_updates (project_id, title, content, version, feedback, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(projectId, title, content, version || 'v1.0', feedback || '', req.user.id);

    if (progress_pct !== undefined) {
      db.prepare('UPDATE projects SET progress_pct = ? WHERE id = ?').run(progress_pct, projectId);
    }

    res.json({ message: 'Project update recorded.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record project update.' });
  }
});

/**
 * POST /api/projects/:id/deploy - Transition project to DEPLOYED & create impact baseline
 */
router.post('/:id/deploy', authenticateToken, (req, res) => {
  try {
    const projectId = req.params.id;

    db.prepare('UPDATE projects SET status = "DEPLOYMENT", progress_pct = 100 WHERE id = ?').run(projectId);

    const project = db.prepare('SELECT problem_id FROM projects WHERE id = ?').get(projectId);
    if (project) {
      db.prepare('UPDATE problems SET status = "DEPLOYED" WHERE id = ?').run(project.problem_id);
    }

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'PROJECT_DEPLOYED', 'PROJECT', projectId, `Project #${projectId} officially deployed!`);

    res.json({ message: 'Project successfully deployed! Impact metrics active.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deploy project.' });
  }
});

module.exports = router;
