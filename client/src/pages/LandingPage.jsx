import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import ImpactChart from '../components/ImpactChart';
import SimulatedUnivApp from '../components/SimulatedUnivApp';
import { api } from '../services/api';
import { Shield, GraduationCap, Building2, Activity, ArrowRight, CheckCircle2, Users, FileText } from 'lucide-react';

export default function LandingPage() {
  const [stats, setStats] = useState({
    challengesPosted: 128,
    universityTeams: 19,
    solutionsDelivered: 34,
    peopleImpacted: '50,000+'
  });
  const [disasters, setDisasters] = useState([]);
  const [isSimulatedAppOpen, setIsSimulatedAppOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPublicData();
  }, []);

  async function loadPublicData() {
    try {
      const impRes = await api.getImpactMetrics().catch(() => ({ stats }));
      if (impRes.stats) setStats(impRes.stats);

      const disRes = await api.getDisasters().catch(() => ({ disasters: [] }));
      setDisasters(disRes.disasters || []);
    } catch (e) {
      console.warn('Landing page data fetch fallback');
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenSimulatedApp={() => setIsSimulatedAppOpen(true)} />

      {/* Spacious Hero Section */}
      <section style={{ padding: '4rem 0 3rem 0', borderBottom: '1px solid var(--border-light)', backgroundColor: '#ffffff' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '900px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '1rem', lineHeight: 1.2 }}>
            SolveLink AI
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            Real problems. Academic solutions. Lasting impact. Government coordinates, universities respond, students deliver.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <Link className="btn btn-primary" to="/login" style={{ padding: '12px 28px', fontSize: '1rem' }}>
              Sign In to Portal
            </Link>
            <a className="btn btn-secondary" href="#how-it-works" style={{ padding: '12px 28px', fontSize: '1rem' }}>
              See How It Works
            </a>
          </div>

          {/* Connected Flow Steps */}
          <div className="flow">
            <span className="step">Problem</span>
            <span className="arrow">→</span>
            <span className="step">AI</span>
            <span className="arrow">→</span>
            <span className="step">Government</span>
            <span className="arrow">→</span>
            <span className="step">University</span>
            <span className="arrow">→</span>
            <span className="step">Students</span>
            <span className="arrow">→</span>
            <span className="step">Solution</span>
            <span className="arrow">→</span>
            <span className="step">Impact</span>
          </div>
        </div>
      </section>

      {/* Three Primary Roles Cards */}
      <section style={{ padding: '3.5rem 0', backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--terracotta)', marginBottom: '8px' }}>
                AUTHORITY
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--navy)', marginBottom: '8px' }}>Government</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Coordinates every problem and disaster response, and monitors impact across universities.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--terracotta)', marginBottom: '8px' }}>
                SUBMITTER
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--navy)', marginBottom: '8px' }}>Problem Owner</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Hospitals, schools, NGOs and municipalities submit real problems and pick the best solution.
              </p>
            </div>

            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', color: 'var(--terracotta)', marginBottom: '8px' }}>
                SOLVER
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--navy)', marginBottom: '8px' }}>University</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Discovers eligible problems, builds teams, and delivers proposals through to deployment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section style={{ padding: '2.5rem 0', backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <div className="grid grid-cols-4">
            <StatCard title="Problems Received" value={stats.challengesPosted || 128} subtitle="Active & Tracked" icon={FileText} color="blue" />
            <StatCard title="Awaiting Review" value={34} subtitle="In Evaluation" icon={Activity} color="amber" />
            <StatCard title="Universities Active" value={stats.universityTeams || 19} subtitle="Partner Institutions" icon={GraduationCap} color="purple" />
            <StatCard title="Active Disasters" value={stats.activeDisasters || 6} subtitle="Command Monitored" icon={Shield} color="red" />
          </div>
        </div>
      </section>

      {/* How It Works Capabilities */}
      <section id="how-it-works" style={{ padding: '4rem 0', backgroundColor: 'var(--bg-main)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem auto' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>System Architecture</span>
            <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Unified Coordination Platform</h2>
            <p className="text-muted">
              Connecting government authorities, problem submitters, and university solvers in a single workflow.
            </p>
          </div>

          <div className="grid grid-cols-2">
            <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--terracotta)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--terracotta-soft)', color: 'var(--terracotta)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} />
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--navy)' }}>Societal Problem Workflow</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                Problems submitted by healthcare providers, schools, and local authorities are automatically assigned to responsible government departments and published to eligible university portals.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> AI Classification &amp; Responsibility Routing</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> University Acceptance &amp; Student Team Formation</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> Multi-Proposal Comparison &amp; Government Approval</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> Field Deployment &amp; Outcome Monitoring</li>
              </ul>
            </div>

            <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--navy)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#E2EBE6', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={20} />
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--navy)' }}>Disaster Response Command</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                Centralized emergency hazard exposure analysis, AI-scored relocation recommendations, hospital pressure tracking, and rapid student responder dispatch.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> Interactive Geospatial Hazard &amp; Exposure Mapping</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> AI Relocation Site Safety Evaluation</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> Real-Time Hospital Capacity &amp; Patient Inflow</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> University-Integrated Emergency Dispatch</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Disaster Command Section Preview */}
      <section id="disaster-response" style={{ padding: '4rem 0', backgroundColor: '#ffffff', borderTop: '1px solid var(--border-light)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <span className="badge badge-danger" style={{ marginBottom: '0.5rem' }}>Live Incident Monitor</span>
              <h2 className="section-title" style={{ fontSize: '1.75rem' }}>Active Emergency Command Monitor</h2>
            </div>
            <Link to="/login" className="btn btn-primary btn-sm">
              Open Command Center <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-3">
            {disasters.slice(0, 3).map((d) => (
              <div key={d.id} className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--status-danger)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-danger">{d.type}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{d.status}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--navy)' }}>{d.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {d.location} • {d.affected_population?.toLocaleString()} Affected
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)', backgroundColor: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: '6px' }}>
                  {d.hazard_info}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Chart */}
      <section id="impact" style={{ padding: '4rem 0', backgroundColor: 'var(--bg-main)' }}>
        <div className="container">
          <ImpactChart />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--navy)', color: '#E2EBE6', padding: '3rem 0', marginTop: 'auto' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff' }}>
              SOLVELINK AI
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: '#E2EBE6' }}>
              Real Problems. Academic Solutions. Lasting Impact.
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#E2EBE6' }}>
            Government coordinates, universities respond, students deliver.
          </div>
        </div>
      </footer>

      {/* Simulated Mobile App Drawer Modal */}
      <SimulatedUnivApp
        isOpen={isSimulatedAppOpen}
        onClose={() => setIsSimulatedAppOpen(false)}
      />
    </div>
  );
}
