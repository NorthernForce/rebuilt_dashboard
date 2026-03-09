import { useState, useEffect, useRef } from 'react';
import { useEntry } from '@frc-web-components/react/networktables';
import FieldMap from '../components/FieldMap';
import { computeMatchPhase } from '../utils/matchPhase';

export default function Teleop({ goToStage, setMatchStats }) {
  const [timeRemaining, setTimeRemaining] = useState(140);
  const hasTransitioned = useRef(false);

  // Scoring - balls scored (1 point each)
  const [ballsScored] = useEntry('/Dashboard/Scoring', 0);

  const [poseX] = useEntry('/Robot/Drive/PoseX', 0);
  const [poseY] = useEntry('/Robot/Drive/PoseY', 0);
  const [poseHeading] = useEntry('/Robot/Drive/PoseHeading', 0);
  const [fmsInfo] = useEntry('/FMSInfo', { IsRedAlliance: false, GameSpecificMessage: '', FMSControlData: 0 });

  // Key subsystem status
  const [shooterSpeed] = useEntry('/Robot/Turret/Shooter/Speed', 0);
  const [shooterTarget] = useEntry('/Robot/Turret/Shooter/TargetSpeed', 0);
  const [suzieAtTarget] = useEntry('/Robot/Turret/Suzie/IsAtTarget', false);
  const [inShootingRange] = useEntry('/Robot/Turret/InShootingRange', false);

  const scored = typeof ballsScored === 'number' ? ballsScored : 0;

  const robotX = typeof poseX === 'number' ? poseX : 0;
  const robotY = typeof poseY === 'number' ? poseY : 0;
  const robotHeading = typeof poseHeading === 'number' ? poseHeading : 0;
  const isRedAlliance = fmsInfo?.IsRedAlliance || false;
  const gameSpecificMessage = fmsInfo?.GameSpecificMessage || '';
  const fmsControlData = fmsInfo?.FMSControlData || 0;

  const isEnabled = (fmsControlData & 0x01) !== 0;

  // Compute match phase
  const { hubState, phaseName } = computeMatchPhase(gameSpecificMessage, isRedAlliance, timeRemaining);

  const shooterRPM = (shooterSpeed || 0) * 60;
  const shooterTargetRPM = (shooterTarget || 0) * 60;
  const shooterAtSpeed = Math.abs(shooterRPM - shooterTargetRPM) < 50 && shooterTargetRPM > 0;

  // FMS-driven transition: when FMS disables the robot (match over), go to postGame
  const wasEnabled = useRef(false);
  useEffect(() => {
    if (isEnabled) {
      wasEnabled.current = true;
    }
    if (wasEnabled.current && !isEnabled && !hasTransitioned.current) {
      hasTransitioned.current = true;
      setMatchStats({
        totalPoints: scored,
        autoPoints: 0,
        teleopPoints: scored,
        endGamePoints: 0
      });
      goToStage('postGame');
    }
  }, [isEnabled, goToStage, scored, setMatchStats]);

  // Local timer fallback (for testing without FMS) + header time display
  useEffect(() => {
    // Set initial header time when entering teleop
    const matchTimeEl = document.getElementById('matchTime');
    if (matchTimeEl) {
      matchTimeEl.textContent = `${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (matchTimeEl) matchTimeEl.textContent = '0:00';
          if (!hasTransitioned.current) {
            hasTransitioned.current = true;
            setMatchStats({
              totalPoints: scored,
              autoPoints: 0,
              teleopPoints: scored,
              endGamePoints: 0
            });
            setTimeout(() => goToStage('postGame'), 1000);
          }
          return 0;
        }
        const next = prev - 1;
        if (matchTimeEl) {
          matchTimeEl.textContent = `${Math.floor(next / 60)}:${(next % 60).toString().padStart(2, '0')}`;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [goToStage, scored, setMatchStats]);

  return (
    <div className={`stage-container-full ${hubState === 'active' ? 'shift-active' : 'shift-inactive'}`}>

      <div className="teleop-layout">
        <div className="field-visualization">
          <FieldMap
            robotPose={{ x: robotX, y: robotY, heading: robotHeading }}
            showRobot={true}
            alliance={isRedAlliance ? 'red' : 'blue'}
            paths={[]}
          />
        </div>

        <div className="teleop-info-bar">
          <div className="info-bar-panel match-phase-panel">
            <h3>Match Phase</h3>
            <div className="phase-name">{phaseName}</div>
            <div className={`hub-status ${hubState}`}>
              Hub: {hubState === 'active' ? 'ACTIVE' : 'INACTIVE'}
            </div>
          </div>

          <div className="info-bar-panel scoring-panel">
            <h3>Scoring</h3>
            <div className="score-inline">
              <span className="score-label">Balls</span>
              <span className="score-value">{scored}</span>
            </div>
          </div>

          <div className="info-bar-panel status-panel">
            <h3>Status</h3>
            <div className="status-indicators">
              <div className={`status-chip ${shooterAtSpeed ? 'good' : 'bad'}`}>
                Shooter: {shooterAtSpeed ? 'AT SPEED' : 'SPINNING UP'}
              </div>
              <div className={`status-chip ${suzieAtTarget ? 'good' : 'bad'}`}>
                Suzie: {suzieAtTarget ? 'ON TARGET' : 'ROTATING'}
              </div>
              <div className={`status-chip ${inShootingRange ? 'good' : 'bad'}`}>
                {inShootingRange ? 'IN RANGE' : 'OUT OF RANGE'}
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
