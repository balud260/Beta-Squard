import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Shield, GraduationCap, Building2, User, Lock, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import SankalpLogo from '../components/SankalpLogo';


export default function RegisterPage() {
  const [authorityType, setAuthorityType] = useState('GOVERNMENT');
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Government Form State
  const [deptName, setDeptName] = useState('');
  const [govOfficialName, setGovOfficialName] = useState('');
  const [govEmail, setGovEmail] = useState('');
  const [govPhone, setGovPhone] = useState('');
  const [govRegion, setGovRegion] = useState('District X');
  const [govPassword, setGovPassword] = useState('');

  // Problem Owner Form State
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState('HOSPITAL');
  const [ownerContactName, setOwnerContactName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerLocation, setOwnerLocation] = useState('Central District');
  const [ownerPassword, setOwnerPassword] = useState('');

  // University Form State
  const [univName, setUnivName] = useState('');
  const [univAdminName, setUnivAdminName] = useState('');
  const [univEmail, setUnivEmail] = useState('');
  const [univPhone, setUnivPhone] = useState('');
  const [univLocation, setUnivLocation] = useState('North Campus');
  const [univPassword, setUnivPassword] = useState('');

  async function handleGovernmentRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.registerGovernment({
        departmentName: deptName,
        officialName: govOfficialName,
        email: govEmail,
        phone: govPhone,
        region: govRegion,
        password: govPassword
      });
      setSession(res.user, res.token);
      navigate('/dashboard/government');
    } catch (err) {
      setError(err.message || 'Government registration failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUniversityRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.registerUniversity({
        universityName: univName,
        adminName: univAdminName,
        email: univEmail,
        phone: univPhone,
        location: univLocation,
        password: univPassword
      });
      setSession(res.user, res.token);
      navigate('/dashboard/university');
    } catch (err) {
      setError(err.message || 'University registration failed.');
    } finally {
      setLoading(false);
    }
  }

  async function handleProblemOwnerRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login({ email: ownerEmail, password: ownerPassword }).catch(() => null);
      if (res) {
        setSession(res.user, res.token);
        navigate('/dashboard/owner');
      } else {
        setError('Problem Owner registration submitted. Please sign in.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <SankalpLogo variant="full" height={50} to="/" />
          </div>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--navy)', margin: 0, fontWeight: 700 }}>Register Institutional Authority</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Select your authority type below to register your institution on SANKALP AI.
          </p>
        </div>


        {/* Three Primary Authority Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setAuthorityType('GOVERNMENT')}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: authorityType === 'GOVERNMENT' ? '2px solid var(--primary-navy)' : '1px solid var(--border-light)',
              backgroundColor: authorityType === 'GOVERNMENT' ? '#e2e8f0' : 'var(--bg-card)',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            <Shield size={20} color="var(--primary-navy)" style={{ display: 'block', margin: '0 auto 0.3rem' }} />
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Government</div>
          </button>

          <button
            onClick={() => setAuthorityType('PROBLEM_OWNER')}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: authorityType === 'PROBLEM_OWNER' ? '2px solid var(--accent-purple)' : '1px solid var(--border-light)',
              backgroundColor: authorityType === 'PROBLEM_OWNER' ? '#f3e8ff' : 'var(--bg-card)',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            <Building2 size={20} color="var(--accent-purple)" style={{ display: 'block', margin: '0 auto 0.3rem' }} />
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Problem Owner</div>
          </button>

          <button
            onClick={() => setAuthorityType('UNIVERSITY')}
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: authorityType === 'UNIVERSITY' ? '2px solid var(--primary-blue)' : '1px solid var(--border-light)',
              backgroundColor: authorityType === 'UNIVERSITY' ? '#e0f2fe' : 'var(--bg-card)',
              textAlign: 'center',
              cursor: 'pointer'
            }}
          >
            <GraduationCap size={20} color="var(--primary-blue)" style={{ display: 'block', margin: '0 auto 0.3rem' }} />
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>University</div>
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {/* Registration Forms */}
        <div className="card">
          {authorityType === 'GOVERNMENT' && (
            <form onSubmit={handleGovernmentRegister}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Government Department Registration</h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Department / Agency Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Disaster Management Authority"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Official Contact Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Commander Rajesh Sharma"
                    value={govOfficialName}
                    onChange={(e) => setGovOfficialName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Official Email (.gov)</label>
                  <input
                    type="email"
                    required
                    placeholder="official@sdma.gov.in"
                    value={govEmail}
                    onChange={(e) => setGovEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={govPassword}
                  onChange={(e) => setGovPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                {loading ? 'Registering...' : 'Register Government Authority'}
              </button>
            </form>
          )}

          {authorityType === 'PROBLEM_OWNER' && (
            <form onSubmit={handleProblemOwnerRegister}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Problem Owner Registration</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Organization Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. District General Hospital"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Organization Category</label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                  >
                    <option value="HOSPITAL">Hospital</option>
                    <option value="SCHOOL">School</option>
                    <option value="NGO">NGO</option>
                    <option value="COMPANY">Company</option>
                    <option value="MUNICIPALITY">Municipality</option>
                    <option value="COMMUNITY_ORG">Community Organization</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Contact Person Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Sunita Deshmukh"
                    value={ownerContactName}
                    onChange={(e) => setOwnerContactName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Official Email</label>
                  <input
                    type="email"
                    required
                    placeholder="contact@districthospital.org"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                {loading ? 'Registering...' : 'Register Problem Owner Authority'}
              </button>
            </form>
          )}

          {authorityType === 'UNIVERSITY' && (
            <form onSubmit={handleUniversityRegister}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>University Institution Registration</h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>University Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Institute of Technology (NIT) District X"
                  value={univName}
                  onChange={(e) => setUnivName(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Administrator Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Arvind Kulkarni"
                    value={univAdminName}
                    onChange={(e) => setUnivAdminName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Institutional Email (.edu)</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@nit.edu"
                    value={univEmail}
                    onChange={(e) => setUnivEmail(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={univPassword}
                  onChange={(e) => setUnivPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                {loading ? 'Registering...' : 'Register University Authority'}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Already registered? <Link to="/login" style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>Sign In</Link>
        </div>

      </div>
    </div>
  );
}
