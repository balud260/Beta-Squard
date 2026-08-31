import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import TeamBuilder from '../components/TeamBuilder';
import AssignEmergencyModal from '../components/AssignEmergencyModal';
import { api } from '../services/api';
import { GraduationCap, Users, Award, BookOpen, Send, Plus, CheckCircle2, Sparkles, Building2, Check, ArrowRight, Clock, Eye, XCircle, AlertCircle, X, Filter, ShieldAlert, ChevronRight } from 'lucide-react';

export default function UniversityDashboard() {
  const [activeTab, setActiveTab] = useState('available');
  const [university, setUniversity] = useState(null);
  const [publicProblems, setPublicProblems] = useState([]);
  const [recommendedProblems, setRecommendedProblems] = useState([]);
  const [acceptedProblems, setAcceptedProblems] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [studentContributions, setStudentContributions] = useState([]);
  const [activeEmergencyRequests, setActiveEmergencyRequests] = useState([]);
  
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [problemDetailModal, setProblemDetailModal] = useState(null);
  const [showAcceptConfirmModal, setShowAcceptConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Outside department scope');
  const [showProposalModal, setShowProposalModal] = useState(false);
  
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedEmergencyIncident, setSelectedEmergencyIncident] = useState(null);
  const [emergencySubTab, setEmergencySubTab] = useState('active');

  const [summary, setSummary] = useState('');
  const [approach, setApproach] = useState('');
  const [cost, setCost] = useState('220000');
  const [timeline, setTimeline] = useState('4 Months');
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.title = 'SANKALP AI | University Portal';
    loadUniversityPortalData();
  }, []);


  async function loadUniversityPortalData() {
    try {
      const uRes = await api.getUniversityDetail(1);
      setUniversity(uRes.university);

      const pubRes = await api.getPublicProblems();
      setPublicProblems(pubRes.problems || []);

      const recRes = await api.getRecommendedProblems().catch(() => ({ recommended: [] }));
      setRecommendedProblems(recRes.recommended || []);

      const accRes = await api.getAcceptedProblems().catch(() => ({ accepted: [] }));
      setAcceptedProblems(accRes.accepted || []);

      const propRes = await api.getMyProposals().catch(() => ({ proposals: [] }));
      setMyProposals(propRes.proposals || []);

      const contribRes = await api.getStudentContributions().catch(() => ({ contributions: [] }));
      setStudentContributions(contribRes.contributions || []);

      const emRes = await api.getActiveEmergencyRequests().catch(() => ({ activeRequests: [] }));
      setActiveEmergencyRequests(emRes.activeRequests || []);
    } catch (err) {
      console.error('Error loading university portal data:', err);
    }
  }

  async function handleOpenProblemDetail(problem) {
    try {
      const res = await api.getProblemDetail(problem.id);
      setProblemDetailModal(res);
    } catch (err) {
      setProblemDetailModal({ problem, analysis: null });
    }
  }

  async function handleConfirmAccept() {
    if (!problemDetailModal && !selectedProblem) return;
    const targetId = problemDetailModal ? problemDetailModal.problem.id : selectedProblem.id;

    try {
      const res = await api.acceptProblem(targetId);
      setMessage(res.message);
      setShowAcceptConfirmModal(false);
      setProblemDetailModal(null);
      loadUniversityPortalData();
    } catch (err) {
      setMessage(err.message || 'Failed to accept challenge.');
    }
  }

  async function handleConfirmReject() {
    if (!problemDetailModal && !selectedProblem) return;
    const targetId = problemDetailModal ? problemDetailModal.problem.id : selectedProblem.id;

    try {
      const res = await api.rejectProblem(targetId, { rejection_reason: rejectionReason });
      setMessage(res.message);
      setShowRejectModal(false);
      setProblemDetailModal(null);
      loadUniversityPortalData();
    } catch (err) {
      setMessage(err.message || 'Failed to reject challenge.');
    }
  }

  async function handleProposalSubmit(e) {
    e.preventDefault();
    if (!selectedProblem) return;

    try {
      const res = await api.submitProposal({
        problem_id: selectedProblem.id,
        summary,
        approach,
        cost: parseFloat(cost),
        timeline
      });
      setMessage('Proposal submitted successfully to client!');
      setShowProposalModal(false);
      loadUniversityPortalData();
    } catch (err) {
      setMessage('Failed to submit proposal.');
    }
  }

  function handleOpenEmergencyWorkflow(incident) {
    setSelectedEmergencyIncident(incident || {
      id: 1,
      title: 'Major Flood Incident - District X',
      severity: 'CRITICAL',
      location: 'District X',
      distance_km: 3.2
    });
    setShowEmergencyModal(true);
  }

  function handleEmergencyAssigned(result) {
    setMessage(result.message + ' ' + (result.details || ''));
    loadUniversityPortalData();
  }

  const getCategoryClass = (cat) => {
    if (!cat) return 'category-pill-edu';
    const upper = cat.toUpperCase();
    if (upper.includes('DISASTER') || upper.includes('FLOOD')) return 'category-pill-disaster';
    if (upper.includes('AGRICULTURE') || upper.includes('WATER')) return 'category-pill-agri';
    if (upper.includes('HEALTH') || upper.includes('MEDICAL')) return 'category-pill-health';
    return 'category-pill-edu';
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ padding: '1.5rem 1rem', flex: 1 }}>
        
        {message && (
          <div style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{message}</span>
            <button onClick={() => setMessage('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-success)' }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Reference Top Sub-Navigation Tabs */}
        <div className="tabs-scrollable">
          <button
            onClick={() => setActiveTab('available')}
            className={`btn btn-sm ${activeTab === 'available' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Discovery ({publicProblems.length})
          </button>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`btn btn-sm ${activeTab === 'recommended' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.3rem' }}
          >
            <Sparkles size={13} /> Recommended ({recommendedProblems.length})
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`btn btn-sm ${activeTab === 'accepted' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Accepted Problems ({acceptedProblems.length})
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`btn btn-sm ${activeTab === 'proposals' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Proposals ({myProposals.length})
          </button>
          <button
            onClick={() => setActiveTab('contributions')}
            className={`btn btn-sm ${activeTab === 'contributions' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Student Submissions ({studentContributions.length})
          </button>
          <button
            onClick={() => setActiveTab('emergency-requests')}
            className={`btn btn-sm ${activeTab === 'emergency-requests' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ color: activeTab === 'emergency-requests' ? '#fff' : 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
          >
            🚨 Emergency Requests
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`btn btn-sm ${activeTab === 'team' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Team Builder
          </button>
        </div>

        {/* MAIN THREE-COLUMN REFERENCE LAYOUT FOR 'AVAILABLE' DISCOVERY */}
        {activeTab === 'available' && (
          <div className="univ-portal-grid">
            
            {/* LEFT COLUMN: Hero Metric Card + Discovery Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="hero-card-dark" style={{ minHeight: '190px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                    ACCEPTED PROBLEMS
                  </div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                    0{acceptedProblems.length}
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--terracotta-soft)', marginBottom: '0.2rem' }}>
                    NATIONAL INSTITUTE OF TECHNOLOGY
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                    Active Response Node • District X
                  </div>
                </div>
              </div>

              {/* Discovery Filters Panel */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
                  <span>DISCOVERY FILTERS</span>
                  <Filter size={13} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-medium)', marginBottom: '0.35rem', display: 'block' }}>Category</label>
                    <select className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}>
                      <option>All Categories</option>
                      <option>Disaster Management</option>
                      <option>Healthcare &amp; Sanitation</option>
                      <option>Civic Infrastructure</option>
                      <option>Education</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-medium)', marginBottom: '0.35rem', display: 'block' }}>Urgency Level</label>
                    <select className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}>
                      <option>All Urgencies</option>
                      <option>CRITICAL</option>
                      <option>HIGH</option>
                      <option>MEDIUM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: Available Societal Challenges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                AVAILABLE SOCIETAL CHALLENGES ({publicProblems.length})
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {publicProblems.map((p) => (
                  <div key={p.id} className="card" style={{ padding: '1.25rem', transition: 'border-color 0.15s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '8px' }}>
                      <span className={`category-pill ${getCategoryClass(p.category)}`}>
                        {p.category}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        Client: {p.organization_name || 'Client Org'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--navy)', cursor: 'pointer' }} onClick={() => handleOpenProblemDetail(p)}>
                      {p.title}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                      {p.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem', flexWrap: 'wrap', gap: '8px' }}>
                      <div className="metadata-row">
                        <span>📍 {p.location}</span>
                        <span>Urgency: <strong style={{ color: p.urgency === 'CRITICAL' ? 'var(--status-danger)' : 'var(--text-dark)' }}>{p.urgency}</strong></span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleOpenProblemDetail(p)} className="btn btn-secondary btn-sm">
                          <Eye size={14} /> View Details
                        </button>
                        <button onClick={() => { setSelectedProblem(p); setShowAcceptConfirmModal(true); }} className="btn btn-primary btn-sm">
                          <Check size={14} /> Accept Challenge
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: Team Activity & Success Insights */}
            <div className="univ-portal-right-rail" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  TEAM ACTIVITY
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                      P
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-dark)' }}>Prof. Ramesh Gupta</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Assigned to Flood Early Warning</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                      A
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-dark)' }}>Aarav Mehta (Student Lead)</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Submitted IoT Sensor Prototype</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '1.25rem', backgroundColor: 'var(--navy)', color: '#ffffff' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                  ACADEMIC IMPACT SCORE
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.2rem' }}>
                  94.8 <span style={{ fontSize: '0.8rem', color: 'var(--status-success-bg)', fontWeight: 600 }}>Top Tier</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                  14 societal challenges solved &amp; deployed in District X
                </div>
              </div>
            </div>

          </div>
        )}

        {/* OTHER TABS */}
        {activeTab !== 'available' && (
          <div>
            {activeTab === 'recommended' && (
              <div className="grid grid-cols-2">
                {recommendedProblems.map((p) => (
                  <div key={p.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge badge-primary"><Sparkles size={12} /> {p.matchScore || 95}% MATCH</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{p.category}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--navy)' }}>{p.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{p.description}</p>
                    <button onClick={() => { setSelectedProblem(p); setShowAcceptConfirmModal(true); }} className="btn btn-primary btn-sm">
                      <Check size={14} /> Accept Challenge
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'accepted' && (
              <div className="grid grid-cols-2">
                {acceptedProblems.map((p) => (
                  <div key={p.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge badge-success">ACCEPTED WORKSPACE</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{p.organization_name}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--navy)' }}>{p.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{p.description}</p>
                    <button onClick={() => { setSelectedProblem(p); setShowProposalModal(true); }} className="btn btn-primary btn-sm">
                      {p.proposal_submitted ? 'Update Proposal' : 'Submit Proposal'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'proposals' && (
              <div className="grid grid-cols-2">
                {myProposals.map((prop) => (
                  <div key={prop.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge badge-primary">{prop.status}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{prop.organization_name}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--navy)' }}>{prop.summary}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Est. Cost: ₹{prop.cost?.toLocaleString()} • Timeline: {prop.timeline}</div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'contributions' && (
              <div className="grid grid-cols-2">
                {studentContributions.map((c) => (
                  <div key={c.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge badge-primary">{c.status}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Student: {c.student_name || 'Aarav Mehta'}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem', color: 'var(--navy)' }}>{c.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* FUNCTIONAL EMERGENCY REQUESTS TAB */}
            {activeTab === 'emergency-requests' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Emergency Requests Sub-Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setEmergencySubTab('active')}
                      className={`btn btn-sm ${emergencySubTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      Active Incidents ({activeEmergencyRequests.length || 1})
                    </button>
                    <button
                      onClick={() => setEmergencySubTab('completed')}
                      className={`btn btn-sm ${emergencySubTab === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      Completed Missions (02)
                    </button>
                  </div>

                  <span className="badge badge-danger">
                    <ShieldAlert size={12} /> GOVERNMENT EMERGENCY DISPATCH ACTIVE
                  </span>
                </div>

                {emergencySubTab === 'active' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(activeEmergencyRequests.length > 0 ? activeEmergencyRequests : [
                      {
                        incident: { id: 1, title: 'Major Flood Incident - District X', severity: 'CRITICAL', location: 'District X', distance_km: 3.2 },
                        status: 'PARTIALLY FULFILLED',
                        requirements: [
                          { role_type: 'Medical Support', required_count: 10, fulfilled_count: 8 },
                          { role_type: 'Evacuation Support', required_count: 20, fulfilled_count: 13 },
                          { role_type: 'Technical Support', required_count: 5, fulfilled_count: 5 }
                        ]
                      }
                    ]).map((reqItem, idx) => {
                      const inc = reqItem.incident;
                      return (
                        <div key={inc.id || idx} className="card" style={{ borderLeft: '5px solid var(--status-danger)', padding: '1.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span className="badge badge-danger">CRITICAL FLOOD INCIDENT</span>
                              <span className="badge badge-primary">HIGH PRIORITY HUB (3.2 km)</span>
                            </div>
                            <span className={`badge ${reqItem.status === 'FULLY FULFILLED' ? 'badge-success' : 'badge-warning'}`}>
                              Response Status: {reqItem.status || 'PARTIALLY FULFILLED'}
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.25rem', color: 'var(--navy)', marginBottom: '0.3rem' }}>
                            {inc.title}
                          </h3>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                            Issued by: <strong>Government Disaster Command Center</strong> • Severity: <strong style={{ color: 'var(--status-danger)' }}>{inc.severity}</strong> • Location: {inc.location}
                          </div>

                          {/* Fulfillment Breakdown Progress Bars */}
                          <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy)', marginBottom: '0.75rem' }}>
                              Required Support &amp; Live Student Response Ratios:
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                              {(reqItem.requirements || [
                                { role_type: 'Medical Support', required_count: 10, fulfilled_count: 8 },
                                { role_type: 'Evacuation Support', required_count: 20, fulfilled_count: 13 },
                                { role_type: 'Technical Support', required_count: 5, fulfilled_count: 5 }
                              ]).map((r) => {
                                const reqCount = r.required_count || 10;
                                const fulCount = r.fulfilled_count || 0;
                                const pct = Math.min(100, Math.round((fulCount / reqCount) * 100));
                                return (
                                  <div key={r.role_type}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>
                                      <span>{r.role_type}</span>
                                      <span>{fulCount} / {reqCount} available ({pct}%)</span>
                                    </div>
                                    <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct >= 100 ? 'var(--status-success)' : 'var(--terracotta)', transition: 'width 0.3s ease' }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Interactive Response Buttons */}
                          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleOpenEmergencyWorkflow(inc)}
                              className="btn btn-secondary btn-sm"
                            >
                              Manage Response Teams
                            </button>
                            <button
                              onClick={() => handleOpenEmergencyWorkflow(inc)}
                              className="btn btn-primary"
                              style={{ backgroundColor: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
                            >
                              <ShieldAlert size={16} /> Assign Response Teams &amp; Notify Students
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {emergencySubTab === 'completed' && (
                  <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={32} color="var(--status-success)" style={{ margin: '0 auto 0.5rem' }} />
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '0.25rem' }}>Past Emergency Operations</h3>
                    <p style={{ fontSize: '0.85rem' }}>Previous disaster deployments fully resolved in coordination with Government Authority.</p>
                  </div>
                )}

              </div>
            )}

            {activeTab === 'team' && <TeamBuilder universityName={university?.name} />}
          </div>
        )}

        {/* Detailed Problem View Modal */}
        {problemDetailModal && (
          <div className="modal-overlay" onClick={() => setProblemDetailModal(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className="badge badge-primary">{problemDetailModal.problem.category}</span>
                <button onClick={() => setProblemDetailModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>

              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.4rem', color: 'var(--navy)' }}>{problemDetailModal.problem.title}</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Posted by: <strong>{problemDetailModal.problem.organization_name || 'Client Organization'}</strong> • Location: {problemDetailModal.problem.location}
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {problemDetailModal.problem.description}
              </p>

              {problemDetailModal.analysis && (
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--terracotta)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={14} /> AI Analysis &amp; Requirement Breakdown
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <div>Difficulty: <strong>{problemDetailModal.analysis.difficulty}</strong></div>
                    <div>Social Impact: <strong>{problemDetailModal.analysis.social_impact}</strong></div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setSelectedProblem(problemDetailModal.problem); setShowRejectModal(true); }}
                  className="btn btn-secondary"
                  style={{ color: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
                >
                  <XCircle size={16} /> Reject Problem
                </button>

                <button
                  onClick={() => { setSelectedProblem(problemDetailModal.problem); setShowAcceptConfirmModal(true); }}
                  className="btn btn-primary"
                  style={{ gap: '0.4rem' }}
                >
                  <Check size={16} /> Accept Problem
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Accept Confirmation Modal */}
        {showAcceptConfirmModal && selectedProblem && (
          <div className="modal-overlay" onClick={() => setShowAcceptConfirmModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--terracotta-soft)', color: 'var(--terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--navy)' }}>Confirm Challenge Acceptance</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Are you sure you want to accept <strong>"{selectedProblem.title}"</strong> for {university?.name}?
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button onClick={() => setShowAcceptConfirmModal(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleConfirmAccept} className="btn btn-primary">Confirm Acceptance</button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Confirmation Modal */}
        {showRejectModal && selectedProblem && (
          <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--status-danger)' }}>Decline Challenge</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Provide an optional reason for declining <strong>"{selectedProblem.title}"</strong>:
              </p>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="btn btn-secondary"
                style={{ width: '100%', marginBottom: '1.25rem', textAlign: 'left' }}
              >
                <option value="Outside department scope">Outside department scope</option>
                <option value="Insufficient student bandwidth">Insufficient student bandwidth</option>
                <option value="Timeline constraints">Timeline constraints</option>
                <option value="Budget constraints">Budget constraints</option>
              </select>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowRejectModal(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleConfirmReject} className="btn btn-primary" style={{ backgroundColor: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}>
                  Confirm Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Proposal Submission Modal */}
        {showProposalModal && selectedProblem && (
          <div className="modal-overlay" onClick={() => setShowProposalModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--navy)' }}>Submit Solution Proposal</h3>
                <button onClick={() => setShowProposalModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Problem: <strong>{selectedProblem.title}</strong>
              </p>

              <form onSubmit={handleProposalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-medium)', marginBottom: '0.3rem', display: 'block' }}>Executive Summary</label>
                  <input
                    type="text"
                    required
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Concise overview of your solution proposal"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-medium)', marginBottom: '0.3rem', display: 'block' }}>Technical Approach &amp; Deliverables</label>
                  <textarea
                    rows={4}
                    required
                    value={approach}
                    onChange={(e) => setApproach(e.target.value)}
                    placeholder="Describe engineering architecture, student team roles, and milestones..."
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-medium)', marginBottom: '0.3rem', display: 'block' }}>Estimated Cost (₹)</label>
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-medium)', marginBottom: '0.3rem', display: 'block' }}>Timeline</label>
                    <input
                      type="text"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowProposalModal(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit Proposal</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ASSIGN EMERGENCY RESPONSE MODAL */}
        <AssignEmergencyModal
          isOpen={showEmergencyModal}
          onClose={() => setShowEmergencyModal(false)}
          incident={selectedEmergencyIncident}
          onAssignmentComplete={handleEmergencyAssigned}
        />

      </main>
    </div>
  );
}
