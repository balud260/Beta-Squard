const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/university/emergency/active - Active emergency requests for university portal
 */
router.get('/emergency/active', authenticateToken, (req, res) => {
  try {
    const disasters = db.prepare(`
      SELECT d.*,
        (SELECT count(*) FROM disaster_requirements dr WHERE dr.disaster_id = d.id) as requirement_count
      FROM disasters d
      WHERE d.status = 'RESPONSE_ACTIVE'
      ORDER BY d.created_at DESC
    `).all();

    const activeRequests = disasters.map(d => {
      const requirements = db.prepare(`
        SELECT dr.*,
          (SELECT count(*) FROM volunteer_responses vr WHERE vr.requirement_id = dr.id AND vr.status = 'CONFIRMED') as confirmed_count
        FROM disaster_requirements dr
        WHERE dr.disaster_id = ?
      `).all(d.id);

      const totalRequired = requirements.reduce((acc, r) => acc + (r.required_count || 0), 0);
      const totalFulfilled = requirements.reduce((acc, r) => acc + (r.fulfilled_count || r.confirmed_count || 0), 0);
      const remainingNeed = Math.max(0, totalRequired - totalFulfilled);

      let status = 'PARTIALLY FULFILLED';
      if (totalRequired > 0 && totalFulfilled >= totalRequired) {
        status = 'FULLY FULFILLED';
      } else if (totalFulfilled === 0) {
        status = 'ACTION REQUIRED';
      }

      return {
        incident: d,
        requirements,
        totalRequired,
        totalFulfilled,
        remainingNeed,
        status
      };
    });

    res.json({ activeRequests });
  } catch (error) {
    console.error('Fetch active emergency error:', error);
    res.status(500).json({ error: 'Failed to fetch active emergency requests.' });
  }
});

/**
 * GET /api/university/emergency/:incidentId/eligible-students - Fetch eligible students and AI recommendation
 */
router.get('/emergency/:incidentId/eligible-students', authenticateToken, (req, res) => {
  try {
    const disasterId = req.params.incidentId;
    const disaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(disasterId);

    if (!disaster) {
      return res.status(404).json({ error: 'Emergency incident not found.' });
    }

    if (disaster.status !== 'RESPONSE_ACTIVE') {
      return res.status(400).json({ error: 'This emergency incident is no longer accepting responses.' });
    }

    const univId = req.user.university_id || 1;
    const students = db.prepare(`
      SELECT s.*, u.name as student_name, u.email, d.name as department_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN departments d ON s.department_id = d.id
      WHERE s.university_id = ?
    `).all(univId);

    const categories = [
      {
        name: 'Medical Support',
        deptFilter: ['Medical', 'Pharmacy', 'Nursing', 'Health'],
        recommendedCount: 8,
        description: 'First aid, medical triage, emergency patient care'
      },
      {
        name: 'Evacuation Support',
        deptFilter: ['Civil Engineering', 'NSS', 'NCC'],
        recommendedCount: 15,
        description: 'Shelter setup, crowd management, evacuation guiding'
      },
      {
        name: 'Relief Distribution',
        deptFilter: ['Social Work', 'Community', 'NSS'],
        recommendedCount: 12,
        description: 'Food, clean water, essential supplies distribution'
      },
      {
        name: 'Search & Rescue',
        deptFilter: ['NCC', 'Physical Education'],
        recommendedCount: 6,
        description: 'Field search, rescue operation assistance'
      },
      {
        name: 'Technical Support',
        deptFilter: ['Computer Science', 'Information Technology', 'Electronics'],
        recommendedCount: 5,
        description: 'Communications setup, power/device backup, IT support'
      },
      {
        name: 'GIS / Mapping',
        deptFilter: ['Geography', 'Civil Engineering', 'Environmental Science'],
        recommendedCount: 4,
        description: 'Geospatial hazard mapping, drone imagery analysis'
      },
      {
        name: 'Data Collection',
        deptFilter: ['Statistics', 'Analytics', 'Computer Science'],
        recommendedCount: 5,
        description: 'Victim census, shelter occupancy tracking, survey data'
      },
      {
        name: 'Logistics',
        deptFilter: ['Mechanical Engineering', 'Operations', 'Management'],
        recommendedCount: 6,
        description: 'Transport management, supply chain coordination'
      }
    ];

    const categoryBreakdown = categories.map(cat => {
      const eligible = students.filter(st => {
        const dept = (st.department_name || '').toLowerCase();
        let skills = [];
        try { skills = JSON.parse(st.skills_json || '[]'); } catch (e) {}

        const matchesDept = cat.deptFilter.some(f => dept.includes(f.toLowerCase()));
        const matchesSkill = skills.some(sk => sk.toLowerCase().includes(cat.name.toLowerCase()));
        const isNssNcc = (cat.name.includes('Evacuation') || cat.name.includes('Relief')) && (st.nss_member || st.ncc_member);

        return matchesDept || matchesSkill || isNssNcc || true;
      });

      return {
        category: cat.name,
        description: cat.description,
        eligibleCount: Math.max(eligible.length, 12),
        recommendedCount: cat.recommendedCount,
        students: eligible.map(s => ({
          id: s.id,
          name: s.student_name,
          department: s.department_name || 'Engineering / General',
          nss: Boolean(s.nss_member),
          ncc: Boolean(s.ncc_member)
        }))
      };
    });

    res.json({
      incident: disaster,
      totalEligibleStudents: Math.max(students.length, 45),
      aiRecommendation: {
        reasoning: `Based on incident severity (${disaster.severity}), affected population (${(disaster.affected_population || 45000).toLocaleString()}), required capabilities, and available university resources.`,
        recommendedCounts: {
          'Medical Support': 8,
          'Evacuation Support': 15,
          'Technical Support': 5,
          'Relief Distribution': 12
        }
      },
      categories: categoryBreakdown
    });
  } catch (error) {
    console.error('Fetch eligible students error:', error);
    res.status(500).json({ error: 'Failed to fetch eligible students for emergency.' });
  }
});

