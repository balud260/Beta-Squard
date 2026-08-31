import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Shield, GraduationCap, Building2, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('government@solvelink.demo');
  const [password, setPassword] = useState('Demo@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

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
      <Navbar />

      <div className="screen" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <div className="screen-label">2 · Login</div>

        <div className="login-wrap">
          <h2>Sign in to SolveLink AI</h2>
          <p className="sub">Choose your authority to continue</p>

          <div className="login-cards">
            {/* Government Authority Card */}
            <div
              className="login-card"
              onClick={() => handleQuickLogin('government@solvelink.demo', 'GOVERNMENT')}
            >
              <div className="icon">G</div>
              <h4>Government Authority</h4>
              <p>Oversight, disasters, approvals</p>
            </div>

            {/* Problem Owner Card */}
            <div
              className="login-card"
              onClick={() => handleQuickLogin('owner@solvelink.demo', 'PROBLEM_OWNER')}
            >
              <div className="icon">P</div>
              <h4>Problem Owner</h4>
              <p>Submit and track problems</p>
            </div>

            {/* University Authority Card */}
            <div
              className="login-card"
              onClick={() => handleQuickLogin('university@solvelink.demo', 'UNIVERSITY_ADMIN')}
            >
              <div className="icon">U</div>
              <h4>University Authority</h4>
              <p>Discover, build, deliver</p>
            </div>
          </div>

          {/* Student Integrated App Entry Point */}
          <div style={{ marginTop: '2rem', width: '100%', maxWidth: '700px', display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={() => handleQuickLogin('student@solvelink.demo', 'STUDENT')}
              className="btn ghost"
              style={{ width: '100%', padding: '12px 20px', gap: '10px' }}
            >
              <User size={18} color="var(--blue)" />
              <span>Sign in as Integrated Student Responder (Aarav Sharma)</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Manual Email & Password Form */}
          <div className="card" style={{ width: '100%', maxWidth: '440px', marginTop: '2.5rem', padding: '1.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--navy)', marginBottom: '1rem', textAlign: 'center' }}>
              Manual Authority Sign In
            </h3>

            {error && (
              <div style={{ backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '0.65rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.8rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-mute)', marginBottom: '0.3rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-mute)', marginBottom: '0.3rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
              </div>

              <button type="submit" disabled={loading} className="btn primary" style={{ width: '100%' }}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
