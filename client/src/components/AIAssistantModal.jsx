import React, { useState } from 'react';
import { api } from '../services/api';
import { Bot, Send, X, Sparkles, Database } from 'lucide-react';

export default function AIAssistantModal({ isOpen, onClose, disasterId }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello Commander. I am SANKALP AI Command Assistant. Ask me any question regarding active disaster incident status, hospital bed availability, relocation safety, or volunteer demand.'
    }
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'Which hospitals can handle additional patients?',
    'Which universities can provide medical volunteers?',
    'How many volunteers are still required?',
    'Which relocation site is currently recommended?'
  ];

  const handleSend = async (textToSend) => {
    const promptText = textToSend || query;
    if (!promptText.trim() || loading) return;

    // Append user message
    const updatedMsgs = [...messages, { sender: 'user', text: promptText }];
    setMessages(updatedMsgs);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.queryAIAssistant({ query: promptText, disaster_id: disasterId });
      setMessages([
        ...updatedMsgs,
        { sender: 'ai', text: res.answer, grounded: res.groundedDataUsed }
      ]);
    } catch (err) {
      setMessages([
        ...updatedMsgs,
        { sender: 'ai', text: 'I encountered an issue querying platform data. Please retry.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Drawer Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem' }}>AI Command Assistant</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                <Database size={12} /> Grounded on SQLite Database State
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Quick Prompts */}
        <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
            Suggested Quick Queries:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-dark)',
                  textAlign: 'left'
                }}
              >
                <Sparkles size={10} style={{ display: 'inline', marginRight: '3px', color: 'var(--primary-blue)' }} /> {p}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Message Stream */}
        <div style={{ flex: 1, padding: '1rem 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                backgroundColor: m.sender === 'user' ? 'var(--primary-blue)' : 'var(--bg-main)',
                color: m.sender === 'user' ? '#ffffff' : 'var(--text-dark)',
                padding: '0.85rem 1.1rem',
                borderRadius: '14px',
                borderBottomRightRadius: m.sender === 'user' ? '2px' : '14px',
                borderBottomLeftRadius: m.sender === 'ai' ? '2px' : '14px',
                boxShadow: 'var(--shadow-sm)',
                fontSize: '0.9rem',
                lineHeight: 1.5
              }}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              Analyzing platform state...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Ask AI Assistant about command decision support..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            style={{
              flex: 1,
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
          <button onClick={() => handleSend()} className="btn btn-primary" disabled={loading}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