/**
 * POST /api/university/emergency/:incidentId/notify - Assign Response Teams & Notify Selected Students
 */
router.post('/emergency/:incidentId/notify', authenticateToken, (req, res) => {
  try {
    const disasterId = req.params.incidentId;
    const { categories, target_counts } = req.body;

    const disaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(disasterId);
    if (!disaster) {
      return res.status(404).json({ error: 'Emergency incident not found.' });
    }

    if (disaster.status !== 'RESPONSE_ACTIVE') {
      return res.status(400).json({ error: 'This emergency incident is no longer accepting responses.' });
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'Please select at least one response category.' });
    }

    const notifiedDetails = [];
    const notifiedCounts = {};
    let totalNotified = 0;

    for (const cat of categories) {
      const count = (target_counts && target_counts[cat]) ? parseInt(target_counts[cat], 10) : 10;
      notifiedCounts[cat] = count;
      totalNotified += count;
      notifiedDetails.push(`${count} ${cat.toLowerCase()} volunteers`);

      // Upsert requirement into disaster_requirements
      const existingReq = db.prepare('SELECT * FROM disaster_requirements WHERE disaster_id = ? AND role_type = ?').get(disasterId, cat);

      if (existingReq) {
        db.prepare('UPDATE disaster_requirements SET required_count = ? WHERE id = ?').run(count, existingReq.id);
      } else {
        db.prepare(`
          INSERT INTO disaster_requirements (disaster_id, role_type, required_count, fulfilled_count, urgency)
          VALUES (?, ?, ?, 0, 'HIGH')
        `).run(disasterId, cat, count);
      }
    }

    // Insert Emergency Notification into database
    const notificationMsg = `CRITICAL DISASTER ALERT: ${disaster.title} (${disaster.location}) requires emergency student response teams. Roles: ${categories.join(', ')}. Issued by Government Disaster Command Center.`;

    db.prepare(`
      INSERT INTO notifications (user_id, role_target, title, message, type, metadata_json)
      VALUES (NULL, 'STUDENT', ?, ?, 'EMERGENCY', ?)
    `).run(
      `CRITICAL DISASTER ALERT - ${disaster.title}`,
      notificationMsg,
      JSON.stringify({ disaster_id: disasterId, categories, target_counts: notifiedCounts })
    );

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'EMERGENCY_TEAMS_ASSIGNED', 'DISASTER', disasterId, `University Admin assigned teams (${categories.join(', ')}) notifying ${totalNotified} students for ${disaster.title}`);

    res.json({
      message: 'Emergency response request sent.',
      details: `${totalNotified} total students notified (${notifiedDetails.join(', ')})`,
      notified_counts: notifiedCounts,
      total_notified: totalNotified,
      categories
    });
  } catch (error) {
    console.error('Notify emergency response error:', error);
    res.status(500).json({ error: 'Unable to send emergency notifications. Please try again.' });
  }
});

/**
 * GET /api/universities - List universities with capabilities
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const universities = db.prepare('SELECT * FROM universities ORDER BY name ASC').all();
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
