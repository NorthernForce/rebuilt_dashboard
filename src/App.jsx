import { useState } from 'react';
import Header from './components/Header';
import AutoSelection from './stages/AutoSelection';
import Confirmation from './stages/Confirmation';
import Autonomous from './stages/Autonomous';
import Teleop from './stages/Teleop';
import PostGame from './stages/PostGame';

export default function App() {
  const [stage, setStage] = useState('autoSelection');
  const [selectedAuto, setSelectedAuto] = useState(null);
  const [matchStats, setMatchStats] = useState({
    totalPoints: 0,
    autoPoints: 0,
    teleopPoints: 0,
    endGamePoints: 0
  });

  const goToStage = (newStage) => {
    console.log('Switching to stage:', newStage);
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
      <Header stage={stage} />
      <main id="mainContent">
        {stage === 'autoSelection' && (
          <AutoSelection 
            selectedAuto={selectedAuto}
            setSelectedAuto={setSelectedAuto}
            goToStage={goToStage}
          />
        )}
        {stage === 'confirmation' && (
          <Confirmation 
            selectedAuto={selectedAuto}
            goToStage={goToStage}
          />
        )}
        {stage === 'autonomous' && (
          <Autonomous 
            selectedAuto={selectedAuto}
            goToStage={goToStage}
          />
        )}
        {stage === 'teleop' && (
          <Teleop 
            goToStage={goToStage}
            setMatchStats={setMatchStats}
          />
        )}
        {stage === 'postGame' && (
          <PostGame 
            matchStats={matchStats}
            resetDashboard={resetDashboard}
          />
        )}
      </main>
    </div>
  );
}
