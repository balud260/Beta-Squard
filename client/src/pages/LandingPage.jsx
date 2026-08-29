import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import ImpactChart from '../components/ImpactChart';
import SimulatedUnivApp from '../components/SimulatedUnivApp';
import { api } from '../services/api';
import { Shield, GraduationCap, Building2, Activity, Sparkles, ArrowRight, CheckCircle2, Users, AlertTriangle, Layers, FileText, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  const [stats, setStats] = useState({
    challengesPosted: 14,
    universityTeams: 5,
    solutionsDelivered: 8,
    peopleImpacted: '50,000+'
  });
  const [disasters, setDisasters] = useState([]);
  const [problems, setProblems] = useState([]);
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

      const probRes = await api.getProblems().catch(() => ({ problems: [] }));
      setProblems(probRes.problems || []);
    } catch (e) {
      console.warn('Landing page data fetch fallback');
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onOpenSimulatedApp={() => setIsSimulatedAppOpen(true)} />

      {/* Hero Section */}
      <section style={{
        padding: '5rem 0 4rem 0',
        background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
        borderBottom: '1px solid var(--border-light)',
        position: 'relative'
      }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '3rem', alignItems: 'center' }}>
          <div>
            <div className="badge badge-primary" style={{ marginBottom: '1.25rem' }}>
              <Sparkles size={14} /> Unified Academic & Emergency Infrastructure
            </div>
            <h1 style={{ fontSize: '3.2rem', fontWeight: 800, color: 'var(--text-dark)', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
              Real Problems.<br />
              <span style={{ color: 'var(--primary-blue)' }}>Academic Solutions.</span><br />
              Lasting Impact.
            </h1>
            <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
              SolveLink AI connects governments, communities, hospitals, and organizations with universities, trained volunteers, researchers, and industry experts to solve real-world challenges and coordinate rapid disaster response.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}>
                Submit a Challenge <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="btn btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1.05rem' }}>
                Explore Capabilities
              </a>
            </div>
          </div>

          {/* Hero Visual Composition Card */}
          <div className="card" style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
            border: '1px solid rgba(37,99,235,0.2)',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield color="var(--primary-blue)" size={20} /> Active Emergency Incident
              </div>
              <span className="badge badge-danger">CRITICAL FLOOD</span>
            </div>

            <div style={{
              backgroundColor: '#fff',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '1rem',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Major Flood Incident - District X</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0.6rem 0' }}>
                Riverside Basin Sector 3-7 • 45,000 People at Risk
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem' }}>
                <span className="badge badge-primary">AI Relocation Evaluated</span>
                <span className="badge badge-success">Hospital Capacity Tracked</span>
              </div>
            </div>

            {/* University Match Preview */}
            <div style={{
              backgroundColor: '#fff',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                <span>NIT District X (94% AI Match)</span>
                <span style={{ color: 'var(--status-success)' }}>250 Volunteers Ready</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Matched Skills: Medical Support, First Aid, GIS Drones, Water Tech
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section style={{ padding: '3rem 0', backgroundColor: '#fff', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <div className="grid grid-cols-4">
            <StatCard title="Challenges Posted" value={stats.challengesPosted || 14} subtitle="Active & Deployed" icon={FileText} color="blue" />
            <StatCard title="University Network" value={stats.universityTeams || 5} subtitle="Partner Institutions" icon={GraduationCap} color="purple" />
            <StatCard title="Solutions Delivered" value={stats.solutionsDelivered || 8} subtitle="Field Pilots Executed" icon={CheckCircle2} color="green" />
            <StatCard title="People Impacted" value={stats.peopleImpacted || '50,000+'} subtitle="Citizens Served" icon={Users} color="amber" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '5rem 0', backgroundColor: 'var(--bg-main)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 3.5rem auto' }}>
            <div className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>Dual Connected Capabilities</div>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>One Platform. Two Core Workflows.</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              SolveLink AI bridges societal innovation collaboration and real-time disaster decision support into one unified command layer.
            </p>
          </div>

          <div className="grid grid-cols-2">
            {/* Capability A Card */}
            <div className="card" style={{ borderTop: '4px solid var(--primary-blue)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} />
                </div>
                <h3 style={{ fontSize: '1.3rem' }}>Capability A: Societal Innovation</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                Connect municipal & community problems directly with university research labs, faculty mentors, and student teams.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> AI Problem Taxonomy & Skill Identification</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> University Matching & Multi-Proposal Comparison</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> Team Building, Prototyping & Feedback Iterations</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> Field Deployment & Before/After Impact Metrics</li>
              </ul>
            </div>

            {/* Capability B Card */}
            <div className="card" style={{ borderTop: '4px solid var(--accent-cyan)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={20} />
                </div>
                <h3 style={{ fontSize: '1.3rem' }}>Capability B: Disaster Response</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
                Real-time incident management, hazard mapping, AI relocation scoring, hospital capacity routing, and volunteer dispatch.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> Interactive Leaflet Geospatial Hazard Command</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> AI Safety-Scored Relocation Site Recommendations</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> Hospital Bed Inflow & Capacity Monitoring</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={16} color="var(--status-success)" /> Role-Specific Emergency Alerts & Live Shortage Deductions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Disaster Command Section Preview */}
      <section id="disaster-response" style={{ padding: '5rem 0', backgroundColor: '#fff', borderTop: '1px solid var(--border-light)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <div className="badge badge-danger" style={{ marginBottom: '0.5rem' }}>Live Incident Monitor</div>
              <h2 style={{ fontSize: '2rem' }}>Disaster Decision Support Command</h2>
            </div>
            <Link to="/login" className="btn btn-primary btn-sm">
              Open Command Center <ArrowRight size={14} />
            </Link>
          </div>

          {/* Active Disaster Cards */}
          <div className="grid grid-cols-3">
            {disasters.slice(0, 3).map((d) => (
              <div key={d.id} className="card" style={{ borderLeft: '4px solid var(--status-danger)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-danger">{d.type}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{d.status}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{d.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  {d.location} • {d.affected_population?.toLocaleString()} Affected
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-medium)', backgroundColor: 'var(--bg-main)', padding: '0.65rem', borderRadius: '6px' }}>
                  {d.hazard_info}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact & Outcome Measurement */}
      <section id="impact" style={{ padding: '5rem 0', backgroundColor: 'var(--bg-main)' }}>
        <div className="container">
          <ImpactChart />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#0f172a', color: '#94a3b8', padding: '3rem 0', marginTop: 'auto' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: '#fff' }}>
              SolveLink <span style={{ color: '#38bdf8' }}>AI</span>
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
              Real Problems. Academic Solutions. Lasting Impact.
            </div>
          </div>
          <div style={{ fontSize: '0.85rem' }}>
            Built for Hackathon Demonstration • Fully Connected Architecture
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
