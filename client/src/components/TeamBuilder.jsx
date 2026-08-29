import React, { useState } from 'react';
import { Users, AlertTriangle, CheckCircle2, UserPlus } from 'lucide-react';

export default function TeamBuilder({ universityName = 'NIT District X' }) {
  const [assignedMembers, setAssignedMembers] = useState([
    { name: 'Prof. Arvind Kulkarni', role: 'Faculty Mentor', department: 'Computer Science & AI', skill: 'Project Lead' },
    { name: 'Aarav Mehta', role: 'Student Developer', department: 'Computer Science', skill: 'React & Node.js' },
    { name: 'Sneha Patel', role: 'Hardware Specialist', department: 'Electrical & IoT', skill: 'IoT Sensors' }
  ]);

  const requiredRoles = ['Faculty Mentor', 'Frontend / Mobile', 'Backend API', 'IoT Hardware', 'GIS Mapping'];

  const candidatePool = [
    { name: 'Rohan Sharma', role: 'GIS Specialist', department: 'Geoinformatics', skill: 'GIS Mapping & Drones' },
    { name: 'Ananya Verma', role: 'AI/ML Student', department: 'Computer Science', skill: 'TensorFlow & Predictive Algorithms' }
  ];

  const coveredSkills = assignedMembers.map(m => m.skill);
  const isGisCovered = coveredSkills.some(s => s.toLowerCase().includes('gis'));

  const handleAddCandidate = (candidate) => {
    setAssignedMembers([...assignedMembers, { ...candidate, role: 'Team Member' }]);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem' }}>University Team Builder & Skill Gap Analysis</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Institution: <strong>{universityName}</strong>
          </p>
        </div>
        <div className="badge badge-primary">
          {assignedMembers.length} / 5 Capabilities Covered
        </div>
      </div>

      {/* Gap Alert if GIS missing */}
      {!isGisCovered ? (
        <div style={{
          backgroundColor: 'var(--status-warning-bg)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertTriangle color="var(--status-warning)" size={20} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#b45309' }}>Missing Capability: GIS Mapping</div>
            <div style={{ fontSize: '0.825rem', color: '#92400e' }}>
              The project requires spatial mapping. Recommend assigning a Geoinformatics student from candidate pool below.
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'var(--status-success-bg)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          color: 'var(--status-success)',
          fontWeight: 600,
          fontSize: '0.875rem'
        }}>
          <CheckCircle2 size={18} /> All required technical capabilities covered by university team!
        </div>
      )}

      {/* Active Team Grid */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--text-medium)', marginBottom: '0.75rem' }}>Assigned Team Members</h4>
        <div className="grid grid-cols-3">
          {assignedMembers.map((m, idx) => (
            <div key={idx} style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              backgroundColor: 'var(--bg-main)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--primary-blue)', fontWeight: 600 }}>{m.role}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Dept: {m.department}</div>
              <span className="badge badge-primary" style={{ marginTop: '0.5rem', fontSize: '0.65rem' }}>
                {m.skill}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Candidates */}
      {!isGisCovered && candidatePool.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-medium)', marginBottom: '0.75rem' }}>Recommended Available Candidates (From University Database)</h4>
          <div className="grid grid-cols-2">
            {candidatePool.map((c, idx) => (
              <div key={idx} style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--primary-blue)',
                backgroundColor: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.department}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: 600 }}>Skill: {c.skill}</div>
                </div>
                <button
                  onClick={() => handleAddCandidate(c)}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.2rem' }}
                >
                  <UserPlus size={14} /> Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
