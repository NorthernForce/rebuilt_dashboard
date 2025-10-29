import { useState, useEffect } from 'react';
import { useEntry } from '@frc-web-components/react/networktables';

export default function Autonomous({ selectedAuto, goToStage }) {
  const [timeRemaining, setTimeRemaining] = useState(15);
  
  const [telemetry] = useEntry('/Dashboard/Telemetry', { x: 0, y: 0, heading: 0, velocity: 0 });
  const [autoData] = useEntry('/Dashboard/Auto', { progress: 0, routine: '' });

  const x = telemetry?.x || 0;
  const y = telemetry?.y || 0;
  const heading = telemetry?.heading || 0;
  const velocity = telemetry?.velocity || 0;
  const autoProgress = autoData?.progress || 0;
  const autoRoutine = autoData?.routine || selectedAuto?.name || '';

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => goToStage('teleop'), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [goToStage]);

  return (
    <div className="stage-container-full">
      <div className="auto-header">
        <h2 className="stage-title-inline">AUTONOMOUS</h2>
        <div className="auto-timer">{timeRemaining}</div>
      </div>

      <div className="autonomous-layout">
        <div className="field-visualization">
          <div className="field-placeholder">
            <p>Field View</p>
            <p>Robot Position: ({x.toFixed(1)}, {y.toFixed(1)})</p>
            <p>Heading: {heading.toFixed(1)}°</p>
          </div>
        </div>

        <div className="auto-sidebar">
          <div className="status-panel">
            <h3>Routine Status</h3>
            <div className="routine-name">{autoRoutine || selectedAuto?.name || 'Unknown'}</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${autoProgress}%` }}></div>
            </div>
          </div>

          <div className="telemetry-panel">
            <h3>Live Telemetry</h3>
            <div className="telemetry-item">
              <span>Position X:</span>
              <span>{x.toFixed(2)}</span>
            </div>
            <div className="telemetry-item">
              <span>Position Y:</span>
              <span>{y.toFixed(2)}</span>
            </div>
            <div className="telemetry-item">
              <span>Heading:</span>
              <span>{heading.toFixed(1)}°</span>
            </div>
            <div className="telemetry-item">
              <span>Velocity:</span>
              <span>{velocity.toFixed(2)} m/s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
