import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DisasterMap from '../components/DisasterMap';
import AIAssistantModal from '../components/AIAssistantModal';
import { api } from '../services/api';
import { Shield, Activity, Users, AlertTriangle, CheckCircle2, Sparkles, MapPin, Hospital, GraduationCap, Clock, Check, ArrowRight } from 'lucide-react';

export default function GovernmentDashboard() {
  const [activeDisaster, setActiveDisaster] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [relocationSites, setRelocationSites] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [nearbyUniversities, setNearbyUniversities] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadGovernmentDashboard();
  }, []);

  async function loadGovernmentDashboard() {
    try {
      const res = await api.getDisasterDetail(1);
      setActiveDisaster(res.disaster);
      setRequirements(res.requirements || []);
      setRelocationSites(res.relocationSites || []);
      setHospitals(res.hospitals || []);
      setNearbyUniversities(res.nearbyUniversities || []);
    } catch (err) {
      console.error('Error loading Government Dashboard:', err);
    }
  }

  async function handleRunAiAnalysis() {
    if (!activeDisaster) return;
    setLoadingAi(true);
    try {
      const res = await api.analyzeDisaster(activeDisaster.id);
      setAiAnalysis(res.analysis);
      setMessage('AI Risk & Resource Requirement Assessment generated.');
    } catch (err) {
      setMessage('AI Analysis failed.');
    } finally {
      setLoadingAi(false);
    }
  }

  async function handleApproveRelocationSite(siteId) {
    if (!activeDisaster) return;
    try {
      const res = await api.approveRelocationSite(activeDisaster.id, { site_id: siteId, notes: 'Government Authorized Decision' });
      setMessage(res.message);
      loadGovernmentDashboard();
    } catch (err) {
      setMessage('Failed to approve relocation site.');
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ padding: '1.5rem 1rem', flex: 1 }}>

        {/* Dashboard Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div className="badge badge-danger" style={{ marginBottom: '0.3rem', gap: '0.3rem', fontSize: '0.7rem' }}>
              <Shield size={13} /> HEAD DISASTER COORDINATION AUTHORITY
            </div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-dark)' }}>Government Disaster Command Center</h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Active Incident: <strong>{activeDisaster?.title || 'Major Flood Incident - District X'}</strong> • Affected Population: <strong>45,000 residents</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button onClick={handleRunAiAnalysis} className="btn btn-primary btn-sm" disabled={loadingAi}>
              <Sparkles size={14} /> {loadingAi ? 'Analyzing Risk...' : 'Run AI Analysis'}
            </button>
            <button onClick={() => setShowAiModal(true)} className="btn btn-secondary btn-sm">
              AI Command Assistant
            </button>
          </div>
        </div>

        {message && (
          <div style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
            {message}
          </div>
        )}

        {/* TOP METRICS ROW matching reference styling */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ACTIVE INCIDENTS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-danger)', marginTop: '0.2rem' }}>01 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Critical Flood</span></div>
          </div>

          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AFFECTED POPULATION</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.2rem' }}>45.0k <span style={{ fontSize: '0.75rem', color: 'var(--status-danger)', fontWeight: 700 }}>8.5k Vulnerable</span></div>
          </div>

          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>RESPONSE COVERAGE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-success)', marginTop: '0.2rem' }}>78% <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Volunteers Deployed</span></div>
          </div>

          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>HOSPITALS UNDER PRESSURE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--status-warning)', marginTop: '0.2rem' }}>02 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Near Capacity</span></div>
          </div>
        </div>

        {/* SECTION 1: Active Disaster Overview & Live Leaflet Map */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          
          {/* Live Leaflet Map */}
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-dark)' }}>Geospatial Hazard Exposure & Response Map</h3>
              <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>LIVE COORDINATION FEED</span>
            </div>
            <DisasterMap
              disaster={activeDisaster}
              relocationSites={relocationSites}
              hospitals={hospitals}
              universities={nearbyUniversities}
            />
          </div>

          {/* Incident Summary Card */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="badge badge-danger" style={{ marginBottom: '0.5rem', fontSize: '0.65rem' }}>CRITICAL SEVERITY</div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.3rem', color: 'var(--text-dark)' }}>{activeDisaster?.title}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                📍 {activeDisaster?.location}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <span>Affected Population:</span>
                  <strong>45,000 residents</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <span>Vulnerable Population:</span>
                  <strong style={{ color: 'var(--status-danger)' }}>8,500 elders/infants</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                  <span>Inundated Roads:</span>
                  <strong>4 major arterials</strong>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--status-warning-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fef08a', marginTop: '1rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--status-warning)', textTransform: 'uppercase' }}>
                Safety Notice
              </div>
              <div style={{ fontSize: '0.75rem', color: '#854d0e', marginTop: '0.15rem' }}>
                AI analyzes hazard risk. Official emergency requests and relocation orders require explicit Government approval.
              </div>
            </div>
          </div>

        </div>

        {/* SECTION 2: Response Requirements & Live Volunteer Confirmation */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Emergency Response Requirements & Live Volunteer Tracker</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Live response updates synchronized from university responders across the district.
              </p>
            </div>
            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>DYNAMIC SQLITE BACKEND STATE</span>
          </div>

          <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
            {requirements.map((req) => {
              const remaining = Math.max(0, req.required_count - (req.confirmed_count || 0));
              const pct = Math.min(100, Math.round(((req.confirmed_count || 0) / req.required_count) * 100));

              return (
                <div key={req.id} style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{req.role_type}</span>
                    <span className="badge badge-danger" style={{ fontSize: '0.6rem' }}>{req.urgency}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    <span>Req: <strong>{req.required_count}</strong></span>
                    <span>Conf: <strong style={{ color: 'var(--status-success)' }}>{req.confirmed_count || 0}</strong></span>
                    <span>Rem: <strong style={{ color: 'var(--status-danger)' }}>{remaining}</strong></span>
                  </div>

                  <div style={{ height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--status-success)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: Relocation Evaluation & Decision Support */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>Relocation Site Evaluation & Decision Support</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Review AI-calculated site safety scores and issue official Government Approval decisions.
              </p>
            </div>
            <span className="badge badge-primary" style={{ gap: '0.3rem', fontSize: '0.65rem' }}>
              <Sparkles size={12} /> AI RECOMMENDATION ENGINE
            </span>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
            {relocationSites.map((site) => (
              <div key={site.id} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: site.status === 'APPROVED' ? '2px solid var(--status-success)' : '1px solid var(--border-light)', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  {site.status === 'APPROVED' ? (
                    <span className="badge badge-success" style={{ gap: '0.3rem', fontSize: '0.65rem' }}>
                      <CheckCircle2 size={12} /> GOVERNMENT APPROVED DECISION
                    </span>
                  ) : (
                    <span className="badge badge-primary" style={{ gap: '0.3rem', fontSize: '0.65rem' }}>
                      <Sparkles size={12} /> AI RECOMMENDATION (SCORE: {site.score}/100)
                    </span>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dist: {site.hospital_distance_km} km</span>
                </div>

                <h4 style={{ fontSize: '1rem', marginBottom: '0.2rem', color: 'var(--text-dark)' }}>{site.name}</h4>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                  Capacity: <strong>{site.capacity?.toLocaleString()}</strong> • Road Status: <strong>{site.road_status}</strong>
                </div>

                {site.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleApproveRelocationSite(site.id)}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', gap: '0.3rem', backgroundColor: 'var(--status-success)', borderColor: 'var(--status-success)', fontSize: '0.75rem' }}
                  >
                    <Check size={14} /> Issue Official Government Approval
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: Regional Hospitals & Nearby Universities Response Hubs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          
          {/* Hospitals */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dark)' }}>
              <Hospital size={16} color="#7c3aed" /> Regional Hospital Capacity & Expected Inflow
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {hospitals.map((h) => (
                <div key={h.id} style={{ padding: '0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{h.name}</strong>
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{h.status}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Available Beds: <strong>{h.available_beds}</strong> / {h.total_beds} • Expected Inflow: <strong style={{ color: 'var(--status-warning)' }}>+{h.expected_inflow || 120}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby Universities */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dark)' }}>
              <GraduationCap size={16} color="var(--primary-blue)" /> Nearby University Response Hubs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {nearbyUniversities.map((u) => (
                <div key={u.id} style={{ padding: '0.7rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{u.name}</strong>
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{u.priority_label}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Distance: <strong>{u.distance_km} km</strong> • Volunteers: {u.nss_capacity + u.ncc_capacity}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* AI Command Assistant Modal */}
        {showAiModal && <AIAssistantModal onClose={() => setShowAiModal(false)} />}

      </main>
    </div>
  );
}
