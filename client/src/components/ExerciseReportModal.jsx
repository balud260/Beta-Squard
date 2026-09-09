import React from 'react';
import { Shield, CheckCircle2, RefreshCw, XCircle, AlertTriangle, MapPin, Activity, FileText, Users, Building2 } from 'lucide-react';
import { api } from '../services/api';

export default function ExerciseReportModal({ report, onClose, onResetComplete }) {
  if (!report) return null;

  const summary = report.impactSummary || {};
  const risks = report.universityRisks || [];
  const auditLogs = report.auditTrail || [];

  async function handleReset() {
    if (window.confirm('Reset this simulation exercise? This will purge simulation records while keeping production data intact.')) {
      try {
        await api.resetSimulation(report.simulationId);
        if (onResetComplete) onResetComplete();
        onClose();
      } catch (err) {
        alert(`Reset failed: ${err.message}`);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-xl text-white">Disaster Exercise Report</h3>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  COMPLETED
                </span>
              </div>
              <p className="text-xs text-slate-400">Simulation Exercise Summary & Audit Trail Breakdown</p>
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
          {/* Top Banner */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exercise Incident Title</span>
              <h4 className="text-lg font-bold text-white mt-0.5">{report.scenarioTitle}</h4>
              <p className="text-xs text-slate-400 mt-1">
                Source: <span className="text-amber-400 font-medium">{report.sourceName}</span> | Ref ID: <code className="text-slate-300">{report.simulationId}</code>
              </p>
            </div>
            <span className={`px-3 py-1 text-xs font-bold rounded-lg uppercase tracking-wider border ${
              report.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              {report.severity}
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-center">
              <div className="text-2xl font-bold text-white">{summary.total || 0}</div>
              <div className="text-xs text-slate-400 mt-0.5">Universities Evaluated</div>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
              <div className="text-2xl font-bold text-rose-400">{summary.high || 0}</div>
              <div className="text-xs text-rose-300/80 mt-0.5">HIGH Risk Tiers</div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-2xl font-bold text-emerald-400">{summary.acknowledged || 0} / {summary.high || 0}</div>
              <div className="text-xs text-emerald-300/80 mt-0.5">High-Risk Acknowledged</div>
            </div>
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
              <div className="text-2xl font-bold text-blue-400">{summary.responseActivated || 0}</div>
              <div className="text-xs text-blue-300/80 mt-0.5">Teams Activated</div>
            </div>
          </div>

          {/* University Risk Breakdown List */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>University Risk & Response Status Breakdown</span>
            </h4>
            <div className="space-y-2">
              {risks.map((r) => (
                <div 
                  key={r.id}
                  className="p-3 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                      r.risk_level === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      r.risk_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {r.risk_level}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-200">{r.university_name}</div>
                      <div className="text-slate-400 text-[11px]">{r.distance_km} KM from disaster center</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`font-medium ${r.acknowledged ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {r.acknowledged ? '✓ Acknowledged' : '⚠ Unacknowledged'}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                      r.response_status === 'ACTIVE' || r.response_status === 'ACTIVATING'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {r.response_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Timeline */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Exercise Audit Timeline ({auditLogs.length} Events)</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-800/20 border border-slate-800 space-y-2.5 max-h-48 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="text-xs flex items-start space-x-3 text-slate-300">
                  <span className="text-slate-500 font-mono flex-shrink-0">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                  <span className="font-semibold text-amber-400/90 flex-shrink-0">{log.action}:</span>
                  <span className="text-slate-300">{log.details}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-800/50 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center space-x-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Exercise Data</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
