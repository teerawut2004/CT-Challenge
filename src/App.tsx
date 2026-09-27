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

export type GridDiagnosticEventType = 'obstacle_hit' | 'target_error' | 'loop_missed' | 'grid_reset';

export interface LevelDiagnosticStats {
  totalMistakes: number; // จำนวนครั้งที่ทำผิดสะสมตลอดการเล่นในด่านนั้นตั้งแต่รอบแรก (ตาราง 5x5 + แบบฝึกหัด)
  retryCount: number;    // จำนวนรอบที่เริ่มใหม่สะสม (รีเซ็ตตาราง 5x5 + เริ่มด่านใหม่)
  // สถิติภารกิจเดินตาราง 5x5
  gridMistakes?: number;
  gridObstaclesHit?: number;
  gridTargetErrors?: number;
  gridLoopMissed?: number;
  gridResets?: number;
  gridRuns?: number;
  blocksUsed?: number;
  targetBlocks3Star?: number;
  usedLoop?: boolean;
  gridCompleted?: boolean;
  // สถิติแบบฝึกหัดวัดทักษะท้ายด่าน / ภารกิจสรุปรวบยอดด่าน 5 (Boss Challenge)
  exerciseMistakes?: number;
  exerciseRetries?: number;
  bossWrongPillars?: number[]; // รหัสทักษะ (1-4) ที่เคยตอบผิดใน Boss Challenge ด่านที่ 5
}

export const TARGET_BLOCKS_BY_LEVEL: Record<number, number> = {
  1: 9,
  2: 10,
  3: 12,
  4: 14,
  5: 15,
};

export const DEFAULT_LEVEL_DIAGNOSTICS: Record<number, LevelDiagnosticStats> = {
  1: {
    totalMistakes: 0,
    retryCount: 0,
    gridMistakes: 0,
    gridObstaclesHit: 0,
    gridTargetErrors: 0,
    gridLoopMissed: 0,
    gridResets: 0,
    gridRuns: 0,
    blocksUsed: 9,
    targetBlocks3Star: 9,
    usedLoop: true,
    gridCompleted: false,
    exerciseMistakes: 0,
    exerciseRetries: 0,
  },
  2: {
    totalMistakes: 0,
    retryCount: 0,
    gridMistakes: 0,
    gridObstaclesHit: 0,
    gridTargetErrors: 0,
    gridLoopMissed: 0,
    gridResets: 0,
    gridRuns: 0,
    blocksUsed: 10,
    targetBlocks3Star: 10,
    usedLoop: true,
    gridCompleted: false,
    exerciseMistakes: 0,
    exerciseRetries: 0,
  },
  3: {
    totalMistakes: 0,
    retryCount: 0,
    gridMistakes: 0,
    gridObstaclesHit: 0,
    gridTargetErrors: 0,
    gridLoopMissed: 0,
    gridResets: 0,
    gridRuns: 0,
    blocksUsed: 12,
    targetBlocks3Star: 12,
    usedLoop: true,
    gridCompleted: false,
    exerciseMistakes: 0,
    exerciseRetries: 0,
  },
  4: {
    totalMistakes: 0,
    retryCount: 0,
    gridMistakes: 0,
    gridObstaclesHit: 0,
    gridTargetErrors: 0,
    gridLoopMissed: 0,
    gridResets: 0,
    gridRuns: 0,
    blocksUsed: 14,
    targetBlocks3Star: 14,
    usedLoop: true,
    gridCompleted: false,
    exerciseMistakes: 0,
    exerciseRetries: 0,
  },
  5: {
    totalMistakes: 0,
    retryCount: 0,
    gridMistakes: 0,
    gridObstaclesHit: 0,
    gridTargetErrors: 0,
    gridLoopMissed: 0,
    gridResets: 0,
    gridRuns: 0,
    blocksUsed: 15,
    targetBlocks3Star: 15,
    usedLoop: true,
    gridCompleted: false,
    exerciseMistakes: 0,
    exerciseRetries: 0,
  },
};

