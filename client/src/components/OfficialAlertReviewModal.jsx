import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Copy, MapPin, Radio, Clock, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function OfficialAlertReviewModal({ alert, onClose, onConfirmSuccess, onActionComplete }) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [conflictNotes, setConflictNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!alert) return null;

  async function handleConfirmAlert() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.confirmAlert(alert.id, { conflict_notes: conflictNotes || 'Government confirmed official disaster alert.' });
      setSubmitting(false);
      setShowConfirmDialog(false);
      if (onConfirmSuccess) onConfirmSuccess(res);
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to confirm alert.');
      setSubmitting(false);
    }
  }

  async function handleRejectAlert() {
    setSubmitting(true);
    setError(null);
    try {
      await api.rejectAlert(alert.id, { reason: 'Government marked alert as non-actionable.' });
      setSubmitting(false);
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to reject alert.');
      setSubmitting(false);
    }
  }

  async function handleMarkDuplicate() {
    setSubmitting(true);
    setError(null);
    try {
      await api.markDuplicateAlert(alert.id, {});
      setSubmitting(false);
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to mark alert duplicate.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto"
        style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div style={{ backgroundColor: 'var(--navy)', color: '#FFFFFF', padding: '1.25rem 1.5rem', borderBottom: '2px solid var(--terracotta)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                <Radio size={20} color="#FFFFFF" className="spin" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>OFFICIAL EMERGENCY ALERT REVIEW</h3>
                  <span style={{ backgroundColor: 'var(--terracotta)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                    {alert.review_status || 'PENDING_REVIEW'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', margin: '0.2rem 0 0 0' }}>
                  Government Authorization Required Before Public Emergency Declaration
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
              <XCircle size={22} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }} className="space-y-4">
          {error && (
            <div style={{ backgroundColor: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', color: 'var(--status-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Source Banner */}
          <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ISSUING SOURCE</span>
              <span className="badge badge-navy" style={{ fontSize: '0.65rem' }}>
                {alert.is_simulation ? 'SIMULATED OFFICIAL FEED' : 'OFFICIAL VERIFIED FEED'}
              </span>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Shield size={16} color="var(--terracotta)" />
              <span>{alert.source_name}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'flex', gap: '1rem' }}>
              <span>Issued: <strong>{new Date(alert.issued_at || Date.now()).toLocaleTimeString()}</strong></span>
              <span>Ref ID: <code style={{ color: 'var(--navy)' }}>{alert.external_alert_id}</code></span>
            </div>
          </div>

          {/* Alert Details */}
          <div className="card" style={{ padding: '1rem', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ALERT EVENT TITLE</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy)', margin: '0.2rem 0 0 0' }}>{alert.title}</h4>
              </div>
              <span className={`badge ${alert.severity === 'CRITICAL' ? 'badge-danger' : alert.severity === 'HIGH' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                {alert.severity} SEVERITY
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.85rem' }}>
              {alert.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={12} color="var(--terracotta)" /> TARGET REGION
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy)', marginTop: '0.2rem' }}>
                  {alert.location || `Lat: ${alert.lat}, Lng: ${alert.lng}`}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>AFFECTED IMPACT RADIUS</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy)', marginTop: '0.2rem' }}>
                  {alert.affected_radius_km || 120} KM Zone
                </div>
              </div>
            </div>
          </div>

          {/* Action Choice Bar */}
          {!showConfirmDialog ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
              <button
                onClick={handleRejectAlert}
                disabled={submitting}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 600 }}
              >
                <XCircle size={14} /> Reject Alert
              </button>

              <button
                onClick={handleMarkDuplicate}
                disabled={submitting}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 600 }}
              >
                <Copy size={14} /> Mark Duplicate
              </button>

              <button
                onClick={() => setShowConfirmDialog(true)}
                disabled={submitting}
                className="btn btn-terracotta btn-sm"
                style={{ fontWeight: 800, gap: '0.4rem', boxShadow: '0 4px 12px rgba(194, 65, 12, 0.25)' }}
              >
                <CheckCircle2 size={14} /> Confirm &amp; Declare Disaster
              </button>
            </div>
          ) : (
            /* Explicit Government Confirmation Dialog */
            <div className="card" style={{ backgroundColor: 'var(--status-success-bg)', border: '2px solid var(--status-success)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={20} color="var(--status-success)" style={{ marginTop: '0.1rem' }} />
                <div>
                  <h5 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>Confirm Disaster Emergency Declaration?</h5>
                  <p style={{ fontSize: '0.8rem', color: '#14532d', margin: '0.2rem 0 0 0' }}>
                    Confirming this alert will activate the SANKALP disaster response workflow, compute geographic university impact zones via Haversine distance, and issue targeted emergency alerts.
                  </p>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--navy)', display: 'block', marginBottom: '0.3rem' }}>
                  Government Verification Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Verified with state emergency ops center. Creating official disaster."
                  value={conflictNotes}
                  onChange={(e) => setConflictNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.825rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={submitting}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAlert}
                  disabled={submitting}
                  className="btn btn-terracotta btn-sm"
                  style={{ fontWeight: 800 }}
                >
                  {submitting ? 'Processing Declaration...' : 'Confirm & Declare Disaster Now'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
