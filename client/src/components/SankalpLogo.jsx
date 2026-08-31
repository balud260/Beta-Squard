import React from 'react';
import { Link } from 'react-router-dom';

export default function SankalpLogo({ variant = 'compact', height = 38, subtitle = '', to = '/', style = {} }) {
  // Use optimal height scaling for different variants
  const imgHeight = variant === 'full' ? Math.max(height, 56) : height;

  const logoContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', ...style }}>
      {/* Official SANKALP AI Logo Image */}
      <img
        src="/sankalp-logo.png"
        alt="SANKALP AI Logo"
        style={{
          height: `${imgHeight}px`,
          width: 'auto',
          objectFit: 'contain',
          display: 'block'
        }}
      />

      {/* Optional Portal Subtitle Badge */}
      {subtitle && subtitle !== 'PLATFORM' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          borderLeft: '2px solid var(--border-light)',
          paddingLeft: '10px',
          height: `${Math.min(imgHeight, 28)}px`
        }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--navy)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap'
          }}>
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
