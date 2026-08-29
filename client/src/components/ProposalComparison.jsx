import React from 'react';
import { CheckCircle2, DollarSign, Clock, Award, ShieldAlert, Cpu } from 'lucide-react';

export default function ProposalComparison({ proposals = [], onSelectProposal, isOwner = false }) {
  if (!proposals.length) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No university proposals received yet.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${proposals.length}, minmax(320px, 1fr))`,
        gap: '1.5rem',
        paddingBottom: '1rem'
      }}>
        {proposals.map((prop) => {
          const isSelected = prop.status === 'SELECTED';
          return (
            <div
              key={prop.id}
              className="card"
              style={{
                border: isSelected ? '2px solid var(--status-success)' : '1px solid var(--border-light)',
                backgroundColor: isSelected ? '#f0fdf4' : 'var(--bg-card)',
                position: 'relative'
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '16px',
                  backgroundColor: 'var(--status-success)',
                  color: '#fff',
                  padding: '0.2rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}>
                  <CheckCircle2 size={12} /> SELECTED SOLUTION
                </div>
              )}

              <div style={{ fontSize: '0.85rem', color: 'var(--primary-blue)', fontWeight: 700 }}>
                🎓 {prop.university_name || 'University Candidate'}
              </div>
              <h3 style={{ fontSize: '1.15rem', marginTop: '0.4rem', marginBottom: '0.75rem' }}>
                {prop.summary}
              </h3>

              {/* Match Badge */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <span className="badge badge-primary">
                  Match Score: {prop.match_score || 92}%
                </span>
                <span className={`badge ${prop.risk_level === 'LOW' ? 'badge-success' : 'badge-warning'}`}>
                  Risk: {prop.risk_level}
                </span>
              </div>

              {/* Metrics Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-main)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.85rem'
              }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Est. Cost</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>₹{(prop.cost || 210000).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Timeline</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{prop.timeline}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Feasibility</div>
                  <div style={{ fontWeight: 700, color: 'var(--status-success)' }}>{prop.feasibility_score}/100</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Social Impact</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{prop.impact_score}/100</div>
                </div>
              </div>

              {/* Technical Approach */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-medium)' }}>
                  Technical Approach
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {prop.approach}
                </p>
              </div>

              {/* Team Structure */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-medium)' }}>
                  Team Composition
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                  {prop.team_structure || 'Faculty lead + multidisciplinary student developers'}
                </p>
              </div>

              {/* Action Button */}
              {isOwner && !isSelected && (
                <button
                  onClick={() => onSelectProposal && onSelectProposal(prop.id)}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Select & Initiate Project
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