export function calculateTrueSkillScore(
  stats?: LevelDiagnosticStats,
  levelId: number = 1,
  gridBlockInfo?: { blocks: number; usedLoop: boolean },
  level5Stats?: LevelDiagnosticStats,
  level5BlockInfo?: { blocks: number; usedLoop: boolean }
): {
  score: number;
  gridScore: number;      // เต็ม 50 คะแนน (สำหรับด่าน 1-4) หรือคะแนนตาราง 5x5
  exerciseScore: number;  // เต็ม 50 คะแนน (สำหรับด่าน 1-4)
  gridPercent: number;    // คิดเป็น % เต็ม 100 ของภารกิจตาราง 5x5
  exercisePercent: number;// คิดเป็น % เต็ม 100 ของแบบฝึกหัด
  stars: number;
  tier: string;
  shortTier: string;
  totalMistakes: number;
  retryCount: number;
  gridMistakes: number;
  gridObstaclesHit: number;
  gridTargetErrors: number;
  gridLoopMissed: number;
  gridResets: number;
  exerciseMistakes: number;
  exerciseRetries: number;
  blocksUsed: number;
  targetBlocks3Star: number;
  usedLoop: boolean;
  bossMissedInPillar: boolean;
} {
  const targetBlocks3Star = stats?.targetBlocks3Star || TARGET_BLOCKS_BY_LEVEL[levelId] || 12;
  const blocksUsed =
    stats?.blocksUsed && stats.blocksUsed > 0
      ? stats.blocksUsed
      : gridBlockInfo?.blocks && gridBlockInfo.blocks > 0
      ? gridBlockInfo.blocks
      : targetBlocks3Star;
  const usedLoop = stats?.usedLoop ?? gridBlockInfo?.usedLoop ?? true;

  const gridObstaclesHit = stats?.gridObstaclesHit ?? 0;
  const gridTargetErrors = stats?.gridTargetErrors ?? 0;
  const gridLoopMissed = stats?.gridLoopMissed ?? 0;
  const gridMistakes = stats?.gridMistakes ?? (gridObstaclesHit + gridTargetErrors + gridLoopMissed);
  const gridResets = stats?.gridResets ?? 0;

  const fallbackTotalMistakes = stats?.totalMistakes ?? 0;
  const fallbackRetryCount = stats?.retryCount ?? 0;

  const exerciseMistakes =
    stats?.exerciseMistakes !== undefined
      ? stats.exerciseMistakes
      : Math.max(0, fallbackTotalMistakes - gridMistakes);
  const exerciseRetries =
    stats?.exerciseRetries !== undefined
      ? stats.exerciseRetries
      : Math.max(0, fallbackRetryCount - gridResets);

  const totalMistakes = gridMistakes + exerciseMistakes;
  const retryCount = gridResets + exerciseRetries;

  // 1. คำนวณคะแนนภารกิจเดินตาราง 5x5 (เต็ม 50 คะแนน)
  const excessBlocks = Math.max(0, blocksUsed - targetBlocks3Star);
  const blockPenalty = Math.min(12, excessBlocks * 2);
  const loopPenalty = !usedLoop ? 10 : gridLoopMissed > 0 ? Math.min(8, gridLoopMissed * 5) : 0;
  const gridErrorPenalty = gridObstaclesHit * 6 + gridTargetErrors * 5 + gridResets * 2;

  let rawGridScore50 = 50 - blockPenalty - loopPenalty - gridErrorPenalty;

  // หากเป็นการประเมินทักษะ 4 ด้าน และผู้เล่นผ่านด่านที่ 5 (ด่านบูรณาการตาราง 5x5) แล้ว ให้นำผลตาราง 5x5 ด่านที่ 5 มาร่วมถ่วงน้ำหนักตามมิติทักษะ
  if (levelId >= 1 && levelId <= 4 && level5Stats?.gridCompleted) {
    const l5Target = level5Stats.targetBlocks3Star || TARGET_BLOCKS_BY_LEVEL[5];
    const l5Blocks =
      level5Stats.blocksUsed && level5Stats.blocksUsed > 0
        ? level5Stats.blocksUsed
        : level5BlockInfo?.blocks && level5BlockInfo.blocks > 0
        ? level5BlockInfo.blocks
        : l5Target;
    const l5Loop = level5Stats.usedLoop ?? level5BlockInfo?.usedLoop ?? true;
    const l5Excess = Math.max(0, l5Blocks - l5Target);

    let l5PillarScore50 = 50;
    if (levelId === 1) {
      // ด้านที่ 1 Decomposition: เน้นความแม่นยำในการแบ่งช่วงเก็บเป้าหมายในด่าน 5
      l5PillarScore50 = 50 - (level5Stats.gridTargetErrors ?? 0) * 6 - (level5Stats.gridResets ?? 0) * 2;
    } else if (levelId === 2) {
      // ด้านที่ 2 Pattern Recognition: เน้นการใช้ลูปและไม่ลืมใช้ลูปรอบแรกในด่าน 5
      l5PillarScore50 = 50 - (!l5Loop ? 15 : 0) - (level5Stats.gridLoopMissed ?? 0) * 6 - Math.min(10, l5Excess * 2);
    } else if (levelId === 3) {
      // ด้านที่ 3 Abstraction: เน้นการหลบหลีกสิ่งกีดขวางและแยกแยะเพชรในด่าน 5
      l5PillarScore50 = 50 - (level5Stats.gridObstaclesHit ?? 0) * 7 - (level5Stats.gridTargetErrors ?? 0) * 4;
    } else if (levelId === 4) {
      // ด้านที่ 4 Algorithm Design: เน้นประสิทธิภาพจำนวนบล็อกและการวางลำดับคำสั่งในด่าน 5
      l5PillarScore50 = 50 - Math.min(15, l5Excess * 3) - (level5Stats.gridResets ?? 0) * 3 - (level5Stats.gridMistakes ?? 0) * 3;
    }
    l5PillarScore50 = Math.max(10, Math.min(50, l5PillarScore50));
    rawGridScore50 = Math.round(rawGridScore50 * 0.8 + l5PillarScore50 * 0.2);
  }

  const gridScore = Math.max(10, Math.min(50, Math.round(rawGridScore50)));
  const gridPercent = Math.round((gridScore / 50) * 100);

  // 2. คำนวณคะแนนแบบฝึกหัดวัดทักษะท้ายด่าน / ภารกิจสรุปรวบยอด Boss Challenge (เต็ม 50 คะแนน สำหรับด่าน 1-5)
  const bossMissedInPillar =
    levelId >= 1 && levelId <= 4 && Array.isArray(level5Stats?.bossWrongPillars)
      ? level5Stats!.bossWrongPillars!.includes(levelId)
      : false;
  const bossPillarPenalty = bossMissedInPillar ? 4 : 0;
  const rawExerciseScore50 = 50 - exerciseMistakes * 10 - exerciseRetries * 5 - bossPillarPenalty;
  const exerciseScore = Math.max(10, Math.min(50, Math.round(rawExerciseScore50)));
  const exercisePercent = Math.round((exerciseScore / 50) * 100);

  // 3. คะแนนประเมินทักษะรวม (ภารกิจเดินตาราง 5x5 [50] + แบบฝึกหัด/Boss Challenge [50] = 100%)
  const score = Math.max(20, Math.min(100, gridScore + exerciseScore));

  const stars = score >= 85 ? 3 : score >= 65 ? 2 : 1;
  const tier =
    score >= 85
      ? 'ดีเยี่ยม (มีทักษะด้านนี้ชัดเจน)'
      : score >= 65
      ? 'ปานกลาง (พอใช้แต่ควรทบทวน)'
      : 'ควรเสริมทักษะด้านนี้';
  const shortTier = score >= 85 ? 'ดีเยี่ยม' : score >= 65 ? 'ปานกลาง' : 'ควรเสริมทักษะ';

  return {
    score,
    gridScore,
    exerciseScore,
    gridPercent,
    exercisePercent,
    stars,
    tier,
    shortTier,
    totalMistakes,
    retryCount,
    gridMistakes,
    gridObstaclesHit,
    gridTargetErrors,
    gridLoopMissed,
    gridResets,
    exerciseMistakes,
    exerciseRetries,
    blocksUsed,
    targetBlocks3Star,
    usedLoop,
    bossMissedInPillar,
  };
}

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
  const [levelDiagnostics, setLevelDiagnostics] = useState<Record<number, LevelDiagnosticStats>>(DEFAULT_LEVEL_DIAGNOSTICS);
  const [levelGridScores, setLevelGridScores] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
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
      const savedDiagnostics = sessionStorage.getItem('ct_level_diagnostics');
      const savedGridScores = sessionStorage.getItem('ct_level_grid_scores');
      const savedGridBlocks = sessionStorage.getItem('ct_level_grid_blocks');

      if (savedUnlocked) setMaxUnlockedLevel(Math.max(4, JSON.parse(savedUnlocked)));
      if (savedCompleted) setCompletedLevels(JSON.parse(savedCompleted));
      if (savedScores) setLevelScores(JSON.parse(savedScores));
      if (savedDiagnostics) setLevelDiagnostics({ ...DEFAULT_LEVEL_DIAGNOSTICS, ...JSON.parse(savedDiagnostics) });
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

  // --- Record cumulative mistake in an exercise (never reset when hearts reset) ---
  const handleRecordMistake = useCallback((levelId: number, wrongPillarIds?: number[]) => {
    setLevelDiagnostics(prev => {
      const current = prev[levelId] || DEFAULT_LEVEL_DIAGNOSTICS[levelId] || { totalMistakes: 0, retryCount: 0 };
      const nextExerciseMistakes = (current.exerciseMistakes ?? 0) + 1;
      const nextGridMistakes = current.gridMistakes ?? 0;
      const existingWrongPillars = current.bossWrongPillars ?? [];
      const nextBossWrongPillars =
        wrongPillarIds && wrongPillarIds.length > 0
          ? Array.from(new Set([...existingWrongPillars, ...wrongPillarIds]))
          : existingWrongPillars;

      const updated = {
        ...prev,
        [levelId]: {
          ...current,
          exerciseMistakes: nextExerciseMistakes,
          totalMistakes: nextGridMistakes + nextExerciseMistakes,
          bossWrongPillars: nextBossWrongPillars,
        },
      };
      try {
        sessionStorage.setItem('ct_level_diagnostics', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // --- Record level retry count (when hearts reach 0 or student restarts the level) ---
  const handleRecordRetry = useCallback((levelId: number) => {
    setLevelDiagnostics(prev => {
      const current = prev[levelId] || DEFAULT_LEVEL_DIAGNOSTICS[levelId] || { totalMistakes: 0, retryCount: 0 };
      const nextExerciseRetries = (current.exerciseRetries ?? 0) + 1;
      const nextGridResets = current.gridResets ?? 0;
      const updated = {
        ...prev,
        [levelId]: {
          ...current,
          exerciseRetries: nextExerciseRetries,
          retryCount: nextGridResets + nextExerciseRetries,
        },
      };
      try {
        sessionStorage.setItem('ct_level_diagnostics', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // --- Record 5x5 Grid Travel Mission events (obstacle hit, target/checkin error, missed loop on run 1, or grid reset) ---
  const handleRecordGridEvent = useCallback((levelId: number, eventType: GridDiagnosticEventType) => {
    setLevelDiagnostics(prev => {
      const current = prev[levelId] || DEFAULT_LEVEL_DIAGNOSTICS[levelId] || { totalMistakes: 0, retryCount: 0 };
      const nextObstacles = (current.gridObstaclesHit ?? 0) + (eventType === 'obstacle_hit' ? 1 : 0);
      const nextTargetErrors = (current.gridTargetErrors ?? 0) + (eventType === 'target_error' ? 1 : 0);
      const nextLoopMissed = (current.gridLoopMissed ?? 0) + (eventType === 'loop_missed' ? 1 : 0);
      const nextResets = (current.gridResets ?? 0) + (eventType === 'grid_reset' ? 1 : 0);
      const nextGridMistakes = nextObstacles + nextTargetErrors + nextLoopMissed;
      const nextExerciseMistakes = current.exerciseMistakes ?? 0;
      const nextExerciseRetries = current.exerciseRetries ?? 0;

      const updated = {
        ...prev,
        [levelId]: {
          ...current,
          gridObstaclesHit: nextObstacles,
          gridTargetErrors: nextTargetErrors,
          gridLoopMissed: nextLoopMissed,
          gridResets: nextResets,
          gridMistakes: nextGridMistakes,
          totalMistakes: nextGridMistakes + nextExerciseMistakes,
          retryCount: nextResets + nextExerciseRetries,
        },
      };
      try {
        sessionStorage.setItem('ct_level_diagnostics', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // --- Record 5x5 Grid Travel Mission completion (blocks used, target 3-star blocks, loop usage) ---
  const handleRecordGridCompletion = useCallback(
    (levelId: number, blocksCount: number, targetBlocks3Star: number, usedLoop: boolean) => {
      setLevelGridBlocksUsed(prev => {
        const updatedBlocks = { ...prev, [levelId]: { blocks: blocksCount, usedLoop } };
        try {
          sessionStorage.setItem('ct_level_grid_blocks', JSON.stringify(updatedBlocks));
        } catch (e) {}
        return updatedBlocks;
      });

      setLevelDiagnostics(prev => {
        const current = prev[levelId] || DEFAULT_LEVEL_DIAGNOSTICS[levelId] || { totalMistakes: 0, retryCount: 0 };
        const updated = {
          ...prev,
          [levelId]: {
            ...current,
            blocksUsed: blocksCount,
            targetBlocks3Star,
            usedLoop,
            gridCompleted: true,
          },
        };
        try {
          sessionStorage.setItem('ct_level_diagnostics', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    },
    []
  );

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

    const currentDiag = levelDiagnostics[levelId] || DEFAULT_LEVEL_DIAGNOSTICS[levelId];
    const updatedLevelDiag: LevelDiagnosticStats = {
      ...currentDiag,
      blocksUsed: blocksCount,
      targetBlocks3Star: TARGET_BLOCKS_BY_LEVEL[levelId] || 12,
      usedLoop,
      gridCompleted: true,
    };
    const nextDiagnostics = { ...levelDiagnostics, [levelId]: updatedLevelDiag };
    setLevelDiagnostics(nextDiagnostics);

    // Save Level completion & star score calculated from true accuracy (5x5 Grid + Exercise) since the first attempt
    const newCompleted = completedLevels.includes(levelId)
      ? completedLevels
      : [...completedLevels, levelId];
    setCompletedLevels(newCompleted);

    const trueStats = calculateTrueSkillScore(
      updatedLevelDiag,
      levelId,
      { blocks: blocksCount, usedLoop },
      nextDiagnostics[5],
      updatedGridBlocks[5]
    );
    const nextScores = { ...levelScores, [levelId]: trueStats.stars };
    setLevelScores(nextScores);

    const allFourCompleted = [1, 2, 3, 4].every(id => newCompleted.includes(id));
    const newMaxUnlocked = allFourCompleted ? 5 : Math.max(4, maxUnlockedLevel);
    setMaxUnlockedLevel(newMaxUnlocked);

    try {
      sessionStorage.setItem('ct_level_grid_scores', JSON.stringify(updatedGridScores));
      sessionStorage.setItem('ct_level_grid_blocks', JSON.stringify(updatedGridBlocks));
      sessionStorage.setItem('ct_level_diagnostics', JSON.stringify(nextDiagnostics));
      sessionStorage.setItem('ct_completed_levels', JSON.stringify(newCompleted));
      sessionStorage.setItem('ct_level_scores', JSON.stringify(nextScores));
      sessionStorage.setItem('ct_max_unlocked_level', JSON.stringify(newMaxUnlocked));
    } catch (e) {}

    setShowFeedback(null);

    if (action === 'replay') {
      // Stay on current level and restore hearts for gameplay, while preserving cumulative diagnostics
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
      sessionStorage.removeItem('ct_level_diagnostics');
      sessionStorage.removeItem('ct_level_grid_scores');
      sessionStorage.removeItem('ct_level_grid_blocks');
      sessionStorage.removeItem('ct_level1_decomposition_answers');
      sessionStorage.removeItem('ct_level2_pattern_answers_v3');
      sessionStorage.removeItem('ct_level3_abstraction_answers_v2');
      sessionStorage.removeItem('ct_level4_algorithm_answers');
      sessionStorage.removeItem('ct_level5_boss_answers');
    } catch (e) {}

    setMaxUnlockedLevel(4);
    setCompletedLevels([]);
    setCurrentLevelId(1);
    setLevelScores({ 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 });
    setLevelDiagnostics(DEFAULT_LEVEL_DIAGNOSTICS);
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
            levelDiagnostics={levelDiagnostics}
            onRecordMistake={handleRecordMistake}
            onRecordRetry={handleRecordRetry}
            onRecordGridEvent={handleRecordGridEvent}
            onRecordGridCompletion={handleRecordGridCompletion}
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
            levelDiagnostics={levelDiagnostics}
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
