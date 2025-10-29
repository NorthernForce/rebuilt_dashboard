import { useEntry } from '@frc-web-components/react/networktables';

export default function Header({ stage }) {
  const [fmsInfo] = useEntry('/FMSInfo', { IsRedAlliance: false });
  const [connected] = useEntry('/.connection/connected', false);

  const teamNumber = 172;
  const isRedAlliance = fmsInfo?.IsRedAlliance || false;

  const stageNames = {
    autoSelection: 'AUTO SELECTION',
    confirmation: 'CONFIRMATION',
    autonomous: 'AUTONOMOUS',
    teleop: 'TELEOPERATED',
    postGame: 'POST-GAME'
  };

  const allianceClass = isRedAlliance ? 'alliance-red' : 'alliance-blue';
  const allianceText = isRedAlliance ? 'RED ALLIANCE' : 'BLUE ALLIANCE';

  return (
    <header className="dashboard-header">
      <div className="team-info">
        <h1>Team {teamNumber}</h1>
        <span className={`alliance-indicator ${allianceClass}`}>{allianceText}</span>
      </div>
      <div className="match-info">
        <span className="match-time" id="matchTime">0:00</span>
        <span className="stage-indicator">{stageNames[stage] || 'PRE-MATCH'}</span>
      </div>
      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        <span>Robot</span>
      </div>
    </header>
  );
}
