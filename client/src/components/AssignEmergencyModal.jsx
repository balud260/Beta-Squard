import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShieldAlert, CheckCircle, Sparkles, RefreshCw, X, Users, AlertCircle, Send, Check } from 'lucide-react';

export default function AssignEmergencyModal({ isOpen, onClose, incident, onAssignmentComplete }) {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);
  
  const [categoriesData, setCategoriesData] = useState([]);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  
  const [selectedCategories, setSelectedCategories] = useState(['Medical Support', 'Evacuation Support', 'Technical Support']);
  const [targetCounts, setTargetCounts] = useState({
    'Medical Support': 8,
    'Evacuation Support': 15,
    'Technical Support': 5,
    'Relief Distribution': 12,
    'Search & Rescue': 6,
    'GIS / Mapping': 4,
    'Data Collection': 5,
    'Logistics': 6
  });

  useEffect(() => {
    if (isOpen && incident) {
      fetchEligibleStudents();
    }
  }, [isOpen, incident]);

  async function fetchEligibleStudents() {
    setFetchingData(true);
    setErrorMsg('');
    setSuccessResult(null);

    try {
      const incidentId = incident.id || 1;
      const res = await api.getEligibleStudents(incidentId);
      setCategoriesData(res.categories || []);
      setAiRecommendation(res.aiRecommendation || null);

      if (res.aiRecommendation && res.aiRecommendation.recommendedCounts) {
        setTargetCounts(prev => ({
          ...prev,
          ...res.aiRecommendation.recommendedCounts
        }));
      }
    } catch (err) {
      console.error('Error fetching eligible students:', err);
      // Fallback data if API error
      setCategoriesData([
        { category: 'Medical Support', eligibleCount: 12, description: 'First aid, triage, emergency care' },
        { category: 'Evacuation Support', eligibleCount: 24, description: 'Shelter setup, evacuation guiding' },
        { category: 'Technical Support', eligibleCount: 8, description: 'Communications & device power' },
        { category: 'Relief Distribution', eligibleCount: 18, description: 'Food & water distribution' }
      ]);
    } finally {
      setFetchingData(false);
    }
  }

  const handleCategoryToggle = (categoryName) => {
    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categoryName));
    } else {
      setSelectedCategories([...selectedCategories, categoryName]);
    }
  };

  const handleCountChange = (catName, count) => {
    const parsed = parseInt(count, 10);
    setTargetCounts(prev => ({
      ...prev,
      [catName]: isNaN(parsed) ? 1 : Math.max(1, parsed)
    }));
  };

  async function handleNotifyStudents() {
    if (selectedCategories.length === 0) {
      setErrorMsg('Please select at least one response category.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const incidentId = incident.id || 1;
      const res = await api.notifyEmergencyStudents(incidentId, {
        categories: selectedCategories,
        target_counts: targetCounts
      });

      setSuccessResult(res);
      if (onAssignmentComplete) {
        onAssignmentComplete(res);
      }
    } catch (err) {
      console.error('Error notifying students:', err);
      setErrorMsg(err.message || 'Unable to send emergency notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', padding: '24px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
          <div>
            <div className="badge badge-danger" style={{ marginBottom: '0.2rem', fontSize: '0.7rem' }}>
              <ShieldAlert size={12} /> CRITICAL DISASTER RESPONSE
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--navy)' }}>Assign Emergency Response</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Incident Summary Card */}
        <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
            🚨 {incident?.title || 'Major Flood Incident - District X'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div>Severity: <strong style={{ color: 'var(--status-danger)' }}>{incident?.severity || 'Critical'}</strong></div>
            <div>Location: <strong>{incident?.location || 'District X'}</strong></div>
            <div>Distance: <strong>{incident?.distance_km || 3.2} km</strong></div>
            <div>Issued By: <strong>Government Command</strong></div>
          </div>
        </div>

        {/* Success State */}
        {successResult ? (
          <div style={{ backgroundColor: 'var(--status-success-bg)', border: '1px solid var(--status-success)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--status-success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <CheckCircle size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--navy)', marginBottom: '0.4rem' }}>
              {successResult.message || 'Emergency response request sent.'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginBottom: '1rem' }}>
              {successResult.details || 'Students have been notified via the University Integrated App.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {Object.entries(successResult.notified_counts || {}).map(([cat, cnt]) => (
                <div key={cat} style={{ fontWeight: 600, color: 'var(--navy)' }}>
                  ✓ {cnt} {cat.toLowerCase()} volunteers notified
                </div>
              ))}
            </div>
            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
              Done &amp; Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            {/* AI Recommendation Banner */}
            {aiRecommendation && (
              <div style={{ backgroundColor: '#FDF3EA', border: '1px solid #F6D9B8', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--terracotta)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                  <Sparkles size={15} /> AI Recommended Response Allocation
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-medium)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  {aiRecommendation.reasoning}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <span className="badge badge-primary">Medical: 8 students</span>
                  <span className="badge badge-primary">Evacuation: 15 volunteers</span>
                  <span className="badge badge-primary">Technical: 5 students</span>
                </div>
              </div>
            )}

            {/* Response Categories Selection */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy)', marginBottom: '0.5rem', display: 'block' }}>
                Select Emergency Response Teams &amp; Target Volunteer Count
              </label>

              {fetchingData ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <RefreshCw size={18} className="spin" /> Loading eligible student rosters...
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', maxHeight: '260px', overflowY: 'auto', paddingRight: '4px' }}>
                  {(categoriesData.length > 0 ? categoriesData : [
                    { category: 'Medical Support', eligibleCount: 12, description: 'First aid, triage care' },
                    { category: 'Evacuation Support', eligibleCount: 24, description: 'Shelter setup & guidance' },
                    { category: 'Relief Distribution', eligibleCount: 18, description: 'Food & supplies logistics' },
                    { category: 'Search & Rescue', eligibleCount: 6, description: 'Field search operations' },
                    { category: 'Technical Support', eligibleCount: 8, description: 'IT, power & comms backup' },
                    { category: 'GIS / Mapping', eligibleCount: 5, description: 'Geospatial hazard mapping' },
                    { category: 'Data Collection', eligibleCount: 7, description: 'Shelter census & survey' },
                    { category: 'Logistics', eligibleCount: 8, description: 'Supply chain management' }
                  ]).map((cat) => {
                    const isSelected = selectedCategories.includes(cat.category);
                    return (
                      <div
                        key={cat.category}
                        style={{
                          border: isSelected ? '2px solid var(--terracotta)' : '1px solid var(--border-light)',
                          backgroundColor: isSelected ? 'var(--terracotta-soft)' : 'var(--bg-card)',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => handleCategoryToggle(cat.category)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem', color: isSelected ? 'var(--terracotta)' : 'var(--text-dark)' }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by div click
                              style={{ accentColor: 'var(--terracotta)', cursor: 'pointer' }}
                            />
                            {cat.category}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {cat.eligibleCount || 12} eligible
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: isSelected ? '8px' : '0' }}>
                          {cat.description || 'Emergency support duty'}
                        </div>

                        {isSelected && (
                          <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-light)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--navy)' }}>Students Needed:</span>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={targetCounts[cat.category] || 8}
                              onChange={(e) => handleCountChange(cat.category, e.target.value)}
                              style={{ width: '60px', padding: '3px 6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div style={{ backgroundColor: 'var(--status-danger-bg)', color: 'var(--status-danger)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} /> {errorMsg}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
                Cancel
              </button>
              <button
                onClick={handleNotifyStudents}
                className="btn btn-primary"
                disabled={loading || fetchingData}
                style={{ minWidth: '220px' }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spin" /> Assigning Response Teams...
                  </>
                ) : (
                  <>
                    <Send size={15} /> Notify Selected Students ({selectedCategories.length} Teams)
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
