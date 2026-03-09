import { useEffect, useState, useRef } from 'react';
import { useEntry } from '@frc-web-components/react';
import FieldMap from '../components/FieldMap';
import { loadAutoPaths, computeBezierPoints } from '../utils/pathLoader';

export default function AutoSelection({ selectedAuto, setSelectedAuto, goToStage }) {
  const [options] = useEntry('/Shuffleboard/Robot/Auto Selector/options', []);
  const [preSelected, setPreSelected] = useEntry('/Shuffleboard/Robot/Auto Selector/selected', 'Default');
  const [pathPoints, setPathPoints] = useState([]);
  const [robotPose, setRobotPose] = useState(null);
  const animFrameRef = useRef(null);
  const animStartRef = useRef(null);

  const AUTO_DURATION_MS = 6000; // time for one full traversal

  const autoRoutines = (options || []).map(name => ({ id: name, name }));

  const sendSelectedAutoToRobot = (auto) => {
    try {
      setPreSelected(auto.name);
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

  // Load path data when selected auto changes
  useEffect(() => {
    if (!selectedAuto?.name) {
      setPathPoints([]);
      return;
    }

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

  // Animate robot along the path
  useEffect(() => {
    // Cancel any running animation
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // Flatten all path segments into one continuous list of points
    const allPoints = pathPoints.flat();
    if (allPoints.length < 2) {
      setRobotPose(null);
      return;
    }

    animStartRef.current = null;

    const animate = (timestamp) => {
      if (!animStartRef.current) animStartRef.current = timestamp;
      const elapsed = timestamp - animStartRef.current;

      // Loop: progress goes 0→1 over AUTO_DURATION_MS, then pauses briefly and restarts
      const totalCycle = AUTO_DURATION_MS + 1500; // traverse + pause
      const cycleTime = elapsed % totalCycle;
      const progress = Math.min(cycleTime / AUTO_DURATION_MS, 1);

      // Map progress to a point index
      const idx = Math.min(
        Math.floor(progress * (allPoints.length - 1)),
        allPoints.length - 2
      );
      const frac = (progress * (allPoints.length - 1)) - idx;

      const p0 = allPoints[idx];
      const p1 = allPoints[idx + 1];

      const x = p0.x + (p1.x - p0.x) * frac;
      const y = p0.y + (p1.y - p0.y) * frac;

      // Compute heading from direction of travel
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const heading = Math.atan2(dy, dx) * (180 / Math.PI);

      setRobotPose({ x, y, heading });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      setRobotPose(null);
    };
  }, [pathPoints]);

  return (
    <div className="stage-container">
      <h2 className="stage-title">Select Autonomous Routine</h2>

      <div className="auto-selection-layout">
        <div className="auto-grid-column">
          {autoRoutines.length === 0 ? (
            <div className="selected-auto-display">No auto routines available — waiting for robot connection</div>
          ) : (
            <div className="auto-grid">
              {autoRoutines.map(auto => (
                <div
                  key={auto.id}
                  className={`auto-card ${selectedAuto?.id === auto.id ? 'selected' : ''}`}
                  onClick={() => {handleSelectAuto(auto);     sendSelectedAutoToRobot(selectedAuto);}}
                >
              <h3>{auto.name}</h3>
            </div>
          ))}
        </div>
          )}
      </div>

      <div className="auto-preview-column">
        <div className="auto-preview-wrapper">
          <FieldMap
            paths={pathPoints}
            robotPose={robotPose}
            showRobot={!!robotPose}
            className="auto-preview-map"
          />
          <div className="selected-auto-display">
            <span>Selected: </span>
            <strong>{selectedAuto?.name || 'None'}</strong>
          </div>
          <button
            className="btn btn-primary btn-large auto-next-btn"
            disabled={!selectedAuto}
            onClick={() => { goToStage('confirmation'); sendSelectedAutoToRobot(selectedAuto) }}
          >
            Next: Confirm Information &rarr;
          </button>
        </div>
      </div>
    </div>
    </div >
  );
}
