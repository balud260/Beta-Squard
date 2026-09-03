import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import SankalpLogo from '../components/SankalpLogo';
import { Shield, GraduationCap, Building2, User, ArrowRight, Lock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';


export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role')?.toUpperCase() || 'GOVERNMENT';

  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [email, setEmail] = useState(
    initialRole === 'PROBLEM_OWNER' ? 'owner@solvelink.demo' :
    initialRole === 'UNIVERSITY_ADMIN' ? 'university@solvelink.demo' :
    initialRole === 'STUDENT' ? 'student@solvelink.demo' : 'government@solvelink.demo'
  );
  const [password, setPassword] = useState('Demo@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  // Background ping on mount to wake up Render container if cold
  useEffect(() => {
    api.healthCheck().catch(() => {
      // Safe background warm-up attempt, ignore errors
    });
  }, []);

  function redirectRole(role) {
    if (role === 'GOVERNMENT') navigate('/dashboard/government');
    else if (role === 'PROBLEM_OWNER') navigate('/dashboard/owner');
    else if (role === 'UNIVERSITY_ADMIN' || role === 'FACULTY') navigate('/dashboard/university');
    else if (role === 'STUDENT') navigate('/dashboard/student');
    else navigate('/dashboard/government');
  }

  function handleSelectAuthority(roleKey, defaultEmail) {
    setSelectedRole(roleKey);
    setEmail(defaultEmail);
    setError('');
  }

  async function handleQuickLogin(targetEmail, targetRole) {
    setSelectedRole(targetRole);
    setEmail(targetEmail);
    setPassword('Demo@123');
    setLoading(true);
    setError('');

    try {
      const loggedUser = await login(targetEmail, 'Demo@123');
      redirectRole(loggedUser.role);
    } catch (err) {
      console.error('Quick login error:', err);
      setError(err.message || 'Unable to sign in. Please check your email and password.');
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
      setError(err.message || 'Unable to sign in. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  }


  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ padding: '40px 24px 64px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        
        {/* SANKALP AI Hero & Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px', maxWidth: '700px' }}>
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
            Choose your authority to continue to your workspace
          </p>
        </div>


        {/* THREE PRIMARY AUTHORITY CARDS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', width: '100%', maxWidth: '1100px', marginBottom: '40px' }}>
          
          {/* 1. Government Authority Card */}
          <div
            onClick={() => handleSelectAuthority('GOVERNMENT', 'government@solvelink.demo')}
            className="card"
            style={{
              padding: '24px',
              border: selectedRole === 'GOVERNMENT' ? '2px solid var(--navy)' : '1px solid var(--border-light)',
              backgroundColor: selectedRole === 'GOVERNMENT' ? '#ffffff' : 'var(--bg-card)',
              boxShadow: selectedRole === 'GOVERNMENT' ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--navy)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                marginBottom: '16px'
              }}>
                <Shield size={24} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
                Government Authority
              </h3>

              <p style={{ fontSize: '14px', color: 'var(--text-medium)', lineHeight: 1.5, marginBottom: '20px' }}>
                Coordinate disasters, validate problems, manage emergency response and monitor impact.
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleQuickLogin('government@solvelink.demo', 'GOVERNMENT'); }}
              className={`btn ${selectedRole === 'GOVERNMENT' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: '100%', justifyContent: 'center', gap: '6px' }}
            >
              Continue as Government <ArrowRight size={15} />
            </button>
          </div>

          {/* 2. Problem Owner Card */}
          <div
            onClick={() => handleSelectAuthority('PROBLEM_OWNER', 'owner@solvelink.demo')}
            className="card"
            style={{
              padding: '24px',
              border: selectedRole === 'PROBLEM_OWNER' ? '2px solid var(--terracotta)' : '1px solid var(--border-light)',
              backgroundColor: selectedRole === 'PROBLEM_OWNER' ? '#ffffff' : 'var(--bg-card)',
              boxShadow: selectedRole === 'PROBLEM_OWNER' ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--terracotta-soft)',
                color: 'var(--terracotta)',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                marginBottom: '16px'
              }}>
                <Building2 size={24} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
                Problem Owner
              </h3>

              <p style={{ fontSize: '14px', color: 'var(--text-medium)', lineHeight: 1.5, marginBottom: '20px' }}>
                Hospitals, schools, NGOs, companies and local authorities can submit and track problems.
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleQuickLogin('owner@solvelink.demo', 'PROBLEM_OWNER'); }}
              className={`btn ${selectedRole === 'PROBLEM_OWNER' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: '100%', justifyContent: 'center', gap: '6px' }}
            >
              Continue as Problem Owner <ArrowRight size={15} />
            </button>
          </div>

          {/* 3. University Authority Card */}
          <div
            onClick={() => handleSelectAuthority('UNIVERSITY_ADMIN', 'university@solvelink.demo')}
            className="card"
            style={{
              padding: '24px',
              border: selectedRole === 'UNIVERSITY_ADMIN' ? '2px solid #2F9E63' : '1px solid var(--border-light)',
              backgroundColor: selectedRole === 'UNIVERSITY_ADMIN' ? '#ffffff' : 'var(--bg-card)',
              boxShadow: selectedRole === 'UNIVERSITY_ADMIN' ? 'var(--shadow-md)' : 'var(--shadow-sm)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: '#E8F7EC',
                color: '#2F9E63',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                marginBottom: '16px'
              }}>
                <GraduationCap size={24} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)', marginBottom: '8px' }}>
                University Authority
              </h3>

              <p style={{ fontSize: '14px', color: 'var(--text-medium)', lineHeight: 1.5, marginBottom: '20px' }}>
                Discover challenges, accept problems, build student teams and submit solutions.
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleQuickLogin('university@solvelink.demo', 'UNIVERSITY_ADMIN'); }}
              className={`btn ${selectedRole === 'UNIVERSITY_ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ width: '100%', justifyContent: 'center', gap: '6px' }}
            >
              Continue as University <ArrowRight size={15} />
            </button>
          </div>

        </div>

        {/* SUBORDINATE USER: UNIVERSITY INTEGRATED STUDENT ACCESS */}
        <div style={{
          width: '100%',
          maxWidth: '1100px',
          backgroundColor: '#ffffff',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: '40px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-navy" style={{ fontSize: '11px' }}>
                UNIVERSITY-INTEGRATED ACCESS
              </span>
              <span className="metadata-text">Subordinate User</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--navy)', marginBottom: '6px' }}>
              University Integrated Student Access
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Students access SANKALP AI through their university's integrated application to view eligible challenges, submit solution ideas, receive disaster alerts, and accept emergency missions.
            </p>
          </div>

          <button
            onClick={() => handleQuickLogin('student@solvelink.demo', 'STUDENT')}
            className="btn btn-secondary"
            style={{ gap: '8px', fontSize: '13px', padding: '10px 18px' }}
          >
            <User size={15} color="var(--terracotta)" />
            Continue as Student <ArrowRight size={14} />
          </button>
        </div>

        {/* MANUAL AUTHENTICATION FORM CARD */}
        <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '28px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
              AUTHENTICATE CREDENTIALS
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)' }}>
              Sign In to {selectedRole === 'GOVERNMENT' ? 'Government Authority' : selectedRole === 'PROBLEM_OWNER' ? 'Problem Owner Portal' : selectedRole === 'UNIVERSITY_ADMIN' ? 'University Authority' : 'Student App'}
            </h2>
          </div>

          {/* Quick Demo Pre-fill Shortcuts */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleSelectAuthority('GOVERNMENT', 'government@solvelink.demo')}
              className={`btn btn-sm ${selectedRole === 'GOVERNMENT' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              Gov Demo
            </button>
            <button
              type="button"
              onClick={() => handleSelectAuthority('PROBLEM_OWNER', 'owner@solvelink.demo')}
              className={`btn btn-sm ${selectedRole === 'PROBLEM_OWNER' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              Owner Demo
            </button>
            <button
              type="button"
              onClick={() => handleSelectAuthority('UNIVERSITY_ADMIN', 'university@solvelink.demo')}
              className={`btn btn-sm ${selectedRole === 'UNIVERSITY_ADMIN' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              Univ Demo
            </button>
          </div>

          {error && (
            <div style={{ backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '6px' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@authority.gov"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '14px', boxSizing: 'border-box' }}
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
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Signing in...
                </>
              ) : (
                <>
                  <Lock size={15} /> Sign In to Workspace
                </>
              )}
            </button>
          </form>

        </div>

      </main>
    </div>
  );
}
