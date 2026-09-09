import React, { useState, useEffect, useRef } from 'react';
import { Shield, Play, Pause, FastForward, RotateCcw, AlertTriangle, CheckCircle2, Radio, MapPin, Activity, Flame, ChevronRight, FileText, Zap, XCircle } from 'lucide-react';
import { api } from '../services/api';

export default function DisasterSimulationModal({ isOpen, onClose, onExerciseStarted, onResetComplete, onViewReport }) {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioKey, setSelectedScenarioKey] = useState('vijayawada_flood');
  const [mode, setMode] = useState('FAST'); // 'FAST' | 'MANUAL'
  const [customConfig, setCustomConfig] = useState({
    title: '',
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
      setScenarios(res.scenarios || []);
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    }
  }

  async function fetchStatus(id) {
    try {
      const res = await api.getSimulationStatus(id);
      setSimulationStatus(res);
    } catch (err) {
      console.error('Fetch status error:', err);
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
    if (window.confirm('Reset this simulation exercise? This will remove all associated simulation records.')) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-xl text-white">Disaster Exercise & Simulation Mode</h3>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  SIMULATION MODE — NOT A LIVE EMERGENCY
                </span>
              </div>
              <p className="text-xs text-slate-400">Authentic SQLite Backend Workflow Execution & Zero-Hallucination Risk Engine</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {!activeSimulationId ? (
            /* Exercise Configuration & Preset Selection View */
            <div className="space-y-6">
              {/* Preset Scenarios */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  1. Select Pre-Built Demo Scenario
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {scenarios.map((sc) => (
                    <button
                      key={sc.key}
                      type="button"
                      onClick={() => handleSelectScenario(sc)}
                      className={`p-4 rounded-xl text-left border transition-all ${
                        selectedScenarioKey === sc.key
                          ? 'bg-amber-500/10 border-amber-500/50 ring-2 ring-amber-500/20 text-white'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{sc.type}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          sc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {sc.severity}
                        </span>
                      </div>
                      <h4 className="font-semibold text-sm text-white">{sc.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sc.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  2. Select Simulation Execution Mode
                </label>
                <div className="flex items-center space-x-4">
                  <label className={`flex-1 p-3.5 rounded-xl border cursor-pointer flex items-center space-x-3 transition-colors ${
                    mode === 'FAST' ? 'bg-amber-500/10 border-amber-500/40 text-white' : 'bg-slate-800/40 border-slate-800 text-slate-400'
                  }`}>
                    <input 
                      type="radio" 
                      name="mode" 
                      value="FAST" 
                      checked={mode === 'FAST'} 
                      onChange={() => setMode('FAST')} 
                      className="text-amber-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center space-x-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>FAST Mode (Automated 30-60s Demo)</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Executes complete workflow sequence for hackathon evaluation</div>
                    </div>
                  </label>

                  <label className={`flex-1 p-3.5 rounded-xl border cursor-pointer flex items-center space-x-3 transition-colors ${
                    mode === 'MANUAL' ? 'bg-amber-500/10 border-amber-500/40 text-white' : 'bg-slate-800/40 border-slate-800 text-slate-400'
                  }`}>
                    <input 
                      type="radio" 
                      name="mode" 
                      value="MANUAL" 
                      checked={mode === 'MANUAL'} 
                      onChange={() => setMode('MANUAL')} 
                      className="text-amber-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center space-x-1.5">
                        <Play className="w-4 h-4 text-emerald-400" />
                        <span>MANUAL Guided Mode</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">User advances each step manually with explanation prompts</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-3 flex justify-end">
                <button
                  onClick={handleStartSimulation}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2"
                >
                  {loading ? (
                    <span>Initializing Simulation...</span>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Start Disaster Exercise Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Active Simulation Control & Timeline View */
            <div className="space-y-6">
              {/* Exercise Control Banner */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      EXERCISE ACTIVE
                    </span>
                    <span className="text-xs text-slate-400">ID: <code className="text-slate-200">{activeSimulationId}</code></span>
                  </div>
                  <h4 className="text-lg font-bold text-white mt-1">
                    {currentAlert?.title || customConfig.title}
                  </h4>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleEscalate}
                    className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center space-x-1"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Escalate to CRITICAL</span>
                  </button>

                  {onViewReport && (
                    <button
                      onClick={() => onViewReport(activeSimulationId)}
                      className="px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-colors flex items-center space-x-1"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Exercise Report</span>
                    </button>
                  )}

                  <button
                    onClick={handleReset}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center space-x-1"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Exercise</span>
                  </button>
                </div>
              </div>

              {/* Status Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="text-xs text-slate-400">Official Alert Status</div>
                  <div className="text-sm font-bold text-amber-400 mt-1">
                    {currentAlert?.review_status || 'PENDING_REVIEW'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="text-xs text-slate-400">Disaster Incident Status</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    {currentDisaster ? currentDisaster.status : 'AWAITING_CONFIRMATION'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="text-xs text-slate-400">High-Risk Universities</div>
                  <div className="text-sm font-bold text-rose-400 mt-1">
                    {riskSummary.high || 0} Tiers Identified
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
                  <div className="text-xs text-slate-400">Response Team Activations</div>
                  <div className="text-sm font-bold text-blue-400 mt-1">
                    {riskSummary.responseActivated || 0} Teams Active
                  </div>
                </div>
              </div>

              {/* Real-Time Simulation Timeline */}
              <div>
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>Real-Time Simulation Audit Timeline ({timeline.length} Events)</span>
                </h4>
                <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 space-y-3 max-h-64 overflow-y-auto">
                  {timeline.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-start space-x-3 text-xs">
                      <span className="text-slate-500 font-mono flex-shrink-0 pt-0.5">
                        {new Date(item.created_at).toLocaleTimeString()}
                      </span>
                      <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-amber-300 mr-2">{item.action}:</span>
                        <span className="text-slate-200">{item.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
