import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Smartphone, ShieldAlert, CheckCircle, RefreshCw, X } from 'lucide-react';

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

      setStatusMsg(`Response Confirmed! Shortage updated live in Government Command Center.`);
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', borderRadius: '16px', padding: '20px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={20} color="var(--terracotta)" />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--navy)' }}>
              University Student App
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Mock Mobile Phone Container */}
        <div style={{
          backgroundColor: '#1B4332',
          borderRadius: '20px',
          padding: '16px',
          color: '#ffffff',
          boxShadow: 'var(--shadow-md)'
        }}>
          {/* Top Notch */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#BFDFCC', marginBottom: '1rem' }}>
            <span>09:41</span>
            <span>NIT Student Portal</span>
            <span>100% 🔋</span>
          </div>

          {/* Alert Card */}
          {selectedReq ? (
            <div style={{ backgroundColor: '#122E22', borderRadius: '12px', padding: '16px', border: '1px solid #26543E' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <ShieldAlert size={16} /> CRITICAL DISASTER ALERT
              </div>

              <h4 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '0.4rem' }}>
                {selectedReq.role_type} Volunteers Required
              </h4>
              <div style={{ fontSize: '0.8rem', color: '#E2EBE6', marginBottom: '1rem' }}>
                Location: {selectedReq.disaster_location || 'District X Flood Zone'} • Distance: 3.2 km
              </div>

              <div style={{
                backgroundColor: '#1B4332',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                display: 'flex',
                justify: 'space-between',
                marginBottom: '1.25rem'
              }}>
                <div>
                  <div style={{ color: '#BFDFCC', fontSize: '0.7rem' }}>Required</div>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>{selectedReq.required_count}</div>
                </div>
                <div>
                  <div style={{ color: '#BFDFCC', fontSize: '0.7rem' }}>Confirmed</div>
                  <div style={{ fontWeight: 700, color: '#4ade80' }}>{selectedReq.fulfilled_count}</div>
                </div>
                <div>
                  <div style={{ color: '#BFDFCC', fontSize: '0.7rem' }}>Shortage</div>
                  <div style={{ fontWeight: 700, color: '#f87171' }}>{Math.max(0, selectedReq.required_count - selectedReq.fulfilled_count)}</div>
                </div>
              </div>

              {/* Accept Mission Button */}
              <button
                onClick={handleStudentAccept}
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
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
            <div style={{ padding: '2rem', textAlign: 'center', color: '#BFDFCC', fontSize: '0.85rem' }}>
              No active emergency mission alerts for student profile.
            </div>
          )}

          <div style={{ marginTop: '1rem', fontSize: '0.725rem', color: '#BFDFCC', textAlign: 'center' }}>
            Government Alert → University App → Live SQLite State
          </div>
        </div>

        <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
          Close Mobile Simulator
        </button>
      </div>
    </div>
  );
}
