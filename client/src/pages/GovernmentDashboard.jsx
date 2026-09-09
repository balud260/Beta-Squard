import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import DisasterMap from '../components/DisasterMap';
import AIAssistantModal from '../components/AIAssistantModal';
import GovernmentProblemDetailModal from '../components/GovernmentProblemDetailModal';
import AIResultPanel from '../components/AIResultPanel';
import OfficialAlertReviewModal from '../components/OfficialAlertReviewModal';
import DisasterSimulationModal from '../components/DisasterSimulationModal';
import ExerciseReportModal from '../components/ExerciseReportModal';
import { api } from '../services/api';
import { 
  Shield, Activity, Users, CheckCircle2, Sparkles, MapPin, Hospital, 
  GraduationCap, Check, Building2, Eye, RefreshCw, AlertCircle, AlertTriangle, X, Send, Plus,
  Radio, Flame, FileText, Play, RotateCcw
} from 'lucide-react';

export default function GovernmentDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'disaster' ? 'disaster' : 'responsible';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [disasterSubTab, setDisasterSubTab] = useState('alerts'); // 'alerts' | 'simulation'

  // Active Disaster & Intelligence State
  const [disastersList, setDisastersList] = useState([]);
  const [activeDisaster, setActiveDisaster] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [relocationSites, setRelocationSites] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [nearbyUniversities, setNearbyUniversities] = useState([]);
  const [universityRisks, setUniversityRisks] = useState([]);
  const [incomingAlerts, setIncomingAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [liveResponseStatus, setLiveResponseStatus] = useState(null);

  // Simulation & Exercise Modals
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  // Loading & Error States for Disaster Command Center
  const [loadingDisaster, setLoadingDisaster] = useState(false);
  const [disasterError, setDisasterError] = useState(null);

  // AI & Modal state
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [message, setMessage] = useState('');

  // Government Responsible Problems state
  const [responsibleProblems, setResponsibleProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loadingProblems, setLoadingProblems] = useState(false);

  // Dynamic AI Relocation Re-Routing State
  const [rerouteResult, setRerouteResult] = useState(null);
  const [loadingReroute, setLoadingReroute] = useState(false);

  // New Requirement Form Modal State
  const [showReqModal, setShowReqModal] = useState(false);
  const [newRoleType, setNewRoleType] = useState('Medical Support');
  const [newRequiredCount, setNewRequiredCount] = useState(15);
  const [newUrgency, setNewUrgency] = useState('HIGH');
  const [submittingReq, setSubmittingReq] = useState(false);

  useEffect(() => {
    document.title = 'SANKALP AI | Government Disaster Command';
    loadGovernmentDashboard();
    loadResponsibleProblems();
  }, []);

  // Sync tab with URL search parameter
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl === 'disaster' || tabFromUrl === 'responsible') {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  async function loadGovernmentDashboard() {
    setLoadingDisaster(true);
    setDisasterError(null);
    try {
      // 1. Fetch incoming official alerts
      const alertsRes = await api.getIncomingAlerts().catch(() => ({ alerts: [] }));
      setIncomingAlerts(alertsRes.alerts || []);

      // 2. Fetch all disasters from backend
      const listRes = await api.getDisasters();
      const disasters = listRes.disasters || [];
      setDisastersList(disasters);

      if (disasters.length === 0) {
        setActiveDisaster(null);
        setRequirements([]);
        setRelocationSites([]);
        setHospitals([]);
        setNearbyUniversities([]);
        setUniversityRisks([]);
        setLiveResponseStatus(null);
        return;
      }

      // 3. Select primary active disaster or first disaster in database
      const targetDisaster = disasters.find(d => d.status === 'RESPONSE_ACTIVE') || disasters[0];
      const detailRes = await api.getDisasterDetail(targetDisaster.id);
      
      setActiveDisaster(detailRes.disaster || targetDisaster);
      setRequirements(detailRes.requirements || []);
      setRelocationSites(detailRes.relocationSites || []);
      setHospitals(detailRes.hospitals || []);
      setNearbyUniversities(detailRes.nearbyUniversities || []);

      // 4. Fetch university risk breakdown
      const risksRes = await api.getUniversityDisasterRisks(targetDisaster.id).catch(() => ({ university_risks: [] }));
      setUniversityRisks(risksRes.university_risks || []);

      // 5. Fetch live response status
      const respStatus = await api.getDisasterResponseStatus(targetDisaster.id).catch(() => null);
      if (respStatus) {
        setLiveResponseStatus(respStatus);
      }
    } catch (err) {
      console.error('Error loading Government Dashboard:', err);
      setDisasterError('Unable to load disaster response data. Please try again.');
    } finally {
      setLoadingDisaster(false);
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

  async function handleExecuteReroute(siteId) {
    if (!activeDisaster) return;
    setLoadingReroute(true);
    try {
      const res = await api.rerouteRelocation(activeDisaster.id, { full_site_id: siteId });
      setRerouteResult(res);
      setMessage(res.message || 'AI Relocation Re-routing executed successfully.');
      loadGovernmentDashboard();
    } catch (err) {
      setMessage('Failed to execute AI relocation re-routing.');
    } finally {
      setLoadingReroute(false);
    }
  }

  async function handleBroadcastRequirement(e) {
    e.preventDefault();
    if (!activeDisaster || !newRoleType || !newRequiredCount) return;
    setSubmittingReq(true);
    try {
      await api.request('/disasters/' + activeDisaster.id + '/requirements', {
        method: 'POST',
        body: JSON.stringify({
          role_type: newRoleType,
          required_count: Number(newRequiredCount),
          urgency: newUrgency
        })
      });
      setMessage(`Emergency Requirement for '${newRoleType}' broadcasted to university hubs.`);
      setShowReqModal(false);
      loadGovernmentDashboard();
    } catch (err) {
      setMessage(err.message || 'Failed to broadcast emergency requirement.');
    } finally {
      setSubmittingReq(false);
    }
  }

  // Summary Metrics calculations for Responsible Problems
  const totalGovProblems = responsibleProblems.length || 3;
  const totalUnivTeams = responsibleProblems.reduce((acc, p) => acc + (p.university_count || 0), 0) || 4;
  const totalSolutionsReceived = responsibleProblems.reduce((acc, p) => acc + (p.proposal_count || 0), 0) || 3;
  const solutionsUnderReview = responsibleProblems.filter(p => p.status === 'PROPOSALS_RECEIVED' || p.solutions?.some(s => s.status === 'SUBMITTED')).length || 2;

  // Dynamic Disaster Metrics
  const activeIncidentsCount = disastersList.filter(d => d.status === 'RESPONSE_ACTIVE').length;
  const totalAffectedPop = activeDisaster?.affected_population ? `${(activeDisaster.affected_population / 1000).toFixed(1)}k` : '0k';
  const totalVulnerablePop = activeDisaster?.vulnerable_population ? `${(activeDisaster.vulnerable_population / 1000).toFixed(1)}k` : '0k';

  const totalRequiredVolunteers = liveResponseStatus?.total_required || requirements.reduce((acc, r) => acc + (r.required_count || 0), 0);
  const totalFulfilledVolunteers = liveResponseStatus?.total_volunteers || requirements.reduce((acc, r) => acc + (r.fulfilled_count || r.confirmed_count || 0), 0);
  const responseCoveragePct = totalRequiredVolunteers > 0 ? Math.min(100, Math.round((totalFulfilledVolunteers / totalRequiredVolunteers) * 100)) : 0;
  
  const highPressureHospitalsCount = hospitals.filter(h => h.status === 'NEAR_CAPACITY' || h.status === 'HIGH_PRESSURE' || (h.available_beds / (h.total_beds || 1)) <= 0.25).length;

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>

        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
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
            <button onClick={handleRunAiAnalysis} className="btn btn-primary btn-sm" disabled={loadingAi || !activeDisaster}>
              <Sparkles size={14} /> {loadingAi ? 'Analyzing Incident...' : 'Run AI Analysis'}
            </button>
            <button onClick={() => setShowAiModal(true)} className="btn btn-secondary btn-sm">
              AI Command Assistant
            </button>
          </div>
        </div>

        {message && (
          <div style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>{message}</div>
            <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-success)' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* SANKALP AI Disaster Analysis Result Panel */}
        {(loadingAi || aiAnalysis) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <AIResultPanel
              title="SANKALP AI DISASTER RESPONSE ANALYSIS"
              loading={loadingAi}
              result={aiAnalysis}
              onRetry={handleRunAiAnalysis}
              onClose={() => setAiAnalysis(null)}
            />
          </div>
        )}

        {/* Primary Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => handleTabChange('responsible')}
            className={`btn btn-sm ${activeTab === 'responsible' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.4rem', fontWeight: 600 }}
          >
            <Building2 size={16} /> Responsible Problems &amp; Solutions ({totalGovProblems})
          </button>
          <button
            onClick={() => handleTabChange('disaster')}
            className={`btn btn-sm ${activeTab === 'disaster' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.4rem', fontWeight: 600 }}
          >
            <Shield size={16} /> Disaster Response Command Center {activeIncidentsCount > 0 && `(${activeIncidentsCount} Active)`}
          </button>
        </div>

        {/* TAB 1: Government Responsible Problems & Solutions */}
        {activeTab === 'responsible' && (
          <div className="page-section">
            {/* Summary Metrics Row */}
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
              <button onClick={loadResponsibleProblems} className="btn btn-secondary btn-sm" disabled={loadingProblems}>
                <RefreshCw size={14} className={loadingProblems ? 'spin' : ''} /> Refresh Catalog
              </button>
            </div>

            {loadingProblems ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Loading Government Responsible Problems...
              </div>
            ) : responsibleProblems.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <Building2 size={36} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '0.4rem' }}>No Responsible Problems Found</h3>
                <p className="text-muted">There are currently no societal challenges assigned to your government department.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {responsibleProblems.map((prob) => (
                  <div key={prob.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
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
            )}
          </div>
        )}

        {/* TAB 2: Disaster Response Command Center */}
        {activeTab === 'disaster' && (
          <div className="page-section">
            
            {/* DISASTER INTELLIGENCE & SIMULATION HEADER PANEL */}
            <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span className="badge badge-navy" style={{ gap: '0.3rem', fontSize: '0.7rem' }}>
                      <Radio size={12} className="spin" /> DISASTER INTELLIGENCE &amp; OFFICIAL ALERTS
                    </span>
                    {activeDisaster?.is_simulation === 1 && (
                      <span className="badge badge-warning" style={{ gap: '0.3rem', fontSize: '0.7rem', fontWeight: 700 }}>
                        <Flame size={12} /> SIMULATION MODE — NOT A LIVE EMERGENCY
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                    Official Emergency Alerts &amp; Exercise Simulation Mode
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ display: 'flex', backgroundColor: 'var(--bg-subtle)', padding: '3px', borderRadius: 'var(--radius-md)', gap: '2px' }}>
                    <button
                      onClick={() => setDisasterSubTab('alerts')}
                      className={`btn btn-xs ${disasterSubTab === 'alerts' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.75rem' }}
                    >
                      <Radio size={12} /> OFFICIAL ALERTS {incomingAlerts.filter(a => a.review_status === 'PENDING_REVIEW').length > 0 && `(${incomingAlerts.filter(a => a.review_status === 'PENDING_REVIEW').length})`}
                    </button>
                    <button
                      onClick={() => setDisasterSubTab('simulation')}
                      className={`btn btn-xs ${disasterSubTab === 'simulation' ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.35rem 0.75rem' }}
                    >
                      <Flame size={12} /> SIMULATION / EXERCISE
                    </button>
                  </div>

                  <button
                    onClick={() => setShowSimulationModal(true)}
                    className="btn btn-terracotta btn-sm"
                    style={{ fontWeight: 700, gap: '0.4rem', boxShadow: '0 4px 12px rgba(194, 65, 12, 0.25)' }}
                  >
                    <Play size={14} fill="currentColor" /> Run Disaster Simulation
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Official Incoming Alerts Queue */}
              {disasterSubTab === 'alerts' && (
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                      Pending Official Source Alerts (Government Review Required)
                    </span>
                    <button onClick={loadGovernmentDashboard} className="btn btn-ghost btn-xs" style={{ fontSize: '0.75rem' }}>
                      <RefreshCw size={12} /> Sync Feeds
                    </button>
                  </div>

                  {incomingAlerts.filter(a => a.review_status === 'PENDING_REVIEW').length === 0 ? (
                    <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', textTransform: 'none', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={16} color="var(--status-success)" />
                      <span>No pending unverified official alerts. Click <strong>"Run Disaster Simulation"</strong> to launch a simulated emergency exercise.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.75rem' }}>
                      {incomingAlerts.filter(a => a.review_status === 'PENDING_REVIEW').map((alt) => (
                        <div key={alt.id} className="card" style={{ padding: '0.85rem 1rem', borderLeft: '4px solid var(--status-warning)', margin: 0, backgroundColor: 'var(--bg-subtle)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>{alt.severity} SEVERITY</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{alt.source_name}</span>
                          </div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.2rem' }}>{alt.title}</h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginBottom: '0.6rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {alt.description}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: '0.4rem', borderTop: '1px solid var(--border-light)' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {alt.location || 'Coastal Zone'}</span>
                            <button
                              onClick={() => setSelectedAlert(alt)}
                              className="btn btn-primary btn-xs"
                              style={{ fontWeight: 600, fontSize: '0.75rem' }}
                            >
                              Review Alert
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Simulation Mode Info & Active Control */}
              {disasterSubTab === 'simulation' && (
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                        End-to-End Disaster Exercise Mode
                      </h4>
                      <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                        Simulates external alert arrival, official verification, Haversine risk calculations, targeted notifications, university acknowledgements, and response team deployments.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowSimulationModal(true)}
                      className="btn btn-primary btn-sm"
                    >
                      Open Exercise Controller
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Refresh & Controls Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                  Active Operational Command View
                </h2>
                <div className="metadata-text" style={{ marginTop: '2px' }}>
                  Real-time database feed of active disaster incidents, university risk classifications, and response status.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setShowReqModal(true)} className="btn btn-primary btn-sm" disabled={!activeDisaster}>
                  <Plus size={14} /> Broadcast Emergency Requirement
                </button>
                <button onClick={loadGovernmentDashboard} className="btn btn-secondary btn-sm" disabled={loadingDisaster}>
                  <RefreshCw size={14} className={loadingDisaster ? 'spin' : ''} /> Refresh Data
                </button>
              </div>
            </div>

            {/* Error State Banner */}
            {disasterError && (
              <div className="card" style={{ backgroundColor: 'var(--status-danger-bg)', borderColor: 'var(--status-danger)', padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                <AlertCircle size={32} color="var(--status-danger)" style={{ marginBottom: '0.5rem' }} />
                <h3 style={{ fontSize: '1.1rem', color: 'var(--status-danger)', marginBottom: '0.4rem', fontWeight: 700 }}>
                  Unable to load disaster response data
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#991b1b', marginBottom: '1rem' }}>
                  {disasterError}
                </p>
                <button onClick={loadGovernmentDashboard} className="btn btn-primary btn-sm">
                  <RefreshCw size={14} /> Try Again
                </button>
              </div>
            )}

            {/* Loading State */}
            {loadingDisaster && !disasterError && (
              <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem', marginBottom: '1.5rem' }}>
                <RefreshCw size={32} className="spin" color="var(--navy)" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)' }}>Connecting to Disaster Command Center...</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Fetching live emergency metrics from database.</p>
              </div>
            )}

            {/* Genuine Empty State (Data does not exist) */}
            {!loadingDisaster && !disasterError && disastersList.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem', marginBottom: '1.5rem' }}>
                <Shield size={42} color="var(--status-success)" style={{ marginBottom: '0.75rem' }} />
                <h3 style={{ fontSize: '1.2rem', color: 'var(--navy)', marginBottom: '0.4rem', fontWeight: 700 }}>
                  No Active Disaster Response Operations
                </h3>
                <p className="text-muted" style={{ maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
                  There are currently no active emergency or disaster incidents reported in District X database. The command center is monitoring standard operations.
                </p>
                <button onClick={loadGovernmentDashboard} className="btn btn-secondary btn-sm">
                  <RefreshCw size={14} /> Check for Updates
                </button>
              </div>
            )}

            {/* Real Data Loaded View */}
            {!loadingDisaster && !disasterError && activeDisaster && (
              <>
                {/* Dynamic Metric Stat Cards */}
                <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem' }}>
                  <div className="stat-card">
                    <div className="lbl">ACTIVE INCIDENTS</div>
                    <div className="num" style={{ color: 'var(--status-danger)' }}>
                      {activeIncidentsCount.toString().padStart(2, '0')}
                    </div>
                    <div className="ctx">{activeDisaster.title}</div>
                  </div>

                  <div className="stat-card">
                    <div className="lbl">AFFECTED POPULATION</div>
                    <div className="num">{totalAffectedPop}</div>
                    <div className="ctx">{totalVulnerablePop} Vulnerable residents</div>
                  </div>

                  <div className="stat-card">
                    <div className="lbl">RESPONSE COVERAGE</div>
                    <div className="num" style={{ color: 'var(--status-success)' }}>
                      {responseCoveragePct}%
                    </div>
                    <div className="ctx">{totalFulfilledVolunteers} / {totalRequiredVolunteers} Volunteers Deployed</div>
                  </div>

                  <div className="stat-card">
                    <div className="lbl">HOSPITALS UNDER PRESSURE</div>
                    <div className="num" style={{ color: highPressureHospitalsCount > 0 ? 'var(--status-warning)' : 'var(--status-success)' }}>
                      {highPressureHospitalsCount.toString().padStart(2, '0')}
                    </div>
                    <div className="ctx">{highPressureHospitalsCount > 0 ? 'Near Bed Capacity' : 'Normal Capacity'}</div>
                  </div>
                </div>

                {/* Section A: Active Incident Overview & Map Grid */}
                <div className="gov-incident-grid" style={{ marginBottom: '2rem' }}>
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
                        <span className={`badge ${activeDisaster.severity === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}`}>
                          {activeDisaster.severity} SEVERITY
                        </span>
                        <span className="metadata-text">{activeDisaster.status}</span>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--navy)', fontWeight: 700 }}>
                        {activeDisaster.title}
                      </h3>
                      <div className="metadata-text" style={{ marginBottom: '1rem' }}>
                        📍 <strong>{activeDisaster.location}</strong>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                          <span>Affected Population:</span>
                          <strong>{activeDisaster.affected_population?.toLocaleString() || 0} residents</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                          <span>Vulnerable Population:</span>
                          <strong style={{ color: 'var(--status-danger)' }}>{activeDisaster.vulnerable_population?.toLocaleString() || 0} elders/infants</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.6rem 0.85rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--navy)' }}>Hazard Details:</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.4 }}>
                            {activeDisaster.hazard_info}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ backgroundColor: 'var(--status-warning-bg)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fef08a', marginTop: '1rem' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--status-warning)', textTransform: 'uppercase' }}>
                        Government Command Oversight
                      </div>
                      <div style={{ fontSize: '13px', color: '#854d0e', marginTop: '0.2rem' }}>
                        Official relocation orders, volunteer broadcasts, and emergency routing require explicit Government Authority actions.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section B: ACTIVE REQUIREMENTS */}
                <div className="card" style={{ marginBottom: '2rem', borderLeft: '5px solid var(--navy)' }}>
                  <div className="panel-head">
                    <div>
                      <h3 className="card-title">Active Emergency Volunteer Requirements</h3>
                      <p className="text-muted" style={{ marginTop: '0.2rem' }}>
                        Track disaster responder demand, university fulfillment rates, and broadcast emergency positions.
                      </p>
                    </div>
                    <button onClick={() => setShowReqModal(true)} className="btn btn-primary btn-sm">
                      <Plus size={14} /> Add Requirement
                    </button>
                  </div>

                  {requirements.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No active emergency requirements broadcasted for this incident. Click "Add Requirement" to broadcast needs to university hubs.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
                      {requirements.map((req) => {
                        const confirmed = req.fulfilled_count || req.confirmed_count || 0;
                        const remaining = Math.max(0, req.required_count - confirmed);
                        const pct = req.required_count > 0 ? Math.min(100, Math.round((confirmed / req.required_count) * 100)) : 0;
                        return (
                          <div key={req.id} style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: '#ffffff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                              <span className={`badge ${req.urgency === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}`}>
                                {req.urgency || 'HIGH'} URGENCY
                              </span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: remaining === 0 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                                {remaining === 0 ? 'FULLY FILLED' : `${remaining} NEEDED`}
                              </span>
                            </div>

                            <h4 style={{ fontSize: '1rem', color: 'var(--navy)', marginBottom: '0.4rem', fontWeight: 700 }}>
                              {req.role_type}
                            </h4>

                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                              Confirmed: <strong style={{ color: 'var(--status-success)' }}>{confirmed} / {req.required_count}</strong> volunteers
                            </div>

                            {/* Progress bar */}
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: pct === 100 ? 'var(--status-success)' : 'var(--terracotta)', transition: 'width 0.3s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section C: Live University Response Monitoring */}
                <div className="card" style={{ marginBottom: '2rem', borderLeft: '5px solid var(--terracotta)' }}>
                  <div className="panel-head">
                    <div>
                      <h3 className="card-title">Live University Response Monitoring &amp; Hubs</h3>
                      <p className="text-muted" style={{ marginTop: '0.2rem' }}>
                        Real-time volunteer dispatch from National Institute of Technology (NIT) &amp; partner university response hubs.
                      </p>
                    </div>
                    <span className="badge badge-success">LIVE OPERATIONAL FEED</span>
                  </div>

                  <div className="grid grid-cols-4" style={{ marginBottom: '1.25rem' }}>
                    <div className="stat-card">
                      <div className="lbl">TOTAL VOLUNTEERS CONFIRMED</div>
                      <div className="num" style={{ color: 'var(--status-success)' }}>
                        {totalFulfilledVolunteers}
                      </div>
                      <div className="ctx">Students Deployed</div>
                    </div>

                    <div className="stat-card">
                      <div className="lbl">ACTIVE UNIVERSITY HUBS</div>
                      <div className="num" style={{ color: 'var(--navy)' }}>
                        {nearbyUniversities.length.toString().padStart(2, '0')}
                      </div>
                      <div className="ctx">Response Ready</div>
                    </div>

                    <div className="stat-card">
                      <div className="lbl">REMAINING NEED</div>
                      <div className="num" style={{ color: 'var(--status-warning)' }}>
                        {Math.max(0, totalRequiredVolunteers - totalFulfilledVolunteers)}
                      </div>
                      <div className="ctx">Unfilled Positions</div>
                    </div>

                    <div className="stat-card">
                      <div className="lbl">RESPONSE STATUS</div>
                      <div className="num" style={{ fontSize: '20px', color: 'var(--terracotta)' }}>
                        {activeDisaster.status}
                      </div>
                      <div className="ctx">Government Coordinated</div>
                    </div>
                  </div>

                  {/* University Response Hubs Grid */}
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy)', marginBottom: '0.75rem' }}>
                    Nearby University Response Hubs:
                  </div>

                  {nearbyUniversities.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      No nearby university response hubs registered.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
                      {nearbyUniversities.map((u) => (
                        <div key={u.id} style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--navy)' }}>{u.name}</strong>
                          </div>
                          <span className="badge badge-primary" style={{ fontSize: '0.65rem', marginBottom: '0.4rem', display: 'inline-block' }}>
                            {u.priority_label}
                          </span>
                          <div className="metadata-row">
                            <div>Distance: <strong>{u.distance_km} km</strong></div>
                            <div>Volunteers Ready: <strong>{u.nss_capacity + u.ncc_capacity}</strong></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section D: RELOCATION / SHELTER STATUS */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                  <div className="panel-head">
                    <div>
                      <h3 className="card-title">Relocation Site Evaluation &amp; Re-Routing Control</h3>
                      <p className="text-muted" style={{ marginTop: '0.2rem' }}>
                        Review center capacity, trigger dynamic capacity re-routing, and issue official Government Approvals.
                      </p>
                    </div>
                    <span className="badge badge-primary">AI RECOMMENDATION &amp; RE-ROUTING ENGINE</span>
                  </div>

                  {/* AI Relocation Re-Routing Result Panel */}
                  {rerouteResult && (
                    <div style={{ backgroundColor: '#0f291e', color: '#ffffff', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #1f523c' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 700, fontSize: '0.9rem' }}>
                          <AlertTriangle size={18} /> SANKALP AI DYNAMIC RELOCATION NODE RE-ROUTING
                        </div>
                        <button onClick={() => setRerouteResult(null)} style={{ background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer' }}>
                          <X size={16} />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', backgroundColor: '#163e2d', padding: '1rem', borderRadius: '8px' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#a7f3d0', textTransform: 'uppercase' }}>Full Node Center</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f87171' }}>
                            {rerouteResult.full_site?.name || 'Relief Center A'} (FULL: {rerouteResult.full_site?.capacity?.toLocaleString()} / {rerouteResult.full_site?.capacity?.toLocaleString()})
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#a7f3d0', textTransform: 'uppercase' }}>AI Calculated Redirect Target</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#4ade80' }}>
                            {rerouteResult.recommended_redirect_site?.name} ({rerouteResult.recommended_redirect_site?.distance_km} km away • {rerouteResult.recommended_redirect_site?.available_spots?.toLocaleString()} open spots)
                          </div>
                        </div>
                      </div>

                      <div style={{ backgroundColor: '#133527', padding: '0.85rem', borderRadius: '8px', borderLeft: '4px solid #4ade80', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                        <strong>🤖 AI Assistant Redirection:</strong> "{rerouteResult.ai_guidance}"
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#a7f3d0' }}>
                        <div>📡 Push Notifications Broadcasted: <strong>{rerouteResult.affected_volunteers_count} Active Student Volunteers Alerted</strong></div>
                        <span className="badge badge-success">LIVE DESTINATION UPDATED</span>
                      </div>
                    </div>
                  )}

                  {relocationSites.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No relocation centers registered for this incident.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2" style={{ gap: '1.25rem' }}>
                      {relocationSites.map((site) => {
                        const isFull = site.status === 'FULL' || (site.current_occupancy && site.current_occupancy >= site.capacity && site.capacity > 0);
                        const availableSpots = Math.max(0, site.capacity - (site.current_occupancy || 0));
                        return (
                          <div key={site.id} style={{ padding: '1.25rem', borderRadius: 'var(--radius-md)', border: isFull ? '2px solid var(--status-error)' : (site.status === 'APPROVED' ? '2px solid var(--status-success)' : '1px solid var(--border-light)'), backgroundColor: '#ffffff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                              {isFull ? (
                                <span className="badge badge-error" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
                                  🚨 CENTER FULL ({site.capacity?.toLocaleString()}/{site.capacity?.toLocaleString()})
                                </span>
                              ) : site.status === 'APPROVED' ? (
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

                            <h4 style={{ fontSize: '1.05rem', color: 'var(--navy)', marginBottom: '0.3rem', fontWeight: 700 }}>{site.name}</h4>
                            <div className="metadata-row" style={{ marginBottom: '0.85rem' }}>
                              <div>Occupancy: <strong>{site.current_occupancy?.toLocaleString() || 0} / {site.capacity?.toLocaleString()}</strong></div>
                              <div>Available Spots: <strong style={{ color: availableSpots > 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>{availableSpots.toLocaleString()}</strong></div>
                              <div>Road Status: <strong>{site.road_status}</strong></div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleExecuteReroute(site.id)}
                                className="btn btn-warning btn-sm"
                                disabled={loadingReroute}
                                style={{ width: '100%', fontSize: '0.75rem' }}
                              >
                                <AlertTriangle size={13} /> {isFull ? 'Run AI Re-Routing for Full Center' : `Simulate Node Full (${site.capacity}/${site.capacity}) & Run AI Re-Routing`}
                              </button>

                              {site.status !== 'APPROVED' && (
                                <button
                                  onClick={() => handleApproveRelocationSite(site.id)}
                                  className="btn btn-primary btn-sm"
                                  style={{ width: '100%', backgroundColor: 'var(--status-success)', borderColor: 'var(--status-success)', fontSize: '0.75rem' }}
                                >
                                  <Check size={13} /> Issue Official Government Approval
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Regional Hospitals Monitoring Grid */}
                <div className="card" style={{ marginBottom: '2rem' }}>
                  <div className="panel-head">
                    <div>
                      <h3 className="card-title">Regional Hospital Pressure &amp; Inflow Monitoring</h3>
                      <p className="text-muted" style={{ marginTop: '0.2rem' }}>
                        Monitored bed availability and estimated patient inflow across district medical facilities.
                      </p>
                    </div>
                    <span className="badge badge-primary">INFLOW MONITOR</span>
                  </div>

                  {hospitals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No regional hospital data available.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
                      {hospitals.map((h) => (
                        <div key={h.id} style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--navy)' }}>{h.name}</strong>
                            <span className={`badge ${h.status === 'NEAR_CAPACITY' || h.status === 'HIGH_PRESSURE' ? 'badge-warning' : 'badge-success'}`}>
                              {h.status}
                            </span>
                          </div>
                          <div className="metadata-row" style={{ marginTop: '0.4rem' }}>
                            <div>Beds: <strong>{h.available_beds} / {h.total_beds}</strong></div>
                            <div>Expected Inflow: <strong style={{ color: 'var(--status-warning)' }}>+{h.expected_inflow || 120}</strong></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        )}

        {/* Broadcast Requirement Modal */}
        {showReqModal && activeDisaster && (
          <div className="drawer-overlay" onClick={() => setShowReqModal(false)} style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', padding: '1.5rem', backgroundColor: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--navy)', fontWeight: 700, margin: 0 }}>
                  Broadcast Emergency Requirement
                </h3>
                <button onClick={() => setShowReqModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleBroadcastRequirement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--navy)' }}>
                    Role / Capability Required
                  </label>
                  <select
                    value={newRoleType}
                    onChange={(e) => setNewRoleType(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  >
                    <option value="Medical Support">Medical Support</option>
                    <option value="Evacuation Support">Evacuation Support</option>
                    <option value="Relief Operations">Relief Operations</option>
                    <option value="Technical / GIS Support">Technical / GIS Support</option>
                    <option value="Logistics & Supply">Logistics & Supply</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--navy)' }}>
                    Required Responders Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newRequiredCount}
                    onChange={(e) => setNewRequiredCount(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--navy)' }}>
                    Urgency Level
                  </label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  >
                    <option value="CRITICAL">CRITICAL URGENCY</option>
                    <option value="HIGH">HIGH URGENCY</option>
                    <option value="MEDIUM">MEDIUM URGENCY</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowReqModal(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={submittingReq}>
                    {submittingReq ? 'Broadcasting...' : 'Broadcast Requirement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Official Alert Review Modal */}
        {selectedAlert && (
          <OfficialAlertReviewModal
            alert={selectedAlert}
            onClose={() => setSelectedAlert(null)}
            onConfirmSuccess={() => {
              loadGovernmentDashboard();
            }}
            onActionComplete={() => {
              loadGovernmentDashboard();
            }}
          />
        )}

        {/* Disaster Simulation Controller Modal */}
        {showSimulationModal && (
          <DisasterSimulationModal
            isOpen={showSimulationModal}
            onClose={() => setShowSimulationModal(false)}
            onExerciseStarted={() => {
              loadGovernmentDashboard();
            }}
            onResetComplete={() => {
              loadGovernmentDashboard();
            }}
            onViewReport={async (simulationId) => {
              try {
                const res = await api.getSimulationReport(simulationId);
                setReportData(res.report);
                setShowReportModal(true);
              } catch (e) {
                alert('Unable to load exercise report.');
              }
            }}
          />
        )}

        {/* Exercise Report Summary Modal */}
        {showReportModal && reportData && (
          <ExerciseReportModal
            report={reportData}
            onClose={() => setShowReportModal(false)}
            onResetComplete={() => {
              loadGovernmentDashboard();
            }}
          />
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

        {/* AI Command Assistant Drawer */}
        {showAiModal && (
          <AIAssistantModal
            isOpen={showAiModal}
            onClose={() => setShowAiModal(false)}
            disasterId={activeDisaster ? activeDisaster.id : 1}
          />
        )}

      </main>
    </div>
  );
}
