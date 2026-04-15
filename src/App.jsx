import { useState } from 'react';
import Header from './components/Header';
import AutoSelection from './stages/AutoSelection';
import Confirmation from './stages/Confirmation';
import Autonomous from './stages/Autonomous';
import Teleop from './stages/Teleop';
import PostGame from './stages/PostGame';
import NTTabView from './stages/NTTabView';

export default function App() {
  const [stage, setStage] = useState('autoSelection');
  const [activeTab, setActiveTab] = useState('Match');
  const [selectedAuto, setSelectedAuto] = useState(null);
  const [matchStats, setMatchStats] = useState({
    totalPoints: 0,
    autoPoints: 0,
    teleopPoints: 0,
    endGamePoints: 0
  });

  const goToStage = (newStage) => setStage(newStage);

  const resetDashboard = () => {
    setSelectedAuto(null);
    setMatchStats({ totalPoints: 0, autoPoints: 0, teleopPoints: 0, endGamePoints: 0 });
    goToStage('autoSelection');
  };

  return (
    <div id="app">
      <Header stage={stage} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main id="mainContent">
        {/* Match tab — pre-match flow + NT-driven content during play */}
        {activeTab === 'Match' && stage === 'autoSelection' && (
          <AutoSelection
            selectedAuto={selectedAuto}
            setSelectedAuto={setSelectedAuto}
            goToStage={goToStage}
          />
        )}
        {activeTab === 'Match' && stage === 'confirmation' && (
          <Confirmation
            selectedAuto={selectedAuto}
            goToStage={goToStage}
          />
        )}
        {activeTab === 'Match' && stage === 'autonomous' && (
          <Autonomous
            selectedAuto={selectedAuto}
            goToStage={goToStage}
          />
        )}
        {activeTab === 'Match' && stage === 'teleop' && (
          <Teleop
            goToStage={goToStage}
            setMatchStats={setMatchStats}
          />
        )}
        {activeTab === 'Match' && stage === 'postGame' && (
          <PostGame
            matchStats={matchStats}
            resetDashboard={resetDashboard}
          />
        )}

        {/* Dynamic tabs — any NT-discovered tab other than Match */}
        {activeTab !== 'Match' && (
          <NTTabView tabName={activeTab} layout="full" />
        )}
      </main>
    </div>
  );
}
