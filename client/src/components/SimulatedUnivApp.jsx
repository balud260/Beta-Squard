import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Smartphone, Bell, CheckCircle, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';

export default function SimulatedUnivApp({ isOpen, onClose, onResponseRecorded }) {
  const [requirements, setRequirements] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRequirements();
    }
  }, [isOpen]);

  async function fetchRequirements() {
    try {
      const res = await api.getVolunteerRequirements();
      setRequirements(res.requirements || []);
      if (res.requirements && res.requirements.length > 0) {
        setSelectedReq(res.requirements[0]);
      }
    } catch (err) {
      console.error('Fetch simulated app reqs error:', err);
    }
  }

  async function handleStudentAccept() {
    if (!selectedReq || loading) return;
    setLoading(true);
    try {
      const res = await api.respondVolunteerMission({
        requirement_id: selectedReq.id,
        status: 'CONFIRMED'
      });

      setStatusMsg(`Response Confirmed! Volunteer shortage updated live in Government Command Center.`);
      fetchRequirements();

      if (onResponseRecorded) {
        onResponseRecorded(res.requirement);
      }
    } catch (err) {
      setStatusMsg('Failed to submit response.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', borderRadius: 'var(--radius-xl)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={20} color="var(--primary-blue)" />
            <span style={{ fontWeight: 800, fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
              University Student App
            </span>
          </div>
          <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
            Demo Simulation
          </span>
        </div>

        {/* Mock Mobile Phone Container */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '24px',
          padding: '16px',
          color: '#fff',
          boxShadow: 'var(--shadow-xl)',
          border: '4px solid #334155'
        }}>
          {/* Top Notch Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '1rem', padding: '0 0.25rem' }}>
            <span>09:41</span>
            <span>NIT Student Portal v3.2</span>
            <span>100% 🔋</span>
          </div>

          {/* Alert Card */}
          {selectedReq ? (
            <div style={{ backgroundColor: '#1e293b', borderRadius: '16px', padding: '1.25rem', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 800, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <ShieldAlert size={16} /> EMERGENCY BROADCAST
              </div>

              <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.4rem' }}>
                {selectedReq.role_type} Volunteers Needed
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                Location: {selectedReq.disaster_location || 'District X Flood Zone'}
              </p>

              <div style={{
                backgroundColor: '#0f172a',
                padding: '0.75rem',
                borderRadius: '10px',
                fontSize: '0.8rem',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Required</div>
                  <div style={{ fontWeight: 700, color: '#38bdf8' }}>{selectedReq.required_count}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Confirmed</div>
                  <div style={{ fontWeight: 700, color: '#4ade80' }}>{selectedReq.fulfilled_count}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Shortage</div>
                  <div style={{ fontWeight: 700, color: '#f87171' }}>{selectedReq.required_count - selectedReq.fulfilled_count}</div>
                </div>
              </div>

              {/* Accept Button */}
              <button
                onClick={handleStudentAccept}
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', backgroundColor: '#2563eb', padding: '0.75rem', borderRadius: '12px' }}
              >
                {loading ? <RefreshCw size={16} className="spin" /> : <CheckCircle size={16} />}
                I'm Available (Accept Mission)
              </button>

              {statusMsg && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#4ade80', textAlign: 'center', lineHeight: 1.4 }}>
                  {statusMsg}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              No active emergency mission alerts for student profile.
            </div>
          )}

          {/* Workflow Sequence Footnote */}
          <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px dashed #334155', fontSize: '0.725rem', color: '#64748b', textAlign: 'center' }}>
            Gov Alert → Univ Integration API → Student App → Real-time SQLite Update
          </div>
        </div>

        <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
          Close Mobile Simulator
        </button>
      </div>
    </div>
  );
}
