import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import TeamBuilder from '../components/TeamBuilder';
import { api } from '../services/api';
import { GraduationCap, Users, Award, BookOpen, Send, Plus, CheckCircle2, Sparkles, Building2, Check, ArrowRight, Clock, Eye, XCircle, AlertCircle, X, Filter } from 'lucide-react';

export default function UniversityDashboard() {
  const [activeTab, setActiveTab] = useState('available');
  const [university, setUniversity] = useState(null);
  const [publicProblems, setPublicProblems] = useState([]);
  const [recommendedProblems, setRecommendedProblems] = useState([]);
  const [acceptedProblems, setAcceptedProblems] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [studentContributions, setStudentContributions] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [problemDetailModal, setProblemDetailModal] = useState(null);
  const [showAcceptConfirmModal, setShowAcceptConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Outside department scope');
  const [showProposalModal, setShowProposalModal] = useState(false);

  const [summary, setSummary] = useState('');
  const [approach, setApproach] = useState('');
  const [cost, setCost] = useState('220000');
  const [timeline, setTimeline] = useState('4 Months');
  const [message, setMessage] = useState('');

  useEffect(() => {
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
          <div style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.9rem' }}>
            {message}
          </div>
        )}

        {/* Reference Top Sub-Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.4rem', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('available')}
            className={`btn ${activeTab === 'available' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            Discovery ({publicProblems.length})
          </button>
          <button
            onClick={() => setActiveTab('recommended')}
            className={`btn ${activeTab === 'recommended' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', gap: '0.3rem' }}
          >
            <Sparkles size={13} /> Recommended ({recommendedProblems.length})
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`btn ${activeTab === 'accepted' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            Accepted Problems ({acceptedProblems.length})
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`btn ${activeTab === 'proposals' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            Proposals ({myProposals.length})
          </button>
          <button
            onClick={() => setActiveTab('contributions')}
            className={`btn ${activeTab === 'contributions' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            Student Submissions ({studentContributions.length})
          </button>
          <button
            onClick={() => setActiveTab('emergency-requests')}
            className={`btn ${activeTab === 'emergency-requests' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem', color: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
          >
            🚨 Emergency Requests
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`btn ${activeTab === 'team' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
          >
            Team Builder
          </button>
        </div>

        {/* MAIN THREE-COLUMN REFERENCE LAYOUT FOR 'AVAILABLE' DISCOVERY */}
        {activeTab === 'available' && (
          <div className="univ-portal-grid">

            
            {/* LEFT COLUMN: Hero Metric Card + Discovery Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Dark Hero Metric Card matching Reference Screenshot */}
              <div className="hero-card-dark" style={{ minHeight: '190px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
                    ACCEPTED PROBLEMS
                  </div>
                  <h2>0{acceptedProblems.length || 8}</h2>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', margin: '0.6rem 0 1rem', lineHeight: 1.4 }}>
                    3 new challenges matched your expertise in CSE this week.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('accepted')}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '0.45rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View All Assignments
                </button>
              </div>

              {/* Discovery Filters Panel matching Reference */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Filter size={13} /> DISCOVERY FILTERS
                </div>

                {/* Domain Category Badges */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                    DOMAIN
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span className="category-pill category-pill-edu">Education</span>
                    <span className="category-pill category-pill-health">Health</span>
                    <span className="category-pill category-pill-agri">Agriculture</span>
                  </div>
                </div>

                {/* Department Checkboxes */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                    DEPARTMENT
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-medium)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked /> CSE / Software
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked /> AI + Robotics
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input type="checkbox" /> Environmental
                    </label>
                  </div>
                </div>

                {/* Bottom Ranking Indicator */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>University Ranking</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent-purple)' }}>Top 5%</span>
                </div>
              </div>

            </div>

            {/* CENTER COLUMN: Available Societal Challenges horizontal cards */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-dark)' }}>Available Societal Challenges</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Showing {publicProblems.length} open challenges
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {publicProblems.map((p, idx) => (
                  <div key={p.id} className="card" style={{ padding: '1.25rem', position: 'relative' }}>
                    
                    {/* Top Row: #ID tag, Category pill, Match score badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                          #00{p.id}
                        </span>
                        <span className={`category-pill ${getCategoryClass(p.category)}`}>
                          {p.category}
                        </span>
                      </div>
                      <span className="badge badge-success" style={{ fontSize: '0.7rem', backgroundColor: '#ecfdf5', color: '#047857' }}>
                        {92 - idx * 3}% Skill Match
                      </span>
                    </div>

                    {/* Problem Title */}
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-dark)', marginBottom: '0.4rem', fontWeight: 700 }}>
                      {p.title}
                    </h3>

                    {/* Short Description Excerpt */}
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '1rem' }}>
                      {p.description}
                    </p>

                    {/* Bottom Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📍 {p.location}</span>
                        <span>•</span>
                        <span>Urgency: <strong>{p.urgency}</strong></span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenProblemDetail(p)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          View Details
                        </button>

                        {p.user_acceptance_status === 'ACCEPTED' ? (
                          <span className="badge badge-success" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                            ✓ Accepted
                          </span>
                        ) : p.user_acceptance_status === 'REJECTED' ? (
                          <span className="badge badge-danger" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                            Declined
                          </span>
                        ) : (
                          <button
                            onClick={() => { setSelectedProblem(p); setShowAcceptConfirmModal(true); }}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: '0.75rem', backgroundColor: 'var(--text-dark)' }}
                          >
                            View & Apply
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: Team Activity & Success Insights matching Reference */}
            <div className="univ-portal-right-rail" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              
              {/* Team Activity Panel */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  TEAM ACTIVITY
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                      A
                    </div>
                    <div style={{ flex: 1, fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>Team Alpha</div>
                      <div style={{ color: 'var(--text-muted)' }}>Submitted Proposal for #004</div>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>3m ago</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                      B
                    </div>
                    <div style={{ flex: 1, fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>Team Beta</div>
                      <div style={{ color: 'var(--text-muted)' }}>Design Phase: Smart Grid</div>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>1h ago</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                      M
                    </div>
                    <div style={{ flex: 1, fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>Lab-X</div>
                      <div style={{ color: 'var(--text-muted)' }}>Prototype Testing (90%)</div>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>2h ago</span>
                  </div>
                </div>
              </div>

              {/* Success Insights Card matching Reference */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                  SUCCESS INSIGHTS
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>IMPACT CREATED</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-purple)' }}>12.4k <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Lives Touched</span></div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>PROPOSALS WON</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--status-success)' }}>84% <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Success Rate</span></div>
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>NEXT DEADLINE</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark)' }}>Feb 24, 2024</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--status-danger)', fontWeight: 700 }}>FINAL REPORT #009</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '1rem', textAlign: 'center' }}>
                  <a href="#switch" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    Switch to Problem Owner Portal →
                  </a>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* OTHER TABS (Recommended, Accepted, Proposals, Contributions, Emergency, Team) */}
        {activeTab !== 'available' && (
          <div style={{ marginTop: '1rem' }}>
            {activeTab === 'recommended' && (
              <div className="grid grid-cols-2">
                {recommendedProblems.map((p) => (
                  <div key={p.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="badge badge-primary">{p.match_score || 94}% MATCH</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{p.organization_name}</span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{p.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>{p.description}</p>
                    <button onClick={() => { setSelectedProblem(p); setShowProposalModal(true); }} className="btn btn-primary" style={{ width: '100%' }}>
                      Submit Proposal
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
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{p.title}</h3>
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
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{prop.summary}</h3>
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
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{c.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.description}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'emergency-requests' && (
              <div className="card" style={{ borderLeft: '4px solid var(--status-danger)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-danger">CRITICAL FLOOD INCIDENT</span>
                  <span className="badge badge-primary">HIGH PRIORITY HUB (3.2 km)</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>Major Flood Incident - District X</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Issued by Government Disaster Command Center</p>
                <button className="btn btn-primary" style={{ backgroundColor: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}>
                  Assign Response Teams & Notify Students
                </button>
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

              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.4rem' }}>{problemDetailModal.problem.title}</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Posted by: <strong>{problemDetailModal.problem.organization_name || 'Client Organization'}</strong> • Location: {problemDetailModal.problem.location}
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-medium)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {problemDetailModal.problem.description}
              </p>

              {problemDetailModal.analysis && (
                <div style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary-blue)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={14} /> AI Analysis & Requirement Breakdown
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
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Confirm Challenge Acceptance</h3>
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
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}
              >
                <option value="Outside current department scope">Outside current department scope</option>
                <option value="Insufficient student expertise">Insufficient student expertise</option>
                <option value="Insufficient laboratory/hardware resources">Insufficient laboratory/hardware resources</option>
                <option value="Timeline not feasible for academic calendar">Timeline not feasible for academic calendar</option>
              </select>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowRejectModal(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleConfirmReject} className="btn btn-primary" style={{ backgroundColor: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}>Decline Challenge</button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Proposal Modal */}
        {showProposalModal && selectedProblem && (
          <div className="modal-overlay" onClick={() => setShowProposalModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.3rem' }}>Submit Technical Proposal</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Challenge: <strong>{selectedProblem.title}</strong></p>
              <form onSubmit={handleProposalSubmit}>
                <input type="text" required placeholder="Solution Summary" value={summary} onChange={(e) => setSummary(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1rem' }} />
                <textarea rows={4} required placeholder="Technical Approach" value={approach} onChange={(e) => setApproach(e.target.value)} style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1rem' }} />
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowProposalModal(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit Proposal</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
