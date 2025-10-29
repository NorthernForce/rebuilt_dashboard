import { useState } from 'react';
import { useEntry } from '@frc-web-components/react';

const autoRoutines = [
  { id: 'center', name: 'Center Score', icon: '🎯', description: 'Start center, score preload, mobility' },
  { id: 'left', name: 'Left Side', icon: '⬅️', description: 'Start left, score 2 pieces' },
  { id: 'right', name: 'Right Side', icon: '➡️', description: 'Start right, score 2 pieces' },
  { id: 'defensive', name: 'Defensive', icon: '🛡️', description: 'Push opponent coral' },
  { id: 'mobility', name: 'Mobility Only', icon: '🚀', description: 'Leave starting zone' },
  { id: 'none', name: 'Do Nothing', icon: '⏸️', description: 'Stay in place' }
];

export default function AutoSelection({ selectedAuto, setSelectedAuto, goToStage }) {
  const handleSelectAuto = (auto) => {
    setSelectedAuto(auto);
  };

  console.log("Auto options: " + useEntry("/Shuffleboard/Robot/Auto Selector/options"))

  return (
    <div className="stage-container">
      <h2 className="stage-title">Select Autonomous Routine</h2>
      <div className="auto-grid">
        {autoRoutines.map(auto => (
          <div
            key={auto.id}
            className={`auto-card ${selectedAuto?.id === auto.id ? 'selected' : ''}`}
            onClick={() => handleSelectAuto(auto)}
          >
            <div className="auto-icon">{auto.icon}</div>
            <h3>{auto.name}</h3>
            <p>{auto.description}</p>
          </div>
        ))}
      </div>
      <div className="selected-auto-display">
        <span>Selected: </span>
        <strong>{selectedAuto?.name || 'None'}</strong>
      </div>
      <button
        className="btn btn-primary btn-large"
        disabled={!selectedAuto}
        onClick={() => goToStage('confirmation')}
      >
        Next: Confirm Information →
      </button>
    </div>
  );
}
