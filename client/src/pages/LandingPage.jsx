import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import ImpactChart from '../components/ImpactChart';
import SimulatedUnivApp from '../components/SimulatedUnivApp';
import { api } from '../services/api';
import { Shield, GraduationCap, Building2, Activity, Sparkles, ArrowRight, CheckCircle2, Users, FileText } from 'lucide-react';

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

      {/* Screen Frame matching User Design Concept */}
      <div className="screen">
        <div className="screen-label">1 · Landing Page</div>

        {/* Hero Section */}
        <div className="hero">
          <h1>SolveLink AI</h1>
          <p className="tag">
            Real problems. Academic solutions. Lasting impact. Government coordinates, universities respond, students deliver.
          </p>

          <div className="cta-row">
            <Link className="btn primary" to="/login">
              Sign in
            </Link>
            <a className="btn ghost" href="#how-it-works">
              See how it works
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

        {/* Three Primary Roles Cards */}
        <div className="roles">
          <div className="role-card">
            <div className="who">AUTHORITY</div>
            <h3>Government</h3>
            <p>Coordinates every problem and disaster response, and monitors impact across universities.</p>
          </div>

          <div className="role-card">
            <div className="who">SUBMITTER</div>
            <h3>Problem Owner</h3>
            <p>Hospitals, schools, NGOs and municipalities submit real problems and pick the best solution.</p>
          </div>

          <div className="role-card">
            <div className="who">SOLVER</div>
            <h3>University</h3>
            <p>Discovers eligible problems, builds teams, and delivers proposals through to deployment.</p>
          </div>
        </div>
      </div>

      {/* Statistics Row */}
      <section style={{ padding: '2rem 0', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="grid grid-cols-4">
            <StatCard title="Problems Received" value={stats.challengesPosted || 128} subtitle="Active & Tracked" icon={FileText} color="blue" />
            <StatCard title="Awaiting Review" value={34} subtitle="In Evaluation" icon={Activity} color="amber" />
            <StatCard title="Universities Active" value={stats.universityTeams || 19} subtitle="Partner Institutions" icon={GraduationCap} color="purple" />
            <StatCard title="Active Disasters" value={stats.activeDisasters || 6} subtitle="Command Monitored" icon={Shield} color="red" />
          </div>
        </div>
      </section>

      {/* Capability Overview */}
      <section id="how-it-works" style={{ padding: '4rem 0', backgroundColor: 'var(--bg-main)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3rem auto' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>Core System Architecture</span>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '0.75rem', color: 'var(--navy)' }}>Unified Coordination Platform</h2>
            <p style={{ color: 'var(--text-mute)' }}>
              Connecting government authorities, problem submitters, and university solvers in a single workflow.
            </p>
          </div>

          <div className="grid grid-cols-2">
            {/* Capability A Card */}
            <div className="card" style={{ padding: '1.75rem', borderTop: '4px solid var(--blue)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--blue-soft)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} />
                </div>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--navy)' }}>Societal Problem Workflow</h3>
              </div>
              <p style={{ color: 'var(--text-mute)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                Problems submitted by healthcare providers, schools, and local authorities are automatically assigned to responsible government departments and published to eligible university portals.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--green)" /> AI Classification & Responsibility Routing</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--green)" /> University Acceptance & Student Team Formation</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--green)" /> Multi-Proposal Comparison & Government Approval</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--green)" /> Field Deployment & Outcome Monitoring</li>
              </ul>
            </div>

            {/* Capability B Card */}
            <div className="card" style={{ padding: '1.75rem', borderTop: '4px solid var(--navy)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--blue-soft)', color: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={20} />
                </div>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--navy)' }}>Disaster Response Command</h3>
              </div>
              <p style={{ color: 'var(--text-mute)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                Centralized emergency hazard exposure analysis, AI-scored relocation recommendations, hospital pressure tracking, and rapid student responder dispatch.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--green)" /> Interactive Geospatial Hazard & Exposure Mapping</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--green)" /> AI Relocation Site Safety Evaluation</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--green)" /> Real-Time Hospital Capacity & Patient Inflow</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--green)" /> University-Integrated Emergency Dispatch</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Disaster Command Section Preview */}
      <section id="disaster-response" style={{ padding: '4rem 0', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <span className="badge badge-danger" style={{ marginBottom: '0.5rem' }}>Live Coordination</span>
              <h2 style={{ fontSize: '2rem', color: 'var(--navy)' }}>Active Emergency Command Monitor</h2>
            </div>
            <Link to="/login" className="btn primary btn-sm">
              Open Command Center <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-3">
            {disasters.slice(0, 3).map((d) => (
              <div key={d.id} className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--red)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-danger">{d.type}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-mute)', fontWeight: 600 }}>{d.status}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: 'var(--navy)' }}>{d.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-mute)', marginBottom: '1rem' }}>
                  {d.location} • {d.affected_population?.toLocaleString()} Affected
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text)', backgroundColor: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: '6px' }}>
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
      <footer style={{ backgroundColor: 'var(--navy)', color: '#E7D9CC', padding: '3rem 0', marginTop: 'auto' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#ffffff' }}>
              SolveLink AI
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: '#BFDFCC' }}>
              Real Problems. Academic Solutions. Lasting Impact.
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#BFDFCC' }}>
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
