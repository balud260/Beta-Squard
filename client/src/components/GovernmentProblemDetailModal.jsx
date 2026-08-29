import React, { useState } from 'react';
import { api } from '../services/api';
import { Shield, Sparkles, Building2, CheckCircle2, Clock, AlertTriangle, FileText, Check, X, RefreshCw, ChevronRight } from 'lucide-react';

export default function GovernmentProblemDetailModal({ problem, onClose, onRefresh }) {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedProposalId, setSelectedProposalId] = useState(
    problem?.solutions && problem.solutions.length > 0 ? problem.solutions[0].id : null
  );

  const [isEditingRouting, setIsEditingRouting] = useState(false);
  const [routingDept, setRoutingDept] = useState(problem?.government_department || '');
  const [routingKey, setRoutingKey] = useState(problem?.responsibility_key || problem?.category || 'COMMUNITY_DEVELOPMENT');
  const [jurisdiction, setJurisdiction] = useState(problem?.jurisdiction || 'District X');

  if (!problem) return null;

  async function handleGovernmentReview(decision) {
    setSubmitting(true);
    setMessage('');
    try {
      const res = await api.submitGovernmentReview(problem.id, {
        proposal_id: selectedProposalId,
        decision,
        feedback
      });
      setMessage(res.message || `Government review decision '${decision}' recorded.`);
      setTimeout(() => {
        onRefresh();
        onClose();
      }, 1200);
    } catch (err) {
      setMessage(err.message || 'Failed to submit government review.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyRouting() {
    setSubmitting(true);
    try {
      await api.updateProblemRouting(problem.id, {
        official_responsibility_key: routingKey,
        government_department: routingDept,
        jurisdiction
      });
      setMessage('Government responsibility routing verified & saved.');
      setIsEditingRouting(false);
      onRefresh();
    } catch (err) {
      setMessage('Failed to update routing.');
    } finally {
      setSubmitting(false);
    }
  }

  const stages = [
    { key: 'PROBLEM_REGISTERED', label: 'Registered' },
    { key: 'UNIVERSITY_ACCEPTED', label: 'Univ Accepted' },
    { key: 'PROPOSAL_SUBMITTED', label: 'Proposal Received' },
    { key: 'PROPOSAL_REVIEWED', label: 'Gov Reviewed' },
    { key: 'DEVELOPMENT', label: 'Development' },
    { key: 'TESTING', label: 'Testing' },
    { key: 'DEPLOYMENT', label: 'Deployed' },
    { key: 'IMPACT', label: 'Impact Tracked' }
  ];

  const currentStageIndex = stages.findIndex(s => s.key === problem.lifecycle_stage);
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
      zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto',
        padding: '1.75rem', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)'
      }}>

        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span className="badge badge-primary" style={{ fontSize: '0.7rem', gap: '0.3rem' }}>
                <Shield size={12} /> RESPONSIBLE GOVERNMENT PROBLEM #{problem.id}
              </span>
              <span className={`badge ${problem.urgency === 'CRITICAL' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                {problem.urgency} URGENCY
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                STATUS: {problem.status}
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--text-dark)', marginBottom: '0.2rem' }}>{problem.title}</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Owner: <strong>{problem.organization_name || problem.client_name || 'District Authority'}</strong> • Location: 📍 <strong>{problem.location}</strong>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.3rem 0.6rem' }}>
            <X size={16} />
          </button>
        </div>

        {message && (
          <div style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontWeight: 600, fontSize: '0.85rem' }}>
            {message}
          </div>
        )}

        {/* Government Responsibility Routing Banner */}
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
              <Building2 size={16} color="var(--primary-blue)" /> Government Responsibility Routing
              {problem.routing_status === 'GOVERNMENT_VERIFIED' ? (
                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>✓ VERIFIED BY GOVERNMENT</span>
              ) : (
                <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>🤖 AI SUGGESTED ROUTING</span>
              )}
            </div>
            <button onClick={() => setIsEditingRouting(!isEditingRouting)} className="btn btn-secondary btn-sm" style={{ fontSize: '0.7rem' }}>
              {isEditingRouting ? 'Cancel' : 'Edit / Confirm Routing'}
            </button>
          </div>

          {isEditingRouting ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.6rem', marginTop: '0.6rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Responsibility Key:</label>
                <select value={routingKey} onChange={e => setRoutingKey(e.target.value)} className="form-control" style={{ fontSize: '0.75rem', padding: '0.3rem' }}>
                  <option value="HEALTHCARE">HEALTHCARE</option>
                  <option value="DISASTER_MANAGEMENT">DISASTER_MANAGEMENT</option>
                  <option value="CIVIC_INFRASTRUCTURE">CIVIC_INFRASTRUCTURE</option>
                  <option value="EDUCATION">EDUCATION</option>
                  <option value="COMMUNITY_DEVELOPMENT">COMMUNITY_DEVELOPMENT</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Department:</label>
                <input type="text" value={routingDept} onChange={e => setRoutingDept(e.target.value)} className="form-control" style={{ fontSize: '0.75rem', padding: '0.3rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Jurisdiction:</label>
                <input type="text" value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} className="form-control" style={{ fontSize: '0.75rem', padding: '0.3rem' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={handleVerifyRouting} disabled={submitting} className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem' }}>
                  Confirm Official Routing
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Department:</span><br />
                <strong>{problem.government_department}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Authority:</span><br />
                <strong>{problem.government_authority}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Jurisdiction:</span><br />
                <strong>{problem.jurisdiction}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Lifecycle Progress Timeline */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            SOLUTION DEVELOPMENT LIFECYCLE TRACKER
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
            {stages.map((stage, idx) => {
              const isPassed = idx <= activeIndex;
              const isCurrent = idx === activeIndex;

              return (
                <div key={stage.key} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', margin: '0 auto 0.3rem',
                    backgroundColor: isPassed ? 'var(--status-success)' : 'var(--border-light)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800,
                    border: isCurrent ? '3px solid var(--primary-blue)' : 'none'
                  }}>
                    {isPassed ? '✓' : idx + 1}
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? 'var(--primary-blue)' : (isPassed ? 'var(--text-dark)' : 'var(--text-muted)') }}>
                    {stage.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 1: University Acceptances & Responders */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-dark)', marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>🎓 University Participation ({problem.accepted_universities?.length || 0})</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Live accepted university teams</span>
          </h3>

          {problem.accepted_universities && problem.accepted_universities.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              {problem.accepted_universities.map(u => (
                <div key={u.id} style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>{u.university_name}</strong>
                    <span className="badge badge-success" style={{ fontSize: '0.6rem' }}>{u.status}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    📍 {u.location} • Student Responders: <strong>{u.student_count || 6}</strong>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Focus: {u.research_focus}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              No universities have accepted this challenge yet. Problem is currently open in University Portal.
            </div>
          )}
        </div>

        {/* Section 2: Submitted University Solutions / Proposals */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-dark)', marginBottom: '0.6rem' }}>
            💡 Submitted University Solutions & Proposals ({problem.solutions?.length || 0})
          </h3>

          {problem.solutions && problem.solutions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {problem.solutions.map(sol => (
                <div
                  key={sol.id}
                  onClick={() => setSelectedProposalId(sol.id)}
                  style={{
                    padding: '1rem', borderRadius: 'var(--radius-md)',
                    border: selectedProposalId === sol.id ? '2px solid var(--primary-blue)' : '1px solid var(--border-light)',
                    backgroundColor: selectedProposalId === sol.id ? '#f0f9ff' : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div>
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem', marginBottom: '0.2rem' }}>
                        SUBMITTED BY: {sol.university_name}
                      </span>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-dark)' }}>{sol.summary}</h4>
                    </div>
                    <span className={`badge ${sol.status === 'SELECTED' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                      {sol.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)', marginBottom: '0.6rem', lineHeight: 1.4 }}>
                    <strong>Technical Approach:</strong> {sol.approach}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <div>Budget: <strong>₹{sol.cost?.toLocaleString()}</strong></div>
                    <div>Timeline: <strong>{sol.timeline}</strong></div>
                    <div>Feasibility: <strong style={{ color: 'var(--status-success)' }}>{sol.feasibility_score}/100</strong></div>
                    <div>Risk: <strong style={{ color: sol.risk_level === 'LOW' ? 'var(--status-success)' : 'var(--status-warning)' }}>{sol.risk_level}</strong></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              No proposals submitted yet by universities. Universities are currently working on technical proposals.
            </div>
          )}
        </div>

        {/* Section 3: Government Review & Approval Actions */}
        <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-dark)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={16} color="var(--primary-blue)" /> Official Government Review & Decision Panel
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            Issue an authorized Government decision on the selected university solution. Decisions are instantly propagated to Problem Owner and University.
          </p>

          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', display: 'block', marginBottom: '0.3rem' }}>
              Government Feedback / Guidelines for University Team:
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Provide clear technical guidelines, deployment parameters, or requested modifications..."
              className="form-control"
              style={{ fontSize: '0.8rem', width: '100%', padding: '0.5rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <button
              onClick={() => handleGovernmentReview('APPROVED')}
              disabled={submitting || !selectedProposalId}
              className="btn btn-primary"
              style={{ backgroundColor: 'var(--status-success)', borderColor: 'var(--status-success)', fontSize: '0.8rem', gap: '0.4rem', justifyContent: 'center' }}
            >
              <Check size={16} /> Approve Solution
            </button>

            <button
              onClick={() => handleGovernmentReview('CHANGES_REQUESTED')}
              disabled={submitting || !selectedProposalId}
              className="btn btn-secondary"
              style={{ backgroundColor: '#f59e0b', color: '#fff', borderColor: '#f59e0b', fontSize: '0.8rem', gap: '0.4rem', justifyContent: 'center' }}
            >
              <RefreshCw size={16} /> Request Changes
            </button>

            <button
              onClick={() => handleGovernmentReview('REJECTED')}
              disabled={submitting || !selectedProposalId}
              className="btn btn-secondary"
              style={{ backgroundColor: '#ef4444', color: '#fff', borderColor: '#ef4444', fontSize: '0.8rem', gap: '0.4rem', justifyContent: 'center' }}
            >
              <X size={16} /> Reject Solution
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
