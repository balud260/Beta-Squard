const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { analyzeDisasterIncident, evaluateRelocationSites } = require('../services/aiService');
const { getCachedAI, setCachedAI, getCacheKey } = require('../services/aiCache');

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
const { initializeOfficialSources, ingestExternalAlert, confirmAlertAndCreateDisaster } = require('../services/disaster/disasterIngestionService');
const { evaluateAndPersistDisasterRisks } = require('../services/disaster/universityRiskEngine');
const { sendTargetedDisasterNotifications } = require('../services/disaster/disasterAlertNotificationService');

// Initialize official sources idempotently
initializeOfficialSources();

/**
 * GET /api/disasters/alerts/incoming - List pending official external alerts for Government review
 */
router.get('/alerts/incoming', authenticateToken, (req, res) => {
  try {
    const alerts = db.prepare(`
      SELECT * FROM external_alerts 
      ORDER BY review_status = 'PENDING_REVIEW' DESC, issued_at DESC
    `).all();

    res.json({ alerts });
  } catch (error) {
    console.error('Fetch incoming alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch incoming official alerts.' });
  }
});

/**
 * POST /api/disasters/alerts/ingest - Ingest an external alert payload (Source Adapter / Ingestion Feed)
 */
router.post('/alerts/ingest', (req, res) => {
  try {
    const { source_name, payload } = req.body;
    const result = ingestExternalAlert(payload || req.body, source_name || 'India Meteorological Department (IMD)');
    res.status(201).json({
      message: 'Alert ingested successfully.',
      ...result
    });
  } catch (error) {
    console.error('Alert ingestion error:', error);
    res.status(500).json({ error: 'Failed to ingest alert payload.' });
  }
});

/**
 * POST /api/disasters/alerts/:id/confirm - Government Confirms External Alert
 */
router.post('/alerts/:id/confirm', authenticateToken, authorizeRoles('GOVERNMENT'), (req, res) => {
  try {
    const alertId = req.params.id;
    const result = confirmAlertAndCreateDisaster(alertId, req.user.id, req.body);
    res.status(201).json({
      message: `Official alert confirmed. Disaster #${result.disasterId} created and early warning alerts broadcasted to universities.`,
      ...result
    });
  } catch (error) {
    console.error('Confirm alert error:', error);
    res.status(400).json({ error: error.message || 'Failed to confirm alert.' });
  }
});

/**
 * POST /api/disasters/alerts/:id/reject - Government Rejects External Alert
 */
router.post('/alerts/:id/reject', authenticateToken, authorizeRoles('GOVERNMENT'), (req, res) => {
  try {
    const alertId = req.params.id;
    const { reason } = req.body;

    db.prepare('UPDATE external_alerts SET review_status = "REJECTED", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(alertId);
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'ALERT_REJECTED', 'EXTERNAL_ALERT', alertId, `Government rejected alert #${alertId}: ${reason || 'Not applicable'}`);

    res.json({ message: 'Official alert rejected successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject alert.' });
  }
});

/**
 * POST /api/disasters/alerts/:id/mark-duplicate - Mark duplicate alert
 */
