const db = require('../../config/db');
const { evaluateAndPersistDisasterRisks } = require('./universityRiskEngine');
const { sendTargetedDisasterNotifications } = require('./disasterAlertNotificationService');

/**
 * Seed default official data sources idempotently
 */
async function initializeOfficialSources() {
  if (db.initPromise) {
    await db.initPromise;
  }
  const defaultSources = [
    {
      name: 'India Meteorological Department (IMD)',
      department: 'Ministry of Earth Sciences, Govt of India',
      type: 'WEATHER',
      endpoint_ref: 'https://api.imd.gov.in/v1/alerts',
      trust_level: 'OFFICIAL_CRITICAL',
      polling_interval_mins: 15
    },
    {
      name: 'National Disaster Management Authority (NDMA)',
      department: 'Ministry of Home Affairs, Govt of India',
      type: 'DISASTER_MGMT',
      endpoint_ref: 'https://ndma.gov.in/api/v1/emergency-alerts',
      trust_level: 'OFFICIAL_CRITICAL',
      polling_interval_mins: 10
    },
    {
      name: 'State Disaster Management Authority (SDMA)',
      department: 'State Revenue & Disaster Mgmt Dept',
      type: 'CYCLONE',
      endpoint_ref: 'https://sdma.state.gov.in/api/feed',
      trust_level: 'OFFICIAL_HIGH',
      polling_interval_mins: 15
    },
    {
      name: 'District Administration Emergency Operations',
      department: 'District Collectorate Office',
      type: 'FLOOD',
      endpoint_ref: 'https://district.gov.in/deoc/feed',
      trust_level: 'OFFICIAL_HIGH',
      polling_interval_mins: 10
    },
    {
      name: 'Official Severe Weather Advisory Feed',
      department: 'Central Water Commission (CWC)',
      type: 'FLOOD',
      endpoint_ref: 'https://cwc.gov.in/api/flood-warnings',
      trust_level: 'AUTHORIZED_MEDIUM',
      polling_interval_mins: 20
    }
  ];

  for (const src of defaultSources) {
    try {
      const existing = db.prepare('SELECT id FROM disaster_sources WHERE name = ?').get(src.name);
      if (!existing) {
        db.prepare(`
          INSERT INTO disaster_sources (name, department, type, endpoint_ref, trust_level, polling_interval_mins, enabled)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `).run(src.name, src.department, src.type, src.endpoint_ref, src.trust_level, src.polling_interval_mins);
      }
    } catch (e) {
      console.warn('[INGESTION] Source seed notice:', e.message);
    }
  }
}

/**
 * Normalizes an external raw alert payload into SANKALP standard external alert format
 */
function normalizeExternalAlert(rawAlert, sourceName) {
  const extId = rawAlert.external_alert_id || rawAlert.id || `ALERT_${Date.now()}_${Math.floor(Math.random()*1000)}`;
  const alertType = rawAlert.alert_type || rawAlert.type || 'Flood';
  const title = rawAlert.title || `Official ${alertType} Warning`;
  const description = rawAlert.description || `Official advisory issued for ${alertType}.`;
  const severity = (rawAlert.severity || 'HIGH').toUpperCase();
  const lat = Number(rawAlert.lat) || 28.6139;
  const lng = Number(rawAlert.lng) || 77.2090;
  const affectedRadius = Number(rawAlert.affected_radius_km) || 15.0;

  return {
    source_name: sourceName,
    external_alert_id: extId,
    alert_type: alertType,
    title,
    description,
    severity,
    issued_at: rawAlert.issued_at || new Date().toISOString(),
    expires_at: rawAlert.expires_at || new Date(Date.now() + 86400000).toISOString(),
    lat,
    lng,
    affected_radius_km: affectedRadius,
    raw_metadata_json: JSON.stringify(rawAlert),
    normalized_data_json: JSON.stringify({ sourceName, extId, alertType, title, severity, lat, lng, affectedRadius }),
    validation_status: 'VALIDATED',
    review_status: 'PENDING_REVIEW'
  };
}

