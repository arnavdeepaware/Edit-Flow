import React from 'react';
import { useUser } from '../../../context/UserContext';

function EditorStats() {
  const { user, isPaid, statistics } = useUser();

  if (!isPaid) return null;

  return (
    <div className="editor-stats-container">
      <div className="editor-stats">
        <div className="stat-item">
          <span className="stat-value">{statistics.editedTexts}</span>
          <span className="stat-label">Total Edits</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{statistics.usedTokens}</span>
          <span className="stat-label">Used Tokens</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{statistics.corrections}</span>
          <span className="stat-label">Corrections</span>
        </div>
      </div>
    </div>
  );
}

export default EditorStats;