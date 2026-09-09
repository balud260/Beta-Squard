import React from 'react';
import { Shield, CheckCircle2, RefreshCw, XCircle, AlertTriangle, MapPin, Activity, FileText, Users, Building2, Download } from 'lucide-react';
import { api } from '../services/api';

export default function ExerciseReportModal({ report, onClose, onResetComplete }) {
  if (!report) return null;

  const summary = report.impactSummary || {};
  const risks = report.universityRisks || [];
  const auditLogs = report.auditTrail || [];

  async function handleReset() {
    if (window.confirm('Reset this simulation exercise? This will purge simulation records while keeping production data intact.')) {
      try {
        await api.resetSimulation(report.simulationId);
        if (onResetComplete) onResetComplete();
        onClose();
      } catch (err) {
        alert(`Reset failed: ${err.message}`);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto"
        style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div style={{ backgroundColor: 'var(--navy)', color: '#FFFFFF', padding: '1.25rem 1.5rem', borderBottom: '2px solid var(--terracotta)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                <CheckCircle2 size={22} color="#4ade80" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>DISASTER EXERCISE REPORT</h3>
                  <span style={{ backgroundColor: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                    EXERCISE COMPLETED
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', margin: '0.2rem 0 0 0' }}>
                  Official SANKALP AI Disaster Response Audit &amp; Impact Report
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

          {/* Top Banner */}
          <div className="card" style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  EXERCISE SCENARIO TITLE
                </span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy)', margin: '0.2rem 0 0.3rem 0' }}>
                  {report.scenarioTitle}
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', margin: 0 }}>
                  Source: <strong>{report.sourceName}</strong> • Exercise ID: <code style={{ color: 'var(--navy)' }}>{report.simulationId}</code>
                </p>
              </div>
              <span className={`badge ${report.severity === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                {report.severity}
              </span>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
            <div className="card" style={{ padding: '0.85rem', textAlign: 'center', backgroundColor: 'var(--bg-card)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy)', lineHeight: 1.1 }}>{summary.total || 0}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Universities Evaluated</div>
            </div>

            <div className="card" style={{ padding: '0.85rem', textAlign: 'center', backgroundColor: 'var(--status-danger-bg)', borderColor: 'var(--status-danger)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-danger)', lineHeight: 1.1 }}>{summary.high || 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#7f1d1d', marginTop: '0.2rem' }}>HIGH Risk Institutions</div>
            </div>

            <div className="card" style={{ padding: '0.85rem', textAlign: 'center', backgroundColor: 'var(--status-success-bg)', borderColor: 'var(--status-success)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-success)', lineHeight: 1.1 }}>{summary.acknowledged || 0} / {summary.high || 0}</div>
              <div style={{ fontSize: '0.72rem', color: '#14532d', marginTop: '0.2rem' }}>High-Risk Acknowledged</div>
            </div>

            <div className="card" style={{ padding: '0.85rem', textAlign: 'center', backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--terracotta)' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--terracotta)', lineHeight: 1.1 }}>{summary.responseActivated || 0}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Response Teams Active</div>
            </div>
          </div>

          {/* University Risk Breakdown List */}
          <div className="card" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={16} color="var(--navy)" /> UNIVERSITY RISK &amp; RESPONSE STATUS BREAKDOWN
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {risks.map((r) => (
                <div 
                  key={r.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${r.risk_level === 'HIGH' ? 'badge-danger' : r.risk_level === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                      {r.risk_level}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{r.university_name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({r.distance_km} km away)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.72rem' }}>
                    <span style={{ color: r.acknowledged ? 'var(--status-success)' : 'var(--text-muted)', fontWeight: 600 }}>
                      {r.acknowledged ? '✓ Acknowledged' : '⏳ Pending'}
                    </span>
                    <span style={{ color: r.response_status === 'ACTIVE' ? 'var(--status-success)' : 'var(--navy)', fontWeight: 700 }}>
                      Team: {r.response_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="card" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={16} color="var(--terracotta)" /> EXERCISE AUDIT TIMELINE ({auditLogs.length} EVENTS)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '160px', overflowY: 'auto', backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              {auditLogs.map((log) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.78rem' }}>
                  <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    {new Date(log.created_at || Date.now()).toLocaleTimeString()}
                  </span>
                  <span className="badge badge-primary" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                    {log.action}
                  </span>
                  <span style={{ color: 'var(--text-dark)', flex: 1 }}>{log.details}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Bar */}
        <div style={{ backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border-light)', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleReset}
            className="btn btn-secondary btn-sm"
            style={{ color: 'var(--status-danger)', borderColor: 'var(--status-danger)', fontWeight: 700, gap: '0.4rem' }}
          >
            <RefreshCw size={14} /> Purge Exercise Data
          </button>

          <button
            onClick={onClose}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700 }}
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
