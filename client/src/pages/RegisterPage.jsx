import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import SankalpLogo from '../components/SankalpLogo';
import { Shield, GraduationCap, Building2, User, AlertCircle, RefreshCw, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [role, setRole] = useState('GOVERNMENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function redirectRole(assignedRole) {
    if (assignedRole === 'GOVERNMENT') navigate('/dashboard/government');
    else if (assignedRole === 'PROBLEM_OWNER') navigate('/dashboard/owner');
    else if (assignedRole === 'UNIVERSITY_ADMIN' || assignedRole === 'FACULTY') navigate('/dashboard/university');
    else if (assignedRole === 'STUDENT') navigate('/dashboard/student');
    else navigate('/dashboard/government');
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.register({
        name,
        email,
        password,
        confirmPassword,
        role,
        organizationName: orgName,
        phone,
        location
      });

      if (res.user && res.token) {
        setSession(res.user, res.token);
        redirectRole(res.user.role);
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ padding: '40px 24px 64px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px', maxWidth: '700px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <SankalpLogo variant="full" height={54} to="/" />
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--navy)', letterSpacing: '0.1em', marginTop: '6px' }}>
              REGISTER YOUR ACCOUNT ON SANKALP AI
            </div>
          </div>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
            Join the platform connecting Government, Academia, and Problem Owners for real societal impact.
          </p>
        </div>

        {/* Role Selection Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', width: '100%', maxWidth: '640px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setRole('GOVERNMENT')}
            style={{
              padding: '12px 8px',
              borderRadius: '8px',
              border: role === 'GOVERNMENT' ? '2px solid var(--navy)' : '1px solid var(--border-light)',
              backgroundColor: role === 'GOVERNMENT' ? '#ffffff' : 'var(--bg-card)',
              color: role === 'GOVERNMENT' ? 'var(--navy)' : 'var(--text-medium)',
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
            onClick={() => setRole('PROBLEM_OWNER')}
            style={{
              padding: '12px 8px',
              borderRadius: '8px',
              border: role === 'PROBLEM_OWNER' ? '2px solid var(--terracotta)' : '1px solid var(--border-light)',
              backgroundColor: role === 'PROBLEM_OWNER' ? '#ffffff' : 'var(--bg-card)',
              color: role === 'PROBLEM_OWNER' ? 'var(--terracotta)' : 'var(--text-medium)',
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
            onClick={() => setRole('UNIVERSITY_ADMIN')}
            style={{
              padding: '12px 8px',
              borderRadius: '8px',
              border: role === 'UNIVERSITY_ADMIN' ? '2px solid #2F9E63' : '1px solid var(--border-light)',
              backgroundColor: role === 'UNIVERSITY_ADMIN' ? '#ffffff' : 'var(--bg-card)',
              color: role === 'UNIVERSITY_ADMIN' ? '#2F9E63' : 'var(--text-medium)',
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
            onClick={() => setRole('STUDENT')}
            style={{
              padding: '12px 8px',
              borderRadius: '8px',
              border: role === 'STUDENT' ? '2px solid var(--primary-blue)' : '1px solid var(--border-light)',
              backgroundColor: role === 'STUDENT' ? '#ffffff' : 'var(--bg-card)',
              color: role === 'STUDENT' ? 'var(--primary-blue)' : 'var(--text-medium)',
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

        {/* REGISTRATION FORM CARD */}
        <div className="card" style={{ width: '100%', maxWidth: '540px', padding: '32px', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--navy)' }}>
              Register as {role === 'GOVERNMENT' ? 'Government Authority' : role === 'PROBLEM_OWNER' ? 'Problem Owner' : role === 'UNIVERSITY_ADMIN' ? 'University Authority' : 'Student'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Create your account to start managing challenges and responses
            </p>
          </div>

          {error && (
            <div style={{ backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Commander Rajesh Sharma or Dr. Sunita Deshmukh"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '6px' }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. official@sdma.gov.in or admin@nit.edu"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            {role !== 'STUDENT' && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '6px' }}>
                  {role === 'GOVERNMENT' ? 'Department / Agency Name' : role === 'PROBLEM_OWNER' ? 'Organization / Hospital Name' : 'University Name'}
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={role === 'GOVERNMENT' ? 'e.g. State Disaster Management Authority' : role === 'PROBLEM_OWNER' ? 'e.g. District General Hospital' : 'e.g. National Institute of Technology'}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, marginTop: '8px', justifyContent: 'center' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Create Account
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-light)', fontSize: '13px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-blue)', fontWeight: 700, textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>

        </div>

      </main>
    </div>
  );
}