/**
 * Ingests external alert payload safely into SQLite with deduplication & multi-source correlation
 */
function ingestExternalAlert(rawAlert, sourceName = 'India Meteorological Department (IMD)') {
  const norm = normalizeExternalAlert(rawAlert, sourceName);

  // DEDUPLICATION: check (source_name, external_alert_id)
  const existing = db.prepare(`
    SELECT * FROM external_alerts WHERE source_name = ? AND external_alert_id = ?
  `).get(norm.source_name, norm.external_alert_id);

  if (existing) {
    console.log(`[INGESTION] Deduplicated duplicate alert: ${norm.source_name} / ${norm.external_alert_id}`);
    return { isDuplicate: true, alertId: existing.id, alert: existing };
  }

  // Multi-source correlation & source conflict check
  let validationStatus = 'VALIDATED';
  let conflictNotes = null;

  const nearbyAlerts = db.prepare(`
    SELECT * FROM external_alerts 
    WHERE review_status = 'PENDING_REVIEW' AND alert_type = ? AND id != 0
  `).all(norm.alert_type);

  for (const n of nearbyAlerts) {
    // If severity or location significantly conflicts
    if (n.severity !== norm.severity && Math.abs(n.lat - norm.lat) < 0.1 && Math.abs(n.lng - norm.lng) < 0.1) {
      validationStatus = 'CONFLICT';
      conflictNotes = `Source disagreement detected: '${sourceName}' reported severity '${norm.severity}' while '${n.source_name}' reported severity '${n.severity}'. Government review required.`;
      break;
    }
  }

  const stmt = db.prepare(`
    INSERT INTO external_alerts (
      source_id, source_name, external_alert_id, alert_type, title, description, severity,
      issued_at, expires_at, lat, lng, affected_radius_km, raw_metadata_json, normalized_data_json,
      validation_status, review_status, conflict_notes
    ) VALUES (
      (SELECT id FROM disaster_sources WHERE name = ? LIMIT 1), ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, 'PENDING_REVIEW', ?
    )
  `);

  const res = stmt.run(
    norm.source_name,
    norm.source_name,
    norm.external_alert_id,
    norm.alert_type,
    norm.title,
    norm.description,
    norm.severity,
    norm.issued_at,
    norm.expires_at,
    norm.lat,
    norm.lng,
    norm.affected_radius_km,
    norm.raw_metadata_json,
    norm.normalized_data_json,
    validationStatus,
    conflictNotes
  );

  const newAlert = db.prepare('SELECT * FROM external_alerts WHERE id = ?').get(res.lastInsertRowid);

  // Update source sync metadata
  db.prepare('UPDATE disaster_sources SET last_sync_at = CURRENT_TIMESTAMP, last_status = "SUCCESS", last_alert_at = CURRENT_TIMESTAMP WHERE name = ?')
    .run(norm.source_name);

  return { isDuplicate: false, alertId: res.lastInsertRowid, alert: newAlert };
}

/**
 * Government Confirms an External Alert -> Creates Normalized Disaster & Runs Early Warning Pipeline
 */
