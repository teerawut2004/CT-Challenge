import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import HomeScreen from './components/HomeScreen';
import LevelSelectionScreen from './components/LevelSelectionScreen';
import GameplayScreen from './components/GameplayScreen';
import BossChallengeScreen from './components/BossChallengeScreen';
import PreMissionScreen from './components/PreMissionScreen';
import RegistrationScreen from './components/RegistrationScreen';
import FeedbackOverlay from './components/FeedbackOverlay';
import { questionsData } from './data/questions';
import { audioSynth } from './utils/audio';

type ScreenType = 'home' | 'map' | 'gameplay' | 'boss' | 'premission' | 'registration';
type FeedbackType = 'correct' | 'incorrect' | 'gameover' | 'level-completed' | null;

export default function App() {
  // --- Game State variables ---
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // --- Student Information States ---
  const [studentName, setStudentName] = useState<string>('');
  const [studentClass, setStudentClass] = useState<string>('');
  const [studentNumber, setStudentNumber] = useState<string>('');

  // --- Character State (Persistent across bases/levels) ---
  const [selectedChar, setSelectedChar] = useState<'kawin' | 'porjai' | null>(null);
  const [characterName, setCharacterName] = useState<string>('');

  // --- Active Level State variables ---
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(3);
  const [correctStreak, setCorrectStreak] = useState<number>(0);

  // --- Feedback Overlay State ---
  const [showFeedback, setShowFeedback] = useState<FeedbackType>(null);
  const [activeHintText, setActiveHintText] = useState<string>('');
  const [justUnlockedLevelId, setJustUnlockedLevelId] = useState<number | null>(null);

  // --- Load progress from Session Storage on mount ---
  useEffect(() => {
    try {
      const savedUnlocked = sessionStorage.getItem('ct_unlocked_levels');
      const savedCompleted = sessionStorage.getItem('ct_completed_levels');
      const savedSound = sessionStorage.getItem('ct_sound_enabled');
      const savedChar = sessionStorage.getItem('ct_selected_char');
      const savedName = sessionStorage.getItem('ct_character_name');
      const savedStudentName = sessionStorage.getItem('ct_student_name');
      const savedStudentClass = sessionStorage.getItem('ct_student_class');
      const savedStudentNumber = sessionStorage.getItem('ct_student_number');

      if (savedUnlocked) setUnlockedLevels(JSON.parse(savedUnlocked));
      if (savedCompleted) setCompletedLevels(JSON.parse(savedCompleted));
      if (savedSound) {
        const soundVal = JSON.parse(savedSound);
        setSoundEnabled(soundVal);
        audioSynth.setMute(!soundVal);
      }
      if (savedChar === 'kawin' || savedChar === 'porjai') {
        setSelectedChar(savedChar);
      }
      if (savedStudentName) {
        setStudentName(savedStudentName);
        setCharacterName(savedStudentName);
      } else if (savedName) {
        setStudentName(savedName);
        setCharacterName(savedName);
      }
      if (savedStudentClass) setStudentClass(savedStudentClass);
      if (savedStudentNumber) setStudentNumber(savedStudentNumber);
    } catch (e) {
      console.error("Failed to read progress from sessionStorage", e);
    }
  }, []);

  // --- Sync mute state and music when currentScreen changes ---
  useEffect(() => {
    if (currentScreen === 'home' || currentScreen === 'map' || currentScreen === 'premission') {
      audioSynth.startBgm('map');
    } else if (currentScreen === 'gameplay' || currentScreen === 'boss') {
      audioSynth.startBgm('focus');
    }
  }, [currentScreen, soundEnabled]);

  // --- Save helper ---
  const saveProgress = (newUnlocked: number[], newCompleted: number[]) => {
    try {
      sessionStorage.setItem('ct_unlocked_levels', JSON.stringify(newUnlocked));
      sessionStorage.setItem('ct_completed_levels', JSON.stringify(newCompleted));
    } catch (e) {
      console.error("Failed to save progress to sessionStorage", e);
    }
  };

  const handleSaveCharacter = (char: 'kawin' | 'porjai', name: string) => {
    setSelectedChar(char);
    setCharacterName(name);
    try {
      sessionStorage.setItem('ct_selected_char', char);
      sessionStorage.setItem('ct_character_name', name);
    } catch (e) {
      console.error("Failed to save character to sessionStorage", e);
    }
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    audioSynth.setMute(!nextVal);
    sessionStorage.setItem('ct_sound_enabled', JSON.stringify(nextVal));
  };

  // --- Navigation actions ---
  const handleStartGame = () => {
    if (studentName && studentClass && studentNumber) {
      setCurrentScreen('map');
    } else {
      setCurrentScreen('registration');
    }
  };

  const handleRegisterStudent = (name: string, klass: string, num: string) => {
    setStudentName(name);
    setStudentClass(klass);
    setStudentNumber(num);
    setCharacterName(name);
    try {
      sessionStorage.setItem('ct_student_name', name);
      sessionStorage.setItem('ct_student_class', klass);
      sessionStorage.setItem('ct_student_number', num);
      sessionStorage.setItem('ct_character_name', name);
    } catch (e) {
      console.error("Failed to save student profile", e);
    }

    setCurrentScreen('map');
  };

  const handleEditProfile = () => {
    setCurrentScreen('registration');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
  };

  const handleSelectLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    setCurrentQuestionIdx(0);
    setHearts(3);
    setCorrectStreak(0);
    setShowFeedback(null);
    if (levelId === 5) {
      setCurrentScreen('boss');
    } else {
      setCurrentScreen('premission');
    }
  };

  // --- Answer evaluation ---
  const handleAnswerSubmit = (isCorrect: boolean, selectedAnswer: any) => {
    const currentLevel = questionsData.find(lvl => lvl.id === currentLevelId);
    if (!currentLevel) return;

    const currentQuestion = currentLevel.questions[currentQuestionIdx];

    if (isCorrect) {
      audioSynth.playSfx('correct');
      const nextStreak = correctStreak + 1;
      setCorrectStreak(nextStreak);

      // Heart recovery rule (Streak x3)
      if (nextStreak === 3) {
        if (hearts < 3) {
          setHearts(prev => prev + 1);
          // Highlight heart regeneration through visual feedback or log
          console.log("Heart restored through 3 correct streak!");
        }
        setCorrectStreak(0); // Reset streak counter after recovery
      }

      // Check if level fully completed
      const isLastQuestion = currentQuestionIdx === currentLevel.questions.length - 1;
      if (isLastQuestion) {
        setShowFeedback('level-completed');
      } else {
        setShowFeedback('correct');
      }
    } 
    else {
      audioSynth.playSfx('wrong');
      setCorrectStreak(0); // Break streak
      const nextHearts = hearts - 1;
      setHearts(nextHearts);

      if (nextHearts === 0) {
        setShowFeedback('gameover');
      } else {
        // Set hint text and show incorrect popup
        setActiveHintText(currentQuestion.hint);
        setShowFeedback('incorrect');
      }
    }
  };

  // --- Automated feedback actions ---
  const handleFeedbackAction = () => {
    if (showFeedback === 'correct') {
      // Move to next question
      setCurrentQuestionIdx(prev => prev + 1);
      setShowFeedback(null);
    } 
    else if (showFeedback === 'incorrect') {
      // Let player retry the same question without penalty (encourages learning)
      setShowFeedback(null);
    } 
    else if (showFeedback === 'gameover') {
      // Reset all progress completely back to Level 1
      setUnlockedLevels([1]);
      setCompletedLevels([]);
      saveProgress([1], []);
      setJustUnlockedLevelId(null);
      setCurrentLevelId(1);
      setCurrentQuestionIdx(0);
      setHearts(3);
      setCorrectStreak(0);
      setCurrentScreen('map');
      setShowFeedback(null);
    } 
    else if (showFeedback === 'level-completed') {
      // Save Level completion and unlock the next level
      let newCompleted = [...completedLevels];
      if (!newCompleted.includes(currentLevelId)) {
        newCompleted.push(currentLevelId);
      }

      let newUnlocked = [...unlockedLevels];
      const nextLevelId = currentLevelId + 1;
      const hasNextLevel = questionsData.some(lvl => lvl.id === nextLevelId);

      if (hasNextLevel && !newUnlocked.includes(nextLevelId)) {
        newUnlocked.push(nextLevelId);
        setJustUnlockedLevelId(nextLevelId); // Flag for map unlock animation
      }

      setCompletedLevels(newCompleted);
      setUnlockedLevels(newUnlocked);
      saveProgress(newUnlocked, newCompleted);

      // Return to galaxy map
      setCurrentScreen('map');
      setShowFeedback(null);
    }
  };

  const handleClearJustUnlocked = useCallback(() => {
    setJustUnlockedLevelId(null);
  }, []);

  // --- Clear Progress helper ---
  const handleResetProgress = () => {
    setUnlockedLevels([1]);
    setCompletedLevels([]);
    setSelectedChar(null);
    setCharacterName('');
    setStudentName('');
    setStudentClass('');
    setStudentNumber('');
    saveProgress([1], []);
    try {
      sessionStorage.removeItem('ct_unlocked_levels');
      sessionStorage.removeItem('ct_completed_levels');
      sessionStorage.removeItem('ct_selected_char');
      sessionStorage.removeItem('ct_character_name');
      sessionStorage.removeItem('ct_student_name');
      sessionStorage.removeItem('ct_student_class');
      sessionStorage.removeItem('ct_student_number');
    } catch (e) {}
    setJustUnlockedLevelId(null);
  };

  const activeLevel = questionsData.find(lvl => lvl.id === currentLevelId);

  return (
    <div className="bg-[#0B0F19] min-h-screen text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* 1. Home Screen */}
      {currentScreen === 'home' && (
        <HomeScreen
          onStartGame={handleStartGame}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Student Registration Screen */}
      {currentScreen === 'registration' && (
        <RegistrationScreen
          onRegister={handleRegisterStudent}
          onBack={handleBackToHome}
          initialName={studentName}
          initialClass={studentClass}
          initialNumber={studentNumber}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* 2. Level Map Selection Screen */}
      {currentScreen === 'map' && (
        <LevelSelectionScreen
          unlockedLevels={unlockedLevels}
          completedLevels={completedLevels}
          onSelectLevel={handleSelectLevel}
          onBack={handleBackToHome}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          justUnlockedLevelId={justUnlockedLevelId}
          onClearJustUnlocked={handleClearJustUnlocked}
          onResetProgress={handleResetProgress}
          studentName={studentName}
          studentClass={studentClass}
          studentNumber={studentNumber}
          onEditProfile={handleEditProfile}
        />
      )}

      {/* Pre-mission Story/Game Screen */}
      {currentScreen === 'premission' && activeLevel && (
        <PreMissionScreen
          levelId={activeLevel.id}
          levelName={activeLevel.name}
          thaiLevelName={activeLevel.thaiName}
          selectedChar={selectedChar}
          characterName={characterName}
          onSaveCharacter={handleSaveCharacter}
          onMissionSuccess={() => {
            if (activeLevel.id === 5) {
              setCurrentScreen('boss');
            } else {
              setCurrentScreen('gameplay');
            }
          }}
          onExit={() => setCurrentScreen('map')}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* 3. Gameplay Screen (Levels 1-4) */}
      {currentScreen === 'gameplay' && activeLevel && (
        <GameplayScreen
          levelId={activeLevel.id}
          levelName={activeLevel.name}
          thaiLevelName={activeLevel.thaiName}
          questions={activeLevel.questions}
          currentQuestionIdx={currentQuestionIdx}
          hearts={hearts}
          characterName={characterName}
          onAnswerSubmit={handleAnswerSubmit}
          onExit={() => {
            setCurrentScreen('map');
          }}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* 4. Boss Challenge Screen (Level 5) */}
      {currentScreen === 'boss' && activeLevel && (
        <BossChallengeScreen
          questions={activeLevel.questions}
          currentQuestionIdx={currentQuestionIdx}
          hearts={hearts}
          characterName={characterName}
          onAnswerSubmit={handleAnswerSubmit}
          onExit={() => {
            setCurrentScreen('map');
          }}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* 5. Automated Feedback Modals */}
      <AnimatePresence>
        {showFeedback && (
          <FeedbackOverlay
            type={showFeedback}
            hintText={activeHintText}
            onAction={handleFeedbackAction}
            starsCount={hearts}
            isFinalLevel={currentLevelId === 5}
            studentName={studentName}
            studentClass={studentClass}
            studentNumber={studentNumber}
            onClearAndExit={() => {
              handleResetProgress();
              setCurrentScreen('home');
              setShowFeedback(null);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
