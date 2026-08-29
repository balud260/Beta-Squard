import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, GraduationCap, ShieldAlert, Award, Send, CheckCircle2, AlertTriangle, BookOpen, Clock, FileText, Check, Plus } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState(null);
  const [missions, setMissions] = useState([]);
  const [availableProblems, setAvailableProblems] = useState([]);
  const [mySolutions, setMySolutions] = useState([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [showIdeaModal, setShowIdeaModal] = useState(false);
  const [message, setMessage] = useState('');

  // Idea Form State
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [ideaTech, setIdeaTech] = useState('React Native, Node.js, LoRaWAN');
  const [ideaApproach, setIdeaApproach] = useState('');
  const [ideaTimeline, setIdeaTimeline] = useState('3 Months');

  useEffect(() => {
    loadStudentData();
  }, [user]);

  async function loadStudentData() {
    try {
      const pRes = await api.getStudentProfile().catch(() => ({ student: null, missions: [] }));
      setProfile(pRes.student);
      setMissions(pRes.missions || []);

      const probRes = await api.getPublicProblems().catch(() => ({ problems: [] }));
      setAvailableProblems(probRes.problems || []);

      const solRes = await api.getMyStudentSolutions().catch(() => ({ solutions: [] }));
      setMySolutions(solRes.solutions || []);

      const reqRes = await api.getVolunteerRequirements().catch(() => ({ requirements: [] }));
      setEmergencyAlerts(reqRes.requirements || []);
    } catch (err) {
      console.error('Error loading student dashboard data:', err);
    }
  }

  async function handleMissionResponse(requirementId, status) {
    try {
      const res = await api.respondVolunteerMission({ requirement_id: requirementId, status });
      setMessage(res.message);
      loadStudentData();
    } catch (err) {
      setMessage('Failed to register response.');
    }
  }

  async function handleIdeaSubmit(e) {
    e.preventDefault();
    if (!selectedProblem) return;

    try {
      const res = await api.submitStudentSolution({
        problem_id: selectedProblem.id,
        title: ideaTitle,
        description: ideaDesc,
        technology: ideaTech,
        approach: ideaApproach,
        estimated_timeline: ideaTimeline
      });
      setMessage(res.message || 'Solution idea submitted to your university!');
      setShowIdeaModal(false);
      loadStudentData();
    } catch (err) {
      setMessage('Failed to submit solution idea.');
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main className="container" style={{ padding: '1.5rem 1rem', flex: 1 }}>

        {/* Student Authority Header */}
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <span className="badge badge-primary" style={{ gap: '0.3rem', fontSize: '0.65rem' }}>
                <GraduationCap size={12} /> UNIVERSITY-INTEGRATED RESPONDER
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', color: 'var(--text-dark)' }}>
              {profile?.student_name || user?.name || 'Aarav Mehta'}
            </h1>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              University: <strong>{profile?.university_name || 'National Institute of Technology (NIT) District X'}</strong> • Dept: <strong>{profile?.department_name || 'Computer Science & AI'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {profile?.nss_member === 1 && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>NSS Member</span>}
            {profile?.ncc_member === 1 && <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>NCC Cadet</span>}
          </div>
        </div>

        {message && (
          <div style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.85rem' }}>
            {message}
          </div>
        )}

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.4rem', overflowX: 'auto' }}>
          <button
            onClick={() => setActiveTab('home')}
            className={`btn ${activeTab === 'home' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('problems')}
            className={`btn ${activeTab === 'problems' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            Available Problems ({availableProblems.length})
          </button>
          <button
            onClick={() => setActiveTab('solutions')}
            className={`btn ${activeTab === 'solutions' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            My Solutions ({mySolutions.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`btn ${activeTab === 'alerts' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', gap: '0.3rem' }}
          >
            <ShieldAlert size={13} color="var(--status-danger)" /> Emergency Alerts ({emergencyAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('missions')}
            className={`btn ${activeTab === 'missions' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
          >
            My Missions ({missions.length})
          </button>
        </div>

        {/* TAB 1: Overview */}
        {activeTab === 'home' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.65rem', color: 'var(--text-dark)' }}>Student Status Summary</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-medium)', lineHeight: 1.6 }}>
                <div><strong>University Authority:</strong> National Institute of Technology (NIT) District X</div>
                <div><strong>Department:</strong> Computer Science & AI</div>
                <div><strong>Availability:</strong> <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>AVAILABLE FOR MISSIONS</span></div>
                <div style={{ marginTop: '0.4rem' }}>
                  <strong>Verified Skills:</strong> GIS Mapping, First Aid, Medical Support, Drone Operation, React, Node.js
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.65rem', color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldAlert size={16} /> Active Emergency Alert
              </h3>
              {emergencyAlerts.length > 0 ? (
                <div style={{ backgroundColor: 'var(--status-danger-bg)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca' }}>
                  <div style={{ fontWeight: 700, color: 'var(--status-danger)', fontSize: '0.85rem' }}>
                    {emergencyAlerts[0].disaster_title || 'Major Flood Incident - District X'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', marginTop: '0.2rem' }}>
                    Role Required: <strong>{emergencyAlerts[0].role_type}</strong> • Urgency: <strong>{emergencyAlerts[0].urgency}</strong>
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => handleMissionResponse(emergencyAlerts[0].id, 'CONFIRMED')} className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem' }}>
                      I'm Available
                    </button>
                    <button onClick={() => handleMissionResponse(emergencyAlerts[0].id, 'DECLINED')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                      Can't Participate
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No active emergency alerts at this moment.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Available Problems */}
        {activeTab === 'problems' && (
          <div>
            <div style={{ marginBottom: '0.85rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-dark)' }}>Available University Problems</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Societal challenges submitted to your university. Submit your solution ideas to be reviewed by university faculty.
              </p>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              {availableProblems.map((p) => (
                <div key={p.id} className="card" style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{p.category}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {p.organization_name || p.client_name || 'Organization'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem', color: 'var(--text-dark)' }}>{p.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem', lineHeight: 1.45 }}>
                      {p.description}
                    </p>
                  </div>

                  <button
                    onClick={() => { setSelectedProblem(p); setShowIdeaModal(true); }}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', gap: '0.3rem', fontSize: '0.75rem' }}
                  >
                    <Send size={14} /> Submit Solution Idea to University
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: My Solutions */}
        {activeTab === 'solutions' && (
          <div>
            <div style={{ marginBottom: '0.85rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-dark)' }}>My Solution Ideas Submitted to University</h2>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              {mySolutions.map((sol) => (
                <div key={sol.id} className="card" style={{ padding: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{sol.status}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{sol.created_at?.slice(0, 10)}</span>
                  </div>

                  <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-dark)' }}>{sol.title}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Problem: <strong>{sol.problem_title}</strong>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                    {sol.description}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
                    Tech Stack: {sol.technology}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Emergency Alerts */}
        {activeTab === 'alerts' && (
          <div>
            <div style={{ marginBottom: '0.85rem' }}>
              <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--status-danger)' }}>
                <ShieldAlert size={20} /> Emergency Response Requests
              </h2>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              {emergencyAlerts.map((req) => (
                <div key={req.id} className="card" style={{ padding: '1.15rem', borderLeft: '4px solid var(--status-danger)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>URGENT MISSION</span>
                    <span className="badge badge-primary" style={{ fontSize: '0.65rem', backgroundColor: '#f3e8ff', color: 'var(--accent-purple)', borderColor: '#e9d5ff' }}>
                      University Assigned / Government Authorized
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-dark)' }}>{req.disaster_title || 'Major Flood Incident'}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Role Required: <strong>{req.role_type}</strong> • Location: District X Relief Base
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleMissionResponse(req.id, 'CONFIRMED')} className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: '0.75rem' }}>
                      I'm Available
                    </button>
                    <button onClick={() => handleMissionResponse(req.id, 'DECLINED')} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.75rem' }}>
                      Can't Participate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: My Missions */}
        {activeTab === 'missions' && (
          <div>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              {missions.map((m) => (
                <div key={m.id} className="card" style={{ padding: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>{m.status}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.responded_at?.slice(0, 10)}</span>
                  </div>

                  <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-dark)' }}>{m.disaster_title}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Assigned Role: <strong>{m.role_type}</strong> • Location: {m.location}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Idea Modal */}
        {showIdeaModal && selectedProblem && (
          <div className="modal-overlay" onClick={() => setShowIdeaModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>Submit Solution Idea to University</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Problem: <strong>{selectedProblem.title}</strong>
              </p>

              <form onSubmit={handleIdeaSubmit}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Solution Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ultrasonic Bin Mesh Prototype"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe your technical idea and methodology..."
                    value={ideaDesc}
                    onChange={(e) => setIdeaDesc(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowIdeaModal(false)} className="btn btn-secondary btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Submit Solution Idea</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
