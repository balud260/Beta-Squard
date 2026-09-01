import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import ProposalComparison from '../components/ProposalComparison';
import ImpactChart from '../components/ImpactChart';
import SubmitChallengeModal from '../components/SubmitChallengeModal';
import AIResultPanel from '../components/AIResultPanel';
import ProblemLifecycleTracker from '../components/ProblemLifecycleTracker';
import { api } from '../services/api';


import { useAuth } from '../context/AuthContext';
import { Building2, Plus, Sparkles, CheckCircle2, FileText, Send, Lock, GraduationCap, Check, ArrowRight, Bell, XCircle } from 'lucide-react';

export default function ProblemOwnerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('problems');
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [acceptedUniversities, setAcceptedUniversities] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    document.title = 'SANKALP AI | Problem Owner Portal';
    loadOwnerProblems();
    loadNotifications();
  }, [user]);


  async function loadOwnerProblems() {
    try {
      const res = await api.getProblems();
      setProblems(res.problems || []);
      if (res.problems && res.problems.length > 0) {
        selectProblem(res.problems[0].id);
      } else {
        setSelectedProblem(null);
        setProposals([]);
        setAcceptedUniversities([]);
      }
    } catch (err) {
      console.error('Load owner problems error:', err);
    }
  }

  async function loadNotifications() {
    try {
      const res = await api.getNotifications().catch(() => ({ notifications: [] }));
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Load notifications error:', err);
    }
  }

  async function selectProblem(problemId) {
    try {
      const detail = await api.getProblemDetail(problemId);
      setSelectedProblem(detail.problem);
      setAiAnalysis(detail.analysis);
      setProposals(detail.proposals || []);

      const accRes = await api.getAcceptedUniversities(problemId).catch(() => ({ accepted: [] }));
      setAcceptedUniversities(accRes.accepted || []);
    } catch (err) {
      console.error('Select problem error:', err);
    }
  }

  async function handleAnalyzeProblem() {
    if (!selectedProblem) return;
    setLoadingAi(true);
    try {
      const res = await api.analyzeProblem(selectedProblem.id);
      setAiAnalysis(res.analysis);
      setMessage('AI Problem Taxonomy & Skill requirements generated.');
      selectProblem(selectedProblem.id);
    } catch (err) {
      setMessage('AI Analysis failed.');
    } finally {
      setLoadingAi(false);
    }
  }

  async function handleSelectProposal(proposalId) {
    try {
      const res = await api.selectProposal(proposalId);
      setMessage(res.message);
      selectProblem(selectedProblem.id);
    } catch (err) {
      console.error('Select proposal error:', err);
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ padding: '1.5rem 1rem', flex: 1 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <div className="badge badge-primary" style={{ marginBottom: '0.3rem', fontSize: '0.7rem' }}>
              <Building2 size={13} /> PROBLEM OWNER PORTAL • {user?.organization?.name || user?.name}
            </div>
            <h1 style={{ fontSize: '1.75rem', color: 'var(--text-dark)' }}>Organization Problems & University Collaborations</h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={12} color="var(--status-success)" /> Strict Privacy Enforced: You see only your organization's challenges and responses.
            </div>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm" style={{ gap: '0.4rem' }}>
            <Plus size={16} /> Submit New Challenge
          </button>
        </div>

        {message && (
          <div style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
            {message}
          </div>
        )}        {/* TOP METRIC CARDS ROW */}
        <div className="grid grid-cols-4" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="lbl">MY PROBLEMS</div>
            <div className="num">0{problems.length}</div>
            <div className="ctx">Active Challenges</div>
          </div>

          <div className="stat-card">
            <div className="lbl">UNIVERSITY RESPONSES</div>
            <div className="num" style={{ color: 'var(--status-success)' }}>0{acceptedUniversities.length}</div>
            <div className="ctx">Accepted Institutions</div>
          </div>

          <div className="stat-card">
            <div className="lbl">SOLUTIONS RECEIVED</div>
            <div className="num" style={{ color: 'var(--terracotta)' }}>0{proposals.length}</div>
            <div className="ctx">Proposals Submitted</div>
          </div>

          <div className="stat-card">
            <div className="lbl">ACTIVE PROJECTS</div>
            <div className="num" style={{ color: 'var(--navy)' }}>01</div>
            <div className="ctx">In Development</div>
          </div>
        </div>

        {/* Notifications Alert Banner if new responses exist */}
        {notifications.length > 0 && (
          <div style={{ backgroundColor: '#FEF3EA', border: '1px solid #F6D9B8', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--terracotta)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
              <Bell size={14} /> Recent University Responses &amp; Notifications
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)' }}>
              {notifications[0].message} ({notifications[0].created_at?.slice(0, 10)})
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="tabs-scrollable">
          <button
            onClick={() => setActiveTab('problems')}
            className={`btn btn-sm ${activeTab === 'problems' ? 'btn-primary' : 'btn-secondary'}`}
          >
            My Problems ({problems.length})
          </button>
          <button
            onClick={() => setActiveTab('accepted-universities')}
            className={`btn btn-sm ${activeTab === 'accepted-universities' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.3rem' }}
          >
            <GraduationCap size={14} /> University Responses ({acceptedUniversities.length})
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`btn btn-sm ${activeTab === 'proposals' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Solutions Received ({proposals.length})
          </button>
          <button
            onClick={() => setActiveTab('impact')}
            className={`btn btn-sm ${activeTab === 'impact' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Impact Metrics
          </button>
        </div>

        {/* TAB 1: My Problems */}
        {activeTab === 'problems' && (
          <div className="grid grid-cols-2" style={{ marginBottom: '1.5rem' }}>

            
            {/* My Problems List matching reference cards */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.85rem', color: 'var(--text-dark)' }}>MY PROBLEMS</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {problems.map((p) => {
                  const isSelected = selectedProblem?.id === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => selectProblem(p.id)}
                      style={{
                        padding: '0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--primary-blue)' : '1px solid var(--border-light)',
                        backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{p.category}</span>
                        <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{p.status}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{p.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'flex', gap: '0.75rem' }}>
                        <span>Accepted: <strong style={{ color: 'var(--status-success)' }}>{p.accepted_count || 0}</strong></span>
                        <span>Rejected: <strong style={{ color: 'var(--status-danger)' }}>{p.rejected_count || 0}</strong></span>
                        <span>Proposals: <strong>{p.proposal_count || 0}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Problem Details & AI Analysis */}
            {selectedProblem ? (
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                  <div>
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{selectedProblem.category}</span>
                    <h2 style={{ fontSize: '1.25rem', marginTop: '0.3rem', color: 'var(--text-dark)' }}>{selectedProblem.title}</h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location: {selectedProblem.location}</p>
                  </div>
                  <button onClick={handleAnalyzeProblem} className="btn btn-primary btn-sm" disabled={loadingAi} style={{ fontSize: '0.75rem' }}>
                    <Sparkles size={13} /> {loadingAi ? 'Analyzing...' : 'Run AI Analysis'}
                  </button>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-medium)', marginBottom: '1rem', lineHeight: 1.45 }}>
                  {selectedProblem.description}
                </p>

                {/* SANKALP AI Problem Lifecycle Tracker */}
                <ProblemLifecycleTracker currentStatus={selectedProblem.status} style={{ marginBottom: '1rem' }} />

                {/* Accepted Universities Summary Box */}
                {acceptedUniversities.length > 0 && (
                  <div style={{ backgroundColor: 'var(--status-success-bg)', border: '1px solid #B8E6CB', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--status-success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                      <CheckCircle2 size={16} /> Accepted Institutions ({acceptedUniversities.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {acceptedUniversities.map(u => (
                        <div key={u.id} style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>🎓 {u.university_name} ({u.location})</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--status-success)' }}>Accepted on {u.accepted_at?.slice(0, 10)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* SANKALP AI Result Panel */}
                {(loadingAi || aiAnalysis) && (
                  <div style={{ marginTop: '1rem' }}>
                    <AIResultPanel
                      title="SANKALP AI PROBLEM ANALYSIS"
                      loading={loadingAi}
                      result={aiAnalysis}
                      onRetry={handleAnalyzeProblem}
                      fallbackResult={{
                        category: selectedProblem.category || 'Healthcare Operations',
                        sub_category: 'Hospital Operations & Resource Logistics',
                        required_skills: ['AI/ML', 'Web Development', 'Data Analytics', 'Database Systems'],
                        required_departments: ['Computer Science', 'Data Science', 'Healthcare Technology'],
                        difficulty: 'Medium',
                        urgency: 'High',
                        social_impact: 'High',
                        summary: 'AI problem taxonomy and skill requirement breakdown generated for university matching.',
                        recommended_actions: [
                          'Publish challenge to university network',
                          'Form multidisciplinary student developer team',
                          'Schedule field deployment within 60 days'
                        ]
                      }}
                    />
                  </div>
                )}

              </div>
            ) : (
              <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No challenges posted yet. Click "Submit New Challenge" to post your first problem.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Accepted & Responding Universities */}
        {activeTab === 'accepted-universities' && selectedProblem && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '0.85rem' }}>
              <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dark)' }}>
                <GraduationCap size={20} color="var(--primary-blue)" /> University Responses for: {selectedProblem.title}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                These universities have reviewed your problem requirements and recorded their official decision.
              </p>
            </div>

            {acceptedUniversities.length > 0 ? (
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                {acceptedUniversities.map((u) => (
                  <div key={u.id} className="card" style={{ padding: '1rem', borderLeft: u.status === 'ACCEPTED' ? '4px solid var(--status-success)' : '4px solid var(--status-danger)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      {u.status === 'ACCEPTED' ? (
                        <span className="badge badge-success" style={{ gap: '0.3rem', fontSize: '0.65rem' }}>
                          <Check size={12} /> UNIVERSITY ACCEPTED
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ gap: '0.3rem', fontSize: '0.65rem' }}>
                          <XCircle size={12} /> UNIVERSITY DECLINED
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.accepted_at?.slice(0, 10)}</span>
                    </div>

                    <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-dark)' }}>{u.university_name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                      Location: {u.location} • Students: {u.total_students}
                    </div>

                    {u.rejection_reason && (
                      <div style={{ backgroundColor: 'var(--status-danger-bg)', padding: '0.55rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--status-danger)', marginBottom: '0.4rem' }}>
                        Rejection Reason: {u.rejection_reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No universities have responded to this problem yet. Published challenges are automatically displayed to eligible universities.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Solutions Received & Proposals Comparison */}
        {activeTab === 'proposals' && selectedProblem && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-dark)' }}>Proposals Received for: {selectedProblem.title}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Compare university technical approach, cost, timeline, and AI feasibility scores.
                </p>
              </div>
            </div>

            <ProposalComparison
              proposals={proposals}
              onSelectProposal={handleSelectProposal}
              isOwner={true}
            />
          </div>
        )}

        {/* TAB 4: Impact Metrics */}
        {activeTab === 'impact' && (
          <ImpactChart />
        )}

        {/* Submit Challenge Modal */}
        {showCreateModal && (
          <SubmitChallengeModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={(res) => {
              setMessage(res.message);
              loadOwnerProblems();
            }}
          />
        )}

      </main>
    </div>
  );
}
