const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/hospitals - List all hospitals
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const hospitals = db.prepare('SELECT * FROM hospitals ORDER BY name ASC').all();
    res.json({ hospitals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hospitals.' });
  }
});

/**
 * PUT /api/hospitals/:id/status - Update bed capacity & status
 */
router.put('/:id/status', authenticateToken, (req, res) => {
  try {
    const hospitalId = req.params.id;
    const { available_beds, status } = req.body;

    db.prepare('UPDATE hospitals SET available_beds = COALESCE(?, available_beds), status = COALESCE(?, status) WHERE id = ?')
      .run(available_beds, status, hospitalId);

    const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(hospitalId);

    res.json({
      message: 'Hospital status updated.',
      hospital
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hospital status.' });
  }
});

/**
 * POST /api/hospitals/:id/acknowledge - Hospital Admin acknowledges emergency inflow alert
 */
router.post('/:id/acknowledge', authenticateToken, (req, res) => {
  try {
    const hospitalId = req.params.id;
    const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(hospitalId);

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'HOSPITAL_ACKNOWLEDGED', 'HOSPITAL', hospitalId, `Hospital '${hospital?.name}' acknowledged disaster patient inflow alert.`);

    res.json({ message: `Hospital '${hospital?.name}' successfully acknowledged disaster alert.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process hospital acknowledgement.' });
  }
});

module.exports = router;
