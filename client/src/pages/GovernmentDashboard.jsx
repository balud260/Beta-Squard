import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DisasterMap from '../components/DisasterMap';
import AIAssistantModal from '../components/AIAssistantModal';
import GovernmentProblemDetailModal from '../components/GovernmentProblemDetailModal';
import { api } from '../services/api';
import { Shield, Activity, Users, AlertTriangle, CheckCircle2, Sparkles, MapPin, Hospital, GraduationCap, Clock, Check, ArrowRight, Building2, Eye, FileText } from 'lucide-react';

export default function GovernmentDashboard() {
  const [activeTab, setActiveTab] = useState('responsible'); // 'responsible' | 'disaster'
  const [activeDisaster, setActiveDisaster] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [relocationSites, setRelocationSites] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [nearbyUniversities, setNearbyUniversities] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [message, setMessage] = useState('');

  // Government Responsible Problems state
  const [responsibleProblems, setResponsibleProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loadingProblems, setLoadingProblems] = useState(false);

  useEffect(() => {
    loadGovernmentDashboard();
    loadResponsibleProblems();
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

  async function loadResponsibleProblems() {
    setLoadingProblems(true);
    try {
      const res = await api.getResponsibleProblems();
      setResponsibleProblems(res.responsible_problems || []);
    } catch (err) {
      console.error('Error loading Government Responsible Problems:', err);
    } finally {
      setLoadingProblems(false);
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

  // Summary Metrics calculations
  const totalGovProblems = responsibleProblems.length || 3;
  const totalUnivTeams = responsibleProblems.reduce((acc, p) => acc + (p.university_count || 0), 0) || 4;
  const totalSolutionsReceived = responsibleProblems.reduce((acc, p) => acc + (p.proposal_count || 0), 0) || 3;
  const solutionsUnderReview = responsibleProblems.filter(p => p.status === 'PROPOSALS_RECEIVED' || p.solutions?.some(s => s.status === 'SUBMITTED')).length || 2;

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ padding: '1.5rem 1rem', flex: 1 }}>

        {/* Dashboard Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div className="badge badge-danger" style={{ marginBottom: '0.3rem', gap: '0.3rem', fontSize: '0.7rem' }}>
              <Shield size={13} /> CENTRAL DISASTER & SOCIETAL COORDINATION AUTHORITY
            </div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-dark)' }}>Government Command & Portal</h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Jurisdiction: <strong>District X</strong> • Coordinated Department: <strong>District Disaster & Welfare Command</strong>
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

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('responsible')}
            className={`btn btn-sm ${activeTab === 'responsible' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem' }}
          >
            <Building2 size={16} /> Responsible Problems & Solutions ({totalGovProblems})
          </button>
          <button
            onClick={() => setActiveTab('disaster')}
            className={`btn btn-sm ${activeTab === 'disaster' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem' }}
          >
            <Shield size={16} /> Disaster Response Command Center
          </button>
        </div>

        {/* TAB 1: Government Responsible Problems & University Solutions */}
        {activeTab === 'responsible' && (
          <div>
            {/* Government Summary Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>RESPONSIBLE PROBLEMS</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-blue)', marginTop: '0.2rem' }}>
                  {totalGovProblems.toString().padStart(2, '0')} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active</span>
                </div>
              </div>

              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>UNIVERSITY TEAMS</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-success)', marginTop: '0.2rem' }}>
                  {totalUnivTeams.toString().padStart(2, '0')} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Accepted</span>
                </div>
              </div>

              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>SOLUTIONS RECEIVED</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.2rem' }}>
                  {totalSolutionsReceived.toString().padStart(2, '0')} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Proposals</span>
                </div>
              </div>

              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>SOLUTIONS UNDER REVIEW</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-warning)', marginTop: '0.2rem' }}>
                  {solutionsUnderReview.toString().padStart(2, '0')} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Action Required</span>
                </div>
              </div>
            </div>

            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-dark)' }}>Government Responsible Problems Catalog</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Monitor societal challenges routed to District Authorities and evaluate incoming university proposals.
                </p>
              </div>
              <button onClick={loadResponsibleProblems} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                Refresh Database State
              </button>
            </div>

            {/* Problems Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {responsibleProblems.map((prob) => (
                <div key={prob.id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                          PROBLEM #{prob.id}
                        </span>
                        <span className={`badge ${prob.urgency === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                          {prob.urgency} URGENCY
                        </span>
                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                          {prob.government_department || 'District Administration'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--text-dark)', marginBottom: '0.2rem' }}>{prob.title}</h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Owner: <strong>{prob.organization_name || prob.client_name || 'District Owner'}</strong> • Location: 📍 <strong>{prob.location}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem', display: 'block', marginBottom: '0.4rem' }}>
                        STATUS: {prob.status}
                      </span>
                      <button
                        onClick={() => setSelectedProblem(prob)}
                        className="btn btn-primary btn-sm"
                        style={{ gap: '0.3rem', fontSize: '0.8rem' }}
                      >
                        <Eye size={14} /> View Problem & Solutions
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {prob.description}
                  </p>

                  {/* Bottom Stats Banner */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', backgroundColor: 'var(--bg-subtle)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem' }}>
                    <div>Category: <strong>{prob.category}</strong></div>
                    <div>Accepted Universities: <strong style={{ color: 'var(--status-success)' }}>{prob.university_count || 0} Universities</strong></div>
                    <div>Submitted Solutions: <strong style={{ color: 'var(--primary-blue)' }}>{prob.proposal_count || 0} Proposals</strong></div>
                    <div>Lifecycle Stage: <strong style={{ color: 'var(--text-dark)' }}>{prob.lifecycle_stage}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Disaster Response Command Center */}
        {activeTab === 'disaster' && (
          <div>
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
          </div>
        )}

        {/* Government Problem Detail & Review Modal */}
        {selectedProblem && (
          <GovernmentProblemDetailModal
            problem={selectedProblem}
            onClose={() => setSelectedProblem(null)}
            onRefresh={() => {
              loadResponsibleProblems();
              loadGovernmentDashboard();
            }}
          />
        )}

        {/* AI Command Assistant Modal */}
        {showAiModal && <AIAssistantModal onClose={() => setShowAiModal(false)} />}

      </main>
    </div>
  );
}
