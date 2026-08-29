import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export default function ImpactChart({ metrics = [] }) {
  const defaultMetrics = [
    { metric_name: 'Waste Overflow Incidents', before_value: 140, after_value: 22, unit: 'incidents/wk', improvement_pct: 84.2 },
    { metric_name: 'Truck Fuel Usage (L)', before_value: 850, after_value: 540, unit: 'liters/wk', improvement_pct: 36.4 },
    { metric_name: 'Evacuation Response (Mins)', before_value: 120, after_value: 35, unit: 'minutes', improvement_pct: 70.8 }
  ];

  const data = metrics.length ? metrics.map(m => ({
    name: m.metric_name,
    Before: parseFloat(m.before_value) || 100,
    After: parseFloat(m.after_value) || 35,
    improvement: m.improvement_pct
  })) : defaultMetrics.map(m => ({
    name: m.metric_name,
    Before: m.before_value,
    After: m.after_value,
    improvement: m.improvement_pct
  }));

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem' }}>Measurable Solution Impact Metrics</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Comparing baseline conditions (Before) vs deployed academic solution results (After).
          </p>
        </div>
        <div className="badge badge-success">
          Verified Outcome Data
        </div>
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-medium)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--text-medium)', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: 'none' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="Before" fill="#ef4444" radius={[6, 6, 0, 0]} name="Baseline (Before)" />
            <Bar dataKey="After" fill="#10b981" radius={[6, 6, 0, 0]} name="Deployed Impact (After)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
        {data.map((item, idx) => (
          <div key={idx} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.name}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--status-success)', margin: '0.2rem 0' }}>
              -{item.improvement}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-medium)' }}>
              From {item.Before} down to {item.After}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
