import React, { useState, useEffect } from 'react';

export default function DesignSwitcher() {
  const [theme, setTheme] = useState(() => localStorage.getItem('solvelink_theme') || 'A');

  useEffect(() => {
    if (theme === 'B') {
      document.documentElement.classList.add('designB');
      document.body.classList.add('designB');
    } else {
      document.documentElement.classList.remove('designB');
      document.body.classList.remove('designB');
    }
    localStorage.setItem('solvelink_theme', theme);
  }, [theme]);

  return (
    <div className="switcher">
      <span>SolveLink AI — pick a direction:</span>
      <button
        id="btnA"
        className={theme === 'A' ? 'active' : ''}
        onClick={() => setTheme('A')}
      >
        Design A · Sidebar / Terracotta &amp; Forest
      </button>
      <button
        id="btnB"
        className={theme === 'B' ? 'active' : ''}
        onClick={() => setTheme('B')}
      >
        Design B · Top-Nav / Magenta &amp; Gold
      </button>
    </div>
  );
}
