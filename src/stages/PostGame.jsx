import { useEntry } from '@frc-web-components/react/networktables';

export default function PostGame({ matchStats, resetDashboard }) {
  const [ballsScored] = useEntry('/Dashboard/Scoring', 0);
  const [stats] = useEntry('/Dashboard/Stats', {
    totalPoints: matchStats.totalPoints,
    autoPoints: matchStats.autoPoints,
    endGamePoints: matchStats.endGamePoints
  });

  const scored = typeof ballsScored === 'number' ? ballsScored : 0;
  const totalPoints = stats?.totalPoints || matchStats.totalPoints;
  const autoPoints = stats?.autoPoints || matchStats.autoPoints;
  const endGamePoints = stats?.endGamePoints || matchStats.endGamePoints;

  return (
    <div className="stage-container">
      <h2 className="stage-title">Match Complete</h2>

      <div className="match-result">
        <div className="result-banner">
          <div className="result-text">MATCH ENDED</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card highlight-card">
          <h3>Total Points</h3>
          <div className="stat-value-large">{totalPoints}</div>
        </div>

        <div className="stat-card">
          <h3>Autonomous</h3>
          <div className="stat-breakdown">
            <div className="stat-row">
              <span>Points:</span>
              <span>{autoPoints}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <h3>Teleoperated</h3>
          <div className="stat-breakdown">
            <div className="stat-row">
              <span>Balls Scored:</span>
              <span>{scored}</span>
            </div>
            <div className="stat-row">
              <span>Points:</span>
              <span>{scored}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <h3>End Game</h3>
          <div className="stat-breakdown">
            <div className="stat-row">
              <span>Points:</span>
              <span>{endGamePoints}</span>
            </div>
          </div>
        </div>
      </div>

      <button className="btn btn-primary btn-large" onClick={resetDashboard}>
        Start New Match
      </button>
    </div>
  );
}