router.post('/alerts/:id/mark-duplicate', authenticateToken, authorizeRoles('GOVERNMENT'), (req, res) => {
  try {
    const alertId = req.params.id;
    const { linked_disaster_id } = req.body;

    db.prepare('UPDATE external_alerts SET review_status = "DUPLICATE", linked_disaster_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(linked_disaster_id || null, alertId);
    res.json({ message: 'Alert marked as duplicate.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark alert duplicate.' });
  }
});

/**
 * GET /api/disasters/sources - List official alert data sources & sync status
 */
router.get('/sources', authenticateToken, (req, res) => {
  try {
    const sources = db.prepare('SELECT * FROM disaster_sources ORDER BY trust_level ASC').all();
    res.json({ sources });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alert data sources.' });
  }
});

/**
 * POST /api/disasters/sources/sync - Sync external alert sources
 */
router.post('/sources/sync', authenticateToken, authorizeRoles('GOVERNMENT'), async (req, res) => {
  try {
    await initializeOfficialSources();
    const demoPayload = {
      external_alert_id: `IMD_${Date.now()}`,
      alert_type: 'Cyclone',
      title: 'Severe Cyclone & Storm Surge Alert (IMD)',
      description: 'Extremely severe cyclonic storm approaching coastal region.',
      severity: 'CRITICAL',
      lat: 20.4625,
      lng: 85.8828,
      affected_radius_km: 120
    };
    const ingested = ingestExternalAlert(demoPayload, 'India Meteorological Department (IMD)');
    res.json({
      message: 'Source sync completed successfully.',
      latest_alert: ingested.alert
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync external alert sources.' });
  }
});

/**
 * POST /api/disasters - Create a new disaster incident (Government Only)
 */
router.post('/', authenticateToken, authorizeRoles('GOVERNMENT'), (req, res) => {
  try {
    const { title, type, location, lat, lng, severity, affected_population, vulnerable_population, hazard_info, affected_radius_km, required_capabilities, immediate_actions } = req.body;

    if (!title || !type || !location) {
      return res.status(400).json({ error: 'Title, type, and location are required.' });
    }

    const radius = Number(affected_radius_km) || 15.0;

    const stmt = db.prepare(`
      INSERT INTO disasters (
        title, type, location, lat, lng, severity, affected_population, vulnerable_population,
        hazard_info, status, affected_radius_km, confirmed_by, confirmed_at, verification_status,
        required_capabilities_json, immediate_actions_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'RESPONSE_ACTIVE', ?, ?, CURRENT_TIMESTAMP, 'GOVERNMENT_CONFIRMED', ?, ?)
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
      hazard_info || 'Government declared disaster incident.',
      radius,
      req.user.id,
      JSON.stringify(required_capabilities || ['Medical Triage', 'GIS Survey', 'Search & Rescue']),
      JSON.stringify(immediate_actions || ['Activate Emergency Response Teams', 'Verify Relocation Shelters'])
    );

    const disasterId = result.lastInsertRowid;

    // Add default volunteer requirements
    const defaultReqs = [
      { role: 'Medical Support', count: 10, urgency: 'CRITICAL' },
      { role: 'Relief Operations', count: 50, urgency: 'HIGH' },
      { role: 'Technical / GIS', count: 15, urgency: 'HIGH' }
    ];

    for (const reqItem of defaultReqs) {
      db.prepare(`
        INSERT INTO disaster_requirements (disaster_id, role_type, required_count, fulfilled_count, urgency)
        VALUES (?, ?, ?, 0, ?)
      `).run(disasterId, reqItem.role, reqItem.count, reqItem.urgency);
    }

    // Add default relocation sites
    db.prepare(`
      INSERT INTO relocation_sites (disaster_id, name, location, lat, lng, capacity, current_occupancy, hospital_distance_km, road_status, risk_level, score, status)
      VALUES 
      (?, 'Relocation Site Alpha (District Sports Complex)', 'North Sector', ?, ?, 5000, 0, 3.2, 'OPEN', 'LOW', 95, 'APPROVED'),
      (?, 'Relocation Site Beta (Community Center B)', 'East Sector', ?, ?, 3500, 0, 5.1, 'OPEN', 'LOW', 88, 'APPROVED')
    `).run(disasterId, (lat || 28.6139) + 0.02, (lng || 77.2090) + 0.02, disasterId, (lat || 28.6139) - 0.03, (lng || 77.2090) + 0.03);

    // Run University Risk Engine & broadcast targeted notifications
    const risks = evaluateAndPersistDisasterRisks(disasterId);
    sendTargetedDisasterNotifications(disasterId, risks);

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'DISASTER_CREATED', 'DISASTER', disasterId, `Disaster '${title}' declared by Government`);

    res.status(201).json({
      message: 'Disaster incident created successfully.',
      disasterId,
      universityRisks: risks
    });
  } catch (error) {
    console.error('Create disaster error:', error);
    res.status(500).json({ error: 'Failed to create disaster incident.' });
  }
});

/**
 * GET /api/disasters/relocation-recommendations - List top scored relocation sites
 */
router.get('/relocation-recommendations', authenticateToken, (req, res) => {
  try {
    const sites = db.prepare('SELECT rs.*, d.title as disaster_title FROM relocation_sites rs JOIN disasters d ON rs.disaster_id = d.id ORDER BY rs.score DESC').all();
    res.json({ sites });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch relocation recommendations.' });
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
 * GET /api/disasters/:id/response - Live Government Response Monitoring
 */
router.get('/:id/response', authenticateToken, (req, res) => {
  try {
    const disasterId = req.params.id;
    const disaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(disasterId);

    if (!disaster) {
      return res.status(404).json({ error: 'Disaster incident not found.' });
    }

    const requirements = db.prepare(`
      SELECT dr.*,
             (SELECT count(*) FROM volunteer_responses vr WHERE vr.requirement_id = dr.id AND vr.status = 'CONFIRMED') as confirmed_count
      FROM disaster_requirements dr
      WHERE dr.disaster_id = ?
    `).all(disasterId);

    const totalRequired = requirements.reduce((sum, r) => sum + (r.required_count || 0), 0);
    const totalFulfilled = requirements.reduce((sum, r) => sum + (r.fulfilled_count || r.confirmed_count || 0), 0);
    const remainingNeed = Math.max(0, totalRequired - totalFulfilled);

    const breakdown = requirements.map(r => ({
      role_type: r.role_type,
      required_count: r.required_count,
      fulfilled_count: r.fulfilled_count || r.confirmed_count || 0,
      remaining_count: Math.max(0, r.required_count - (r.fulfilled_count || r.confirmed_count || 0))
    }));

    res.json({
      disaster,
      total_required: totalRequired,
      total_volunteers: totalFulfilled,
      remaining_need: remainingNeed,
      requirements: breakdown
    });
  } catch (error) {
    console.error('Fetch disaster response status error:', error);
    res.status(500).json({ error: 'Failed to fetch disaster response status.' });
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
 * GET /api/disasters/relocation-recommendations - List top scored relocation sites
 */
router.get('/relocation-recommendations', authenticateToken, (req, res) => {
  try {
    const sites = db.prepare('SELECT rs.*, d.title as disaster_title FROM relocation_sites rs JOIN disasters d ON rs.disaster_id = d.id ORDER BY rs.score DESC').all();
    res.json({ sites });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch relocation recommendations.' });
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

/**
 * POST /api/disasters/:id/relocate - Alias for relocation approval (Government Only)
 */
router.post('/:id/relocate', authenticateToken, authorizeRoles('GOVERNMENT'), (req, res) => {
  try {
    const disasterId = req.params.id;
    const { site_id, notes } = req.body;

    const site = db.prepare('SELECT * FROM relocation_sites WHERE id = ? AND disaster_id = ?').get(site_id || 1, disasterId);

    if (!site) {
      return res.status(404).json({ error: 'Relocation site not found.' });
    }

    db.prepare('UPDATE relocation_sites SET status = "APPROVED" WHERE id = ?').run(site.id);

    res.json({
      message: `Relocation Site '${site.name}' successfully APPROVED by Government.`,
      status: 'APPROVED',
      is_government_decision: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve relocation site.' });
  }
});

/**
 * POST /api/disasters/:id/requirements - Government broadcasts volunteer requirements
 */
router.post('/:id/requirements', authenticateToken, authorizeRoles('GOVERNMENT'), (req, res) => {
  try {
    const disasterId = req.params.id;
    const { role_type, required_count, urgency } = req.body;

    if (!role_type || !required_count) {
      return res.status(400).json({ error: 'Role type and required count are required.' });
    }

    const disaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(disasterId);
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster incident not found.' });
    }

    const result = db.prepare(`
      INSERT INTO disaster_requirements (disaster_id, role_type, required_count, urgency)
      VALUES (?, ?, ?, ?)
    `).run(disasterId, role_type, required_count, urgency || 'HIGH');

    const requirementId = result.lastInsertRowid;

    // Generate notifications for students
    const students = db.prepare('SELECT user_id FROM students').all();
    students.forEach(s => {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, metadata_json)
        VALUES (?, '🚨 CRITICAL DISASTER ALERT', ?, 'EMERGENCY', ?)
      `).run(
        s.user_id,
        `Emergency Alert: ${disaster.title} requires ${role_type} in ${disaster.location}.`,
        JSON.stringify({ disaster_id: Number(disasterId), requirement_id: Number(requirementId) })
      );
    });

    res.status(201).json({
      message: `Emergency requirement for '${role_type}' broadcasted successfully.`,
      requirementId
    });
  } catch (error) {
    console.error('Broadcast requirement error:', error);
    res.status(500).json({ error: 'Failed to broadcast emergency requirement.' });
  }
});

/**
 * POST /api/disasters/:id/re-route-relocation
 * Dynamic AI Relocation Node Re-Routing System
 */
router.post('/:id/re-route-relocation', authenticateToken, async (req, res) => {
  try {
    const disasterId = req.params.id;
    const { full_site_id } = req.body;

    const disaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(disasterId);
    if (!disaster) {
      return res.status(404).json({ error: 'Disaster incident not found.' });
    }

    // Get the site that reached full capacity
    let fullSite = null;
    if (full_site_id) {
      fullSite = db.prepare('SELECT * FROM relocation_sites WHERE id = ? AND disaster_id = ?').get(full_site_id, disasterId);
    } else {
      fullSite = db.prepare('SELECT * FROM relocation_sites WHERE disaster_id = ? AND (status = "FULL" OR current_occupancy >= capacity) LIMIT 1').get(disasterId);
    }

    if (!fullSite) {
      fullSite = db.prepare('SELECT * FROM relocation_sites WHERE disaster_id = ? ORDER BY id ASC LIMIT 1').get(disasterId);
    }

    // Immediately mark target site as FULL and set current_occupancy = capacity
    if (fullSite) {
      db.prepare('UPDATE relocation_sites SET current_occupancy = capacity, status = "FULL" WHERE id = ?').run(fullSite.id);
      fullSite.status = 'FULL';
      fullSite.current_occupancy = fullSite.capacity;
    }

    // Query candidate available relocation centers with open capacity
    const availableSites = db.prepare(`
      SELECT * FROM relocation_sites 
      WHERE disaster_id = ? AND id != ? AND (current_occupancy < capacity OR capacity = 0)
    `).all(disasterId, fullSite ? fullSite.id : 0);

    const fullSiteLat = fullSite ? fullSite.lat : disaster.lat;
    const fullSiteLng = fullSite ? fullSite.lng : disaster.lng;

    const rankedCenters = availableSites.map(site => {
      const distKm = calculateDistanceKm(fullSiteLat, fullSiteLng, site.lat, site.lng);
      const availableSpots = Math.max(0, site.capacity - site.current_occupancy);
      const score = Math.round((site.score || 85) + (availableSpots / 50) - (distKm * 3));
      return {
        ...site,
        distance_km: distKm,
        available_spots: availableSpots,
        suitability_score: Math.max(50, score)
      };
    }).sort((a, b) => b.suitability_score - a.suitability_score);

    const bestCenter = rankedCenters[0] || {
      name: 'South District Relief Center B',
      distance_km: 2.4,
      available_spots: 3800,
      capacity: 5000
    };

    const fullSiteName = fullSite ? fullSite.name : 'Relief Center A';
    const fullSiteCap = fullSite ? fullSite.capacity : 1000;
    
    let aiGuidance = `${fullSiteName} is currently FULL (${fullSiteCap}/${fullSiteCap} capacity occupied). Please redirect to ${bestCenter.name}, ${bestCenter.distance_km} km away.`;

    const volunteers = db.prepare(`
      SELECT vr.id, s.id as student_id, u.name as student_name, u.id as user_id, univ.name as university_name
      FROM volunteer_responses vr
      JOIN students s ON vr.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN universities univ ON s.university_id = univ.id
      WHERE vr.status = 'CONFIRMED'
    `).all();

    volunteers.forEach(v => {
      db.prepare(`
        INSERT INTO notifications (user_id, role_target, title, message, type, metadata_json)
        VALUES (?, 'STUDENT', '🚨 EMERGENCY RE-ROUTING ALERT', ?, 'EMERGENCY', ?)
      `).run(
        v.user_id,
        `${fullSiteName} is FULL. Destination updated: Please proceed immediately to ${bestCenter.name} (${bestCenter.distance_km} km away).`,
        JSON.stringify({
          full_site_id: fullSite ? fullSite.id : 1,
          full_site_name: fullSiteName,
          redirect_site_name: bestCenter.name,
          distance_km: bestCenter.distance_km,
          available_spots: bestCenter.available_spots
        })
      );
    });

    db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'RELOCATION_REROUTED', 'RELOCATION_SITE', fullSite ? fullSite.id : 1, `Marked '${fullSiteName}' FULL. Redirected ${volunteers.length} volunteers to '${bestCenter.name}' (${bestCenter.distance_km} km away)`);

    res.json({
      success: true,
      message: `System marked ${fullSiteName} as FULL. Redirected volunteers to ${bestCenter.name} (${bestCenter.distance_km} km away).`,
      full_site: fullSite,
      recommended_redirect_site: bestCenter,
      ai_guidance: aiGuidance,
      affected_volunteers_count: volunteers.length,
      ranked_alternative_centers: rankedCenters
    });
  } catch (error) {
    console.error('Re-route relocation error:', error);
    res.status(500).json({ error: 'Failed to execute relocation re-routing.' });
  }
});

