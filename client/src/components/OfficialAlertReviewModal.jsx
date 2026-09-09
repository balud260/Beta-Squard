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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg text-white">Official Emergency Alert Review</h3>
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {alert.review_status || 'PENDING_REVIEW'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Government Action Required Before Public Emergency Declaration</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Source Banner */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Issuing Source</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                {alert.is_simulation ? 'SIMULATED OFFICIAL FEED' : 'OFFICIAL VERIFIED FEED'}
              </span>
            </div>
            <div className="text-base font-medium text-amber-300 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>{alert.source_name}</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center space-x-4 pt-1">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Issued: {new Date(alert.issued_at || Date.now()).toLocaleTimeString()}</span>
              </span>
              <span>Ref ID: <code className="text-slate-300">{alert.external_alert_id}</code></span>
            </div>
          </div>

          {/* Alert Details */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Alert Event Title</span>
                <h4 className="text-xl font-bold text-white mt-0.5">{alert.title}</h4>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider border ${
                alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                alert.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
                {alert.severity} SEVERITY
              </span>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-3.5 rounded-xl border border-slate-800">
              {alert.description}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-xs text-slate-400 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Target Region & Coordinates</span>
                </div>
                <div className="text-sm font-semibold text-white mt-1">
                  {alert.location || `Lat: ${alert.lat}, Lng: ${alert.lng}`}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  {alert.lat?.toFixed(4)}, {alert.lng?.toFixed(4)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-xs text-slate-400">Affected Impact Radius</div>
                <div className="text-sm font-semibold text-white mt-1">
                  {alert.affected_radius_km || 15} KM Zone
                </div>
                <div className="text-xs text-amber-400/90 mt-0.5">
                  Haversine deterministic radius evaluation
                </div>
              </div>
            </div>
          </div>

          {alert.conflict_notes && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <span className="font-semibold block text-amber-400 mb-0.5">Multi-Source Verification Alert:</span>
              {alert.conflict_notes}
            </div>
          )}

          {/* Action Choice Bar */}
          {!showConfirmDialog ? (
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
              <button
                onClick={handleRejectAlert}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors flex items-center space-x-1.5"
              >
                <XCircle className="w-4 h-4 text-slate-400" />
                <span>Reject Alert</span>
              </button>

              <button
                onClick={handleMarkDuplicate}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors flex items-center space-x-1.5"
              >
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Mark Duplicate</span>
              </button>

              <button
                onClick={() => setShowConfirmDialog(true)}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-950/30 transition-all flex items-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Declare Disaster</span>
              </button>
            </div>
          ) : (
            /* Explicit Government Confirmation Dialog */
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-semibold text-white text-base">Confirm Disaster Emergency Declaration?</h5>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Confirming this alert will activate the disaster response workflow, calculate geographic university impact zones via Haversine distance, and broadcast targeted emergency alerts to affected institutions.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Government Verification Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Verified with state emergency ops center. Creating official disaster."
                  value={conflictNotes}
                  onChange={(e) => setConflictNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAlert}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg transition-all flex items-center space-x-2"
                >
                  {submitting ? (
                    <span>Processing Declaration...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Declare Disaster Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
