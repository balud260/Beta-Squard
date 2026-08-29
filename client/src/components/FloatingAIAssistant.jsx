import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, ChevronDown, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function FloatingAIAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  if (!user) return null; // Only show for authenticated users

  const getRoleQuestions = (role) => {
    if (role === 'GOVERNMENT') {
      return [
        'What disasters are currently active?',
        'Which response requirements are unfilled?',
        'Which universities are responding?',
        'Which hospitals are near capacity?'
      ];
    } else if (role === 'PROBLEM_OWNER') {
      return [
        'How many universities accepted my problem?',
        'Which universities responded?',
        'Compare proposals for my problem',
        'What is my project status?'
      ];
    } else if (role === 'UNIVERSITY_ADMIN' || role === 'FACULTY') {
      return [
        'Which problems best match our capabilities?',
        'Which challenges are awaiting review?',
        'What problems have we accepted?',
        'Which emergency requests need volunteers?'
      ];
    } else if (role === 'STUDENT') {
      return [
        'What emergency missions are available?',
        'What role am I assigned?',
        'Which problems match my skills?',
        'Show my submitted solution ideas'
      ];
    }
    return ['What can SolveLink AI help me with?'];
  };

  const suggestedQuestions = getRoleQuestions(user.role);

  async function handleSendQuery(textToSend) {
    const promptText = textToSend || query;
    if (!promptText || promptText.trim() === '') return;

    const userMsg = { id: Date.now(), sender: 'user', text: promptText };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setQuery('');
    setLoading(true);

    try {
      const res = await api.chatAI(promptText);
      const botMsg = { id: Date.now() + 1, sender: 'bot', text: res.answer || 'Response generated from platform state.' };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const fallbackMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'AI Assistant is temporarily offline. You can still view your data directly from your dashboard tabs.'
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>

      {/* Persistent Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Open SolveLink AI Assistant"
          aria-label="Open SolveLink AI Assistant"
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'var(--text-dark)',
            color: '#fff',
            border: 'none',
            boxShadow: 'var(--shadow-xl)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Sparkles size={22} color="#fff" />
        </button>
      )}

      {/* Floating Compact AI Panel */}
      {isOpen && (
        <div style={{
          width: '380px',
          maxWidth: 'calc(100vw - 32px)',
          height: '520px',
          maxHeight: 'calc(100vh - 100px)',
          backgroundColor: '#fff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease'
        }}>
          
          {/* Header */}
          <div style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: 'var(--text-dark)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={15} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.1 }}>SolveLink AI Assistant</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>Role: {user.role.replace('_', ' ')}</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.8 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Transcript Area */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            
            {/* Greeting */}
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-blue)', flexShrink: 0 }}>
                <Bot size={14} />
              </div>
              <div style={{ backgroundColor: '#fff', padding: '0.75rem 0.9rem', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid var(--border-light)', color: 'var(--text-dark)', maxWidth: '85%' }}>
                Hi <strong>{user.name}</strong>! I'm your role-aware AI Assistant. How can I support your {user.role.toLowerCase().replace('_', ' ')} workflow today?
              </div>
            </div>

            {/* Suggested Question Pills (show if few messages) */}
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Suggested Questions
                </div>
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuery(q)}
                    style={{
                      textAlign: 'left',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: '#fff',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.8rem',
                      color: 'var(--primary-blue)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                  >
                    💡 {q}
                  </button>
                ))}
              </div>
            )}

            {/* Message History */}
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: '0.6rem',
                  alignItems: 'flex-start',
                  justify: m.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {m.sender === 'bot' && (
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-blue)', flexShrink: 0 }}>
                    <Bot size={14} />
                  </div>
                )}

                <div style={{
                  backgroundColor: m.sender === 'user' ? 'var(--text-dark)' : '#fff',
                  color: m.sender === 'user' ? '#fff' : 'var(--text-dark)',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  border: m.sender === 'user' ? 'none' : '1px solid var(--border-light)',
                  maxWidth: '85%',
                  lineHeight: 1.45
                }}>
                  {m.text}
                </div>

                {m.sender === 'user' && (
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <RefreshCw size={14} className="spin" /> Querying database context & AI model...
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Bar */}
          <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-light)', backgroundColor: '#fff' }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }}
              style={{ display: 'flex', gap: '0.5rem' }}
            >
              <input
                type="text"
                placeholder="Ask anything about your workspace..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ flex: 1, padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.55rem 0.75rem' }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
