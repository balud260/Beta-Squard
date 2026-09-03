import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Smartphone, ShieldAlert, CheckCircle, RefreshCw, X, XCircle } from 'lucide-react';
import SankalpLogo from './SankalpLogo';


export default function SimulatedUnivApp({ isOpen, onClose, onResponseRecorded }) {
  const [requirements, setRequirements] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [loading, setLoading] = useState(false);

  const [rerouteAlert, setRerouteAlert] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchRequirements();
      fetchNotifications();
    }
  }, [isOpen]);

  async function fetchNotifications() {
    try {
      const res = await api.getNotifications();
      const rerouteNotif = (res.notifications || []).find(n => n.title && n.title.includes('RE-ROUTING'));
      if (rerouteNotif) {
        setRerouteAlert(rerouteNotif);
      }
    } catch (e) {
      // ignore
    }
  }

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

  async function handleStudentRespond(status = 'CONFIRMED') {
    if (!selectedReq || loading) return;
    setLoading(true);
    setStatusMsg('');
    setIsDuplicate(false);

    try {
      const res = await api.respondVolunteerMission({
        requirement_id: selectedReq.id,
        status
      });

      if (res.duplicate) {
        setIsDuplicate(true);
        setStatusMsg(res.message || "You're already registered for this mission.");
      } else {
        setStatusMsg(res.message || `Response recorded: ${status}`);
        fetchRequirements();
        if (onResponseRecorded) {
          onResponseRecorded(res.requirement);
        }
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
            <SankalpLogo variant="compact" height={26} subtitle="STUDENT" to={null} />
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
            <span>SANKALP AI • NIT Student</span>
            <span>100% 🔋</span>
          </div>

          {/* AI Emergency Re-Routing Alert */}
          {rerouteAlert && (
            <div style={{ backgroundColor: '#450a0a', border: '1px solid #991b1b', borderRadius: '12px', padding: '12px', marginBottom: '1rem', color: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fca5a5', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                <ShieldAlert size={16} /> {rerouteAlert.title}
              </div>
              <div style={{ fontSize: '0.775rem', color: '#ffffff', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                {rerouteAlert.message}
              </div>
              <div style={{ fontSize: '0.725rem', color: '#fca5a5', backgroundColor: '#7f1d1d', padding: '6px 8px', borderRadius: '6px', lineHeight: 1.3 }}>
                <strong>🤖 AI Redirection:</strong> Destination automatically updated. Please re-route immediately to recommended shelter.
              </div>
            </div>
          )}


          {/* Alert Card */}
          {selectedReq ? (
            <div style={{ backgroundColor: '#122E22', borderRadius: '12px', padding: '16px', border: '1px solid #26543E' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <ShieldAlert size={16} /> CRITICAL DISASTER ALERT
              </div>

              <h4 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '0.4rem' }}>
                {selectedReq.disaster_title || 'Major Flood Incident'}
              </h4>
              <div style={{ fontSize: '0.8rem', color: '#E2EBE6', marginBottom: '0.75rem' }}>
                Role Required: <strong style={{ color: '#ffffff' }}>{selectedReq.role_type}</strong> • Location: {selectedReq.disaster_location || 'District X'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#BFDFCC', marginBottom: '1rem' }}>
                Issued by: Government Disaster Command Center
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

              {/* Action Buttons: I'm Available & Not Available */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => handleStudentRespond('DECLINED')}
                  className="btn btn-secondary"
                  disabled={loading}
                  style={{ padding: '8px', fontSize: '0.75rem', borderRadius: '8px' }}
                >
                  <XCircle size={14} /> Not Available
                </button>

                <button
                  onClick={() => handleStudentRespond('CONFIRMED')}
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ padding: '8px', fontSize: '0.75rem', borderRadius: '8px' }}
                >
                  {loading ? <RefreshCw size={14} className="spin" /> : <CheckCircle size={14} />}
                  I'm Available
                </button>
              </div>

              {statusMsg && (
                <div style={{
                  marginTop: '0.75rem',
                  fontSize: '0.75rem',
                  color: isDuplicate ? '#fde047' : '#4ade80',
                  backgroundColor: isDuplicate ? 'rgba(234, 179, 8, 0.15)' : 'rgba(74, 222, 128, 0.15)',
                  padding: '8px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  lineHeight: 1.4
                }}>
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
