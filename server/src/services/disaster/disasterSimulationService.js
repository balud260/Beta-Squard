const db = require('../../config/db');
const { evaluateAndPersistDisasterRisks } = require('./universityRiskEngine');
const { sendTargetedDisasterNotifications } = require('./disasterAlertNotificationService');

const PRESET_SCENARIOS = {
  vijayawada_flood: {
    key: 'vijayawada_flood',
    title: 'Vijayawada Regional Flood Emergency',
    type: 'Flood',
    severity: 'CRITICAL',
    location: 'Vijayawada-Krishna Basin Region',
    latitude: 28.6139,
    longitude: 77.2090,
    affected_radius_km: 120.0,
    description: 'Extremely heavy rainfall causing rapid surge in Krishna river water levels. High flood inundation expected across Vijayawada, Guntur, and downstream coastal districts.',
    source_name: 'India Meteorological Department (IMD) [SIMULATED OFFICIAL FEED]',
    external_alert_id: 'IMD-FLOOD-VJ-2026'
  },
  ap_cyclone: {
    key: 'ap_cyclone',
    title: 'Andhra Pradesh Coastal Cyclone Warning',
    type: 'Cyclone',
    severity: 'HIGH',
    location: 'Visakhapatnam-Kakinada Coastal Belt',
    latitude: 28.6139,
    longitude: 77.2090,
    affected_radius_km: 150.0,
    description: 'Category 3 severe cyclonic storm approaching north coastal Andhra Pradesh with wind speeds exceeding 120 km/h and heavy tidal storm surge.',
    source_name: 'State Disaster Management Authority (SDMA) [SIMULATED OFFICIAL FEED]',
    external_alert_id: 'SDMA-CYCLONE-AP-2026'
  },
  urban_industrial: {
    key: 'urban_industrial',
    title: 'Urban Industrial Chemical Incident',
    type: 'Industrial Accident',
    severity: 'CRITICAL',
    location: 'Cuttack-Choudwar Industrial Corridor',
    latitude: 28.6139,
    longitude: 77.2090,
    affected_radius_km: 80.0,
    description: 'Hazardous chemical container leak reported at industrial processing plant. Airborne plume dispersion and localized evacuation advisories issued.',
    source_name: 'District Administration Emergency Operations [SIMULATED OFFICIAL FEED]',
    external_alert_id: 'DEOC-IND-INC-2026'
  }
};

/**
 * Return list of available simulation scenarios
 */
function getSimulationScenarios() {
  return Object.values(PRESET_SCENARIOS);
}

/**
 * Start a new Disaster Simulation Exercise
 */
function startSimulation(scenarioKey = 'vijayawada_flood', mode = 'FAST', customConfig = {}, userId = 1) {
  const preset = PRESET_SCENARIOS[scenarioKey] || PRESET_SCENARIOS.vijayawada_flood;
  
  const simulationId = `SIM_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const title = customConfig.title || preset.title;
  const type = customConfig.type || preset.type;
  const severity = customConfig.severity || preset.severity;
  const location = customConfig.location || preset.location;
  const lat = Number(customConfig.latitude || preset.latitude);
  const lng = Number(customConfig.longitude || preset.longitude);
  const radius = Number(customConfig.affected_radius_km || preset.affected_radius_km);
  const description = customConfig.description || preset.description;
  const sourceName = preset.source_name;
  const externalAlertId = `${preset.external_alert_id}_${Date.now()}`;

  // 1. Create simulated external alert in PENDING_REVIEW
  const alertStmt = db.prepare(`
    INSERT INTO external_alerts (
      source_id, source_name, external_alert_id, alert_type, title, description, severity,
      issued_at, expires_at, lat, lng, affected_radius_km, raw_metadata_json, normalized_data_json,
      validation_status, review_status, is_simulation, simulation_id
    ) VALUES (
      1, ?, ?, ?, ?, ?, ?,
      CURRENT_TIMESTAMP, DATETIME('now', '+2 days'), ?, ?, ?, ?, ?,
      'VALIDATED', 'PENDING_REVIEW', 1, ?
    )
  `);

  const rawMetadata = JSON.stringify({ mode, exercise_note: 'SIMULATION — NOT A LIVE EMERGENCY' });
  const normalizedData = JSON.stringify({ sourceName, externalAlertId, type, title, severity, lat, lng, radius });

  const alertRes = alertStmt.run(
    sourceName,
    externalAlertId,
    type,
    title,
    description,
    severity,
    lat,
    lng,
    radius,
    rawMetadata,
    normalizedData,
    simulationId
  );

  const alertId = alertRes.lastInsertRowid;

  // 2. Add audit log
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, is_simulation, simulation_id)
    VALUES (?, 'SIMULATION_STARTED', 'EXTERNAL_ALERT', ?, ?, 1, ?)
  `).run(userId, alertId, `Disaster simulation '${title}' started (Mode: ${mode})`, simulationId);

  return {
    simulationId,
    mode,
    alertId,
    scenario: {
      title,
      type,
      severity,
      location,
      lat,
      lng,
      affected_radius_km: radius,
      source_name: sourceName
    }
  };
}

/**
 * Fetch current state & timeline audit logs for a simulation exercise
 */
