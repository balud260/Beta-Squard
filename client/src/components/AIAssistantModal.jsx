import React, { useState } from 'react';
import { api } from '../services/api';
import { Bot, Send, X, Sparkles, Database, RefreshCw, Shield, AlertCircle } from 'lucide-react';

export default function AIAssistantModal({ isOpen = true, onClose, disasterId = 1 }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello Commander. I am SANKALP AI Command Assistant. I am grounded on real-time database state across District X active disasters, hospital capacities, university volunteers, and submitted proposals. How can I assist your command decisions today?',
      grounded: true
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (isOpen === false) return null;

  const quickPrompts = [
    { label: 'Unfilled Requirements', prompt: 'Which response requirements are still unfilled?' },
    { label: 'Critical Problems', prompt: 'Which problems are currently marked as critical urgency?' },
    { label: 'Hospital Pressure', prompt: 'Which hospitals are under pressure or near capacity?' },
    { label: 'University Response', prompt: 'Which universities are currently helping with emergency response?' },
    { label: 'Solutions Under Review', prompt: 'Which university proposals are currently under review?' },
    { label: 'Disaster Summary', prompt: 'Summarize the current disaster situation and immediate priorities.' }
  ];

  const handleSend = async (textToSend) => {
    const promptText = textToSend || query;
    if (!promptText.trim() || loading) return;

    setErrorMsg(null);
    const updatedMsgs = [...messages, { sender: 'user', text: promptText }];
    setMessages(updatedMsgs);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.queryAIAssistant({ query: promptText, disaster_id: disasterId });
      setMessages([
        ...updatedMsgs,
        {
          sender: 'ai',
          text: res.answer || res.reply || 'Analysis completed.',
          grounded: res.groundedDataUsed !== false
        }
      ]);
    } catch (err) {
      console.error('AI Command Assistant error:', err);
      setErrorMsg('AI Command Assistant is temporarily unavailable.');
      setMessages([
        ...updatedMsgs,
        {
          sender: 'ai',
          text: 'Unable to process command query against platform data at this time.',
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.text);
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
                  Government AI Command Assistant
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, marginTop: '2px' }}>
                  <Database size={13} /> Grounded on Live SQLite Database State
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
                lineHeight: 1.55,
                whiteSpace: 'pre-line'
              }}
            >
              {m.text}
              {m.grounded && (
                <div style={{ fontSize: '0.7rem', color: m.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--status-success)', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Database size={10} /> Verified Application Context Used
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: 'flex-start', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', padding: '0.85rem 1.1rem', borderRadius: '14px', fontSize: '0.85rem', color: 'var(--navy)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={14} className="spin" /> Analyzing command against platform database...
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
