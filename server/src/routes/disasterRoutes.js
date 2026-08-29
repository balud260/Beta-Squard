const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { analyzeDisasterIncident, evaluateRelocationSites } = require('../services/aiService');

// Haversine distance calculator in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * GET /api/disasters - List active disaster incidents
 */
router.get('/', authenticateToken, (req, res) => {
  try {
    const disasters = db.prepare(`
      SELECT d.*,
             (SELECT count(*) FROM disaster_requirements dr WHERE dr.disaster_id = d.id) as requirement_count,
             (SELECT count(*) FROM relocation_sites rs WHERE rs.disaster_id = d.id) as site_count
      FROM disasters d
      ORDER BY d.created_at DESC
    `).all();

    res.json({ disasters });
  } catch (error) {
    console.error('Fetch disasters error:', error);
    res.status(500).json({ error: 'Failed to fetch disaster incidents.' });
  }
});

/**
 * POST /api/disasters - Create a new disaster incident (Government Only)
 */
router.post('/', authenticateToken, authorizeRoles('GOVERNMENT'), (req, res) => {
  try {
    const { title, type, location, lat, lng, severity, affected_population, vulnerable_population, hazard_info } = req.body;

    if (!title || !type || !location) {
      return res.status(400).json({ error: 'Title, type, and location are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO disasters (title, type, location, lat, lng, severity, affected_population, vulnerable_population, hazard_info, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'RESPONSE_ACTIVE')
    `);

    const result = stmt.run(
      title,
      type,
      location,
      lat || 28.6139,
      lng || 77.2090,
      severity || 'CRITICAL',
      affected_population || 45000,
      vulnerable_population || 8500,
      hazard_info || 'Disaster incident reported.'
    );

    const disasterId = result.lastInsertRowid;

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'DISASTER_CREATED', 'DISASTER', disasterId, `Disaster '${title}' created by Government`);

    res.status(201).json({
      message: 'Disaster incident created successfully.',
      disasterId
    });
  } catch (error) {
    console.error('Create disaster error:', error);
    res.status(500).json({ error: 'Failed to create disaster incident.' });
  }
});

/**
 * GET /api/disasters/:id - Full Disaster Command Center Details with University Distances
 */
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const disasterId = req.params.id;
    const disaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(disasterId);

    if (!disaster) {
      return res.status(404).json({ error: 'Disaster incident not found.' });
    }

    // Requirements & Live Response Counts
    const requirements = db.prepare(`
      SELECT dr.*,
             (SELECT count(*) FROM volunteer_responses vr WHERE vr.requirement_id = dr.id AND vr.status = 'CONFIRMED') as confirmed_count
      FROM disaster_requirements dr
      WHERE dr.disaster_id = ?
    `).all(disasterId);

    // Relocation Sites
    const relocationSites = db.prepare('SELECT * FROM relocation_sites WHERE disaster_id = ? ORDER BY score DESC').all(disasterId);

    // Nearby Hospitals with Inflow
    const hospitals = db.prepare('SELECT * FROM hospitals').all();
    const hospitalsWithDistance = hospitals.map(h => {
      const dist = calculateDistanceKm(disaster.lat, disaster.lng, h.lat, h.lng);
      return {
        ...h,
        distance_km: dist,
        expected_inflow: Math.round(disaster.affected_population * 0.003) // Estimated patient inflow
      };
    });

    // Nearby Universities with Distance & Priority Categorization
    const universities = db.prepare('SELECT * FROM universities').all();
    const universitiesWithDistance = universities.map(u => {
      const dist = calculateDistanceKm(disaster.lat, disaster.lng, u.lat, u.lng);
      let priority = 'LOWER PRIORITY RESPONSE HUB';
      if (dist < 10) priority = 'HIGH PRIORITY RESPONSE HUB';
      else if (dist < 20) priority = 'MEDIUM PRIORITY RESPONSE HUB';

      return {
        ...u,
        distance_km: dist,
        priority_label: priority
      };
    }).sort((a, b) => a.distance_km - b.distance_km);

    res.json({
      disaster,
      requirements,
      relocationSites,
      hospitals: hospitalsWithDistance,
      nearbyUniversities: universitiesWithDistance
    });
  } catch (error) {
    console.error('Fetch disaster detail error:', error);
    res.status(500).json({ error: 'Failed to fetch disaster details.' });
  }
});

/**
 * POST /api/disasters/:id/analyze - AI Disaster Risk & Action Analysis (Government Controlled)
 */
router.post('/:id/analyze', authenticateToken, authorizeRoles('GOVERNMENT'), async (req, res) => {
  try {
    const disasterId = req.params.id;
    const disaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(disasterId);

    if (!disaster) {
      return res.status(404).json({ error: 'Disaster incident not found.' });
    }

    const hospitals = db.prepare('SELECT * FROM hospitals').all();
    const relocationSites = db.prepare('SELECT * FROM relocation_sites WHERE disaster_id = ?').all(disasterId);
    const requirements = db.prepare('SELECT * FROM disaster_requirements WHERE disaster_id = ?').all(disasterId);

    const aiAnalysis = await analyzeDisasterIncident(disaster, hospitals, relocationSites, requirements);

    res.json({
      message: 'AI Disaster Risk Assessment completed.',
      is_ai_recommendation: true,
      analysis: aiAnalysis
    });
  } catch (error) {
    console.error('AI disaster analysis error:', error.message);
    res.status(500).json({ error: 'AI disaster analysis failed.', details: error.message });
  }
});

/**
 * GET /api/disasters/:id/relocation-eval - AI Relocation Evaluation
 */
router.get('/:id/relocation-eval', authenticateToken, async (req, res) => {
  try {
    const disasterId = req.params.id;
    const disaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(disasterId);
    const sites = db.prepare('SELECT * FROM relocation_sites WHERE disaster_id = ?').all(disasterId);

    const evalResult = await evaluateRelocationSites(disaster, sites);

    res.json({
      is_ai_recommendation: true,
      evaluation: evalResult
    });
  } catch (error) {
    console.error('Relocation evaluation error:', error);
    res.status(500).json({ error: 'Relocation evaluation failed.' });
  }
});

/**
 * POST /api/disasters/:id/relocation-approve - Government Official Approves Relocation Site
 */
router.post('/:id/relocation-approve', authenticateToken, authorizeRoles('GOVERNMENT'), (req, res) => {
  try {
    const disasterId = req.params.id;
    const { site_id, notes } = req.body;

    const site = db.prepare('SELECT * FROM relocation_sites WHERE id = ? AND disaster_id = ?').get(site_id, disasterId);

    if (!site) {
      return res.status(404).json({ error: 'Relocation site not found.' });
    }

    // Government Approval Decision
    db.prepare('UPDATE relocation_sites SET status = "APPROVED" WHERE id = ?').run(site_id);

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'RELOCATION_APPROVED', 'RELOCATION_SITE', site_id, `Government approved relocation site '${site.name}' (Notes: ${notes || 'Approved'})`);

    res.json({
      message: `Relocation Site '${site.name}' successfully APPROVED by Government.`,
      status: 'APPROVED',
      is_government_decision: true
    });
  } catch (error) {
    console.error('Approve relocation site error:', error);
    res.status(500).json({ error: 'Failed to approve relocation site.' });
  }
});

module.exports = router;
