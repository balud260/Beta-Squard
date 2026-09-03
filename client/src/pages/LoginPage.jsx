import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import SankalpLogo from '../components/SankalpLogo';
import { Shield, GraduationCap, Building2, User, Lock, AlertCircle, RefreshCw, LogIn, Key, CheckCircle2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role')?.toUpperCase() || 'GOVERNMENT';

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.healthCheck().catch(() => {});
  }, []);

  function redirectRole(role) {
    if (role === 'GOVERNMENT') navigate('/dashboard/government');
    else if (role === 'PROBLEM_OWNER') navigate('/dashboard/owner');
    else if (role === 'UNIVERSITY_ADMIN' || role === 'FACULTY') navigate('/dashboard/university');
    else if (role === 'STUDENT') navigate('/dashboard/student');
    else navigate('/dashboard/government');
  }

  function handleUseTestAccount(testRole, testEmail, testPassword) {
    setSelectedRole(testRole);
    setEmail(testEmail);
    setPassword(testPassword);
    setError('');
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const loggedUser = await login(email, password);
      redirectRole(loggedUser.role);
    } catch (err) {
      console.error('Login submit error:', err);
      setError(err.message || 'Unable to sign in. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ padding: '40px 24px 64px', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        
        {/* SANKALP AI Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px', maxWidth: '700px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <SankalpLogo variant="full" height={54} to="/" />
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '0.1em', marginTop: '6px' }}>
              FROM PROBLEMS TO ACTION. FROM ACTION TO IMPACT.
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--terracotta)', letterSpacing: '0.05em' }}>
              Government • Academia • Society
            </div>
          </div>

          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
            Sign in to access your SANKALP workspace
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', width: '100%', maxWidth: '600px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setSelectedRole('GOVERNMENT')}
            style={{
              padding: '12px 8px',
              borderRadius: '8px',
              border: selectedRole === 'GOVERNMENT' ? '2px solid var(--navy)' : '1px solid var(--border-light)',
              backgroundColor: selectedRole === 'GOVERNMENT' ? '#ffffff' : 'var(--bg-card)',
              color: selectedRole === 'GOVERNMENT' ? 'var(--navy)' : 'var(--text-medium)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Shield size={18} /> Government
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('PROBLEM_OWNER')}
            style={{
              padding: '12px 8px',
              borderRadius: '8px',
              border: selectedRole === 'PROBLEM_OWNER' ? '2px solid var(--terracotta)' : '1px solid var(--border-light)',
              backgroundColor: selectedRole === 'PROBLEM_OWNER' ? '#ffffff' : 'var(--bg-card)',
              color: selectedRole === 'PROBLEM_OWNER' ? 'var(--terracotta)' : 'var(--text-medium)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Building2 size={18} /> Problem Owner
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('UNIVERSITY_ADMIN')}
            style={{
              padding: '12px 8px',
              borderRadius: '8px',
              border: selectedRole === 'UNIVERSITY_ADMIN' ? '2px solid #2F9E63' : '1px solid var(--border-light)',
              backgroundColor: selectedRole === 'UNIVERSITY_ADMIN' ? '#ffffff' : 'var(--bg-card)',
              color: selectedRole === 'UNIVERSITY_ADMIN' ? '#2F9E63' : 'var(--text-medium)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <GraduationCap size={18} /> University
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('STUDENT')}
            style={{
              padding: '12px 8px',
              borderRadius: '8px',
              border: selectedRole === 'STUDENT' ? '2px solid var(--primary-blue)' : '1px solid var(--border-light)',
              backgroundColor: selectedRole === 'STUDENT' ? '#ffffff' : 'var(--bg-card)',
              color: selectedRole === 'STUDENT' ? 'var(--primary-blue)' : 'var(--text-medium)',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <User size={18} /> Student
          </button>
        </div>

        {/* REAL AUTHENTICATION FORM CARD */}
        <div className="card" style={{ width: '100%', maxWidth: '460px', padding: '32px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', marginBottom: '40px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)' }}>
              Sign In to {selectedRole === 'GOVERNMENT' ? 'Government Workspace' : selectedRole === 'PROBLEM_OWNER' ? 'Problem Owner Portal' : selectedRole === 'UNIVERSITY_ADMIN' ? 'University Portal' : 'Student Portal'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Enter your account credentials to log in
            </p>
          </div>

          {error && (
            <div style={{ backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@authority.gov or user@institution.edu"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, marginTop: '6px', justifyContent: 'center' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Verifying Credentials...
                </>
              ) : (
                <>
                  <LogIn size={16} /> Sign In
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-light)', fontSize: '13px', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-blue)', fontWeight: 700, textDecoration: 'none' }}>
              Create Account
            </Link>
          </div>

        </div>

        {/* HACKATHON TEST ACCOUNTS SECTION */}
        <div style={{ width: '100%', maxWidth: '960px', marginTop: '8px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#e2e8f0', color: 'var(--navy)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px' }}>
              <Key size={14} /> HACKATHON TEST ACCOUNTS
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              These accounts are provided for hackathon evaluation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', width: '100%' }}>
            
            {/* 1. Government */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Shield size={18} color="var(--navy)" />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy)' }}>Government</span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginBottom: '4px' }}>
                  <strong>Email:</strong> <code style={{ backgroundColor: '#f1f5f9', padding: '2px 5px', borderRadius: '4px', fontSize: '11px' }}>government@sankalp.ai</code>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginBottom: '14px' }}>
                  <strong>Password:</strong> <code style={{ backgroundColor: '#f1f5f9', padding: '2px 5px', borderRadius: '4px', fontSize: '11px' }}>Sankalp@Gov2026</code>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUseTestAccount('GOVERNMENT', 'government@sankalp.ai', 'Sankalp@Gov2026')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center', fontSize: '12px', fontWeight: 600, gap: '4px' }}
              >
                Use Account <ArrowRight size={13} />
              </button>
            </div>

            {/* 2. Problem Owner */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Building2 size={18} color="var(--terracotta)" />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy)' }}>Problem Owner</span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginBottom: '4px' }}>
                  <strong>Email:</strong> <code style={{ backgroundColor: '#f1f5f9', padding: '2px 5px', borderRadius: '4px', fontSize: '11px' }}>owner@sankalp.ai</code>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginBottom: '14px' }}>
                  <strong>Password:</strong> <code style={{ backgroundColor: '#f1f5f9', padding: '2px 5px', borderRadius: '4px', fontSize: '11px' }}>Sankalp@Owner2026</code>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUseTestAccount('PROBLEM_OWNER', 'owner@sankalp.ai', 'Sankalp@Owner2026')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center', fontSize: '12px', fontWeight: 600, gap: '4px' }}
              >
                Use Account <ArrowRight size={13} />
              </button>
            </div>

            {/* 3. University Authority */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <GraduationCap size={18} color="#2F9E63" />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy)' }}>University Authority</span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginBottom: '4px' }}>
                  <strong>Email:</strong> <code style={{ backgroundColor: '#f1f5f9', padding: '2px 5px', borderRadius: '4px', fontSize: '11px' }}>university@sankalp.ai</code>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginBottom: '14px' }}>
                  <strong>Password:</strong> <code style={{ backgroundColor: '#f1f5f9', padding: '2px 5px', borderRadius: '4px', fontSize: '11px' }}>Sankalp@University2026</code>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUseTestAccount('UNIVERSITY_ADMIN', 'university@sankalp.ai', 'Sankalp@University2026')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center', fontSize: '12px', fontWeight: 600, gap: '4px' }}
              >
                Use Account <ArrowRight size={13} />
              </button>
            </div>

            {/* 4. Student */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <User size={18} color="var(--primary-blue)" />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--navy)' }}>Student</span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginBottom: '4px' }}>
                  <strong>Email:</strong> <code style={{ backgroundColor: '#f1f5f9', padding: '2px 5px', borderRadius: '4px', fontSize: '11px' }}>student@sankalp.ai</code>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-dark)', marginBottom: '14px' }}>
                  <strong>Password:</strong> <code style={{ backgroundColor: '#f1f5f9', padding: '2px 5px', borderRadius: '4px', fontSize: '11px' }}>Sankalp@Student2026</code>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUseTestAccount('STUDENT', 'student@sankalp.ai', 'Sankalp@Student2026')}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', justifyContent: 'center', fontSize: '12px', fontWeight: 600, gap: '4px' }}
              >
                Use Account <ArrowRight size={13} />
              </button>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
