const db = require('../../config/db');

/**
 * Creates targeted emergency notifications for universities based on calculated risk levels.
 */
function sendTargetedDisasterNotifications(disasterId, risks = []) {
  const disaster = db.prepare('SELECT * FROM disasters WHERE id = ?').get(disasterId);
  if (!disaster) return;

  for (const r of risks) {
    // Fetch university admin/faculty users
    const univUsers = db.prepare('SELECT id FROM users WHERE university_id = ? AND role IN ("UNIVERSITY_ADMIN", "FACULTY", "STUDENT")').all(r.university_id);

    let title = '🟢 DISASTER ADVISORY MONITORING';
    let type = 'INFO';
    if (r.risk_level === 'HIGH') {
      title = '🚨 EMERGENCY ALERT: HIGH RISK - IMMEDIATE ACTION REQUIRED';
      type = 'EMERGENCY';
    } else if (r.risk_level === 'MEDIUM') {
      title = '🟠 DISASTER PREPARATION ALERT: MEDIUM RISK';
      type = 'EMERGENCY';
    }

    const metadataJson = JSON.stringify({
      disaster_id: Number(disasterId),
      university_id: Number(r.university_id),
      risk_level: r.risk_level,
      distance_km: r.distance_km,
      action_required: r.action_required
    });

    for (const u of univUsers) {
      // Deduplicate: check if notification already sent for this disaster + user + risk_level
      const existingNotif = db.prepare(`
        SELECT id FROM notifications 
        WHERE user_id = ? AND metadata_json LIKE ?
      `).get(u.id, `%"disaster_id":${disasterId}%"risk_level":"${r.risk_level}"%`);

      if (!existingNotif) {
        db.prepare(`
          INSERT INTO notifications (user_id, role_target, title, message, type, metadata_json)
          VALUES (?, 'UNIVERSITY_ADMIN', ?, ?, ?, ?)
        `).run(
          u.id,
          title,
          `Official Alert for '${disaster.title}': ${r.risk_reason}`,
          type,
          metadataJson
        );
      }
    }
  }
}

/**
 * Checks for unacknowledged HIGH-risk alerts and escalates them if threshold exceeded.
 */
function checkAndEscalateUnacknowledgedAlerts(disasterId) {
  const unackedHighRisks = db.prepare(`
    SELECT udr.*, u.name as university_name
    FROM university_disaster_risks udr
    JOIN universities u ON udr.university_id = u.id
    WHERE udr.disaster_id = ? AND udr.risk_level = 'HIGH' AND udr.acknowledged = 0
  `).all(disasterId);

  const escalations = [];

  for (const item of unackedHighRisks) {
    // Flag action_required and record escalation notice
    db.prepare('UPDATE university_disaster_risks SET action_required = 1 WHERE id = ?').run(item.id);

    // Notify admins with urgent escalation
    const admins = db.prepare('SELECT id FROM users WHERE university_id = ? AND role IN ("UNIVERSITY_ADMIN", "FACULTY")').all(item.university_id);
    for (const a of admins) {
      db.prepare(`
        INSERT INTO notifications (user_id, role_target, title, message, type, metadata_json)
        VALUES (?, 'UNIVERSITY_ADMIN', '⚠️ URGENT ESCALATION: UNACKNOWLEDGED HIGH-RISK ALERT', ?, 'EMERGENCY', ?)
      `).run(
        a.id,
        `CRITICAL ESCALATION: High-risk disaster alert #${disasterId} requires immediate university acknowledgement and response team activation.`,
        JSON.stringify({ disaster_id: Number(disasterId), university_id: Number(item.university_id), escalated: true })
      );
    }
    escalations.push(item);
  }

  return escalations;
}

module.exports = {
  sendTargetedDisasterNotifications,
  checkAndEscalateUnacknowledgedAlerts
};
