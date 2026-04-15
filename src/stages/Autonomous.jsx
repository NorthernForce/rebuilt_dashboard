import { useState, useEffect, useRef } from 'react';
import { useEntry } from '@frc-web-components/react/networktables';
import FieldMap from '../components/FieldMap';
import { loadAutoPaths, computeBezierPoints } from '../utils/pathLoader';
import NTTabView from './NTTabView';

export default function Autonomous({ selectedAuto, goToStage }) {
  const [timeRemaining, setTimeRemaining] = useState(20);
  const [pathPoints, setPathPoints] = useState([]);
  const hasTransitioned = useRef(false);

  const [poseX] = useEntry('/Robot/Drive/PoseX', 0);
  const [poseY] = useEntry('/Robot/Drive/PoseY', 0);
  const [poseHeading] = useEntry('/Robot/Drive/PoseHeading', 0);
  const [autoData] = useEntry('/Dashboard/Auto', { progress: 0, routine: '' });
  const [fmsInfo] = useEntry('/FMSInfo', { IsRedAlliance: false, FMSControlData: 0 });

  // Key subsystem status
  const [shooterSpeed] = useEntry('/Robot/Turret/Shooter/Speed', 0);
  const [shooterTarget] = useEntry('/Robot/Turret/Shooter/TargetSpeed', 0);
  const [suzieAtTarget] = useEntry('/Robot/Turret/Suzie/IsAtTarget', false);
  const [inShootingRange] = useEntry('/Robot/Turret/InShootingRange', false);

  const x = typeof poseX === 'number' ? poseX : 0;
  const y = typeof poseY === 'number' ? poseY : 0;
  const heading = typeof poseHeading === 'number' ? poseHeading : 0;
  const autoProgress = autoData?.progress || 0;
  const autoRoutine = autoData?.routine || selectedAuto?.name || '';
  const isRedAlliance = fmsInfo?.IsRedAlliance || false;
  const fmsControlData = fmsInfo?.FMSControlData || 0;

  const isEnabled = (fmsControlData & 0x01) !== 0;
  const isAuto = (fmsControlData & 0x02) !== 0;

  const shooterRPM = (shooterSpeed || 0) * 60;
  const shooterTargetRPM = (shooterTarget || 0) * 60;
  const shooterAtSpeed = Math.abs(shooterRPM - shooterTargetRPM) < 50 && shooterTargetRPM > 0;

  // Load path data on mount
  useEffect(() => {
    if (!selectedAuto?.name) return;

    let cancelled = false;
    loadAutoPaths(selectedAuto.name).then((paths) => {
      if (cancelled) return;
      const points = paths.map((p) => computeBezierPoints(p.waypoints));
      setPathPoints(points);
    }).catch(() => {
      if (!cancelled) setPathPoints([]);
    });

    return () => { cancelled = true; };
  }, [selectedAuto?.name]);

  // FMS-driven transition: when FMS leaves autonomous (teleop starts), transition
  useEffect(() => {
    if (isEnabled && !isAuto && !hasTransitioned.current) {
      hasTransitioned.current = true;
      goToStage('teleop');
    }
  }, [isEnabled, isAuto, goToStage]);

  // Local timer fallback (for testing without FMS) + header time display
  useEffect(() => {
    const matchTimeEl = document.getElementById('matchTime');
    if (matchTimeEl) {
      matchTimeEl.textContent = `0:${timeRemaining.toString().padStart(2, '0')}`;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (matchTimeEl) matchTimeEl.textContent = '0:00';
          if (!hasTransitioned.current) {
            hasTransitioned.current = true;
            setTimeout(() => goToStage('teleop'), 1000);
          }
          return 0;
        }
        const next = prev - 1;
        if (matchTimeEl) {
          matchTimeEl.textContent = `0:${next.toString().padStart(2, '0')}`;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [goToStage]);

  // Both hubs active during auto = always green pulse
  return (
    <div className="stage-container-full shift-active">

      <div className="autonomous-layout">
        <div className="field-visualization">
          <FieldMap
            paths={pathPoints}
            robotPose={{ x, y, heading }}
            showRobot={true}
            alliance={isRedAlliance ? 'red' : 'blue'}
          />
        </div>

        <div className="auto-info-bar">
          <div className="info-bar-panel status-panel">
            <h3>Auto Routine</h3>
            <div className="routine-name">{autoRoutine || selectedAuto?.name || 'Unknown'}</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${autoProgress}%` }}></div>
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

          <div className="info-bar-panel status-panel" style={{ overflowY: 'auto', maxHeight: '100%' }}>
            <h3>Match Controls</h3>
            <NTTabView tabName="Match" layout="panel" />
          </div>

        </div>
      </div>
    </div>
  );
}

