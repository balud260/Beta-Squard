import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, GraduationCap, Building2, User, ArrowRight, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('government@solvelink.demo');
  const [password, setPassword] = useState('Demo@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const primaryAuthorities = [
    {
      id: 'gov',
      title: 'Government Authority',
      role: 'GOVERNMENT',
      email: 'government@solvelink.demo',
      icon: Shield,
      color: 'var(--primary-navy)',
      bg: '#e2e8f0'
    },
    {
      id: 'owner',
      title: 'Problem Owner Authority',
      role: 'PROBLEM_OWNER',
      email: 'owner@solvelink.demo',
      icon: Building2,
      color: 'var(--accent-purple)',
      bg: '#f3e8ff'
    },
    {
      id: 'univ',
      title: 'University Authority',
      role: 'UNIVERSITY_ADMIN',
      email: 'university@solvelink.demo',
      icon: GraduationCap,
      color: 'var(--primary-blue)',
      bg: '#e0f2fe'
    }
  ];

  function redirectRole(role) {
    if (role === 'GOVERNMENT') navigate('/dashboard/government');
    else if (role === 'PROBLEM_OWNER') navigate('/dashboard/owner');
    else if (role === 'UNIVERSITY_ADMIN' || role === 'FACULTY') navigate('/dashboard/university');
    else if (role === 'STUDENT') navigate('/dashboard/student');
    else navigate('/dashboard/government');
  }

  async function handleQuickLogin(targetEmail, targetRole) {
    setEmail(targetEmail);
    setPassword('Demo@123');
    setLoading(true);
    setError('');
    try {
      const loggedUser = await login(targetEmail, 'Demo@123');
      redirectRole(loggedUser.role);
    } catch (err) {
      console.error('Quick login error:', err);
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const loggedUser = await login(email, password);
      redirectRole(loggedUser.role);
    } catch (err) {
      console.error('Login submit error:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--border-light)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'var(--text-dark)', textDecoration: 'none', fontWeight: 800, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>
            S
          </div>
          SolveLink <span style={{ color: 'var(--primary-blue)' }}>AI</span>
        </Link>

        <Link to="/register" className="btn btn-secondary btn-sm">
          Register Institution
        </Link>
      </div>

      {/* Main Centered Minimal Login Content */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '440px', textAlign: 'center' }}>
          
          {/* Brand Heading */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', color: 'var(--text-dark)', marginBottom: '0.3rem' }}>SolveLink AI</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
              Real Problems. Academic Solutions.
            </p>
          </div>

          {/* Portal Selection Header */}
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.85rem' }}>
            Select Your Portal
          </div>

          {/* Three Primary Portals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {primaryAuthorities.map((auth) => {
              const Icon = auth.icon;
              return (
                <button
                  key={auth.id}
                  onClick={() => handleQuickLogin(auth.email, auth.role)}
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    padding: '0.85rem 1.25rem',
                    justify: 'space-between',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    backgroundColor: '#fff',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-blue)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: auth.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: auth.color }}>
                      <Icon size={18} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-dark)' }}>{auth.title}</span>
                  </div>
                  <ArrowRight size={16} color="var(--text-muted)" />
                </button>
              );
            })}
          </div>

          {/* OR Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
            <span>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-light)' }} />
          </div>

          {/* Subordinate Student Integration Login */}
          <div style={{ backgroundColor: '#fff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '2rem', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-dark)' }}>Student Demo Login</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>University-integrated student account</div>
            </div>
            <button
              onClick={() => handleQuickLogin('student@solvelink.demo', 'STUDENT')}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.3rem' }}
            >
              <User size={14} /> Enter
            </button>
          </div>

          {/* Manual Email & Password Form */}
          <div className="card" style={{ textAlign: 'left', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', textAlign: 'center' }}>Manual Sign In</h3>

            {error && (
              <div style={{ backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.8rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.9rem' }}
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
