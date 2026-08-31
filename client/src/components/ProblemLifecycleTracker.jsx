import React from 'react';
import { CheckCircle2, Circle, ArrowRight, Sparkles, Building2, GraduationCap, Award, Activity, Rocket } from 'lucide-react';

export default function ProblemLifecycleTracker({ currentStatus = 'SUBMITTED', style = {} }) {
  // Define full end-to-end lifecycle stages
  const stages = [
    { key: 'SUBMITTED', label: 'Problem Submitted', desc: 'Client posts challenge' },
    { key: 'AI_ANALYZED', label: 'AI Analysis', desc: 'Taxonomy & Routing' },
    { key: 'PUBLISHED', label: 'University Match', desc: 'Catalog published' },
    { key: 'ACCEPTED', label: 'University Accepted', desc: 'Institution assigned' },
    { key: 'PROPOSALS_RECEIVED', label: 'Proposal Comparison', desc: 'Technical solutions' },
    { key: 'SOLUTION_SELECTED', label: 'Solution Selected', desc: 'Owner authorizes' },
    { key: 'DEVELOPMENT', label: 'Development & Build', desc: 'Student team coding' },
    { key: 'DEPLOYED', label: 'Deployed Impact', desc: 'Field deployment' }
  ];

  // Calculate current stage index
  const statusOrder = ['SUBMITTED', 'AI_ANALYZED', 'PUBLISHED', 'ACCEPTED', 'PROPOSALS_RECEIVED', 'SOLUTION_SELECTED', 'DEVELOPMENT', 'DEPLOYED'];
  const currentIndex = Math.max(0, statusOrder.indexOf(currentStatus));

  return (
    <div className="card" style={{ padding: '1.25rem', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            SANKALP AI END-TO-END PROBLEM LIFECYCLE
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy)', marginTop: '2px' }}>
            Stage {currentIndex + 1} of {stages.length}: {stages[currentIndex]?.label || 'Active Workflow'}
          </h4>
        </div>
        <span className="badge badge-primary" style={{ gap: '4px' }}>
          <Sparkles size={13} /> LIVE LIFECYCLE STATE: {currentStatus}
        </span>
      </div>

      {/* Horizontal Lifecycle Steps Scroll Container */}
      <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', minWidth: '700px', gap: '8px' }}>
          {stages.map((stage, idx) => {
            const isPassed = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <React.Fragment key={stage.key}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isCurrent ? 'var(--terracotta-soft)' : isPassed ? 'var(--brand-green-light)' : 'var(--bg-main)',
                  border: isCurrent ? '2px solid var(--terracotta)' : isPassed ? '1px solid var(--brand-green)' : '1px solid var(--border-light)',
                  textAlign: 'center'
                }}>
                  <div style={{ marginBottom: '4px', color: isCurrent ? 'var(--terracotta)' : isPassed ? 'var(--brand-green)' : 'var(--text-muted)' }}>
                    {isPassed ? <CheckCircle2 size={18} /> : isCurrent ? <Sparkles size={18} /> : <Circle size={18} />}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isCurrent ? 'var(--terracotta)' : isPassed ? 'var(--brand-green)' : 'var(--navy)' }}>
                    {stage.label}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {stage.desc}
                  </div>
                </div>

                {idx < stages.length - 1 && (
                  <ArrowRight size={14} color={isPassed ? 'var(--brand-green)' : 'var(--border-light)'} style={{ flexShrink: 0 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
