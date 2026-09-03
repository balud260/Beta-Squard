import React, { useState } from 'react';
import { Sparkles, AlertCircle, RefreshCw, CheckCircle2, ChevronRight, X, ShieldAlert, Cpu, Award, Zap } from 'lucide-react';

export default function AIResultPanel({
  title = "SANKALP AI ANALYSIS",
  loading = false,
  loadingText = "SANKALP AI is processing data...",
  error = null,
  onRetry = null,
  result = null,
  fallbackResult = null,
  onClose = null,
  style = {}
}) {
  const [showFallback, setShowFallback] = useState(false);

  // Helper to safely parse string results (JSON or formatted text)
  const parsedData = React.useMemo(() => {
    const dataToUse = showFallback && fallbackResult ? fallbackResult : result;
    if (!dataToUse) return null;

    if (typeof dataToUse === 'object') return dataToUse;

    if (typeof dataToUse === 'string') {
      try {
        let cleaned = dataToUse.trim();
        if (cleaned.startsWith('```json')) {
          cleaned = cleaned.replace(/^```json/i, '').replace(/```$/, '').trim();
        } else if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
        }
        return JSON.parse(cleaned);
      } catch (e) {
        // Return structured wrapper around raw text if not valid JSON
        return { text: dataToUse };
      }
    }
    return null;
  }, [result, fallbackResult, showFallback]);

  // Loading View
  if (loading) {
    return (
      <div className="card" style={{
        padding: '24px',
        backgroundColor: '#ffffff',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        textAlign: 'center',
        ...style
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--terracotta-soft)', color: 'var(--terracotta)', marginBottom: '16px' }}>
          <Sparkles className="spin" size={24} />
        </div>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
          {title}
        </h4>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {loadingText}
        </p>

        {/* Animated Loading Bar */}
        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-main)', borderRadius: '9999px', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '60%',
            backgroundColor: 'var(--terracotta)',
            borderRadius: '9999px',
            animation: 'pulse 1.5s infinite ease-in-out'
          }} />
        </div>
      </div>
    );
  }

  // Error View
  if (error && !showFallback) {
    const isRateLimit = typeof error === 'string' && (error.includes('429') || error.toLowerCase().includes('quota') || error.toLowerCase().includes('rate limit'));
    const isAuth = typeof error === 'string' && error.includes('401');

    const friendlyMsg = isRateLimit
      ? "AI request quota limit reached. Please wait a moment or retry."
      : isAuth
      ? "AI service authentication is not configured correctly."
      : typeof error === 'string' ? error : "SANKALP AI service temporarily unavailable.";

    return (
      <div className="card" style={{
        padding: '20px',
        backgroundColor: 'var(--status-danger-bg)',
        border: '1px solid #fca5a5',
        borderRadius: 'var(--radius-md)',
        color: 'var(--status-danger)',
        ...style
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px' }}>
          <AlertCircle size={18} /> SANKALP AI Execution Notice
        </div>
        <p style={{ fontSize: '0.85rem', color: '#991b1b', lineHeight: 1.4, marginBottom: '14px' }}>
          {friendlyMsg}
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {onRetry && (
            <button onClick={onRetry} className="btn btn-sm" style={{ backgroundColor: 'var(--status-danger)', color: '#ffffff', border: 'none' }}>
              <RefreshCw size={14} /> Retry AI Analysis
            </button>
          )}

          {fallbackResult && (
            <button onClick={() => setShowFallback(true)} className="btn btn-secondary btn-sm" style={{ backgroundColor: '#ffffff' }}>
              View Operational Assessment
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty / No Data View
  if (!parsedData) {
    return null;
  }

  // Active Result View (Success or Fallback)
  const isFallbackActive = showFallback && fallbackResult;
  const d = parsedData;

  return (
    <div className="card" style={{
      padding: '24px',
      backgroundColor: '#ffffff',
      border: isFallbackActive ? '1px solid #fef08a' : '1px solid var(--border-light)',
      borderLeft: isFallbackActive ? '5px solid var(--status-warning)' : '5px solid var(--terracotta)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-md)',
      ...style
    }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className={`badge ${isFallbackActive ? 'badge-warning' : 'badge-primary'}`} style={{ gap: '4px' }}>
              <Sparkles size={13} /> {isFallbackActive ? 'OFFICIAL PLATFORM ASSESSMENT' : 'SANKALP AI GENERATED'}
            </span>
            {d.difficulty && (
              <span className="badge badge-navy" style={{ fontSize: '11px' }}>
                Difficulty: {d.difficulty}
              </span>
            )}
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy)' }}>
            {title}
          </h3>
        </div>

        {onClose && (
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Primary Category & Metrics Grid */}
      {(d.category || d.taxonomy || d.urgency || d.social_impact || d.match_score) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px', backgroundColor: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
          {d.category && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Category</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy)' }}>{d.category}</div>
            </div>
          )}
          {d.sub_category && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Sub-Category</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy)' }}>{d.sub_category}</div>
            </div>
          )}
          {d.urgency && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Urgency</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--status-danger)' }}>{d.urgency}</div>
            </div>
          )}
          {d.social_impact && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Social Impact</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--status-success)' }}>{d.social_impact}</div>
            </div>
          )}
          {d.match_score && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>AI Match Score</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--terracotta)' }}>{d.match_score}%</div>
            </div>
          )}
        </div>
      )}

      {/* Required Skills Badges */}
      {((d.required_skills && d.required_skills.length > 0) || (d.skills && d.skills.length > 0)) && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Required Skills:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(d.required_skills || d.skills).map((skill, idx) => (
              <span key={idx} style={{ fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--terracotta-soft)', color: 'var(--terracotta)', padding: '4px 10px', borderRadius: '9999px' }}>
                ✓ {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Required Departments */}
      {d.required_departments && d.required_departments.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
            Target Departments:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {d.required_departments.map((dept, idx) => (
              <span key={idx} style={{ fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'var(--brand-green-light)', color: 'var(--brand-green)', padding: '4px 10px', borderRadius: '6px' }}>
                🏛 {dept}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary / Reasoning Text */}
      {(d.summary || d.reasoning || d.risk_assessment || d.text) && (
        <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)', lineHeight: 1.5, marginBottom: '14px', backgroundColor: '#fcfcfc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
          {d.summary || d.reasoning || d.risk_assessment || d.text}
        </div>
      )}

      {/* Recommended Actions List */}
      {d.recommended_actions && d.recommended_actions.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px', textTransform: 'uppercase' }}>
            Recommended Action Plan:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {d.recommended_actions.map((act, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: 'var(--text-dark)', backgroundColor: 'var(--bg-main)', padding: '8px 12px', borderRadius: '6px' }}>
                <CheckCircle2 size={15} color="var(--status-success)" />
                <span>{typeof act === 'string' ? act : act.action || JSON.stringify(act)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Possible Solution Areas */}
      {d.solution_areas && d.solution_areas.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px', textTransform: 'uppercase' }}>
            Possible Solution Areas:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            {d.solution_areas.map((sa, idx) => (
              <div key={idx}>• {sa}</div>
            ))}
          </div>
        </div>
      )}

      {/* Switch back from fallback */}
      {isFallbackActive && (
        <button onClick={() => setShowFallback(false)} className="btn btn-secondary btn-sm" style={{ marginTop: '14px', width: '100%' }}>
          Return to AI Analysis View
        </button>
      )}
    </div>
  );
}
