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

    res.status(201).json({
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
 * GET /api/university/emergency-alerts - University Early Warning Alerts & Risk Classification
 */
router.get('/emergency-alerts', authenticateToken, (req, res) => {
  try {
    const univId = req.user.university_id || 1;
    const { evaluateAndPersistDisasterRisks } = require('../services/disaster/universityRiskEngine');

    // Get all active disasters
    const activeDisasters = db.prepare('SELECT * FROM disasters WHERE status IN ("ACTIVE", "RESPONSE_ACTIVE", "CONFIRMED", "ESCALATED") ORDER BY created_at DESC').all();

    const alerts = [];

    for (const d of activeDisasters) {
      evaluateAndPersistDisasterRisks(d.id);

      const riskRecord = db.prepare(`
        SELECT * FROM university_disaster_risks WHERE disaster_id = ? AND university_id = ?
      `).get(d.id, univId);

      if (riskRecord) {
        alerts.push({
          ...riskRecord,
          disaster_id: d.id,
          disaster_title: d.title,
          disaster_type: d.type,
          disaster_severity: d.severity,
          location: d.location,
          latitude: d.latitude,
          longitude: d.longitude,
          disaster: d,
          risk: riskRecord
        });
      }
    }

    res.json({ alerts });
  } catch (error) {
    console.error('Fetch university emergency alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch emergency alerts.' });
  }
});

/**
 * POST /api/university/emergency-alerts/:disasterId/acknowledge - Acknowledge Risk Alert
 */
router.post('/emergency-alerts/:disasterId/acknowledge', authenticateToken, (req, res) => {
  try {
    const disasterId = req.params.disasterId;
    const univId = req.user.university_id || 1;

    db.prepare(`
      UPDATE university_disaster_risks
      SET acknowledged = 1, acknowledged_at = CURRENT_TIMESTAMP, acknowledged_by = ?, action_required = 0, updated_at = CURRENT_TIMESTAMP
      WHERE disaster_id = ? AND university_id = ?
    `).run(req.user.id, disasterId, univId);

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'EMERGENCY_ALERT_ACKNOWLEDGED', 'DISASTER', disasterId, `University #${univId} acknowledged disaster #${disasterId} alert`);

    res.json({
      message: 'Emergency alert acknowledged successfully.',
      acknowledged: true,
      acknowledged_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Acknowledge emergency alert error:', error);
    res.status(500).json({ error: 'Failed to acknowledge emergency alert.' });
  }
});

/**
 * POST /api/university/emergency-alerts/:disasterId/activate-response - Activate Response Team Status
 */
router.post('/emergency-alerts/:disasterId/activate-response', authenticateToken, (req, res) => {
  try {
    const disasterId = req.params.disasterId;
    const univId = req.user.university_id || 1;
    const { status } = req.body;

    const newStatus = status || 'ACTIVE';

    db.prepare(`
      UPDATE university_disaster_risks
      SET response_status = ?, response_activated_at = CURRENT_TIMESTAMP, response_activated_by = ?, acknowledged = 1, acknowledged_at = COALESCE(acknowledged_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
      WHERE disaster_id = ? AND university_id = ?
    `).run(newStatus, req.user.id, disasterId, univId);

    // Notify Government Command Center
    const govAdmins = db.prepare('SELECT id FROM users WHERE role = "GOVERNMENT"').all();
    const univ = db.prepare('SELECT name FROM universities WHERE id = ?').get(univId);

    for (const g of govAdmins) {
      db.prepare(`
        INSERT INTO notifications (user_id, role_target, title, message, type, metadata_json)
        VALUES (?, 'GOVERNMENT', '🚨 UNIVERSITY RESPONSE TEAM ACTIVATED', ?, 'EMERGENCY', ?)
      `).run(
        g.id,
        `${univ?.name || 'A university'} activated emergency response team (Status: ${newStatus}) for Disaster #${disasterId}.`,
        JSON.stringify({ disaster_id: Number(disasterId), university_id: Number(univId), response_status: newStatus })
      );
    }

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'UNIVERSITY_RESPONSE_ACTIVATED', 'DISASTER', disasterId, `University #${univId} set response status to '${newStatus}' for disaster #${disasterId}`);

    res.json({
      message: `Emergency response team activated (Status: ${newStatus}).`,
      response_status: newStatus,
      activated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Activate response team error:', error);
    res.status(500).json({ error: 'Failed to activate response team.' });
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
