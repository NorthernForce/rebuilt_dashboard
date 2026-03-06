import { useEffect } from 'react';
import { useEntry } from '@frc-web-components/react';

export default function AutoSelection({ selectedAuto, setSelectedAuto, goToStage }) {
  const [options] = useEntry('/Shuffleboard/Robot/Auto Selector/options', []);
  const [preSelected, setPreSelected] = useEntry('/Shuffleboard/Robot/Auto Selector/selected', 'Default');
  // console.log("preSelected auto from NetworkTables:", preSelected);
  const autoRoutines = (options || []).map(name => ({ id: name, name }));

  const sendSelectedAutoToRobot = (auto) => {
    // Send the selected auto routine to the robot via NetworkTables
    try {
      setPreSelected(auto.name);
      // console.log(`Sent selected auto routine to robot: ${auto.name}`);
    } catch (error) {
      console.error('Failed to send selected auto routine to robot:', error);
    }
  };

  const handleSelectAuto = (auto) => {
    setSelectedAuto(auto);
  };

  useEffect(() => {
    handleSelectAuto(preSelected ? { id: preSelected, name: preSelected } : null);
  }, [preSelected]);

  return (
    <div className="stage-container">
      <h2 className="stage-title">Select Autonomous Routine</h2>
      {autoRoutines.length === 0 ? (
        <div className="selected-auto-display">No auto routines available — waiting for robot connection</div>
      ) : (
        <div className="auto-grid">
          {autoRoutines.map(auto => (
            <div
              key={auto.id}
              className={`auto-card ${selectedAuto?.id === auto.id ? 'selected' : ''}`}
              onClick={() => handleSelectAuto(auto)}
            >
              <h3>{auto.name}</h3>
            </div>
          ))}
        </div>
      )}
      <div className="selected-auto-display">
        <span>Selected: </span>
        <strong>{selectedAuto?.name || 'None'}</strong>
      </div>
      <button
        className="btn btn-primary btn-large"
        disabled={!selectedAuto}
        onClick={() => {goToStage('confirmation');sendSelectedAutoToRobot(selectedAuto)}}
      >
        Next: Confirm Information →
      </button>
    </div>
  );
}
