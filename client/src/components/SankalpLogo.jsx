import React from 'react';
import { Link } from 'react-router-dom';

export default function SankalpLogo({ variant = 'compact', height = 36, subtitle = '', to = '/', style = {} }) {
  const logoContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', ...style }}>
      {/* Official SANKALP AI Mark / Logo Image */}
      <img
        src="/sankalp-logo.png"
        alt="SANKALP AI Logo"
        style={{
          height: `${height}px`,
          width: 'auto',
          objectFit: 'contain',
          display: 'block'
        }}
      />

      {variant !== 'icon' && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', lineHeight: 1.1 }}>
            <span style={{
              fontFamily: 'Outfit, var(--font-primary)',
              fontWeight: 800,
              fontSize: height > 32 ? '1.15rem' : '1.05rem',
              color: 'var(--navy)',
              letterSpacing: '0.02em'
            }}>
              SANKALP
            </span>
            <span style={{
              fontFamily: 'Outfit, var(--font-primary)',
              fontWeight: 800,
              fontSize: height > 32 ? '1.15rem' : '1.05rem',
              color: 'var(--terracotta)',
              letterSpacing: '0.02em'
            }}>
              AI
            </span>
          </div>

          {subtitle && (
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginTop: '1px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              | {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none', display: 'inline-flex' }}>
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
