import React, { useState } from 'react';
import { CheckCircle2, DollarSign, Clock, Award, ShieldAlert, Cpu, Layers, Sparkles, LayoutGrid, Table as TableIcon, MessageSquare, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function ProposalComparison({ proposals = [], onSelectProposal, isOwner = false }) {
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'cards'
  const [feedbackProposalId, setFeedbackProposalId] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState('');

  if (!proposals || !proposals.length) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#ffffff', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No university proposals received yet. Published challenges are automatically available to eligible university departments.</p>
      </div>
    );
  }

  const handleSendFeedback = async (proposalId) => {
    if (!feedbackText.trim()) return;
    try {
      const res = await api.addProposalFeedback(proposalId, { feedback: feedbackText });
      setFeedbackStatus(`Feedback sent! Created Version ${(res.version || 2)}.`);
      setFeedbackText('');
      setTimeout(() => {
        setFeedbackProposalId(null);
        setFeedbackStatus('');
      }, 2000);
    } catch (err) {
      setFeedbackStatus('Failed to send feedback.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Controls: View Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy)' }}>
            Solution Proposals ({proposals.length} Received)
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Compare technical approach, cost, timeline, and AI feasibility scores across competing institutions.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setViewMode('matrix')}
            className={`btn btn-sm ${viewMode === 'matrix' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.3rem' }}
          >
            <TableIcon size={14} /> Matrix View
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ gap: '0.3rem' }}
          >
            <LayoutGrid size={14} /> Card View
          </button>
        </div>
      </div>

      {/* VIEW 1: COMPARISON MATRIX TABLE */}
      {viewMode === 'matrix' && (
        <div className="card" style={{ padding: '0', overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--navy)', color: '#ffffff' }}>
                <th style={{ padding: '1rem', textAlign: 'left', minWidth: '150px' }}>Evaluation Metric</th>
                {proposals.map((p) => (
                  <th key={p.id} style={{ padding: '1rem', textAlign: 'left', minWidth: '220px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--terracotta-soft)' }}>
                      {p.university_name || 'University Candidate'}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px', color: '#ffffff' }}>
                      {p.summary}
                    </div>
                    {p.status === 'SELECTED' && (
                      <span className="badge badge-success" style={{ marginTop: '4px', fontSize: '10px' }}>
                        ✓ SELECTED
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Row 1: AI Match Score */}
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#ffffff' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--navy)' }}>AI Match Score</td>
                {proposals.map((p) => (
                  <td key={p.id} style={{ padding: '0.85rem 1rem', borderLeft: '1px solid var(--border-light)' }}>
                    <span className="badge badge-primary" style={{ gap: '4px' }}>
                      <Sparkles size={12} /> {p.match_score || 92}% MATCH
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row 2: Estimated Cost */}
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-main)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--navy)' }}>Estimated Budget</td>
                {proposals.map((p) => (
                  <td key={p.id} style={{ padding: '0.85rem 1rem', borderLeft: '1px solid var(--border-light)', fontWeight: 700, color: 'var(--navy)' }}>
                    ₹{(p.cost || 200000).toLocaleString()}
                  </td>
                ))}
              </tr>

              {/* Row 3: Timeline */}
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#ffffff' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--navy)' }}>Implementation Timeline</td>
                {proposals.map((p) => (
                  <td key={p.id} style={{ padding: '0.85rem 1rem', borderLeft: '1px solid var(--border-light)' }}>
                    {p.timeline || '3 Months'}
                  </td>
                ))}
              </tr>

              {/* Row 4: Impact Score */}
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-main)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--navy)' }}>Expected Impact Score</td>
                {proposals.map((p) => (
                  <td key={p.id} style={{ padding: '0.85rem 1rem', borderLeft: '1px solid var(--border-light)', fontWeight: 700, color: 'var(--brand-green)' }}>
                    {p.impact_score || 94} / 100 ({p.impact_score > 90 ? 'High Impact' : 'Moderate Impact'})
                  </td>
                ))}
              </tr>

              {/* Row 5: Technical Feasibility */}
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#ffffff' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--navy)' }}>Feasibility Score</td>
                {proposals.map((p) => (
                  <td key={p.id} style={{ padding: '0.85rem 1rem', borderLeft: '1px solid var(--border-light)', fontWeight: 700, color: 'var(--status-success)' }}>
                    {p.feasibility_score || 95} / 100
                  </td>
                ))}
              </tr>

              {/* Row 6: Risk Assessment */}
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-main)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--navy)' }}>Risk Profile</td>
                {proposals.map((p) => (
                  <td key={p.id} style={{ padding: '0.85rem 1rem', borderLeft: '1px solid var(--border-light)' }}>
                    <span className={`badge ${p.risk_level === 'LOW' ? 'badge-success' : 'badge-warning'}`}>
                      {p.risk_level || 'LOW'} RISK
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row 7: Team Composition */}
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#ffffff' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--navy)' }}>Team Composition</td>
                {proposals.map((p) => (
                  <td key={p.id} style={{ padding: '0.85rem 1rem', borderLeft: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {p.team_structure || 'Faculty lead + student developers'}
                  </td>
                ))}
              </tr>

              {/* Row 8: Technical Approach */}
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-main)' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--navy)' }}>Technical Approach</td>
                {proposals.map((p) => (
                  <td key={p.id} style={{ padding: '0.85rem 1rem', borderLeft: '1px solid var(--border-light)', fontSize: '0.8rem', color: 'var(--text-dark)', lineHeight: 1.4 }}>
                    {p.approach}
                  </td>
                ))}
              </tr>

              {/* Row 9: Version & Iteration */}
              <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#ffffff' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--navy)' }}>Proposal Version</td>
                {proposals.map((p) => (
                  <td key={p.id} style={{ padding: '0.85rem 1rem', borderLeft: '1px solid var(--border-light)' }}>
                    <span className="badge badge-navy" style={{ fontSize: '10px' }}>
                      Version {p.version || 1}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Action Row */}
              {isOwner && (
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--navy)' }}>Action</td>
                  {proposals.map((p) => (
                    <td key={p.id} style={{ padding: '1rem', borderLeft: '1px solid var(--border-light)' }}>
                      {p.status === 'SELECTED' ? (
                        <div style={{ color: 'var(--status-success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={16} /> Selected Proposal
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <button
                            onClick={() => onSelectProposal && onSelectProposal(p.id)}
                            className="btn btn-primary btn-sm"
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            Select {p.university_name ? p.university_name.split(' ')[0] : 'Solution'}
                          </button>
                          <button
                            onClick={() => setFeedbackProposalId(p.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '11px' }}
                          >
                            <MessageSquare size={12} /> Request Changes
                          </button>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: CARD GRID VIEW */}
      {viewMode === 'cards' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 300px), 1fr))`,
          gap: '1.25rem'
        }}>
          {proposals.map((prop) => {
            const isSelected = prop.status === 'SELECTED';
            return (
              <div
                key={prop.id}
                className="card"
                style={{
                  padding: '1.25rem',
                  border: isSelected ? '2px solid var(--status-success)' : '1px solid var(--border-light)',
                  backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between'
                }}
              >
                <div>
                  {isSelected && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: 'var(--status-success)',
                      color: '#fff',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      marginBottom: '10px'
                    }}>
                      <CheckCircle2 size={12} /> SELECTED SOLUTION
                    </div>
                  )}

                  <div style={{ fontSize: '0.8rem', color: 'var(--terracotta)', fontWeight: 700, textTransform: 'uppercase' }}>
                    🎓 {prop.university_name || 'University Candidate'}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', marginTop: '0.3rem', marginBottom: '0.75rem', color: 'var(--navy)' }}>
                    {prop.summary}
                  </h3>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">
                      Match: {prop.match_score || 92}%
                    </span>
                    <span className={`badge ${prop.risk_level === 'LOW' ? 'badge-success' : 'badge-warning'}`}>
                      Risk: {prop.risk_level || 'LOW'}
                    </span>
                    <span className="badge badge-navy">
                      v{prop.version || 1}
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    backgroundColor: 'var(--bg-main)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    fontSize: '0.8rem'
                  }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Est. Budget</div>
                      <div style={{ fontWeight: 700, color: 'var(--navy)' }}>₹{(prop.cost || 200000).toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Timeline</div>
                      <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{prop.timeline || '3 Months'}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.825rem', color: 'var(--text-dark)', marginBottom: '1rem', lineHeight: 1.45 }}>
                    <strong>Approach:</strong> {prop.approach}
                  </div>
                </div>

                {isOwner && !isSelected && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '1rem' }}>
                    <button
                      onClick={() => onSelectProposal && onSelectProposal(prop.id)}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Select &amp; Initiate Project
                    </button>
                    <button
                      onClick={() => setFeedbackProposalId(prop.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '11px' }}
                    >
                      <MessageSquare size={12} /> Request Changes / Feedback
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FEEDBACK MODAL */}
      {feedbackProposalId && (
        <div className="modal-overlay" onClick={() => setFeedbackProposalId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--navy)', marginBottom: '0.5rem' }}>
              Request Proposal Modifications / Feedback
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Send feedback to the university to request technical updates or timeline adjustments:
            </p>

            {feedbackStatus && (
              <div style={{ padding: '8px 12px', backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', borderRadius: '6px', marginBottom: '10px', fontSize: '13px', fontWeight: 600 }}>
                {feedbackStatus}
              </div>
            )}

            <textarea
              rows={4}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g. Please clarify offline data sync and update deployment timeline to 3 months..."
              style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1rem' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setFeedbackProposalId(null)} className="btn btn-secondary btn-sm">Cancel</button>
              <button onClick={() => handleSendFeedback(feedbackProposalId)} className="btn btn-primary btn-sm">Submit Feedback</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
