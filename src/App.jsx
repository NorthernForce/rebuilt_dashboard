import { useState } from 'react';
import Header from './components/Header';
import AutoSelection from './stages/AutoSelection';
import Confirmation from './stages/Confirmation';
import Autonomous from './stages/Autonomous';
import Teleop from './stages/Teleop';
import PostGame from './stages/PostGame';
import DeveloperDashboard from './stages/DeveloperDashboard';

export default function App() {
  const [stage, setStage] = useState('autoSelection');
  const [viewMode, setViewMode] = useState('driver');
  const [selectedAuto, setSelectedAuto] = useState(null);
  const [matchStats, setMatchStats] = useState({
    totalPoints: 0,
    autoPoints: 0,
    teleopPoints: 0,
    endGamePoints: 0
  });

  const goToStage = (newStage) => {
    // console.log('Switching to stage:', newStage);
    setStage(newStage);
  };

  const resetDashboard = () => {
    setSelectedAuto(null);
    setMatchStats({
      totalPoints: 0,
      autoPoints: 0,
      teleopPoints: 0,
      endGamePoints: 0
    });
    goToStage('autoSelection');
  };

  return (
    <div id="app">
      <Header stage={stage} viewMode={viewMode} setViewMode={setViewMode} />
      <main id="mainContent">
        {viewMode === 'developer' && <DeveloperDashboard />}

        {viewMode === 'driver' && stage === 'autoSelection' && (
          <AutoSelection 
            selectedAuto={selectedAuto}
            setSelectedAuto={setSelectedAuto}
            goToStage={goToStage}
          />
        )}
        {viewMode === 'driver' && stage === 'confirmation' && (
          <Confirmation 
            selectedAuto={selectedAuto}
            goToStage={goToStage}
          />
        )}
        {viewMode === 'driver' && stage === 'autonomous' && (
          <Autonomous 
            selectedAuto={selectedAuto}
            goToStage={goToStage}
          />
        )}
        {viewMode === 'driver' && stage === 'teleop' && (
          <Teleop 
            goToStage={goToStage}
            setMatchStats={setMatchStats}
          />
        )}
        {viewMode === 'driver' && stage === 'postGame' && (
          <PostGame 
            matchStats={matchStats}
            resetDashboard={resetDashboard}
          />
        )}
      </main>
    </div>
  );
}
