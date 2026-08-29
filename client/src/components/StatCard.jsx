import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) {
  const colorMap = {
    blue: { bg: 'var(--primary-light)', text: 'var(--primary-blue)' },
    green: { bg: 'var(--status-success-bg)', text: 'var(--status-success)' },
    amber: { bg: 'var(--status-warning-bg)', text: 'var(--status-warning)' },
    rose: { bg: 'var(--status-danger-bg)', text: 'var(--status-danger)' },
    purple: { bg: '#f3e8ff', text: '#7c3aed' }
  };

  const activeColor = colorMap[color] || colorMap.blue;

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: 'var(--text-dark)', margin: '0.2rem 0' }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.825rem', color: 'var(--text-medium)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {trend && <span style={{ fontWeight: 700, color: trend.startsWith('+') ? 'var(--status-success)' : 'var(--status-danger)' }}>{trend}</span>}
            {subtitle}
          </div>
        )}
      </div>

      {Icon && (
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: activeColor.bg,
          color: activeColor.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}
