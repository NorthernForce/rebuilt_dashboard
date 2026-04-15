import { useEntry } from '@frc-web-components/react/networktables';
import { useDiscoveredTabs } from '../hooks/useDiscoveredTabs';

export default function Header({ stage, activeTab, setActiveTab }) {
  const [fmsInfo] = useEntry('/FMSInfo', { IsRedAlliance: false });
  const discoveredTabs = useDiscoveredTabs();

  const isRedAlliance = fmsInfo?.IsRedAlliance || false;
  const type = fmsInfo['.type'] || '';
  const connected = type !== '';

  const stageNames = {
    autoSelection: 'AUTO SELECTION',
    confirmation:  'CONFIRMATION',
    autonomous:    'AUTONOMOUS',
    teleop:        'TELEOPERATED',
    postGame:      'POST-GAME',
  };

  const allianceClass = isRedAlliance ? 'alliance-red' : 'alliance-blue';
  const allianceText  = isRedAlliance ? 'RED ALLIANCE' : 'BLUE ALLIANCE';

  // Tab order: Match first, then any NT-discovered tabs (including Developer if backend registers it)
  const allTabs = ['Match', ...discoveredTabs];

  const stageIndicator =
    activeTab === 'Match'
      ? (stageNames[stage] || 'PRE-MATCH')
      : activeTab.toUpperCase();

  return (
    <header className="dashboard-header">
      <div className="team-info">
        <h1>Team 172</h1>
        <span className={`alliance-indicator ${allianceClass}`}>{allianceText}</span>
      </div>

      <div className="match-info">
        <div className="mode-tabs" role="tablist" aria-label="Dashboard tab">
          {allTabs.map(tab => (
            <button
              key={tab}
              type="button"
              className={`mode-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
            >
              {tab}
            </button>
          ))}
        </div>
        <span className="match-time" id="matchTime">0:00</span>
        <span className="stage-indicator">{stageIndicator}</span>
      </div>

      <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        <span>Robot</span>
      </div>
    </header>
  );
}
