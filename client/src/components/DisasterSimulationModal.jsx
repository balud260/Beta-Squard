import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, Radio, MapPin,
  Activity, Flame, FileText, Zap, XCircle, Droplets, Wind, Factory, Check,
  ArrowRight, Clock, Building2, ChevronRight, AlertCircle, Eye
} from 'lucide-react';
import { api } from '../services/api';
import DisasterMap from './DisasterMap';

export default function DisasterSimulationModal({ isOpen, onClose, onExerciseStarted, onResetComplete, onViewReport, onReviewAlert }) {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioKey, setSelectedScenarioKey] = useState('vijayawada_flood');
  const [mode, setMode] = useState('FAST'); // 'FAST' | 'MANUAL'
  const [customConfig, setCustomConfig] = useState({
    title: 'Vijayawada Regional Flood Emergency',
    type: 'Flood',
    severity: 'CRITICAL',
    location: 'Vijayawada-Krishna Basin Region',
    latitude: 16.5062,
    longitude: 80.6480,
    affected_radius_km: 120
  });

  const [activeSimulationId, setActiveSimulationId] = useState(null);
  const [simulationStatus, setSimulationStatus] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadScenarios();
    } else {
      stopPolling();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeSimulationId) {
      startPolling(activeSimulationId);
    } else {
      stopPolling();
    }
  }, [activeSimulationId]);

  function startPolling(id) {
    stopPolling();
    fetchStatus(id);
    pollIntervalRef.current = setInterval(() => {
      fetchStatus(id);
    }, 2000);
  }

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }

  async function loadScenarios() {
    try {
      const res = await api.getSimulationScenarios();
      const list = res.scenarios || [];
      setScenarios(list);
      if (list.length > 0) {
        const defaultSc = list.find(s => s.key === 'vijayawada_flood') || list[0];
        handleSelectScenario(defaultSc);
      }
    } catch (err) {
      console.error('Failed to load simulation scenarios:', err);
    }
  }

  async function fetchStatus(id) {
    try {
      const res = await api.getSimulationStatus(id);
      setSimulationStatus(res);
    } catch (err) {
      console.error('Fetch simulation status error:', err);
    }
  }

  const handleSelectScenario = (sc) => {
    setSelectedScenarioKey(sc.key);
    setCustomConfig({
      title: sc.title,
      type: sc.type,
      severity: sc.severity,
      location: sc.location,
      latitude: sc.latitude,
      longitude: sc.longitude,
      affected_radius_km: sc.affected_radius_km
    });
  };

  async function handleStartSimulation() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.startSimulation({
        scenarioKey: selectedScenarioKey,
        mode,
        customConfig
      });
      setActiveSimulationId(res.simulationId);
      setIsRunning(true);
      setLoading(false);
      if (onExerciseStarted) onExerciseStarted(res);
    } catch (err) {
      setError(err.message || 'Failed to start simulation exercise.');
      setLoading(false);
    }
  }

  async function handleEscalate() {
    if (!activeSimulationId) return;
    try {
      await api.escalateSimulation(activeSimulationId, { severity: 'CRITICAL' });
      fetchStatus(activeSimulationId);
    } catch (err) {
      setError(err.message || 'Failed to escalate simulation.');
    }
  }

  async function handleReset() {
    if (!activeSimulationId) return;
    if (window.confirm('Reset this simulation exercise? This will purge all simulation records while keeping standard data safe.')) {
      try {
        await api.resetSimulation(activeSimulationId);
        stopPolling();
        setActiveSimulationId(null);
        setSimulationStatus(null);
        setIsRunning(false);
        if (onResetComplete) onResetComplete();
      } catch (err) {
        setError(err.message || 'Failed to reset simulation.');
      }
    }
  }

  if (!isOpen) return null;

  const currentAlert = simulationStatus?.alert;
  const currentDisaster = simulationStatus?.disaster;
  const riskSummary = simulationStatus?.riskSummary || {};
  const timeline = simulationStatus?.timeline || [];
  const universityRisks = simulationStatus?.universityRisks || [];

  const selectedScenarioObj = scenarios.find(s => s.key === selectedScenarioKey) || {
    title: customConfig.title,
    type: customConfig.type,
    severity: customConfig.severity,
    location: customConfig.location,
    affected_radius_km: customConfig.affected_radius_km,
    description: 'Predefined disaster emergency exercise for testing government-university coordination.'
  };

  const getScenarioIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('flood')) return <Droplets size={20} color="var(--status-info)" />;
    if (t.includes('cyclone') || t.includes('wind')) return <Wind size={20} color="var(--status-warning)" />;
    if (t.includes('industrial') || t.includes('fire')) return <Factory size={20} color="var(--status-danger)" />;
    return <Activity size={20} color="var(--terracotta)" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn" style={{ overflowY: 'auto' }}>
      <div
        className="w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl flex flex-col my-auto"
        style={{
          backgroundColor: 'var(--bg-main)',
          border: '1px solid var(--border-light)',
          maxHeight: '92vh'
        }}
      >
        {/* 1. PAGE HEADER: Command Center Header */}
        <div style={{ backgroundColor: 'var(--navy)', color: '#FFFFFF', padding: '1.25rem 1.5rem', borderBottom: '2px solid var(--terracotta)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                  <Shield size={20} color="#FFFFFF" />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.85)' }}>
                  DISASTER COMMAND CENTER
                </span>
                <span style={{ backgroundColor: 'var(--terracotta)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                  SIMULATION &amp; EXERCISE
                </span>
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
                {activeSimulationId ? `🔴 EXERCISE IN PROGRESS: ${currentAlert?.title || customConfig.title}` : 'Government Emergency Operations Console'}
              </h2>
              <p style={{ fontSize: '0.825rem', color: 'rgba(255,255,255,0.8)', margin: '0.25rem 0 0 0', maxWidth: '750px' }}>
                Run a controlled emergency scenario to demonstrate how SANKALP receives, verifies, calculates risk, and coordinates university disaster response.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ backgroundColor: 'rgba(47, 158, 99, 0.2)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80', display: 'inline-block' }} />
                  SYSTEM READY
                </span>
                <span style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#fde047', border: '1px solid rgba(253, 224, 71, 0.3)', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                  SIMULATION MODE — NOT A LIVE EMERGENCY
                </span>
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', padding: '0.2rem' }}
                  title="Close Console"
                >
                  <XCircle size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. TOP OPERATIONAL STATUS BAR */}
        <div style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-light)', padding: '0.6rem 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>SYSTEM STATUS:</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                ● READY
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ACTIVE EVENTS:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: activeSimulationId ? 'var(--status-danger)' : 'var(--navy)' }}>
                {activeSimulationId ? '1 EXERCISE RUNNING' : '0 (Ready for exercise)'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>UNIVERSITIES:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy)' }}>
                {riskSummary.total || 7} Connected Hubs
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>RESPONSE TEAMS:</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--terracotta)' }}>
                {riskSummary.responseActivated || 0} Active Units
              </span>
            </div>
          </div>
        </div>

        {/* 3. MAIN BODY LAYOUT (Scrollable) */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div style={{ backgroundColor: 'var(--status-danger-bg)', border: '1px solid var(--status-danger)', color: 'var(--status-danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* TWO COLUMN RESPONSIVE GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.25rem' }}>

            {/* LEFT COLUMN: ~65% (8/12 cols desktop) */}
            <div style={{ gridColumn: 'span 12 / span 12', '@media (min-width: 1024px)': { gridColumn: 'span 8 / span 8' } }} className="lg:col-span-8 space-y-4">

              {!activeSimulationId ? (
                /* SCENARIO SELECTION GRID VIEW */
                <div>
                  <div style={{ marginBottom: '0.85rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      CHOOSE EXERCISE SCENARIO
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                      Select a predefined emergency scenario to simulate the complete Government → University response workflow.
                    </p>
                  </div>

                  {/* Compact Scenario Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                    {scenarios.map((sc) => {
                      const isSelected = selectedScenarioKey === sc.key;
                      const isCritical = sc.severity === 'CRITICAL';

                      return (
                        <div
                          key={sc.key}
                          onClick={() => handleSelectScenario(sc)}
                          style={{
                            backgroundColor: isSelected ? 'var(--terracotta-soft)' : 'var(--bg-card)',
                            border: isSelected ? '2px solid var(--terracotta)' : '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: isSelected ? '0 4px 12px rgba(194, 65, 12, 0.15)' : 'var(--shadow-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            justify: 'space-between',
                            position: 'relative'
                          }}
                          className="hover:shadow-md transition-shadow"
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {getScenarioIcon(sc.type)}
                                <span className="badge badge-navy" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
                                  {sc.type}
                                </span>
                              </div>

                              <span className={`badge ${isCritical ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                                {sc.severity}
                              </span>
                            </div>

                            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                              {sc.title}
                            </h4>

                            <p style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {sc.description}
                            </p>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📍 {sc.location}</span>
                            {isSelected && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--terracotta)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Check size={13} /> SELECTED
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ACTIVE SIMULATION OPERATIONAL CONSOLE VIEW */
                <div className="space-y-4">

                  {/* GOVERNMENT ACTION REQUIRED CARD (At confirmation stage) */}
                  {currentAlert && currentAlert.review_status === 'PENDING_REVIEW' && (
                    <div style={{ backgroundColor: 'var(--status-warning-bg)', border: '2px solid var(--status-warning)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                        <div style={{ backgroundColor: 'var(--status-warning)', color: '#fff', padding: '0.5rem', borderRadius: 'var(--radius-sm)', marginTop: '0.1rem' }}>
                          <AlertTriangle size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--status-warning)' }}>
                              GOVERNMENT ACTION REQUIRED
                            </span>
                            <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>OFFICIAL ALERT VALIDATED</span>
                          </div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy)', margin: '0 0 0.3rem 0' }}>
                            {currentAlert.title}
                          </h4>
                          <p style={{ fontSize: '0.825rem', color: 'var(--text-dark)', marginBottom: '0.85rem' }}>
                            An official emergency alert feed from <strong>{currentAlert.source_name}</strong> has been ingested and validated. Government authorization is required to officially declare the disaster and trigger university risk alerts.
                          </p>

                          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => onReviewAlert && onReviewAlert(currentAlert)}
                              className="btn btn-primary btn-sm"
                              style={{ fontWeight: 700, gap: '0.4rem' }}
                            >
                              <Eye size={14} /> Review &amp; Confirm Alert
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DISASTER ACTIVATED & IMPACT ANALYSIS SUMMARY */}
                  {currentDisaster && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ backgroundColor: 'var(--status-success-bg)', color: 'var(--status-success)', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={12} /> DISASTER OFFICIALLY ACTIVATED
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy)' }}>
                            Impact Radius: {currentDisaster.affected_radius_km || 120} km
                          </span>
                        </div>
                      </div>

                      {/* University Risk Breakdown Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div className="card" style={{ padding: '0.85rem', backgroundColor: 'var(--status-danger-bg)', borderColor: 'var(--status-danger)', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--status-danger)', textTransform: 'uppercase' }}>🚨 HIGH RISK</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-danger)', lineHeight: 1.2 }}>{riskSummary.high || 0}</div>
                          <div style={{ fontSize: '0.72rem', color: '#7f1d1d' }}>Universities in zone</div>
                        </div>

                        <div className="card" style={{ padding: '0.85rem', backgroundColor: 'var(--status-warning-bg)', borderColor: 'var(--status-warning)', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--status-warning)', textTransform: 'uppercase' }}>🟠 MEDIUM RISK</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-warning)', lineHeight: 1.2 }}>{riskSummary.medium || 0}</div>
                          <div style={{ fontSize: '0.72rem', color: '#78350f' }}>Advisory status</div>
                        </div>

                        <div className="card" style={{ padding: '0.85rem', backgroundColor: 'var(--status-success-bg)', borderColor: 'var(--status-success)', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--status-success)', textTransform: 'uppercase' }}>🟢 LOW / SAFE</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--status-success)', lineHeight: 1.2 }}>{(riskSummary.low || 0) + (riskSummary.safe || 0)}</div>
                          <div style={{ fontSize: '0.72rem', color: '#14532d' }}>Monitoring status</div>
                        </div>
                      </div>

                      {/* University Response Status Tracking List */}
                      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          UNIVERSITY RESPONSE TRACKING ({universityRisks.length} INSTITUTIONS)
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                          {universityRisks.map((u) => {
                            const isHigh = u.risk_level === 'HIGH';
                            const isMed = u.risk_level === 'MEDIUM';
                            const badgeClass = isHigh ? 'badge-danger' : isMed ? 'badge-warning' : 'badge-success';

                            return (
                              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span className={`badge ${badgeClass}`} style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                                    {u.risk_level}
                                  </span>
                                  <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{u.university_name}</span>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({u.distance_km} km away)</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.72rem' }}>
                                  <span>Acknowledged: <strong>{u.acknowledged ? '✓ YES' : '⏳ PENDING'}</strong></span>
                                  <span style={{ color: u.response_status === 'ACTIVE' ? 'var(--status-success)' : 'var(--text-muted)', fontWeight: 700 }}>
                                    Response: {u.response_status}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Leaflet Disaster Map Component */}
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                          GIS INCIDENT MAP &amp; IMPACT RADIUS
                        </h4>
                        <DisasterMap
                          disaster={currentDisaster}
                          universities={universityRisks.map(r => ({ ...r, name: r.university_name }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* REAL-TIME SIMULATION AUDIT TIMELINE */}
                  <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Activity size={14} color="var(--terracotta)" /> REAL-TIME SIMULATION AUDIT TIMELINE ({timeline.length} EVENTS)
                      </h4>
                      <span className="badge badge-navy" style={{ fontSize: '0.65rem' }}>AUTOMATED EVENT LOG</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      {timeline.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
                          Awaiting exercise event execution...
                        </div>
                      ) : (
                        timeline.map((item, idx) => (
                          <div key={item.id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.78rem' }}>
                            <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.72rem', pt: '1px' }}>
                              {new Date(item.created_at || Date.now()).toLocaleTimeString()}
                            </span>
                            <span className="badge badge-primary" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                              {item.action}
                            </span>
                            <span style={{ color: 'var(--text-dark)', flex: 1 }}>{item.details}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* RIGHT COLUMN: ~35% (4/12 cols desktop) - Sticky Exercise Control Panel */}
            <div style={{ gridColumn: 'span 12 / span 12', '@media (min-width: 1024px)': { gridColumn: 'span 4 / span 4' } }} className="lg:col-span-4">
              <div className="card sticky top-4" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>

                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '0.85rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--terracotta)', marginBottom: '0.2rem' }}>
                    EXERCISE CONTROL
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy)', margin: 0 }}>
                    {activeSimulationId ? 'Active Exercise Panel' : 'Scenario Configuration'}
                  </h3>
                </div>

                {/* Selected Scenario Metadata Breakdown */}
                <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 0.85rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    SELECTED SCENARIO
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.5rem' }}>
                    {selectedScenarioObj.title}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <div>SEVERITY: <strong style={{ color: selectedScenarioObj.severity === 'CRITICAL' ? 'var(--status-danger)' : 'var(--status-warning)' }}>{selectedScenarioObj.severity}</strong></div>
                    <div>TYPE: <strong>{selectedScenarioObj.type}</strong></div>
                    <div>LOCATION: <strong>{selectedScenarioObj.location}</strong></div>
                    <div>IMPACT: <strong>{selectedScenarioObj.affected_radius_km} km</strong></div>
                    <div>SOURCE: <strong>Simulated Official Feed</strong></div>
                    <div>STATUS: <strong style={{ color: 'var(--status-success)' }}>{activeSimulationId ? 'EXERCISE RUNNING' : 'Ready to start'}</strong></div>
                  </div>
                </div>

                {!activeSimulationId ? (
                  <>
                    {/* Execution Mode Selector (Segmented Cards) */}
                    <div style={{ marginBottom: '1.15rem' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
                        EXECUTION MODE
                      </label>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div
                          onClick={() => setMode('FAST')}
                          style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            border: mode === 'FAST' ? '2px solid var(--terracotta)' : '1px solid var(--border-light)',
                            backgroundColor: mode === 'FAST' ? 'var(--terracotta-soft)' : 'var(--bg-card)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Zap size={14} color="var(--terracotta)" /> ⚡ FAST Mode
                            </span>
                            {mode === 'FAST' && <Check size={14} color="var(--terracotta)" />}
                          </div>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                            Automated 30–60 sec demo. Recommended for hackathon presentation.
                          </p>
                        </div>

                        <div
                          onClick={() => setMode('MANUAL')}
                          style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            border: mode === 'MANUAL' ? '2px solid var(--terracotta)' : '1px solid var(--border-light)',
                            backgroundColor: mode === 'MANUAL' ? 'var(--terracotta-soft)' : 'var(--bg-card)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justify: 'space-between' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Play size={14} color="var(--status-success)" /> ▶ GUIDED Mode
                            </span>
                            {mode === 'MANUAL' && <Check size={14} color="var(--terracotta)" />}
                          </div>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                            Advance each step manually. Best for explaining detailed workflow.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Primary CTA Button */}
                    <button
                      onClick={handleStartSimulation}
                      disabled={loading}
                      className="btn btn-terracotta"
                      style={{
                        width: '100%',
                        padding: '0.85rem 1rem',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 14px rgba(194, 65, 12, 0.35)',
                        marginBottom: '0.6rem'
                      }}
                    >
                      {loading ? (
                        <span>Initializing Exercise...</span>
                      ) : (
                        <>
                          <Play size={16} fill="currentColor" />
                          <span>▶ START DISASTER EXERCISE</span>
                        </>
                      )}
                    </button>

                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 1.25rem 0' }}>
                      Uses the same backend workflow as a real disaster event.
                    </p>
                  </>
                ) : (
                  /* Active Exercise Controls */
                  <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <button
                      onClick={handleEscalate}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--status-danger)', borderColor: 'var(--status-danger)', fontWeight: 700, width: '100%', justifyContent: 'center' }}
                    >
                      <AlertTriangle size={14} /> Escalate to CRITICAL
                    </button>

                    {onViewReport && (
                      <button
                        onClick={() => onViewReport(activeSimulationId)}
                        className="btn btn-primary btn-sm"
                        style={{ fontWeight: 700, width: '100%', justifyContent: 'center' }}
                      >
                        <FileText size={14} /> View Exercise Report
                      </button>
                    )}

                    <button
                      onClick={handleReset}
                      className="btn btn-secondary btn-sm"
                      style={{ fontWeight: 600, width: '100%', justifyContent: 'center' }}
                    >
                      <RotateCcw size={14} /> Reset Exercise Data
                    </button>
                  </div>
                )}

                {/* HOW THE EXERCISE WORKS Timeline Steps */}
                <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.6rem' }}>
                    HOW THE EXERCISE WORKS
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.75rem' }}>
                    {[
                      { step: '01', text: 'Official alert received from IMD feed' },
                      { step: '02', text: 'Government reviews & validates alert' },
                      { step: '03', text: 'Government confirms emergency declaration' },
                      { step: '04', text: 'SANKALP calculates affected university risk' },
                      { step: '05', text: 'Universities receive risk-based alerts' },
                      { step: '06', text: 'Universities activate campus response' },
                      { step: '07', text: 'Government monitors live operations' }
                    ].map((st, i) => (
                      <div key={st.step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ backgroundColor: 'var(--navy)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {st.step}
                        </span>
                        <span style={{ color: 'var(--text-main)', fontSize: '0.75rem' }}>{st.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
