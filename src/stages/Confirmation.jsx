import { useEntry } from '@frc-web-components/react/networktables';

export default function Confirmation({ selectedAuto, goToStage }) {
  const [fmsInfo] = useEntry('/FMSInfo', {
    EventName: '[No event name]',
    MatchType: '[No match type]',
    MatchNumber: '[No match number]',
    IsRedAlliance: null,
    StationNumber: 1
  });

  const [systemStats] = useEntry('/SystemStats', {
    BatteryVoltage: null,
    TeamNumber: 172,
  });

  const eventName = fmsInfo?.EventName || '[No event name]';
  const matchType = fmsInfo?.MatchType || '[No match type]';
  const matchNumber = fmsInfo?.MatchNumber || '[No match number]';
  const alliance = fmsInfo?.IsRedAlliance ? 'Red' : 'Blue' || '[No alliance]';
  const stationNumber = fmsInfo?.StationNumber || 1;
  const batteryVoltage = systemStats?.BatteryVoltage || '[No voltage]';
  const teamNumber = systemStats?.TeamNumber || '[No team number]';

  return (
    <div className="stage-container">
      <h2 className="stage-title">Confirm Match Information</h2>
      <div className="confirmation-grid">
        <div className="info-card">
          <h3>Team Information</h3>
          <div className="info-row">
            <span className="info-label">Team Number:</span>
            <span className="info-value">{teamNumber}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Event Name:</span>
            <span className="info-value">{eventName}</span>
          </div>
        </div>

        <div className="info-card">
          <h3>Match Assignment</h3>
          <div className="info-row">
            <span className="info-label">Match Type:</span>
            <span className="info-value">{matchType}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Match Number:</span>
            <span className="info-value">{matchNumber}</span>
          </div>
        </div>

        <div className="info-card alliance-card">
          <h3>Alliance & Position</h3>
          <div className="info-row">
            <span className="info-label">Alliance:</span>
            <span className="info-value">{alliance}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Station:</span>
            <span className="info-value">{stationNumber}</span>
          </div>
        </div>

        <div className="info-card auto-card-confirm">
          <h3>Selected Autonomous</h3>
          <div className="auto-display-large">
            <div className="auto-name-large">{selectedAuto?.name || 'None'}</div>
          </div>
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-secondary" onClick={() => goToStage('autoSelection')}>
          ← Back to Auto Selection
        </button>
        <button className="btn btn-primary btn-large" onClick={() => { document.documentElement.requestFullscreen.call(document.documentElement); goToStage('autonomous') }}>
          Start Match / Begin Autonomous →
        </button>
      </div>
    </div>
  );
}
