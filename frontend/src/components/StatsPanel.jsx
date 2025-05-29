import React from 'react';
import { useUser } from '../context/UserContext';

function StatsPanel() {
  const { isPaid, statistics } = useUser();

  if (!isPaid) return null;

  return (
    <div className="stats-panel">
      <div className="stats-container">
        <div className="stat-item">
          <span className="stat-value">{statistics.editedTexts}</span>
          <span className="stat-label">Edited Texts</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{statistics.usedTokens}</span>
          <span className="stat-label">Used Tokens</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{statistics.availableTokens}</span>
          <span className="stat-label">Available Tokens</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{statistics.corrections}</span>
          <span className="stat-label">Corrections</span>
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;