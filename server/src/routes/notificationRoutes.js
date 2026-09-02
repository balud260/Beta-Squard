const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/notifications - Targeted role & user notifications
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const { id: userId, role } = req.user;

    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ? OR role_target = ? OR role_target = 'ALL'
      ORDER BY created_at DESC
      LIMIT 20
    `).all(userId, role);

    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

/**
 * POST /api/notifications/:id/read - Mark notification as read
 */
const markReadHandler = (req, res) => {
  try {
    const notifId = req.params.id;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notifId);
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
};

router.post('/:id/read', authenticateToken, markReadHandler);
router.patch('/:id/read', authenticateToken, markReadHandler);
router.put('/:id/read', authenticateToken, markReadHandler);

module.exports = router;
