import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function FloatingAIAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  if (!user) return null;

  const getRoleTitle = (role) => {
    if (role === 'GOVERNMENT') return 'SolveLink AI Assistant • Role: Government';
    if (role === 'PROBLEM_OWNER') return 'SolveLink AI Assistant • Role: Problem Owner';
    if (role === 'UNIVERSITY_ADMIN' || role === 'FACULTY') return 'SolveLink AI Assistant • Role: University';
    if (role === 'STUDENT') return 'SolveLink AI Assistant • Role: Student Responder';
    return 'SolveLink AI Assistant';
  };

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
    setLastFailedQuery(null);

    try {
      const res = await api.chatAI(promptText);
      const botMsg = { id: Date.now() + 1, sender: 'bot', text: res.answer || 'Analysis complete. State updated.', status: 'success' };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setLastFailedQuery(promptText);
      const fallbackMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'AI analysis temporarily unavailable. Please try again.',
        status: 'error'
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Open SolveLink AI Assistant"
          aria-label="Open SolveLink AI Assistant"
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'var(--navy)',
            color: '#fff',
            border: 'none',
            boxShadow: 'var(--shadow-lg)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Sparkles size={22} color="#ffffff" />
        </button>
      )}

      {/* Floating Compact Assistant Drawer */}
      {isOpen && (
        <div style={{
          width: '400px',
          maxWidth: 'calc(100vw - 32px)',
          height: '540px',
          maxHeight: 'calc(100vh - 100px)',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          
          {/* Header Bar */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--navy)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={15} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', lineHeight: 1.1 }}>
                  {getRoleTitle(user.role)}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', opacity: 0.8 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Transcript Area */}
          <div style={{ flex: 1, padding: '14px', overflowY: 'auto', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Greeting */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--terracotta-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--terracotta)', flexShrink: 0 }}>
                <Bot size={14} />
              </div>
              <div style={{ backgroundColor: '#ffffff', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', border: '1px solid var(--border-light)', color: 'var(--text-dark)', maxWidth: '88%' }}>
                Hi <strong>{user.name}</strong>! I am your AI Assistant. Ask any question regarding active challenges, proposals, or disaster response.
              </div>
            </div>

            {/* Suggested Question Pills */}
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Suggested Context Queries
                </div>
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendQuery(q)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-light)',
                      fontSize: '12.5px',
                      color: 'var(--navy)',
                      cursor: 'pointer'
                    }}
                  >
                    💡 {q}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start',
                  justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                {m.sender === 'bot' && (
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: m.status === 'error' ? 'var(--status-danger-bg)' : 'var(--terracotta-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.status === 'error' ? 'var(--status-danger)' : 'var(--terracotta)', flexShrink: 0 }}>
                    {m.status === 'error' ? <AlertCircle size={14} /> : <Bot size={14} />}
                  </div>
                )}

                <div style={{
                  backgroundColor: m.sender === 'user' ? 'var(--navy)' : m.status === 'error' ? 'var(--status-danger-bg)' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : m.status === 'error' ? 'var(--status-danger)' : 'var(--text-dark)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  border: m.sender === 'user' ? 'none' : m.status === 'error' ? '1px solid #fca5a5' : '1px solid var(--border-light)',
                  maxWidth: '88%',
                  lineHeight: 1.45
                }}>
                  {m.text}
                  {m.status === 'error' && lastFailedQuery && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        onClick={() => handleSendQuery(lastFailedQuery)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: 'var(--status-danger)', borderColor: 'var(--status-danger)' }}
                      >
                        <RefreshCw size={12} /> Retry Query
                      </button>
                    </div>
                  )}
                </div>

                {m.sender === 'user' && (
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '12.5px', padding: '4px 8px' }}>
                <RefreshCw size={14} className="spin" /> Analyzing incident &amp; database state...
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-light)', backgroundColor: '#ffffff' }}>
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendQuery(); }}
              style={{ display: 'flex', gap: '8px' }}
            >
              <input
                type="text"
                placeholder="Ask AI Assistant..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '13px' }}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="btn btn-primary btn-sm"
                style={{ padding: '8px 14px' }}
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
