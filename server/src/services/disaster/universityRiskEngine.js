const db = require('../../config/db');

/**
 * Haversine Distance Calculator (in kilometers)
 */
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
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
 * Deterministic University Risk Engine
 * Calculates risk level (HIGH, MEDIUM, LOW, SAFE), impact zone status, exact distance,
 * and un-hallucinated reason text.
 */
function calculateUniversityRisk(disasterOrAlert, university) {
  const dLat = disasterOrAlert.lat || 28.6139;
  const dLng = disasterOrAlert.lng || 77.2090;
  const uLat = university.lat || 28.6139;
  const uLng = university.lng || 77.2090;

  const distanceKm = calculateDistanceKm(dLat, dLng, uLat, uLng);
  const impactRadius = disasterOrAlert.affected_radius_km || 15.0;
  const insideImpactZone = distanceKm <= impactRadius;
  const severity = (disasterOrAlert.severity || 'HIGH').toUpperCase();
  const type = disasterOrAlert.type || disasterOrAlert.alert_type || 'Flood Emergency';

  let riskLevel = 'SAFE';
  let actionRequired = false;
  let reason = '';

  if (insideImpactZone || (distanceKm < 15.0 && (severity === 'CRITICAL' || severity === 'HIGH'))) {
    riskLevel = 'HIGH';
    actionRequired = true;
    reason = `University is inside the declared ${type} impact zone (${distanceKm} km from reported epicenter; radius ${impactRadius} km). Immediate response team activation and emergency acknowledgement required.`;
  } else if (distanceKm <= 35.0 || (distanceKm <= 50.0 && severity === 'CRITICAL')) {
    riskLevel = 'MEDIUM';
    actionRequired = false;
    reason = `University is ${distanceKm} km from the ${type} incident area. Prepare response teams, review equipment readiness, and monitor official updates.`;
  } else if (distanceKm <= 75.0) {
    riskLevel = 'LOW';
    actionRequired = false;
    reason = `University is ${distanceKm} km from incident center. Outside immediate impact zone; remain on advisory monitoring.`;
  } else {
    riskLevel = 'SAFE';
    actionRequired = false;
    reason = `University is located ${distanceKm} km from incident area and unaffected by immediate hazard conditions.`;
  }

  return {
    university_id: university.id,
    university_name: university.name,
    risk_level: riskLevel,
    distance_km: distanceKm,
    inside_impact_zone: insideImpactZone,
    impact_radius_km: impactRadius,
    action_required: actionRequired ? 1 : 0,
    risk_reason: reason
  };
}

/**
 * Re-evaluates risk classifications for all universities for a specific disaster
 * and persists the results in university_disaster_risks.
 */
function evaluateAndPersistDisasterRisks(disasterId) {
  const disaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(disasterId);
  if (!disaster) return [];

  const universities = db.prepare('SELECT * FROM universities').all();
  const evaluated = [];

  for (const univ of universities) {
    const risk = calculateUniversityRisk(disaster, univ);

    // Persist or update in university_disaster_risks
    const existing = db.prepare('SELECT id, acknowledged, response_status FROM university_disaster_risks WHERE disaster_id = ? AND university_id = ?').get(disasterId, univ.id);

    if (existing) {
      db.prepare(`
        UPDATE university_disaster_risks SET
          risk_level = ?,
          distance_km = ?,
          inside_impact_zone = ?,
          risk_reason = ?,
          action_required = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        risk.risk_level,
        risk.distance_km,
        risk.inside_impact_zone ? 1 : 0,
        risk.risk_reason,
        risk.action_required,
        existing.id
      );
      evaluated.push({ ...risk, id: existing.id, acknowledged: existing.acknowledged, response_status: existing.response_status });
    } else {
      const res = db.prepare(`
        INSERT INTO university_disaster_risks (
          disaster_id, university_id, risk_level, distance_km, inside_impact_zone, risk_reason, action_required, response_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'NOT_ACTIVATED')
      `).run(
        disasterId,
        univ.id,
        risk.risk_level,
        risk.distance_km,
        risk.inside_impact_zone ? 1 : 0,
        risk.risk_reason,
        risk.action_required
      );
      evaluated.push({ ...risk, id: res.lastInsertRowid, acknowledged: 0, response_status: 'NOT_ACTIVATED' });
    }
  }

  return evaluated;
}

module.exports = {
  calculateDistanceKm,
  calculateUniversityRisk,
  evaluateAndPersistDisasterRisks
};
