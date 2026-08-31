import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import DisasterMap from '../components/DisasterMap';
import AIAssistantModal from '../components/AIAssistantModal';
import GovernmentProblemDetailModal from '../components/GovernmentProblemDetailModal';
import { api } from '../services/api';
import { Shield, Activity, Users, CheckCircle2, Sparkles, MapPin, Hospital, GraduationCap, Check, Building2, Eye, RefreshCw, AlertCircle } from 'lucide-react';

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
      setMessage('AI Analysis temporarily unavailable. Please retry.');
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

      <main className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>

        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div className="badge badge-navy" style={{ marginBottom: '0.4rem', gap: '0.4rem', fontSize: '0.75rem' }}>
              <Shield size={13} /> CENTRAL DISASTER &amp; SOCIETAL COORDINATION AUTHORITY
            </div>
            <h1 className="page-title">Government Disaster Command Center</h1>
            <div className="metadata-text" style={{ marginTop: '0.2rem' }}>
              Jurisdiction: <strong>District X</strong> • Coordinated Department: <strong>District Disaster &amp; Welfare Command</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={handleRunAiAnalysis} className="btn btn-primary btn-sm" disabled={loadingAi}>
              <Sparkles size={14} /> {loadingAi ? 'Analyzing Incident...' : 'Run AI Analysis'}
            </button>
            <button onClick={() => setShowAiModal(true)} className="btn btn-secondary btn-sm">
              AI Command Assistant
            </button>
          </div>
        </div>

        {message && (
          <div style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.875rem' }}>
            {message}
          </div>
        )}

        {/* Primary Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('responsible')}
            className={`btn btn-sm ${activeTab === 'responsible' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.4rem', fontWeight: 600 }}
          >
            <Building2 size={16} /> Responsible Problems &amp; Solutions ({totalGovProblems})
          </button>
          <button
            onClick={() => setActiveTab('disaster')}
            className={`btn btn-sm ${activeTab === 'disaster' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.4rem', fontWeight: 600 }}
          >
            <Shield size={16} /> Disaster Response Command Center
          </button>
        </div>

        {/* TAB 1: Government Responsible Problems & Solutions */}
        {activeTab === 'responsible' && (
          <div className="page-section">
            {/* Cleaner Summary Metrics Row */}
            <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <div className="lbl">RESPONSIBLE PROBLEMS</div>
                <div className="num">{totalGovProblems.toString().padStart(2, '0')}</div>
                <div className="ctx">Active District Challenges</div>
              </div>

              <div className="stat-card">
                <div className="lbl">UNIVERSITY TEAMS</div>
                <div className="num" style={{ color: 'var(--status-success)' }}>{totalUnivTeams.toString().padStart(2, '0')}</div>
                <div className="ctx">Accepted Institutions</div>
              </div>

              <div className="stat-card">
                <div className="lbl">SOLUTIONS RECEIVED</div>
                <div className="num">{totalSolutionsReceived.toString().padStart(2, '0')}</div>
                <div className="ctx">Submitted Proposals</div>
              </div>

              <div className="stat-card">
                <div className="lbl">SOLUTIONS UNDER REVIEW</div>
                <div className="num" style={{ color: 'var(--status-warning)' }}>{solutionsUnderReview.toString().padStart(2, '0')}</div>
                <div className="ctx">Pending Decision</div>
              </div>
            </div>

            {/* Catalog Section */}
            <div className="section-header">
              <div>
                <h2 className="section-title">Government Responsible Problems Catalog</h2>
                <p className="text-muted">Monitor societal challenges assigned to District Authorities and review university solution proposals.</p>
              </div>
              <button onClick={loadResponsibleProblems} className="btn btn-secondary btn-sm">
                <RefreshCw size={14} /> Refresh Catalog
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {responsibleProblems.map((prob) => (
                <div key={prob.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div className="metadata-row" style={{ marginBottom: '0.4rem' }}>
                        <span className="badge badge-primary">PROBLEM #{prob.id}</span>
                        <span className={`badge ${prob.urgency === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}`}>
                          {prob.urgency} URGENCY
                        </span>
                        <span className="badge badge-success">
                          {prob.government_department || 'District Administration'}
                        </span>
                      </div>
                      <h3 className="card-title" style={{ fontSize: '1.15rem' }}>{prob.title}</h3>
                      <div className="metadata-text" style={{ marginTop: '0.2rem' }}>
                        Owner: <strong>{prob.organization_name || prob.client_name || 'District Owner'}</strong> • Location: 📍 <strong>{prob.location}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-navy" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
                        STATUS: {prob.status}
                      </span>
                      <br />
                      <button
                        onClick={() => setSelectedProblem(prob)}
                        className="btn btn-primary btn-sm"
                      >
                        <Eye size={14} /> View Problem &amp; Solutions
                      </button>
                    </div>
                  </div>

                  <p className="body-text" style={{ marginBottom: '1rem' }}>
                    {prob.description}
                  </p>

                  <div className="metadata-row" style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                    <div>Category: <strong>{prob.category}</strong></div>
                    <div>Accepted Universities: <strong style={{ color: 'var(--status-success)' }}>{prob.university_count || 0} Universities</strong></div>
                    <div>Submitted Solutions: <strong style={{ color: 'var(--terracotta)' }}>{prob.proposal_count || 0} Proposals</strong></div>
                    <div>Lifecycle Stage: <strong>{prob.lifecycle_stage}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Disaster Response Command Center */}
        {activeTab === 'disaster' && (
          <div className="page-section">
            {/* Clean Metric Row */}
            <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem' }}>
              <div className="stat-card">
                <div className="lbl">ACTIVE INCIDENTS</div>
                <div className="num" style={{ color: 'var(--status-danger)' }}>01</div>
                <div className="ctx">Critical flood in District X</div>
              </div>

              <div className="stat-card">
                <div className="lbl">AFFECTED POPULATION</div>
                <div className="num">45.0k</div>
                <div className="ctx">8.5k Vulnerable residents</div>
              </div>

              <div className="stat-card">
                <div className="lbl">RESPONSE COVERAGE</div>
                <div className="num" style={{ color: 'var(--status-success)' }}>78%</div>
                <div className="ctx">Volunteers Deployed</div>
              </div>

              <div className="stat-card">
                <div className="lbl">HOSPITALS UNDER PRESSURE</div>
                <div className="num" style={{ color: 'var(--status-warning)' }}>02</div>
                <div className="ctx">Near Capacity</div>
              </div>
            </div>

            {/* Spacious 2-Column Section: Map & Incident Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.8fr', gap: '1.5rem', marginBottom: '2rem' }}>
              
              {/* Map */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div className="panel-head">
                  <h3 className="card-title">Geospatial Hazard Exposure &amp; Response Map</h3>
                  <span className="badge badge-danger">LIVE COORDINATION FEED</span>
                </div>
                <DisasterMap
                  disaster={activeDisaster}
                  relocationSites={relocationSites}
                  hospitals={hospitals}
                  universities={nearbyUniversities}
                />
              </div>

              {/* Incident Overview Side Panel */}
              <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="panel-head" style={{ marginBottom: '1rem' }}>
                    <span className="badge badge-danger">CRITICAL SEVERITY</span>
                    <span className="metadata-text">District X</span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--navy)' }}>{activeDisaster?.title}</h3>
                  <div className="metadata-text" style={{ marginBottom: '1rem' }}>
                    📍 {activeDisaster?.location}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                      <span>Affected Population:</span>
                      <strong>45,000 residents</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                      <span>Vulnerable Population:</span>
                      <strong style={{ color: 'var(--status-danger)' }}>8,500 elders/infants</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                      <span>Inundated Arterials:</span>
                      <strong>4 main roads blocked</strong>
                    </div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--status-warning-bg)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fef08a', marginTop: '1rem' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--status-warning)', textTransform: 'uppercase' }}>
                    Government Oversight
                  </div>
                  <div style={{ fontSize: '13px', color: '#854d0e', marginTop: '0.2rem' }}>
                    AI calculates hazard risk. Official relocation and emergency orders require explicit Government Approval.
                  </div>
                </div>
              </div>

            </div>

            {/* Relocation Site Evaluation Comparison */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="panel-head">
                <div>
                  <h3 className="card-title">Relocation Site Evaluation &amp; Decision Support</h3>
                  <p className="text-muted" style={{ marginTop: '0.2rem' }}>
                    Review AI-calculated safety scores and issue official Government Approvals.
                  </p>
                </div>
                <span className="badge badge-primary">AI RECOMMENDATION ENGINE</span>
              </div>

              <div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
                {relocationSites.map((site) => (
                  <div key={site.id} style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', border: site.status === 'APPROVED' ? '2px solid var(--status-success)' : '1px solid var(--border-light)', backgroundColor: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      {site.status === 'APPROVED' ? (
                        <span className="badge badge-success">
                          <CheckCircle2 size={12} /> GOVERNMENT APPROVED
                        </span>
                      ) : (
                        <span className="badge badge-primary">
                          <Sparkles size={12} /> AI RECOMMENDATION (SCORE: {site.score}/100)
                        </span>
                      )}
                      <span className="metadata-text">Distance: {site.hospital_distance_km} km</span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', color: 'var(--navy)', marginBottom: '0.3rem' }}>{site.name}</h4>
                    <div className="metadata-row" style={{ marginBottom: '0.85rem' }}>
                      <div>Capacity: <strong>{site.capacity?.toLocaleString()}</strong></div>
                      <div>Road Status: <strong>{site.road_status}</strong></div>
                    </div>

                    {site.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleApproveRelocationSite(site.id)}
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', backgroundColor: 'var(--status-success)', borderColor: 'var(--status-success)' }}
                      >
                        <Check size={14} /> Issue Official Government Approval
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Regional Hospitals & Nearby Universities Response */}
            <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
              
              {/* Hospitals */}
              <div className="card">
                <div className="panel-head">
                  <h3 className="card-title">Regional Hospital Pressure</h3>
                  <span className="badge badge-primary">INFLOW MONITOR</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {hospitals.map((h) => (
                    <div key={h.id} style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--navy)' }}>{h.name}</strong>
                        <span className="badge badge-warning">{h.status}</span>
                      </div>
                      <div className="metadata-row">
                        <div>Beds: <strong>{h.available_beds} / {h.total_beds}</strong></div>
                        <div>Expected Inflow: <strong style={{ color: 'var(--status-warning)' }}>+{h.expected_inflow || 120}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Universities */}
              <div className="card">
                <div className="panel-head">
                  <h3 className="card-title">Nearby University Response Hubs</h3>
                  <span className="badge badge-success">DISPATCH READY</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {nearbyUniversities.map((u) => (
                    <div key={u.id} style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--navy)' }}>{u.name}</strong>
                        <span className="badge badge-primary">{u.priority_label}</span>
                      </div>
                      <div className="metadata-row">
                        <div>Distance: <strong>{u.distance_km} km</strong></div>
                        <div>Volunteers Ready: <strong>{u.nss_capacity + u.ncc_capacity}</strong></div>
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