function confirmAlertAndCreateDisaster(alertId, governmentUserId, overrides = {}) {
  const alert = db.prepare('SELECT * FROM external_alerts WHERE id = ?').get(alertId);
  if (!alert) {
    throw new Error('External alert record not found.');
  }

  const title = overrides.title || alert.title;
  const type = overrides.type || alert.alert_type;
  const location = overrides.location || `District Region (${alert.lat.toFixed(2)}, ${alert.lng.toFixed(2)})`;
  const severity = overrides.severity || alert.severity;
  const radius = overrides.affected_radius_km || alert.affected_radius_km || 15.0;

  // Insert normalized disaster record
  const stmt = db.prepare(`
    INSERT INTO disasters (
      title, type, location, lat, lng, severity, affected_population, vulnerable_population,
      hazard_info, status, affected_radius_km, confirmed_by, confirmed_at, source_name, source_alert_id, verification_status,
      is_simulation, simulation_id
    ) VALUES (
      ?, ?, ?, ?, ?, ?, 45000, 8500,
      ?, 'RESPONSE_ACTIVE', ?, ?, CURRENT_TIMESTAMP, ?, ?, 'GOVERNMENT_CONFIRMED',
      ?, ?
    )
  `);

  const res = stmt.run(
    title,
    type,
    location,
    alert.lat,
    alert.lng,
    severity,
    alert.description,
    radius,
    governmentUserId,
    alert.source_name,
    alert.external_alert_id,
    alert.is_simulation || 0,
    alert.simulation_id || null
  );

  const disasterId = res.lastInsertRowid;

  // Update external alert review status
  db.prepare(`
    UPDATE external_alerts 
    SET review_status = 'CONFIRMED', linked_disaster_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(disasterId, alertId);

  // Add default volunteer requirements for the disaster
  const defaultReqs = [
    { role: 'Medical Support', count: 10, urgency: 'CRITICAL' },
    { role: 'Relief Operations', count: 40, urgency: 'HIGH' },
    { role: 'Technical / GIS', count: 15, urgency: 'HIGH' }
  ];

  for (const req of defaultReqs) {
    db.prepare(`
      INSERT INTO disaster_requirements (disaster_id, role_type, required_count, fulfilled_count, urgency)
      VALUES (?, ?, ?, 0, ?)
    `).run(disasterId, req.role, req.count, req.urgency);
  }

  // Add default relocation sites
  db.prepare(`
    INSERT INTO relocation_sites (disaster_id, name, location, lat, lng, capacity, current_occupancy, hospital_distance_km, road_status, risk_level, score, status)
    VALUES 
    (?, 'Relocation Site Alpha (District Sports Complex)', 'North Sector', ?, ?, 5000, 0, 3.2, 'OPEN', 'LOW', 95, 'APPROVED'),
    (?, 'Relocation Site Beta (Community Center B)', 'East Sector', ?, ?, 3500, 0, 5.1, 'OPEN', 'LOW', 88, 'APPROVED')
  `).run(disasterId, alert.lat + 0.02, alert.lng + 0.02, disasterId, alert.lat - 0.03, alert.lng + 0.03);

  // 1. Run Deterministic University Risk Engine
  const risks = evaluateAndPersistDisasterRisks(disasterId);

  // Tag risks with is_simulation & simulation_id if applicable
  if (alert.is_simulation && alert.simulation_id) {
    db.prepare(`
      UPDATE university_disaster_risks
      SET is_simulation = 1, simulation_id = ?
      WHERE disaster_id = ?
    `).run(alert.simulation_id, disasterId);
  }

  // 2. Broadcast Targeted Notifications
  sendTargetedDisasterNotifications(disasterId, risks);
  if (alert.is_simulation && alert.simulation_id) {
    db.prepare(`
      UPDATE notifications
      SET is_simulation = 1, simulation_id = ?
      WHERE is_simulation = 0
    `).run(alert.simulation_id);
  }

  // 3. Log Audit Event
  db.prepare('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, is_simulation, simulation_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(
      governmentUserId,
      'ALERT_CONFIRMED_DISASTER_CREATED',
      'DISASTER',
      disasterId,
      `Government confirmed alert #${alertId} from '${alert.source_name}' as active disaster '${title}'`,
      alert.is_simulation || 0,
      alert.simulation_id || null
    );

  return {
    disasterId,
    disaster: db.prepare('SELECT * FROM disasters WHERE id = ?').get(disasterId),
    universityRisks: risks
  };
}

module.exports = {
  initializeOfficialSources,
  normalizeExternalAlert,
  ingestExternalAlert,
  confirmAlertAndCreateDisaster
};
