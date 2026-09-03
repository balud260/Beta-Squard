const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

/**
 * POST /api/auth/login - Real Backend Authentication via bcrypt
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ? AND status = 'ACTIVE'").get(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify hashed password securely using bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Attach role-specific metadata
    let orgDetails = null;
    let univDetails = null;
    let hospitalDetails = null;

    if (user.organization_id) {
      orgDetails = db.prepare('SELECT * FROM organizations WHERE id = ?').get(user.organization_id);
    }
    if (user.university_id) {
      univDetails = db.prepare('SELECT * FROM universities WHERE id = ?').get(user.university_id);
    }
    if (user.hospital_id) {
      hospitalDetails = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(user.hospital_id);
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization_id: user.organization_id,
      university_id: user.university_id,
      hospital_id: user.hospital_id
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        organization: orgDetails,
        university: univDetails,
        hospital: hospitalDetails
      }
    });
  } catch (error) {
    console.error('[AUTH] Login internal error:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

/**
 * GET /api/auth/me - Persistent Token Session Verification
 */
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, role, phone, organization_id, university_id, hospital_id FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    let orgDetails = null;
    let univDetails = null;
    let hospitalDetails = null;

    if (user.organization_id) {
      orgDetails = db.prepare('SELECT * FROM organizations WHERE id = ?').get(user.organization_id);
    }
    if (user.university_id) {
      univDetails = db.prepare('SELECT * FROM universities WHERE id = ?').get(user.university_id);
    }
    if (user.hospital_id) {
      hospitalDetails = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(user.hospital_id);
    }

    res.json({
      user: {
        ...user,
        organization: orgDetails,
        university: univDetails,
        hospital: hospitalDetails
      }
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

/**
 * POST /api/auth/register - Unified Real User Registration
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, organizationName, organizationType, phone, location } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: 'Password and confirm password do not match.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    let orgId = null;
    let univId = null;

    if (role === 'GOVERNMENT') {
      const orgResult = db.prepare(`
        INSERT INTO organizations (name, type, location, contact_email)
        VALUES (?, 'GOVERNMENT', ?, ?)
      `).run(organizationName || `${name} Agency`, location || 'District HQ', cleanEmail);
      orgId = orgResult.lastInsertRowid;
    } else if (role === 'PROBLEM_OWNER') {
      const orgResult = db.prepare(`
        INSERT INTO organizations (name, type, location, contact_email)
        VALUES (?, ?, ?, ?)
      `).run(organizationName || `${name} Organization`, organizationType || 'COMMUNITY_ORG', location || 'District Area', cleanEmail);
      orgId = orgResult.lastInsertRowid;
    } else if (role === 'UNIVERSITY_ADMIN' || role === 'UNIVERSITY') {
      const baseCode = (organizationName || name).split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4) || 'UNIV';
      const code = `${baseCode}${Math.floor(100 + Math.random() * 900)}`;
      const univResult = db.prepare(`
        INSERT INTO universities (name, code, location, lat, lng, total_students, research_focus, equipment_summary)
        VALUES (?, ?, ?, 28.6139, 77.2090, 3000, 'AI, Civic Engineering & Public Health', 'IoT Labs, GIS Workstations')
      `).run(organizationName || `${name} University`, code, location || 'Main Campus');
      univId = univResult.lastInsertRowid;
    } else if (role === 'STUDENT') {
      univId = 1; // Default to primary university if not specified
    }

    const assignedRole = role === 'UNIVERSITY' ? 'UNIVERSITY_ADMIN' : role;
    const userResult = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, organization_id, university_id, phone, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `).run(name, cleanEmail, hash, assignedRole, orgId, univId, phone || '');

    const userId = userResult.lastInsertRowid;

    if (assignedRole === 'STUDENT') {
      try {
        db.prepare(`
          INSERT INTO students (user_id, university_id, department_id, roll_number, skills_json, availability_status)
          VALUES (?, ?, 1, ?, '["General Support", "AI/ML", "React"]', 'AVAILABLE')
        `).run(userId, univId || 1, `STU-${userId}`);
      } catch (e) {}
    }

    const token = jwt.sign(
      { id: userId, email: cleanEmail, name, role: assignedRole, organization_id: orgId, university_id: univId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: { id: userId, name, email: cleanEmail, role: assignedRole, organization_id: orgId, university_id: univId }
    });
  } catch (error) {
    console.error('[AUTH] Registration error:', error);
    res.status(500).json({ error: 'Failed to complete user registration.' });
  }
});

/**
 * POST /api/auth/register-government
 */
router.post('/register-government', async (req, res) => {
  req.body.role = 'GOVERNMENT';
  req.body.name = req.body.officialName || req.body.departmentName;
  req.body.organizationName = req.body.departmentName;
  router.handle({ ...req, url: '/register', method: 'POST' }, res);
});

/**
 * POST /api/auth/register-university
 */
router.post('/register-university', async (req, res) => {
  req.body.role = 'UNIVERSITY_ADMIN';
  req.body.name = req.body.adminName || req.body.universityName;
  req.body.organizationName = req.body.universityName;
  router.handle({ ...req, url: '/register', method: 'POST' }, res);
});

module.exports = router;
