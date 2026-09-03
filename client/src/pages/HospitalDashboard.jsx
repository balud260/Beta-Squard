import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Activity, ShieldAlert, CheckCircle2, RefreshCw, Building2 } from 'lucide-react';

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [availableBeds, setAvailableBeds] = useState(42);
  const [status, setStatus] = useState('OPERATIONAL');
  const [acknowledged, setAcknowledged] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadHospitalData();
  }, []);

  async function loadHospitalData() {
    try {
      const res = await api.getHospitals();
      if (res.hospitals && res.hospitals.length > 0) {
        const h = res.hospitals[0];
        setHospital(h);
        setAvailableBeds(h.available_beds);
        setStatus(h.status);
      }
    } catch (err) {
      console.error('Error loading hospital data:', err);
    }
  }

  async function handleUpdateBeds() {
    if (!hospital) return;
    try {
      const res = await api.updateHospitalStatus(hospital.id, {
        available_beds: availableBeds,
        status: status
      });
      setMessage('Hospital bed capacity & operational status updated in live operational data.');
      setHospital(res.hospital);
    } catch (err) {
      setMessage('Failed to update status.');
    }
  }

  async function handleAcknowledgeAlert() {
    if (!hospital) return;
    try {
      const res = await api.acknowledgeHospitalAlert(hospital.id);
      setAcknowledged(true);
      setMessage(res.message);
    } catch (err) {
      setMessage('Failed to acknowledge alert.');
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <div className="badge badge-danger" style={{ marginBottom: '0.4rem' }}>
              <Activity size={14} /> Hospital Emergency Operations
            </div>
            <h1 style={{ fontSize: '2rem' }}>{hospital?.name || 'District General Hospital'}</h1>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Location: Central District Avenue • Contact: +91 11 2345 6789
            </div>
          </div>
          <span className={`badge ${status === 'OPERATIONAL' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.9rem' }}>
            {status}
          </span>
        </div>

        {message && (
          <div style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
            {message}
          </div>
        )}

        {/* Emergency Alert Card */}
        <div className="card" style={{ borderLeft: '4px solid var(--status-danger)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ShieldAlert color="var(--status-danger)" size={24} />
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>🚨 High Patient Inflow Warning - District Flood</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  State Command estimates incoming 40 emergency admissions over next 6 hours.
                </p>
              </div>
            </div>

            {acknowledged ? (
              <span className="badge badge-success" style={{ padding: '0.5rem 1rem' }}>
                <CheckCircle2 size={16} /> Alert Acknowledged
              </span>
            ) : (
              <button onClick={handleAcknowledgeAlert} className="btn btn-danger btn-sm">
                Acknowledge Emergency Alert
              </button>
            )}
          </div>
        </div>

        {/* Bed Capacity Controls */}
        <div className="grid grid-cols-2">
          
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Live Bed Capacity Management</h3>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Available ICU & General Beds
              </label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="number"
                  value={availableBeds}
                  onChange={(e) => setAvailableBeds(parseInt(e.target.value) || 0)}
                  style={{
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    width: '120px'
                  }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>out of {hospital?.total_beds || 500} Total Beds</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Operational Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
              >
                <option value="OPERATIONAL">OPERATIONAL</option>
                <option value="NEAR_CAPACITY">NEAR CAPACITY</option>
                <option value="CRITICAL">CRITICAL / FULL</option>
              </select>
            </div>

            <button onClick={handleUpdateBeds} className="btn btn-primary">
              Update Hospital Capacity
            </button>
          </div>

          {/* Hospital Stats */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Emergency Trauma Resources</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>Emergency Capacity:</span>
                <strong>{hospital?.emergency_capacity || 80} Beds</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span>Medical Staff On-Duty:</span>
                <strong>{hospital?.staff_count || 210} Personnel</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0' }}>
                <span>Mobile ICU Units:</span>
                <strong>3 Vans Ready</strong>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