function getSimulationStatus(simulationId) {
  const alert = db.prepare('SELECT * FROM external_alerts WHERE simulation_id = ? AND is_simulation = 1 ORDER BY id DESC LIMIT 1').get(simulationId);
  const disaster = db.prepare('SELECT * FROM disasters WHERE simulation_id = ? AND is_simulation = 1 ORDER BY id DESC LIMIT 1').get(simulationId);
  
  let universityRisks = [];
  if (disaster) {
    universityRisks = db.prepare(`
      SELECT r.*, u.name as university_name, u.location as university_location, u.lat as university_lat, u.lng as university_lng
      FROM university_disaster_risks r
      JOIN universities u ON r.university_id = u.id
      WHERE r.simulation_id = ?
      ORDER BY 
        CASE r.risk_level 
          WHEN 'HIGH' THEN 1 
          WHEN 'MEDIUM' THEN 2 
          WHEN 'LOW' THEN 3 
          ELSE 4 
        END, r.distance_km ASC
    `).all(simulationId);
  }

  const timeline = db.prepare(`
    SELECT *, timestamp as created_at FROM audit_logs WHERE simulation_id = ? ORDER BY id ASC
  `).all(simulationId);

  return {
    simulationId,
    alert,
    disaster,
    universityRisks,
    timeline,
    riskSummary: {
      total: universityRisks.length,
      high: universityRisks.filter(r => r.risk_level === 'HIGH').length,
      medium: universityRisks.filter(r => r.risk_level === 'MEDIUM').length,
      low: universityRisks.filter(r => r.risk_level === 'LOW').length,
      safe: universityRisks.filter(r => r.risk_level === 'SAFE').length,
      acknowledged: universityRisks.filter(r => r.acknowledged === 1).length,
      responseActivated: universityRisks.filter(r => r.response_status === 'ACTIVE' || r.response_status === 'ACTIVATING').length
    }
  };
}

/**
 * Escalate Simulation Severity (e.g. HIGH -> CRITICAL)
 */
function escalateSimulation(simulationId, newSeverity = 'CRITICAL', userId = 1) {
  const disaster = db.prepare('SELECT * FROM disasters WHERE simulation_id = ? AND is_simulation = 1').get(simulationId);
  if (!disaster) {
    throw new Error('Active simulation disaster record not found.');
  }

  // Update severity on disaster & alert
  db.prepare('UPDATE disasters SET severity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newSeverity, disaster.id);
  db.prepare('UPDATE external_alerts SET severity = ?, updated_at = CURRENT_TIMESTAMP WHERE simulation_id = ?').run(newSeverity, simulationId);

  // Recalculate university risks
  const newRisks = evaluateAndPersistDisasterRisks(disaster.id);
  
  // Tag simulation_id on new/updated risks
  db.prepare('UPDATE university_disaster_risks SET is_simulation = 1, simulation_id = ? WHERE disaster_id = ?').run(simulationId, disaster.id);

  // Send immediate notifications to upgraded high-risk universities
  sendTargetedDisasterNotifications(disaster.id, newRisks);
  db.prepare('UPDATE notifications SET is_simulation = 1, simulation_id = ? WHERE is_simulation = 0').run(simulationId);

  db.prepare(`
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, is_simulation, simulation_id)
    VALUES (?, 'SIMULATION_ESCALATED', 'DISASTER', ?, ?, 1, ?)
  `).run(userId, disaster.id, `Simulation severity escalated to '${newSeverity}'`, simulationId);

  return getSimulationStatus(simulationId);
}

/**
 * Safely reset an exercise, deleting ONLY records tagged with simulation_id
 */
function resetSimulation(simulationId, userId = 1) {
  db.prepare('DELETE FROM university_disaster_risks WHERE simulation_id = ? AND is_simulation = 1').run(simulationId);
  db.prepare('DELETE FROM notifications WHERE simulation_id = ? AND is_simulation = 1').run(simulationId);
  db.prepare('DELETE FROM external_alerts WHERE simulation_id = ? AND is_simulation = 1').run(simulationId);
  db.prepare('DELETE FROM disasters WHERE simulation_id = ? AND is_simulation = 1').run(simulationId);
  db.prepare('DELETE FROM audit_logs WHERE simulation_id = ? AND is_simulation = 1').run(simulationId);

  return {
    message: `Simulation exercise '${simulationId}' reset cleanly. All associated simulation records purged.`,
    simulationId
  };
}

/**
 * Generate final Exercise Report summary
 */
function getExerciseReport(simulationId) {
  const status = getSimulationStatus(simulationId);
  const auditLogs = status.timeline || [];

  return {
    simulationId,
    isComplete: true,
    scenarioTitle: status.alert ? status.alert.title : 'Disaster Exercise',
    disasterId: status.disaster ? status.disaster.id : null,
    sourceName: status.alert ? status.alert.source_name : 'Simulated Feed',
    severity: status.disaster ? status.disaster.severity : (status.alert ? status.alert.severity : 'CRITICAL'),
    impactSummary: status.riskSummary,
    universityRisks: status.universityRisks,
    auditTrail: auditLogs,
    created_at: status.alert ? status.alert.created_at : new Date().toISOString()
  };
}

module.exports = {
  PRESET_SCENARIOS,
  getSimulationScenarios,
  startSimulation,
  getSimulationStatus,
  escalateSimulation,
  resetSimulation,
  getExerciseReport
};
