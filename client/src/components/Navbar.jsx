import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Activity, GraduationCap, Building2, User, LogOut, ChevronDown, Bell, Search, Smartphone } from 'lucide-react';

export default function Navbar({ onOpenSimulatedApp }) {
  const { user, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const demoAccounts = [
    { label: '1. Government Authority', role: 'GOVERNMENT', email: 'government@solvelink.demo', icon: Shield },
    { label: '2. Problem Owner (Hospital)', role: 'PROBLEM_OWNER', email: 'owner@solvelink.demo', icon: Building2 },
    { label: '2. Problem Owner (NGO)', role: 'PROBLEM_OWNER', email: 'owner2@solvelink.demo', icon: Building2 },
    { label: '3. University Authority (NIT)', role: 'UNIVERSITY_ADMIN', email: 'university@solvelink.demo', icon: GraduationCap },
    { label: 'Integrated Student (Aarav)', role: 'STUDENT', email: 'student@solvelink.demo', icon: User }
  ];

  const handleRoleSwitch = async (email, role) => {
    setShowRoleDropdown(false);
    await quickLogin(email);
    if (role === 'GOVERNMENT') navigate('/dashboard/government');
    else if (role === 'PROBLEM_OWNER') navigate('/dashboard/owner');
    else if (role === 'UNIVERSITY_ADMIN') navigate('/dashboard/university');
    else if (role === 'STUDENT') navigate('/dashboard/student');
  };

  const getPortalLabel = (role) => {
    if (role === 'GOVERNMENT') return 'GOVERNMENT DISASTER COMMAND';
    if (role === 'PROBLEM_OWNER') return 'PROBLEM OWNER PORTAL';
    if (role === 'UNIVERSITY_ADMIN' || role === 'FACULTY') return 'UNIVERSITY PORTAL';
    if (role === 'STUDENT') return 'STUDENT INTEGRATED APP';
    return 'PORTAL';
  };

  const getDashboardPath = (role) => {
    if (role === 'GOVERNMENT') return '/dashboard/government';
    if (role === 'PROBLEM_OWNER') return '/dashboard/owner';
    if (role === 'UNIVERSITY_ADMIN' || role === 'FACULTY') return '/dashboard/university';
    if (role === 'STUDENT') return '/dashboard/student';
    return '/';
  };

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-light)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}>
        
        {/* Brand Logo & Portal Title matching Reference */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-purple)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '800',
              fontSize: '1.1rem'
            }}>
              S
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-dark)' }}>
              SOLVELINK <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>| {user ? getPortalLabel(user.role) : 'PLATFORM'}</span>
            </div>
          </Link>
        </div>

        {/* Center Nav Links matching Reference Screenshot */}
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {user && (user.role === 'UNIVERSITY_ADMIN' || user.role === 'FACULTY') ? (
            <>
              <Link to="/dashboard/university" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-blue)', borderBottom: '2px solid var(--primary-blue)', paddingBottom: '0.2rem' }}>
                Discovery
              </Link>
              <Link to="/dashboard/university" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                My Projects
              </Link>
              <Link to="/dashboard/university" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Team Management
              </Link>
            </>
          ) : user && user.role === 'GOVERNMENT' ? (
            <>
              <Link to="/dashboard/government" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-blue)', borderBottom: '2px solid var(--primary-blue)', paddingBottom: '0.2rem' }}>
                Disaster Command Center
              </Link>
              <a href="#requirements" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Requirements
              </a>
              <a href="#hospitals" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Hospitals & Universities
              </a>
            </>
          ) : user && user.role === 'PROBLEM_OWNER' ? (
            <>
              <Link to="/dashboard/owner" style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-blue)', borderBottom: '2px solid var(--primary-blue)', paddingBottom: '0.2rem' }}>
                My Challenges
              </Link>
              <a href="#responses" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                University Responses
              </a>
              <a href="#proposals" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Proposals
              </a>
            </>
          ) : (
            <>
              <Link to="/" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-medium)' }}>Overview</Link>
              <a href="#how-it-works" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-medium)' }}>How It Works</a>
              <a href="#disaster-response" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-medium)' }}>Disaster Command</a>
            </>
          )}
        </nav>

        {/* Right Actions / User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onOpenSimulatedApp && (
            <button
              onClick={onOpenSimulatedApp}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.3rem', fontSize: '0.8rem' }}
            >
              <Smartphone size={14} /> Univ App Demo
            </button>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
              
              {/* User Profile & Role Dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.2rem'
                  }}
                >
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: 1.1 }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {user.role.replace('_', ' ')}
                    </div>
                  </div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                    {user.name[0]}
                  </div>
                  <ChevronDown size={14} color="var(--text-muted)" />
                </button>

                {showRoleDropdown && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '260px',
                    backgroundColor: '#fff',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--border-light)',
                    padding: '0.5rem',
                    zIndex: 100
                  }}>
                    <div style={{ padding: '0.5rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Switch Portal / Demo Role
                    </div>
                    {demoAccounts.map((acc) => {
                      const IconComp = acc.icon;
                      return (
                        <button
                          key={acc.email}
                          onClick={() => handleRoleSwitch(acc.email, acc.role)}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.55rem 0.75rem',
                            borderRadius: '6px',
                            backgroundColor: user.role === acc.role ? 'var(--primary-light)' : 'transparent',
                            color: user.role === acc.role ? 'var(--primary-blue)' : 'var(--text-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                        >
                          <IconComp size={15} />
                          {acc.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={() => { logout(); navigate('/'); }}
                className="btn btn-secondary btn-sm"
                title="Sign Out"
                style={{ padding: '0.45rem' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
              <Link to="/login" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
