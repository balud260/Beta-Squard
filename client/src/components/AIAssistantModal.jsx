import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bot, Send, X, Sparkles, CheckCircle2, RefreshCw, Shield, AlertCircle } from 'lucide-react';

export default function AIAssistantModal({ isOpen = true, onClose, disasterId = 1 }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello Commander. I am SANKALP AI. I am grounded in current SANKALP platform data across District X active disasters, hospital capacities, university volunteers, and submitted proposals. How can I assist your command decisions today?',
      grounded: true,
      dataOrigin: 'SANKALP DATA'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Non-blocking silent backend warm-up ping on mount
  useEffect(() => {
    if (isOpen) {
      api.healthCheck().catch(() => {});
    }
  }, [isOpen]);

  if (isOpen === false) return null;

  const quickPrompts = [
    { label: 'Unfilled Requirements', prompt: 'Which response requirements are still unfilled?' },
    { label: 'Critical Problems', prompt: 'Which problems are currently marked as critical urgency?' },
    { label: 'Hospital Pressure', prompt: 'Which hospitals are under pressure or near capacity?' },
    { label: 'University Response', prompt: 'Which universities are currently helping with emergency response?' },
    { label: 'Solutions Under Review', prompt: 'Which university proposals are currently under review?' },
    { label: 'Nepal Flood Situation', prompt: 'Do you know about the recent Nepal flood incident?' }
  ];

  function formatCleanText(rawText) {
    if (!rawText) return '';
    let cleaned = String(rawText);
    cleaned = cleaned.replace(/\*{2,}(.*?)\*{2,}/g, '$1');
    cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
    cleaned = cleaned.replace(/_{2,}(.*?)_{2,}/g, '$1');
    cleaned = cleaned.replace(/_(.*?)_/g, '$1');
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
    return cleaned.trim();
  }

  function renderCleanMessageContent(rawText) {
    const text = formatCleanText(rawText);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const bulletItems = lines.filter(line => line.startsWith('•') || line.startsWith('-') || /^\d+\.\s/.test(line));

    if (bulletItems.length >= 2) {
      const headerLine = lines[0] && !bulletItems.includes(lines[0]) ? lines[0] : null;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {headerLine && <div style={{ fontWeight: 600, marginBottom: '2px', lineHeight: '1.4' }}>{headerLine}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {bulletItems.map((item, idx) => {
              const cleanItem = item.replace(/^([•\-]\s*|\d+\.\s*)/, '');
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', background: 'rgba(0,0,0,0.03)', padding: '5px 8px', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--navy)', fontWeight: 'bold', fontSize: '12px' }}>•</span>
                  <span style={{ fontSize: '13px', lineHeight: '1.4', flex: 1 }}>{cleanItem}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>{text}</div>;
  }

  const handleSend = async (textToSend, isRetry = false) => {
    if (loading) return; // Prevent duplicate request submission

    const promptText = (textToSend !== undefined ? textToSend : query).trim();
    if (!promptText) return;

    setErrorMsg(null);

    const historyPayload = messages
      .filter(m => !m.isError)
      .slice(-6)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

    let updatedMsgs = messages;
    if (!isRetry) {
      updatedMsgs = [...messages, { sender: 'user', text: promptText }];
      setMessages(updatedMsgs);
      setQuery('');
    } else {
      updatedMsgs = messages.filter(m => !m.isError);
      setMessages(updatedMsgs);
    }
    setLoading(true);

    try {
      const res = await api.queryAIAssistant({ query: promptText, disaster_id: disasterId, history: historyPayload });
      setMessages([
        ...updatedMsgs,
        {
          sender: 'ai',
          text: res.answer || res.reply || 'Analysis completed.',
          grounded: res.groundedDataUsed !== false,
          dataOrigin: res.dataOrigin,
          sources: res.sources,
          freshness: res.freshness
        }
      ]);
    } catch (err) {
      console.error('AI Command Assistant error:', err);
      setErrorMsg(err.message || 'SANKALP AI is temporarily unavailable. Please click Retry.');
      setMessages([
        ...updatedMsgs,
        {
          sender: 'ai',
          text: 'Unable to process query at this time. SANKALP AI is temporarily unavailable.',
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (lastUserMsg && !loading) {
      handleSend(lastUserMsg.text, true);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="drawer-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '540px',
          width: '100%',
          backgroundColor: '#ffffff',
          boxShadow: 'var(--shadow-xl)',
          borderLeft: '1px solid var(--border-light)'
        }}
      >
        {/* Drawer Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', backgroundColor: 'var(--bg-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--navy)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                  SANKALP AI Assistant
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, marginTop: '2px' }}>
                  <CheckCircle2 size={13} /> Real-time Platform &amp; Live World Intelligence
                </div>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem', borderRadius: '8px' }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Authority: <strong>District Disaster &amp; Welfare Command</strong> • Jurisdiction: <strong>District X</strong>
          </div>
        </div>

        {/* Quick Command Action Chips */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: '#ffffff' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Command Quick Queries:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleSend(qp.prompt)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--navy)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles size={11} color="var(--terracotta)" /> {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Message Stream */}
        <div style={{ flex: 1, padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: 'var(--bg-main)' }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                backgroundColor: m.sender === 'user' ? 'var(--navy)' : '#ffffff',
                color: m.sender === 'user' ? '#ffffff' : 'var(--text-dark)',
                padding: '1rem 1.2rem',
                borderRadius: '16px',
                borderBottomRightRadius: m.sender === 'user' ? '3px' : '16px',
                borderBottomLeftRadius: m.sender === 'ai' ? '3px' : '16px',
                border: m.sender === 'ai' ? '1px solid var(--border-light)' : 'none',
                boxShadow: 'var(--shadow-sm)',
                fontSize: '0.9rem',
                lineHeight: 1.55
              }}
            >
              {/* Assistant Identity */}
              {m.sender === 'ai' && !m.isError && (
                <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--navy)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🤖 SANKALP AI
                </div>
              )}

              {/* Data Source Badge (Secondary Metadata) */}
              {m.dataOrigin && (
                <div style={{ fontSize: '0.7rem', color: m.dataOrigin.includes('LIVE') ? '#0284c7' : m.dataOrigin.includes('HYBRID') ? '#7c3aed' : 'var(--status-success)', marginBottom: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  [{m.dataOrigin}] {m.freshness ? `• ${m.freshness}` : ''}
                </div>
              )}

              {renderCleanMessageContent(m.text)}

              {m.sources && m.sources.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '3px' }}>Retrieved Sources:</div>
                  {m.sources.map((s, sIdx) => (
                    <div key={sIdx} style={{ marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      • <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy)', textDecoration: 'underline' }}>{s.source}: {s.title}</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: 'flex-start', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', padding: '0.85rem 1.1rem', borderRadius: '14px', fontSize: '0.85rem', color: 'var(--navy)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={14} className="spin" /> SANKALP AI is thinking...
            </div>
          )}

          {errorMsg && (
            <div style={{ alignSelf: 'flex-start', backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              <AlertCircle size={16} />
              <div style={{ flex: 1 }}>{errorMsg}</div>
              <button onClick={handleRetry} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}
        </div>

        {/* Input Command Bar */}
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border-light)', backgroundColor: '#ffffff', display: 'flex', gap: '0.6rem' }}>
          <input
            type="text"
            placeholder="Type command or query for SANKALP AI..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              outline: 'none',
              fontSize: '0.9rem',
              boxSizing: 'border-box'
            }}
          />
          <button onClick={() => handleSend()} className="btn btn-primary" disabled={loading || !query.trim()} style={{ gap: '6px' }}>
            <Send size={16} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}
