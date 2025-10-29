import { useState, useEffect } from 'react';
import { useEntry } from '@frc-web-components/react/networktables';

export default function Teleop({ goToStage, setMatchStats }) {
  const [timeRemaining, setTimeRemaining] = useState(135);
  
  const [scoring] = useEntry('/Dashboard/Scoring', { coral: 0, algae: 0 });
  const [alignment] = useEntry('/Dashboard/Alignment', { distance: 0, angle: 0, aligned: false });
  const [battery] = useEntry('/Dashboard/battery', 12.0);
  const [subsystems] = useEntry('/Dashboard/Subsystems', { intake: 'Unknown', shooter: 'Unknown', climber: 'Unknown' });

  const coralScored = scoring?.coral || 0;
  const algaeScored = scoring?.algae || 0;
  const alignmentDistance = alignment?.distance || 0;
  const alignmentAngle = alignment?.angle || 0;
  const aligned = alignment?.aligned || false;
  const batteryVoltage = battery || 12.0;
  const intakeStatus = subsystems?.intake || 'Unknown';
  const shooterStatus = subsystems?.shooter || 'Unknown';
  const climberStatus = subsystems?.climber || 'Unknown';

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setMatchStats({
            totalPoints: (coralScored * 5) + (algaeScored * 3),
            autoPoints: 0,
            teleopPoints: (coralScored * 5) + (algaeScored * 3),
            endGamePoints: 0
          });
          setTimeout(() => goToStage('postGame'), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [goToStage, coralScored, algaeScored, setMatchStats]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="stage-container-full">
      <div className="teleop-header">
        <h2 className="stage-title-inline">TELEOPERATED</h2>
        <div className="teleop-timer">{minutes}:{seconds.toString().padStart(2, '0')}</div>
      </div>

      <div className="teleop-layout">
        <div className="camera-feed-container">
          <div className="camera-placeholder">
            <p>Camera Feed</p>
            <p>Waiting for stream...</p>
          </div>
          <div className="camera-overlay">
            <div className="crosshair"></div>
          </div>
        </div>

        <div className="teleop-sidebar">
          <div className="scoring-panel">
            <h3>Scoring Status</h3>
            <div className="score-grid">
              <div className="score-item">
                <div className="score-label">Coral Scored</div>
                <div className="score-value">{coralScored}</div>
              </div>
              <div className="score-item">
                <div className="score-label">Algae Scored</div>
                <div className="score-value">{algaeScored}</div>
              </div>
            </div>
          </div>

          <div className="reef-alignment-panel">
            <h3>Reef Alignment</h3>
            <div className="alignment-visual">
              <div className="alignment-text">
                Distance: {alignmentDistance.toFixed(1)} cm
              </div>
              <div className="alignment-text">
                Angle: {alignmentAngle.toFixed(1)}°
              </div>
              <div className="indicator-row ready-indicator">
                <span className="indicator-label">Ready to Score:</span>
                <span className={`indicator-box ${aligned ? 'active' : ''}`}>
                  {aligned ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>

          <div className="robot-status-panel">
            <h3>Robot Status</h3>
            <div className="status-grid">
              <div className="status-item">
                <span>Battery:</span>
                <span>{batteryVoltage.toFixed(1)}V</span>
              </div>
              <div className="status-item">
                <span>Intake:</span>
                <span>{intakeStatus}</span>
              </div>
              <div className="status-item">
                <span>Shooter:</span>
                <span>{shooterStatus}</span>
              </div>
              <div className="status-item">
                <span>Climber:</span>
                <span>{climberStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
