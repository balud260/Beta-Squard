import React, { useState } from 'react';
import { X, Send, Sparkles, AlertCircle, Building2 } from 'lucide-react';
import { api } from '../services/api';

export default function SubmitChallengeModal({ onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('HEALTHCARE');
  const [subcategory, setSubcategory] = useState('Clinic Operations & Diagnostics');
  const [location, setLocation] = useState('Rural District X');
  const [urgency, setUrgency] = useState('HIGH');
  const [expectedOutcome, setExpectedOutcome] = useState('Reduce patient waiting times by 40% using AI scheduling and triaging.');
  const [targetUsers, setTargetUsers] = useState('Rural Outpatient Clinic Visitors');
  const [requiredSkills, setRequiredSkills] = useState('AI, Data Analysis, Healthcare Systems, Web App');
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedStatus, setSubmittedStatus] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Strict Validations
    if (!title || title.trim().length < 5) {
      setError('Challenge Title must be at least 5 characters long.');
      return;
    }
    if (!description || description.trim().length < 15) {
      setError('Problem Description must be at least 15 characters long.');
      return;
    }
    if (!category) {
      setError('Please select a Category.');
      return;
    }
    if (!location) {
      setError('Please specify the Location.');
      return;
    }

    setLoading(true);
    setSubmittedStatus('Submitting & Running Automated Gemini AI Analysis...');

    try {
      const res = await api.createProblem({
        title: title.trim(),
        description: description.trim(),
        category,
        subcategory,
        location: location.trim(),
        urgency,
        expected_outcome: expectedOutcome,
        target_users: targetUsers,
        required_skills: requiredSkills,
        additional_requirements: additionalRequirements
      });

      setSubmittedStatus('Published to University Portal!');
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to submit challenge.');
      setSubmittedStatus('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-xl)',
        border: '1px solid var(--border-light)'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-main)'
        }}>
          <div>
            <div className="badge badge-primary" style={{ gap: '0.3rem', marginBottom: '0.2rem' }}>
              <Building2 size={13} /> PROBLEM OWNER PORTAL
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-navy)' }}>Submit New Societal Challenge</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>

          {error && (
            <div style={{ backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {submittedStatus && (
            <div style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} /> {submittedStatus}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Challenge Title <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Reduce Patient Waiting Time in Rural Clinics"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Category <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
              >
                <option value="HEALTHCARE">Healthcare & Hospitals</option>
                <option value="DISASTER_MANAGEMENT">Disaster Management & Relief</option>
                <option value="EDUCATION">Education & Schools</option>
                <option value="COMMUNITY_DEVELOPMENT">Community & Urban Infrastructure</option>
                <option value="AGRICULTURE">Agriculture & Water Security</option>
                <option value="CLEAN_ENERGY">Clean Energy & Environment</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Urgency Level</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
              >
                <option value="CRITICAL">Critical (Immediate Response Required)</option>
                <option value="HIGH">High (Within 1 Month)</option>
                <option value="MEDIUM">Medium (Within 3 Months)</option>
                <option value="LOW">Low (Exploratory Research)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Sub-category</label>
              <input
                type="text"
                placeholder="e.g., Clinic Operations"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Location / Region <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., District X Rural Centers"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Problem Description <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe the societal problem, core bottlenecks, and current impact..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Expected Outcome</label>
              <input
                type="text"
                placeholder="e.g., Reduce waiting times by 40%"
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Affected Users</label>
              <input
                type="text"
                placeholder="e.g., Rural Outpatient Visitors"
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem' }}>Required Skills / Disciplines</label>
              <input
                type="text"
                placeholder="e.g., AI, Data Analysis, Healthcare Systems, Web App"
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ gap: '0.4rem' }}>
              <Send size={16} /> {loading ? 'Submitting & Analyzing...' : 'Submit & Publish Challenge'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
