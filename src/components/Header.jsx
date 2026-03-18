import { useEntry } from '@frc-web-components/react/networktables';

export default function Header({ stage, viewMode, setViewMode }) {
  const [fmsInfo] = useEntry('/FMSInfo', { IsRedAlliance: false });

  const teamNumber = 172;
  const isRedAlliance = fmsInfo?.IsRedAlliance || false;
  const type = fmsInfo['.type'] || '';
  // console.log("FMS Info:", fmsInfo);
  // console.log("FMS Info type:", type);
  const stageNames = {
    autoSelection: 'AUTO SELECTION',
    confirmation: 'CONFIRMATION',
    autonomous: 'AUTONOMOUS',
    teleop: 'TELEOPERATED',
    postGame: 'POST-GAME'
  };

  const allianceClass = isRedAlliance ? 'alliance-red' : 'alliance-blue';
  const allianceText = isRedAlliance ? 'RED ALLIANCE' : 'BLUE ALLIANCE';
  const connected = type !== "";

  return (
    <header className="dashboard-header">
      <div className="team-info">
        <h1>Team {teamNumber}</h1>
        <span className={`alliance-indicator ${allianceClass}`}>{allianceText}</span>
      </div>
      <div className="match-info">
        <div className="mode-tabs" role="tablist" aria-label="Dashboard mode">
          <button
            type="button"
            className={`mode-tab ${viewMode === 'driver' ? 'active' : ''}`}
            onClick={() => setViewMode('driver')}
            role="tab"
            aria-selected={viewMode === 'driver'}
          >
            Driver
          </button>
          <button
            type="button"
            className={`mode-tab ${viewMode === 'developer' ? 'active' : ''}`}
            onClick={() => setViewMode('developer')}
            role="tab"
            aria-selected={viewMode === 'developer'}
          >
            Developer
          </button>
        </div>
        <span className="match-time" id="matchTime">0:00</span>
        <span className="stage-indicator">{viewMode === 'developer' ? 'DEVELOPER' : (stageNames[stage] || 'PRE-MATCH')}</span>
      </div>
      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        <span>Robot</span>
      </div>
    </header>
  );
}