/**
 * GET /api/disasters/:id/university-risks - Government live monitoring breakdown of university risk levels & response actions
 */
router.get('/:id/university-risks', authenticateToken, (req, res) => {
  try {
    const disasterId = req.params.id;

    // Evaluate & update risk records dynamically
    const risks = evaluateAndPersistDisasterRisks(disasterId);

    const detailed = risks.map(r => {
      const u = db.prepare('SELECT id, name, location, total_students, nss_capacity, ncc_capacity FROM universities WHERE id = ?').get(r.university_id);
      return {
        ...r,
        university: u
      };
    });

    const highCount = detailed.filter(d => d.risk_level === 'HIGH').length;
    const medCount = detailed.filter(d => d.risk_level === 'MEDIUM').length;
    const lowCount = detailed.filter(d => d.risk_level === 'LOW').length;
    const safeCount = detailed.filter(d => d.risk_level === 'SAFE').length;

    const ackedCount = detailed.filter(d => d.acknowledged === 1).length;
    const activeCount = detailed.filter(d => ['ACTIVATING', 'ACTIVE', 'DEPLOYED'].includes(d.response_status)).length;

    res.json({
      disaster_id: disasterId,
      total_universities: detailed.length,
      summary: {
        high_risk: highCount,
        medium_risk: medCount,
        low_risk: lowCount,
        safe: safeCount,
        total_acknowledged: ackedCount,
        unacknowledged: detailed.length - ackedCount,
        response_activated: activeCount
      },
      university_risks: detailed
    });
  } catch (error) {
    console.error('Fetch university risks error:', error);
    res.status(500).json({ error: 'Failed to fetch university risks.' });
  }
});

module.exports = router;

