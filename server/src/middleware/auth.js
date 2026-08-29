const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'solvelink_ai_hackathon_super_secret_key_2026';

/**
 * Authentication Middleware: Validates JWT token
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }

    // Verify user exists in SQLite
    const dbUser = db.prepare('SELECT id, name, email, role, organization_id, university_id, hospital_id FROM users WHERE id = ? AND status = "ACTIVE"').get(user.id);
    if (!dbUser) {
      return res.status(401).json({ error: 'User account not found or deactivated.' });
    }

    req.user = dbUser;
    next();
  });
}

/**
 * Role-Based Access Control Middleware
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access forbidden. Role '${req.user.role}' is not authorized for this resource.`
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  JWT_SECRET
};
