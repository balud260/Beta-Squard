import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, GraduationCap, Building2, User, LogOut, ChevronDown, Smartphone } from 'lucide-react';

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
    return 'PLATFORM';
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
        height: '60px'
      }}>
        
        {/* Brand Logo & Portal Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: '800',
              fontSize: '1rem'
            }}>
              S
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy)' }}>
              SOLVELINK <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem' }}>| {user ? getPortalLabel(user.role) : 'PLATFORM'}</span>
            </div>
          </Link>
        </div>

        {/* Center Nav Links */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', minWidth: 0 }}>
          {user && (user.role === 'UNIVERSITY_ADMIN' || user.role === 'FACULTY') ? (
            <>
              <Link to="/dashboard/university" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--terracotta)', whiteSpace: 'nowrap' }}>
                Discovery
              </Link>
              <a href="#accepted" style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                My Projects
              </a>
              <a href="#teams" style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Team Management
              </a>
            </>
          ) : user && user.role === 'GOVERNMENT' ? (
            <>
              <Link to="/dashboard/government" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--terracotta)', whiteSpace: 'nowrap' }}>
                Disaster Command Center
              </Link>
              <a href="#responsible" style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Requirements
              </a>
              <a href="#resources" style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                Hospitals &amp; Universities
              </a>
            </>
          ) : user && user.role === 'PROBLEM_OWNER' ? (
            <>
              <Link to="/dashboard/owner" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--terracotta)', whiteSpace: 'nowrap' }}>
                My Challenges
              </Link>
              <a href="#responses" style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                University Responses
              </a>
            </>
          ) : (
            <>
              <Link to="/" style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-dark)', whiteSpace: 'nowrap' }}>Overview</Link>
              <a href="#how-it-works" style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>How It Works</a>
            </>
          )}
        </nav>

        {/* Right User Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flexShrink: 0 }}>
          {onOpenSimulatedApp && (
            <button
              onClick={onOpenSimulatedApp}
              className="btn btn-secondary btn-sm"
              style={{ gap: '0.3rem', fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
            >
              <Smartphone size={13} /> Student App
            </button>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative', minWidth: 0 }}>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    minWidth: 0
                  }}
                >
                  <div style={{ textAlign: 'right', minWidth: 0, maxWidth: '130px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-dark)', lineHeight: 1.1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {user.role.replace('_', ' ')}
                    </div>
                  </div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--terracotta-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: 'var(--terracotta)', flexShrink: 0 }}>
                    {user.name[0]}
                  </div>
                  <ChevronDown size={14} color="var(--text-muted)" flexShrink={0} />
                </button>


                {showRoleDropdown && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: '250px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--border-light)',
                    padding: '0.5rem',
                    zIndex: 100
                  }}>
                    <div style={{ padding: '0.4rem 0.5rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Switch Portal Role
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
                            padding: '0.5rem 0.75rem',
                            borderRadius: '6px',
                            backgroundColor: user.role === acc.role ? 'var(--terracotta-soft)' : 'transparent',
                            color: user.role === acc.role ? 'var(--terracotta)' : 'var(--text-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer'
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
                style={{ padding: '0.4rem' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
              <Link to="/login" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
