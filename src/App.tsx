import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import HomeScreen from './components/HomeScreen';
import TravelMissionScreen from './components/TravelMissionScreen';
import GameplayScreen from './components/GameplayScreen';
import BossChallengeScreen from './components/BossChallengeScreen';
import FinalDashboardScreen from './components/FinalDashboardScreen';
import FeedbackOverlay from './components/FeedbackOverlay';
import DeveloperCreditFooter from './components/DeveloperCreditFooter';
import { questionsData, Question } from './data/questions';
import { audioSynth } from './utils/audio';
import { getRandomizedQuestionsForLevel } from './utils/questionRandomizer';

type ScreenType = 'home' | 'grid-mission' | 'gameplay' | 'boss' | 'final-dashboard';
type FeedbackType = 'correct' | 'incorrect' | 'gameover' | 'level-completed' | null;

export default function App() {
  // --- Game State variables ---
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(4);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // --- Traveler Information States ---
  const [travelerName, setTravelerName] = useState<string>('');
  const [travelerGender, setTravelerGender] = useState<'female' | 'male'>('female');

  // --- Active Level State variables ---
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(3);
  const [correctStreak, setCorrectStreak] = useState<number>(0);

  // --- Scoring and Analytics States ---
  const [levelScores, setLevelScores] = useState<Record<number, number>>({ 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 });
  const [levelGridScores, setLevelGridScores] = useState<Record<number, number>>({ 1: 90, 2: 90, 3: 90, 4: 90, 5: 90 });
  const [levelGridBlocksUsed, setLevelGridBlocksUsed] = useState<Record<number, { blocks: number; usedLoop: boolean }>>({
    1: { blocks: 10, usedLoop: true },
    2: { blocks: 9, usedLoop: true },
    3: { blocks: 11, usedLoop: true },
    4: { blocks: 12, usedLoop: true },
    5: { blocks: 13, usedLoop: true },
  });

  // --- Feedback Overlay State ---
  const [showFeedback, setShowFeedback] = useState<FeedbackType>(null);
  const [activeHintText, setActiveHintText] = useState<string>('');

  // --- Load progress from Session Storage on mount ---
  useEffect(() => {
    try {
      const savedUnlocked = sessionStorage.getItem('ct_max_unlocked_level');
      const savedCompleted = sessionStorage.getItem('ct_completed_levels');
      const savedSound = sessionStorage.getItem('ct_sound_enabled');
      const savedName = sessionStorage.getItem('ct_traveler_name') || sessionStorage.getItem('ct_student_name');
      const savedGender = sessionStorage.getItem('ct_traveler_gender');
      const savedScores = sessionStorage.getItem('ct_level_scores');
      const savedGridScores = sessionStorage.getItem('ct_level_grid_scores');
      const savedGridBlocks = sessionStorage.getItem('ct_level_grid_blocks');

      if (savedUnlocked) setMaxUnlockedLevel(Math.max(4, JSON.parse(savedUnlocked)));
      if (savedCompleted) setCompletedLevels(JSON.parse(savedCompleted));
      if (savedScores) setLevelScores(JSON.parse(savedScores));
      if (savedGridScores) setLevelGridScores(JSON.parse(savedGridScores));
      if (savedGridBlocks) setLevelGridBlocksUsed(JSON.parse(savedGridBlocks));

      if (savedSound) {
        const soundVal = JSON.parse(savedSound);
        setSoundEnabled(soundVal);
        audioSynth.setMute(!soundVal);
      }
      if (savedName) {
        setTravelerName(savedName);
      }
      if (savedGender === 'female' || savedGender === 'male') {
        setTravelerGender(savedGender);
      }
    } catch (e) {
      console.error("Failed to read progress from sessionStorage", e);
    }
  }, []);

  // --- Sync mute state and music when currentScreen changes ---
  useEffect(() => {
    if (currentScreen === 'home' || currentScreen === 'grid-mission' || currentScreen === 'final-dashboard') {
      audioSynth.startBgm('map');
    } else if (currentScreen === 'gameplay' || currentScreen === 'boss') {
      audioSynth.startBgm('focus');
    }
  }, [currentScreen, soundEnabled]);

  // --- Audio Toggle ---
  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    audioSynth.setMute(!nextVal);
    try {
      sessionStorage.setItem('ct_sound_enabled', JSON.stringify(nextVal));
    } catch (e) {}
  };

  // --- Start Adventure from Home ---
  const handleStartAdventure = (name: string, gender: 'female' | 'male') => {
    setTravelerName(name);
    setTravelerGender(gender);
    try {
      sessionStorage.setItem('ct_traveler_name', name);
      sessionStorage.setItem('ct_student_name', name);
      sessionStorage.setItem('ct_traveler_gender', gender);
    } catch (e) {}

    // Start at the first uncompleted level among 1-4, or level 1
    const firstUncompleted = [1, 2, 3, 4].find(id => !completedLevels.includes(id)) || 1;
    setCurrentLevelId(firstUncompleted);
    setHearts(3);
    setCurrentScreen('grid-mission');
  };

  // --- Grid Mission Success -> Advance to Next Level or Replay Current Level ---
  const handleGridMissionSuccess = (
    levelId: number,
    earnedPoints: number,
    blocksCount: number,
    usedLoop: boolean,
    action: 'next' | 'replay' = 'next'
  ) => {
    // Record grid travel stats
    const updatedGridScores = { ...levelGridScores, [levelId]: earnedPoints };
    const updatedGridBlocks = { ...levelGridBlocksUsed, [levelId]: { blocks: blocksCount, usedLoop } };
    setLevelGridScores(updatedGridScores);
    setLevelGridBlocksUsed(updatedGridBlocks);

    // Save Level completion & star score
    const newCompleted = completedLevels.includes(levelId)
      ? completedLevels
      : [...completedLevels, levelId];
    setCompletedLevels(newCompleted);

    const nextScores = { ...levelScores, [levelId]: Math.max(1, hearts) };
    setLevelScores(nextScores);

    const allFourCompleted = [1, 2, 3, 4].every(id => newCompleted.includes(id));
    const newMaxUnlocked = allFourCompleted ? 5 : Math.max(4, maxUnlockedLevel);
    setMaxUnlockedLevel(newMaxUnlocked);

    try {
      sessionStorage.setItem('ct_level_grid_scores', JSON.stringify(updatedGridScores));
      sessionStorage.setItem('ct_level_grid_blocks', JSON.stringify(updatedGridBlocks));
      sessionStorage.setItem('ct_completed_levels', JSON.stringify(newCompleted));
      sessionStorage.setItem('ct_level_scores', JSON.stringify(nextScores));
      sessionStorage.setItem('ct_max_unlocked_level', JSON.stringify(newMaxUnlocked));
    } catch (e) {}

    setShowFeedback(null);

    if (action === 'replay') {
      // Stay on current level and restore hearts
      setHearts(3);
      setCurrentScreen('grid-mission');
      return;
    }

    // Advance to next uncompleted level among 1-4, or Level 5, or Final Dashboard
    if (levelId >= 5) {
      setCurrentScreen('final-dashboard');
    } else {
      const nextUncompletedIn1To4 = [1, 2, 3, 4].find(id => !newCompleted.includes(id));
      if (nextUncompletedIn1To4) {
        setCurrentLevelId(nextUncompletedIn1To4);
        setHearts(3);
        setCurrentScreen('grid-mission');
      } else {
        setCurrentLevelId(5);
        setHearts(3);
        setCurrentScreen('grid-mission');
      }
    }
  };

  // --- Answer evaluation in Quiz ---
  const handleAnswerSubmit = (isCorrect: boolean, selectedAnswer: any) => {
    const currentLevel = questionsData.find(lvl => lvl.id === currentLevelId);
    const currentQuestionsList = activeQuestions.length > 0 ? activeQuestions : (currentLevel?.questions || []);
    if (!currentQuestionsList || currentQuestionsList.length === 0) return;

    const currentQuestion = currentQuestionsList[currentQuestionIdx];
    if (!currentQuestion) return;

    if (isCorrect) {
      audioSynth.playSfx('correct');
      const nextStreak = correctStreak + 1;
      setCorrectStreak(nextStreak);

      // Check if level fully completed
      const isLastQuestion = currentQuestionIdx === currentQuestionsList.length - 1;
      if (isLastQuestion) {
        setShowFeedback('level-completed');
      } else {
        setShowFeedback('correct');
      }
    } else {
      audioSynth.playSfx('wrong');
      setCorrectStreak(0);
      const feedbackMessage = currentQuestion.debugHint 
        ? `🔍 ${currentQuestion.debugHint}\n\n💡 คำแนะนำ: ${currentQuestion.hint}`
        : currentQuestion.hint;
      setActiveHintText(feedbackMessage);
      setShowFeedback('incorrect');
    }
  };

  // --- Feedback Overlay Actions ---
  const handleFeedbackAction = () => {
    if (showFeedback === 'correct') {
      setCurrentQuestionIdx(prev => prev + 1);
      setShowFeedback(null);
    } 
    else if (showFeedback === 'incorrect') {
      setShowFeedback(null);
    } 
    else if (showFeedback === 'gameover') {
      // Restart current level
      const qs = getRandomizedQuestionsForLevel(currentLevelId, 1);
      setActiveQuestions(qs);
      setCurrentQuestionIdx(0);
      setHearts(3);
      setCorrectStreak(0);
      setShowFeedback(null);
      setCurrentScreen('grid-mission');
    } 
    else if (showFeedback === 'level-completed') {
      // Save Level completion
      const newCompleted = completedLevels.includes(currentLevelId)
        ? completedLevels
        : [...completedLevels, currentLevelId];
      setCompletedLevels(newCompleted);

      // Save question star score based on remaining hearts
      const nextScores = { ...levelScores, [currentLevelId]: Math.max(1, hearts) };
      setLevelScores(nextScores);

      try {
        sessionStorage.setItem('ct_completed_levels', JSON.stringify(newCompleted));
        sessionStorage.setItem('ct_level_scores', JSON.stringify(nextScores));
      } catch (e) {}

      setShowFeedback(null);

      // Check if all 5 levels completed
      if (currentLevelId >= 5) {
        setCurrentScreen('final-dashboard');
      } else {
        // Unlock next level and advance to next level's Grid Mission
        const nextLevel = currentLevelId + 1;
        const newMaxUnlocked = Math.max(maxUnlockedLevel, nextLevel);
        setMaxUnlockedLevel(newMaxUnlocked);
        try {
          sessionStorage.setItem('ct_max_unlocked_level', JSON.stringify(newMaxUnlocked));
        } catch (e) {}

        setCurrentLevelId(nextLevel);
        setHearts(3);
        setCurrentScreen('grid-mission');
      }
    }
  };

  // --- Reset All Progress helper (Play Again) ---
  const handlePlayAgain = () => {
    try {
      sessionStorage.removeItem('ct_max_unlocked_level');
      sessionStorage.removeItem('ct_completed_levels');
      sessionStorage.removeItem('ct_level_scores');
      sessionStorage.removeItem('ct_level_grid_scores');
      sessionStorage.removeItem('ct_level_grid_blocks');
    } catch (e) {}

    setMaxUnlockedLevel(4);
    setCompletedLevels([]);
    setCurrentLevelId(1);
    setLevelScores({ 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 });
    setLevelGridScores({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    setLevelGridBlocksUsed({
      1: { blocks: 0, usedLoop: false },
      2: { blocks: 0, usedLoop: false },
      3: { blocks: 0, usedLoop: false },
      4: { blocks: 0, usedLoop: false },
      5: { blocks: 0, usedLoop: false },
    });
    setCurrentScreen('home');
  };

  // Calculate total accumulated score (grid mission points + quiz points)
  const totalGridPoints = (Object.values(levelGridScores) as number[]).reduce((a, b) => a + b, 0);
  const totalQuizPoints = (Object.values(levelScores) as number[]).reduce((a, b) => a + (b * 20), 0);
  const totalAccumulatedScore = totalGridPoints + totalQuizPoints;

  const activeLevel = questionsData.find(lvl => lvl.id === currentLevelId);

  return (
    <div className="bg-[#0B0F19] h-screen w-screen overflow-hidden flex flex-col text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative">
        {/* 1. Home Screen (Title + Rules modal + Traveler Profile Creation) */}
        {currentScreen === 'home' && (
          <HomeScreen
            onStartAdventure={handleStartAdventure}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />
        )}

        {/* 2. Main Game Screen: Grid Travel Mission Screen (5x5 Matrix + Console) */}
        {currentScreen === 'grid-mission' && (
          <TravelMissionScreen
            currentLevelId={currentLevelId}
            maxUnlockedLevel={maxUnlockedLevel}
            completedLevels={completedLevels}
            travelerName={travelerName}
            travelerGender={travelerGender}
            hearts={hearts}
            onHeartsChange={setHearts}
            totalAccumulatedScore={totalAccumulatedScore}
            levelGridScores={levelGridScores}
            levelGridBlocksUsed={levelGridBlocksUsed}
            onLevelChange={(newLevelId) => setCurrentLevelId(newLevelId)}
            onMissionSuccess={handleGridMissionSuccess}
            onExitToHome={() => setCurrentScreen('home')}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />
        )}

        {/* 3. Gameplay Screen: CT Questions for Levels 1-4 */}
        {currentScreen === 'gameplay' && activeLevel && (
          <GameplayScreen
            levelId={activeLevel.id}
            levelName={activeLevel.name}
            thaiLevelName={activeLevel.thaiName}
            questions={activeQuestions.length > 0 ? activeQuestions : activeLevel.questions}
            currentQuestionIdx={currentQuestionIdx}
            hearts={hearts}
            characterName={travelerName}
            onAnswerSubmit={handleAnswerSubmit}
            onExit={() => {
              setCurrentScreen('grid-mission');
            }}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />
        )}

        {/* 4. Boss Challenge Screen: CT Questions for Level 5 */}
        {currentScreen === 'boss' && activeLevel && (
          <BossChallengeScreen
            questions={activeQuestions.length > 0 ? activeQuestions : activeLevel.questions}
            currentQuestionIdx={currentQuestionIdx}
            hearts={hearts}
            characterName={travelerName}
            onAnswerSubmit={handleAnswerSubmit}
            onExit={() => {
              setCurrentScreen('grid-mission');
            }}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />
        )}

        {/* 5. Final Tech Analytics Dashboard Screen (Automatic after completing all 5 levels) */}
        {currentScreen === 'final-dashboard' && (
          <FinalDashboardScreen
            travelerName={travelerName}
            travelerGender={travelerGender}
            totalAccumulatedScore={totalAccumulatedScore}
            levelScores={levelScores}
            levelGridScores={levelGridScores}
            levelGridBlocksUsed={levelGridBlocksUsed}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </div>

      {/* Feedback Overlay Modals (Correct / Incorrect Hint / Level Completed / Game Over) */}
      <AnimatePresence>
        {showFeedback && (
          <FeedbackOverlay
            type={showFeedback}
            hintText={activeHintText}
            onAction={handleFeedbackAction}
            onReplayLevel={() => {
              setShowFeedback(null);
              setHearts(3);
              setCurrentScreen('grid-mission');
            }}
            levelId={currentLevelId}
            starsCount={hearts}
            isFinalLevel={currentLevelId === 5}
            studentName={travelerName}
            studentClass="ม.2"
            studentNumber="-"
            levelScores={levelScores}
            onClearAndExit={() => {
              handlePlayAgain();
              setShowFeedback(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Developer Credit Footer for in-app screens */}
      {currentScreen !== 'home' && (
        <DeveloperCreditFooter />
      )}

    </div>
  );
}
