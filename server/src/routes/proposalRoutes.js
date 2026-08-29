const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/**
 * GET /api/proposals/compare/:problemId - Side-by-side proposal comparison (Strict IDOR Protected)
 */
router.get('/compare/:problemId', authenticateToken, (req, res) => {
  try {
    const { problemId } = req.params;
    const problem = db.prepare('SELECT owner_id FROM problems WHERE id = ?').get(problemId);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    // STRICT IDOR ENFORCEMENT
    if (req.user.role === 'PROBLEM_OWNER' && problem.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Access forbidden. You do not own this client problem.' });
    }

    const proposals = db.prepare(`
      SELECT pr.*, u.name as university_name, u.location as university_location, u.equipment_summary,
             (SELECT match_score FROM problem_matches pm WHERE pm.problem_id = pr.problem_id AND pm.university_id = pr.university_id) as match_score
      FROM proposals pr
      JOIN universities u ON pr.university_id = u.id
      WHERE pr.problem_id = ?
      ORDER BY pr.feasibility_score DESC
    `).all(problemId);

    res.json({ proposals });
  } catch (error) {
    console.error('Proposal comparison error:', error);
    res.status(500).json({ error: 'Failed to compare proposals.' });
  }
});

/**
 * GET /api/proposals/my-proposals - Proposals submitted by current university
 */
router.get('/my-proposals', authenticateToken, authorizeRoles('UNIVERSITY_ADMIN', 'FACULTY'), (req, res) => {
  try {
    const univId = req.user.university_id || 1;
    const proposals = db.prepare(`
      SELECT pr.*, p.title as problem_title, p.category as problem_category,
             o.name as organization_name
      FROM proposals pr
      JOIN problems p ON pr.problem_id = p.id
      LEFT JOIN users u_owner ON p.owner_id = u_owner.id
      LEFT JOIN organizations o ON u_owner.organization_id = o.id
      WHERE pr.university_id = ?
      ORDER BY pr.created_at DESC
    `).all(univId);

    res.json({ proposals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch university proposals.' });
  }
});

/**
 * POST /api/proposals - Submit a proposal from a University
 */
router.post('/', authenticateToken, authorizeRoles('UNIVERSITY_ADMIN', 'FACULTY'), (req, res) => {
  try {
    const { problem_id, summary, approach, team_structure, cost, timeline } = req.body;
    const university_id = req.user.university_id || 1;

    if (!problem_id || !summary || !approach) {
      return res.status(400).json({ error: 'Problem ID, summary, and technical approach are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO proposals (problem_id, university_id, submitted_by, summary, approach, team_structure, cost, timeline, status, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', 1)
    `);

    const result = stmt.run(problem_id, university_id, req.user.id, summary, approach, team_structure || '', cost || 200000, timeline || '3 Months');
    const proposalId = result.lastInsertRowid;

    // Record in version history
    db.prepare(`
      INSERT INTO proposal_versions (proposal_id, version, summary, approach)
      VALUES (?, 1, ?, ?)
    `).run(proposalId, summary, approach);

    // Update university_problem_acceptances status
    db.prepare('UPDATE university_problem_acceptances SET status = "PROPOSAL_SUBMITTED" WHERE university_id = ? AND problem_id = ?').run(university_id, problem_id);

    // Update problem status
    db.prepare('UPDATE problems SET status = "PROPOSALS_RECEIVED" WHERE id = ?').run(problem_id);

    // Notify Problem Owner
    const problem = db.prepare('SELECT owner_id, title FROM problems WHERE id = ?').get(problem_id);
    if (problem) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, metadata_json)
        VALUES (?, 'New University Proposal Submitted', ?, 'PROPOSAL', ?)
      `).run(problem.owner_id, `Proposal received for '${problem.title}'`, JSON.stringify({ problem_id, proposal_id: proposalId }));
    }

    res.status(201).json({
      message: 'Proposal submitted successfully.',
      proposalId
    });
  } catch (error) {
    console.error('Submit proposal error:', error);
    res.status(500).json({ error: 'Failed to submit proposal.' });
  }
});

/**
 * POST /api/proposals/:id/select - Problem Owner selects a proposal (Strict IDOR Protected)
 */
router.post('/:id/select', authenticateToken, authorizeRoles('PROBLEM_OWNER', 'GOVERNMENT'), (req, res) => {
  try {
    const proposalId = req.params.id;
    const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId);

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found.' });
    }

    const problem = db.prepare('SELECT * FROM problems WHERE id = ?').get(proposal.problem_id);

    // STRICT IDOR PRIVACY ENFORCEMENT
    if (req.user.role === 'PROBLEM_OWNER' && problem.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized. You do not own this client problem.' });
    }

    // Update proposal status
    db.prepare('UPDATE proposals SET status = "SELECTED" WHERE id = ?').run(proposalId);
    db.prepare('UPDATE proposals SET status = "REJECTED" WHERE problem_id = ? AND id != ?').run(proposal.problem_id, proposalId);

    // Update problem status
    db.prepare('UPDATE problems SET status = "SOLUTION_SELECTED" WHERE id = ?').run(proposal.problem_id);

    // Check if project already exists for this problem
    const existingProject = db.prepare('SELECT id FROM projects WHERE problem_id = ?').get(proposal.problem_id);
    let projectId = 0;

    if (existingProject) {
      db.prepare('UPDATE projects SET proposal_id = ?, university_id = ?, status = "PLANNING" WHERE id = ?')
        .run(proposalId, proposal.university_id, existingProject.id);
      projectId = existingProject.id;
    } else {
      const projectStmt = db.prepare(`
        INSERT INTO projects (problem_id, proposal_id, university_id, title, status, progress_pct)
        VALUES (?, ?, ?, ?, 'PLANNING', 10)
      `);
      const projectResult = projectStmt.run(proposal.problem_id, proposalId, proposal.university_id, `Project: ${problem.title}`);
      projectId = projectResult.lastInsertRowid;
    }

    // Audit Log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'PROPOSAL_SELECTED', 'PROPOSAL', proposalId, `Selected proposal #${proposalId} for problem '${problem.title}'`);

    res.json({
      message: 'Proposal selected! Project initiated successfully.',
      projectId
    });
  } catch (error) {
    console.error('Select proposal error:', error);
    res.status(500).json({ error: 'Failed to select proposal.' });
  }
});

/**
 * POST /api/proposals/:id/feedback - Add feedback & request version update
 */
router.post('/:id/feedback', authenticateToken, (req, res) => {
  try {
    const proposalId = req.params.id;
    const { feedback, new_summary, new_approach } = req.body;

    const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found.' });
    }

    const nextVersion = (proposal.version || 1) + 1;

    if (new_summary || new_approach) {
      db.prepare(`
        UPDATE proposals SET summary = COALESCE(?, summary), approach = COALESCE(?, approach), version = ?
        WHERE id = ?
      `).run(new_summary, new_approach, nextVersion, proposalId);

      db.prepare(`
        INSERT INTO proposal_versions (proposal_id, version, summary, approach, feedback_received)
        VALUES (?, ?, ?, ?, ?)
      `).run(proposalId, nextVersion, new_summary || proposal.summary, new_approach || proposal.approach, feedback || '');
    }

    res.json({
      message: 'Feedback and proposal version update recorded.',
      version: nextVersion
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record feedback.' });
  }
});

module.exports = router;
