import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, MapPin, Repeat, 
  Trash2, X, Play, RotateCcw, Volume2, VolumeX, CheckCircle2, AlertTriangle, 
  Award, Sparkles, ChevronLeft, ChevronRight, Home, Heart,
  Layers, Check, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioSynth } from '../utils/audio';
import { GRID_LEVELS, GridLevelConfig, GridLandmark, GridObstacle, LandmarkType, LANDMARK_INFO } from '../data/gridLevels';
import { LevelDiagnosticStats, GridDiagnosticEventType, calculateTrueSkillScore } from '../App';

export type CommandAction = 'up' | 'down' | 'left' | 'right' | 'checkin';

export interface CommandBlock {
  id: string;
  action: CommandAction;
  repeat: number; // 1 for normal, >1 for loop
}

interface TravelMissionScreenProps {
  currentLevelId: number;
  maxUnlockedLevel: number;
  completedLevels?: number[];
  travelerName: string;
  travelerGender: 'female' | 'male';
  hearts: number;
  onHeartsChange: (newHearts: number) => void;
  levelDiagnostics?: Record<number, LevelDiagnosticStats>;
  onRecordMistake?: (levelId: number, wrongPillarIds?: number[]) => void;
  onRecordRetry?: (levelId: number) => void;
  onRecordGridEvent?: (levelId: number, eventType: GridDiagnosticEventType) => void;
  onRecordGridCompletion?: (levelId: number, blocksCount: number, targetBlocks3Star: number, usedLoop: boolean) => void;
  totalAccumulatedScore: number;
  levelGridScores: Record<number, number>; // levelId -> score
  levelGridBlocksUsed: Record<number, { blocks: number; usedLoop: boolean }>; // for analytics table
  onLevelChange: (newLevelId: number) => void;
  onMissionSuccess: (levelId: number, earnedPoints: number, blocksCount: number, usedLoop: boolean, action?: 'next' | 'replay') => void;
  onExitToHome: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function TravelMissionScreen({
  currentLevelId,
  maxUnlockedLevel,
  completedLevels = [],
  travelerName,
  travelerGender,
  hearts,
  onHeartsChange,
  levelDiagnostics,
  onRecordMistake,
  onRecordRetry,
  onRecordGridEvent,
  onRecordGridCompletion,
  totalAccumulatedScore,
  levelGridScores,
  levelGridBlocksUsed,
  onLevelChange,
  onMissionSuccess,
  onExitToHome,
  soundEnabled,
  onToggleSound,
}: TravelMissionScreenProps) {
  const currentConfig: GridLevelConfig = GRID_LEVELS.find(l => l.id === currentLevelId) || GRID_LEVELS[0];

  // Character position on 5x5 grid
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number }>(currentConfig.startPos);
  const [queueStartPos, setQueueStartPos] = useState<{ x: number; y: number }>(currentConfig.startPos);
  const [queueStartCheckedIds, setQueueStartCheckedIds] = useState<string[]>([]);
  const [queueStartPoints, setQueueStartPoints] = useState<number>(0);
  const [collidedObstaclePos, setCollidedObstaclePos] = useState<{ x: number; y: number } | null>(null);
  
  // Execution & commands
  const [commands, setCommands] = useState<CommandBlock[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeExecutingCmdId, setActiveExecutingCmdId] = useState<string | null>(null);
  
  // Check-ins & Points in this run
  const [checkedInIds, setCheckedInIds] = useState<string[]>([]);
  const [currentLevelPoints, setCurrentLevelPoints] = useState<number>(0);
  
  // Feedback status toast/message
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' | 'warning' } | null>(null);

  // Loop controller input
  const [loopCount, setLoopCount] = useState<number>(2);
  const [isLoopModeActive, setIsLoopModeActive] = useState<boolean>(false);
  const [travelRunCount, setTravelRunCount] = useState<number>(0);
  const [firstRunMissedLoop, setFirstRunMissedLoop] = useState<boolean>(false);

  // Progressive Hints (คำใบ้ 3 ระดับ: 1. ชวนคิด -> 2. ชี้จุดที่ผิด -> 3. แสดงตัวอย่างแนวคิด) & Algorithm Comparison states
  const [gridMistakeStreak, setGridMistakeStreak] = useState<number>(0);
  const [manualGridHintTier, setManualGridHintTier] = useState<1 | 2 | 3 | null>(null);
  const [exerciseMistakeStep, setExerciseMistakeStep] = useState<number>(0);
  const [manualExerciseHintTier, setManualExerciseHintTier] = useState<1 | 2 | 3 | null>(null);
  const [showAlgorithmComparisonModal, setShowAlgorithmComparisonModal] = useState<boolean>(false);

  // Victory modal after reaching targets & Game Over modal when hearts reach 0
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);

  // Level 1 Post-Mission Learning & Exercise Flow: 'knowledge' -> 'exercise' -> Victory Modal
  const [level1LearningStep, setLevel1LearningStep] = useState<'knowledge' | 'exercise' | null>(null);
  const [scienceProjectSteps, setScienceProjectSteps] = useState<string[]>(['', '', '', '']);
  const [tripPlanningSteps, setTripPlanningSteps] = useState<string[]>(['', '', '', '']);
  const [activeDecompCategory, setActiveDecompCategory] = useState<'science' | 'trip'>('science');
  const [draggingDecompItem, setDraggingDecompItem] = useState<{
    value: string;
    fromCategory?: 'science' | 'trip';
    fromSlotIdx?: number;
  } | null>(null);
  const [dragOverDecompTarget, setDragOverDecompTarget] = useState<{
    category: 'science' | 'trip';
    slotIdx: number | 'box';
  } | null>(null);
  const [exerciseError, setExerciseError] = useState<string | null>(null);
  const [exerciseCompleted, setExerciseCompleted] = useState<boolean>(false);

  // Level 2 Post-Mission Learning & Exercise Flow (Pattern Recognition): 'knowledge' -> 'exercise' -> Victory Modal
  const [level2LearningStep, setLevel2LearningStep] = useState<'knowledge' | 'exercise' | null>(null);
  const [patternAnswers, setPatternAnswers] = useState<{
    q1: (string | null)[];
    q2: (string | null)[];
    q3: (string | null)[];
    q4: (string | null)[];
  }>({
    q1: [null, null, null],
    q2: [null, null, null],
    q3: [null, null, null],
    q4: [null, null, null],
  });
  const [draggingItem, setDraggingItem] = useState<{
    questionKey: 'q1' | 'q2' | 'q3' | 'q4';
    value: string;
    fromSlotIdx?: number;
  } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    questionKey: 'q1' | 'q2' | 'q3' | 'q4';
    slotIdx: number;
  } | null>(null);
  const [level2ExerciseError, setLevel2ExerciseError] = useState<string | null>(null);
  const [level2ExerciseCompleted, setLevel2ExerciseCompleted] = useState<boolean>(false);

  // Level 3 Post-Mission Learning & Exercise Flow (Abstraction): 'knowledge' -> 'exercise' -> Victory Modal
  const [level3LearningStep, setLevel3LearningStep] = useState<'knowledge' | 'exercise' | null>(null);
  const [abstractionAnswers, setAbstractionAnswers] = useState<{
    s1: (string | null)[];
    s2: (string | null)[];
  }>({
    s1: [null, null, null, null, null],
    s2: [null, null, null, null, null],
  });
  const [draggingAbstractionItem, setDraggingAbstractionItem] = useState<{
    scenarioKey: 's1' | 's2';
    value: string;
    fromSlotIdx?: number;
  } | null>(null);
  const [dragOverAbstractionTarget, setDragOverAbstractionTarget] = useState<{
    scenarioKey: 's1' | 's2';
    slotIdx: number | 'box';
  } | null>(null);
  const [level3ExerciseError, setLevel3ExerciseError] = useState<string | null>(null);
  const [level3ExerciseCompleted, setLevel3ExerciseCompleted] = useState<boolean>(false);

  // Level 4 Post-Mission Learning & Exercise Flow (Algorithm Design / Flowchart): 'knowledge' -> 'exercise' -> Victory Modal
  const [level4LearningStep, setLevel4LearningStep] = useState<'knowledge' | 'exercise' | null>(null);
  const [flowchartAnswers, setFlowchartAnswers] = useState<(string | null)[]>([
    null, null, null, null, null, null, null, null,
  ]);
  const [draggingFlowchartItem, setDraggingFlowchartItem] = useState<{
    value: string;
    fromSlotIdx?: number;
  } | null>(null);
  const [dragOverFlowchartSlot, setDragOverFlowchartSlot] = useState<number | null>(null);
  const [level4ExerciseError, setLevel4ExerciseError] = useState<string | null>(null);
  const [level4ExerciseCompleted, setLevel4ExerciseCompleted] = useState<boolean>(false);

  // Level 5 Post-Mission Capstone Assessment (Boss Challenge: โจทย์สถานการณ์บูรณาการ 4 ทักษะ): 'knowledge' -> 'exercise' -> Victory Modal
  const [level5LearningStep, setLevel5LearningStep] = useState<'knowledge' | 'exercise' | null>(null);
  const [bossAnswers, setBossAnswers] = useState<{
    decomposition: string | null;
    pattern: string | null;
    abstraction: string | null;
    algorithm: string | null;
  }>({
    decomposition: null,
    pattern: null,
    abstraction: null,
    algorithm: null,
  });
  const [level5ExerciseError, setLevel5ExerciseError] = useState<string | null>(null);
  const [level5ExerciseCompleted, setLevel5ExerciseCompleted] = useState<boolean>(false);

  // Refs for tracking execution cancellation & drag-and-drop auto-scrolling
  const isCancelledRef = useRef(false);
  const exerciseScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dragPointerYRef = useRef<number | null>(null);
  const dragAutoScrollDirRef = useRef<'up' | 'down' | null>(null);

  const isAnyExerciseDragging = Boolean(
    draggingDecompItem !== null ||
      draggingItem !== null ||
      draggingAbstractionItem !== null ||
      draggingFlowchartItem !== null
  );

  // Global auto-scroll & mouse-wheel support while dragging cards in any exercise modal
  useEffect(() => {
    if (!isAnyExerciseDragging) {
      dragPointerYRef.current = null;
      dragAutoScrollDirRef.current = null;
      return;
    }

    let rafId: number | null = null;

    const performEdgeScroll = (clientY: number) => {
      const container = exerciseScrollContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const edgeThreshold = Math.min(115, Math.max(65, rect.height * 0.24));

      if (clientY < rect.top + edgeThreshold) {
        const dist = Math.max(1, rect.top + edgeThreshold - clientY);
        const ratio = Math.min(1.6, dist / edgeThreshold);
        container.scrollTop -= Math.max(4, Math.round(ratio * 16));
      } else if (clientY > rect.bottom - edgeThreshold) {
        const dist = Math.max(1, clientY - (rect.bottom - edgeThreshold));
        const ratio = Math.min(1.6, dist / edgeThreshold);
        container.scrollTop += Math.max(4, Math.round(ratio * 16));
      }
    };

    const handleGlobalDragOver = (e: DragEvent) => {
      dragPointerYRef.current = e.clientY;
      const container = exerciseScrollContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        if (
          e.clientX >= rect.left - 40 &&
          e.clientX <= rect.right + 40 &&
          e.clientY >= rect.top - 60 &&
          e.clientY <= rect.bottom + 60
        ) {
          e.preventDefault();
        }
      }
      performEdgeScroll(e.clientY);
    };

    const handleGlobalWheelDuringDrag = (e: WheelEvent) => {
      const container = exerciseScrollContainerRef.current;
      if (!container) return;
      container.scrollTop += e.deltaY;
    };

    const resetDragStates = () => {
      dragPointerYRef.current = null;
      dragAutoScrollDirRef.current = null;
    };

    const tickAutoScroll = () => {
      const container = exerciseScrollContainerRef.current;
      if (container) {
        if (dragAutoScrollDirRef.current === 'up') {
          container.scrollTop -= 12;
        } else if (dragAutoScrollDirRef.current === 'down') {
          container.scrollTop += 12;
        } else if (dragPointerYRef.current !== null) {
          performEdgeScroll(dragPointerYRef.current);
        }
      }
      rafId = window.requestAnimationFrame(tickAutoScroll);
    };

    window.addEventListener('dragover', handleGlobalDragOver, { capture: true });
    window.addEventListener('wheel', handleGlobalWheelDuringDrag, {
      capture: true,
      passive: true,
    });
    window.addEventListener('dragend', resetDragStates, { capture: true });
    window.addEventListener('drop', resetDragStates, { capture: true });
    rafId = window.requestAnimationFrame(tickAutoScroll);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver, { capture: true });
      window.removeEventListener('wheel', handleGlobalWheelDuringDrag, { capture: true });
      window.removeEventListener('dragend', resetDragStates, { capture: true });
      window.removeEventListener('drop', resetDragStates, { capture: true });
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [isAnyExerciseDragging]);

  // Load saved Decomposition, Pattern & Abstraction Exercise answers if available
  useEffect(() => {
    try {
      const savedEx = sessionStorage.getItem('ct_level1_decomposition_answers_v2');
      if (savedEx) {
        const parsed = JSON.parse(savedEx);
        if (Array.isArray(parsed.scienceProjectSteps) && parsed.scienceProjectSteps.length === 4) {
          setScienceProjectSteps(parsed.scienceProjectSteps);
        }
        if (Array.isArray(parsed.tripPlanningSteps) && parsed.tripPlanningSteps.length === 4) {
          setTripPlanningSteps(parsed.tripPlanningSteps);
        }
        if (parsed.completed) {
          setExerciseCompleted(true);
        }
      }
      const savedL2 = sessionStorage.getItem('ct_level2_pattern_answers_v3');
      if (savedL2) {
        const parsed2 = JSON.parse(savedL2);
        if (parsed2.patternAnswers) {
          setPatternAnswers(parsed2.patternAnswers);
        }
        if (parsed2.completed) {
          setLevel2ExerciseCompleted(true);
        }
      }
      const savedL3 = sessionStorage.getItem('ct_level3_abstraction_answers_v2');
      if (savedL3) {
        const parsed3 = JSON.parse(savedL3);
        if (parsed3.abstractionAnswers) {
          setAbstractionAnswers(parsed3.abstractionAnswers);
        }
        if (parsed3.completed) {
          setLevel3ExerciseCompleted(true);
        }
      }
      const savedL4 = sessionStorage.getItem('ct_level4_algorithm_answers');
      if (savedL4) {
        const parsed4 = JSON.parse(savedL4);
        if (Array.isArray(parsed4.flowchartAnswers) && parsed4.flowchartAnswers.length === 8) {
          setFlowchartAnswers(parsed4.flowchartAnswers);
        }
        if (parsed4.completed) {
          setLevel4ExerciseCompleted(true);
        }
      }
      const savedL5 = sessionStorage.getItem('ct_level5_boss_answers');
      if (savedL5) {
        const parsed5 = JSON.parse(savedL5);
        if (parsed5.bossAnswers) {
          setBossAnswers(parsed5.bossAnswers);
        }
        if (parsed5.completed) {
          setLevel5ExerciseCompleted(true);
        }
      }
    } catch (e) {}
  }, []);

  // Reset grid state whenever level changes
  useEffect(() => {
    setPlayerPos(currentConfig.startPos);
    setQueueStartPos(currentConfig.startPos);
    setQueueStartCheckedIds([]);
    setQueueStartPoints(0);
    setCollidedObstaclePos(null);
    setCommands([]);
    setCheckedInIds([]);
    setCurrentLevelPoints(0);
    setIsRunning(false);
    setActiveExecutingCmdId(null);
    setStatusMessage(null);
    setShowVictoryModal(false);
    setShowGameOverModal(false);
    setLevel1LearningStep(null);
    setLevel2LearningStep(null);
    setLevel3LearningStep(null);
    setLevel4LearningStep(null);
    setLevel5LearningStep(null);
    setExerciseError(null);
    setLevel2ExerciseError(null);
    setLevel3ExerciseError(null);
    setLevel4ExerciseError(null);
    setLevel5ExerciseError(null);
    setIsLoopModeActive(false);
    setTravelRunCount(0);
    setFirstRunMissedLoop(false);
    setGridMistakeStreak(0);
    setManualGridHintTier(null);
    setExerciseMistakeStep(0);
    setManualExerciseHintTier(null);
    setShowAlgorithmComparisonModal(false);
    onHeartsChange(3);
    isCancelledRef.current = false;
  }, [currentLevelId]);

  // Sound toggle
  const handleToggleAudio = () => {
    onToggleSound();
    audioSynth.playSfx('click');
  };

  // Add command to workspace queue
  const addCommand = (action: CommandAction) => {
    if (isRunning) return;

    if (isLoopModeActive && action === 'checkin') {
      audioSynth.playSfx('wrong');
      setStatusMessage({ 
        text: 'คำสั่งเช็คอินไม่สามารถวนลูปได้ กรุณาเลือกคำสั่งทิศทาง (ขึ้นบน / ลงล่าง / เลี้ยวซ้าย / เลี้ยวขวา)', 
        type: 'warning' 
      });
      return;
    }

    audioSynth.playSfx('click');
    setStatusMessage(null);
    setManualGridHintTier(null);

    const repeat = isLoopModeActive && action !== 'checkin' ? Math.max(2, Math.min(5, loopCount)) : 1;
    if (repeat > 1) {
      setFirstRunMissedLoop(false);
    }
    const newBlock: CommandBlock = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      action,
      repeat,
    };

    setCommands(prev => [...prev, newBlock]);

    if (isLoopModeActive) {
      setIsLoopModeActive(false); // Reset loop mode after assigning direction
    }
  };

  // Delete a specific block
  const deleteCommand = (id: string) => {
    if (isRunning) return;
    audioSynth.playSfx('click');
    setStatusMessage(null);
    setManualGridHintTier(null);
    setCommands(prev => prev.filter(c => c.id !== id));
  };

  // Clear all commands without resetting player position
  const clearAllCommands = () => {
    if (isRunning) return;
    audioSynth.playSfx('click');
    setQueueStartPos(playerPos);
    setQueueStartCheckedIds(checkedInIds);
    setQueueStartPoints(currentLevelPoints);
    setCommands([]);
    setStatusMessage(null);
    setManualGridHintTier(null);
  };

  // Reset simulation to start
  const handleResetSimulation = (recordAsUserReset: boolean = false) => {
    audioSynth.playSfx('click');
    if (recordAsUserReset && (travelRunCount > 0 || commands.length > 0)) {
      onRecordGridEvent?.(currentLevelId, 'grid_reset');
    }
    isCancelledRef.current = true;
    setIsRunning(false);
    setActiveExecutingCmdId(null);
    setPlayerPos(currentConfig.startPos);
    setQueueStartPos(currentConfig.startPos);
    setQueueStartCheckedIds([]);
    setQueueStartPoints(0);
    setCollidedObstaclePos(null);
    setCheckedInIds([]);
    setCurrentLevelPoints(0);
    setTravelRunCount(0);
    setFirstRunMissedLoop(false);
    onHeartsChange(3);
    setShowGameOverModal(false);
    setStatusMessage(null);
  };

  const ACTION_THAI_NAMES: Record<CommandAction, string> = {
    up: 'ขึ้นบน',
    down: 'ลงล่าง',
    left: 'เลี้ยวซ้าย',
    right: 'เลี้ยวขวา',
    checkin: 'เช็คอิน',
  };

  // Build the loop reminder message (used only when the first travel run did not use a loop)
  const getFirstRunLoopWarningText = (cmds: CommandBlock[]): string => {
    const repeatedGroups: { action: CommandAction; startBlock: number; endBlock: number; totalSteps: number }[] = [];
    let i = 0;
    while (i < cmds.length) {
      const current = cmds[i];
      if (current.action === 'checkin') {
        i++;
        continue;
      }
      let j = i + 1;
      let totalSteps = current.repeat;
      while (j < cmds.length && cmds[j].action === current.action) {
        totalSteps += cmds[j].repeat;
        j++;
      }
      if (j - i >= 2) {
        repeatedGroups.push({
          action: current.action,
          startBlock: i + 1,
          endBlock: j,
          totalSteps,
        });
      }
      i = j;
    }

    if (repeatedGroups.length === 1) {
      const g = repeatedGroups[0];
      return `มีการเดินด้วยคำสั่ง "${ACTION_THAI_NAMES[g.action]}" ซ้ำกัน (บล็อกที่ ${g.startBlock}–${g.endBlock}) แนะนำให้ใช้ 🔄 วนลูป เพื่อทำคำสั่งซ้ำหลายครั้ง ช่วยให้ใช้บล็อกคำสั่งน้อยลง`;
    }

    if (repeatedGroups.length > 1) {
      const groupDetails = repeatedGroups
        .map(g => `"${ACTION_THAI_NAMES[g.action]}" (บล็อกที่ ${g.startBlock}–${g.endBlock})`)
        .join(', ');
      return `มีการเดินด้วยคำสั่งซ้ำกัน ได้แก่ ${groupDetails} แนะนำให้ใช้ 🔄 วนลูป เพื่อทำคำสั่งซ้ำหลายครั้ง ช่วยให้ใช้บล็อกคำสั่งน้อยลง`;
    }

    return 'การเดินทางในรอบแรกยังไม่ได้มีการใช้ลูป แนะนำให้ใช้ 🔄 วนลูป เพื่อทำคำสั่งซ้ำหลายครั้ง ช่วยให้ใช้บล็อกคำสั่งน้อยลง';
  };

  // Run execution
  const handleStartTravel = async () => {
    if (commands.length === 0) {
      audioSynth.playSfx('wrong');
      setStatusMessage({ text: 'ยังไม่ได้เพิ่มบล็อกคำสั่ง! กรุณาเพิ่มบล็อกคำสั่งก่อนกดเริ่มการเดินทาง', type: 'warning' });
      return;
    }

    const currentRun = travelRunCount + 1;
    setTravelRunCount(currentRun);
    const usedLoopInThisRun = commands.some(c => c.repeat > 1);
    const isFirstRunWithoutLoop = currentRun === 1 && !usedLoopInThisRun;
    setFirstRunMissedLoop(isFirstRunWithoutLoop);

    // Start running from the queue's starting position on the grid
    isCancelledRef.current = false;
    setCollidedObstaclePos(null);
    setIsRunning(true);
    setStatusMessage(null);
    setManualGridHintTier(null);
    audioSynth.playSfx('click');

    let curX = queueStartPos.x;
    let curY = queueStartPos.y;
    let currentChecked: string[] = [...queueStartCheckedIds];
    let earnedPts = queueStartPoints;
    setPlayerPos({ x: curX, y: curY });
    setCheckedInIds([...currentChecked]);
    setCurrentLevelPoints(earnedPts);
    let hasFailed = false;

    // Expand commands into step-by-step actions
    for (let i = 0; i < commands.length; i++) {
      if (isCancelledRef.current) break;
      const cmd = commands[i];
      setActiveExecutingCmdId(cmd.id);

      for (let r = 0; r < cmd.repeat; r++) {
        if (isCancelledRef.current) break;

        await new Promise(resolve => setTimeout(resolve, 450));
        if (isCancelledRef.current) break;

        const prevX = curX;
        const prevY = curY;

        if (cmd.action === 'up') curY -= 1;
        else if (cmd.action === 'down') curY += 1;
        else if (cmd.action === 'left') curX -= 1;
        else if (cmd.action === 'right') curX += 1;
        else if (cmd.action === 'checkin') {
          // Check if standing on a landmark
          const landmark = currentConfig.landmarks.find(l => l.x === curX && l.y === curY && l.type !== 'diamond');
          if (landmark) {
            if (!currentChecked.includes(landmark.id)) {
              currentChecked.push(landmark.id);
              earnedPts += landmark.points;
              setCheckedInIds([...currentChecked]);
              setCurrentLevelPoints(earnedPts);
              audioSynth.playSfx('correct');
            } else {
              audioSynth.playSfx('wrong');
              onRecordGridEvent?.(currentLevelId, 'target_error');
              setStatusMessage({ 
                text: `เช็คอินซ้ำ! "${landmark.name}" ได้รับการเช็คอินไปแล้ว`, 
                type: 'warning' 
              });
            }
          } else {
            audioSynth.playSfx('wrong');
            onRecordGridEvent?.(currentLevelId, 'target_error');
            setStatusMessage({ 
              text: `คำสั่งเช็คอินผิดพลาด! ที่พิกัด (${curX},${curY}) ไม่มีสถานที่ท่องเที่ยวให้เช็คอิน`, 
              type: 'warning' 
            });
          }
          continue;
        }

        // Check bounds
        if (curX < 0 || curX > 4 || curY < 0 || curY > 4) {
          hasFailed = true;
          curX = prevX;
          curY = prevY;
          audioSynth.playSfx('wrong');
          onRecordGridEvent?.(currentLevelId, 'obstacle_hit');
          setStatusMessage({ 
            text: `เดินหลุดออกนอกขอบเขตแผนที่ 5x5 จากพิกัด (${prevX},${prevY})! กรุณาปรับแก้ทิศทางคำสั่ง`, 
            type: 'error' 
          });
          break;
        }

        // Check obstacles
        const obstacle = currentConfig.obstacles.find(o => o.x === curX && o.y === curY);
        if (obstacle) {
          hasFailed = true;
          audioSynth.playSfx('wrong');
          onRecordGridEvent?.(currentLevelId, 'obstacle_hit');
          setCollidedObstaclePos({ x: curX, y: curY });
          const obsName = obstacle.type === 'rock' ? 'หิน 🪨' : obstacle.type === 'tree' ? 'ต้นไม้ 🌲' : 'บ่อน้ำ 💧';
          // Keep player at the valid cell right before the obstacle
          curX = prevX;
          curY = prevY;
          setPlayerPos({ x: prevX, y: prevY });

          setStatusMessage({ 
            text: `ชนสิ่งกีดขวาง (${obsName}) ที่พิกัด (${obstacle.x},${obstacle.y})! กรุณาปรับแก้ทิศทางคำสั่งหลบหลีก`, 
            type: 'error' 
          });
          break;
        }

        // Move player
        setPlayerPos({ x: curX, y: curY });
        audioSynth.playSfx('click');

        // Auto-collect diamond if stepping onto a diamond tile
        const steppedLandmark = currentConfig.landmarks.find(l => l.x === curX && l.y === curY);
        if (steppedLandmark && steppedLandmark.type === 'diamond' && !currentChecked.includes(steppedLandmark.id)) {
          currentChecked.push(steppedLandmark.id);
          earnedPts += steppedLandmark.points;
          setCheckedInIds([...currentChecked]);
          setCurrentLevelPoints(earnedPts);
          audioSynth.playSfx('correct');
        }
      }

      if (hasFailed || isCancelledRef.current) break;
    }

    setIsRunning(false);
    setActiveExecutingCmdId(null);

    if (isCancelledRef.current) return;

    if (hasFailed) {
      setGridMistakeStreak(prev => prev + 1);
      return;
    }

    // Check if target count is achieved
    // Count checked by type
    const checkedByType: Record<LandmarkType, number> = { museum: 0, castle: 0, tower: 0, themepark: 0, diamond: 0 };
    currentChecked.forEach(id => {
      const lm = currentConfig.landmarks.find(l => l.id === id);
      if (lm) checkedByType[lm.type] = (checkedByType[lm.type] || 0) + 1;
    });

    const isAllChecked = (Object.keys(currentConfig.targetCount) as LandmarkType[]).every(type => {
      const required = currentConfig.targetCount[type] || 0;
      return checkedByType[type] >= required;
    });

    const loopWarning = isFirstRunWithoutLoop ? getFirstRunLoopWarningText(commands) : null;

    if (isAllChecked) {
      if (loopWarning) {
        audioSynth.playSfx('wrong');
        onRecordGridEvent?.(currentLevelId, 'loop_missed');
        setGridMistakeStreak(prev => prev + 1);
        setStatusMessage({
          text: loopWarning,
          type: 'warning',
        });
        return;
      }
      audioSynth.playSfx('unlock');
      setStatusMessage(null);
      onRecordGridCompletion?.(
        currentLevelId,
        commands.length,
        currentConfig.targetBlocks3Star,
        usedLoopInThisRun
      );
      onHeartsChange(3);
      // Open Algorithm Comparison & Metacognitive Reflection modal first upon completing 5x5 grid
      setShowAlgorithmComparisonModal(true);
    } else {
      audioSynth.playSfx('wrong');
      onRecordGridEvent?.(currentLevelId, 'target_error');
      if (loopWarning) {
        onRecordGridEvent?.(currentLevelId, 'loop_missed');
      }
      setGridMistakeStreak(prev => prev + 1);
      const baseMsg = `สิ้นสุดคำสั่งที่พิกัด (${curX},${curY}) แต่ยังเช็คอินหรือเก็บเพชรไม่ครบตามเป้าหมายของด่าน!`;
      setStatusMessage({ 
        text: loopWarning ? `${baseMsg} • ${loopWarning}` : baseMsg, 
        type: 'warning' 
      });
    }
  };

  // Proceed from Algorithm Comparison modal to the level's Knowledge/Exercise or Capstone Boss Challenge or Victory Modal
  const handleProceedAfterAlgorithmComparison = () => {
    audioSynth.playSfx('click');
    setShowAlgorithmComparisonModal(false);
    if (currentLevelId === 1 && !exerciseCompleted) {
      setLevel1LearningStep('knowledge');
    } else if (currentLevelId === 2 && !level2ExerciseCompleted) {
      setLevel2LearningStep('knowledge');
    } else if (currentLevelId === 3 && !level3ExerciseCompleted) {
      setLevel3LearningStep('knowledge');
    } else if (currentLevelId === 4 && !level4ExerciseCompleted) {
      setLevel4LearningStep('knowledge');
    } else if (currentLevelId === 5 && !level5ExerciseCompleted) {
      setLevel5LearningStep('exercise');
    } else {
      setShowVictoryModal(true);
    }
  };

  // Calculate targets & progress
  const checkedByType: Record<LandmarkType, number> = { museum: 0, castle: 0, tower: 0, themepark: 0, diamond: 0 };
  checkedInIds.forEach(id => {
    const lm = currentConfig.landmarks.find(l => l.id === id);
    if (lm) checkedByType[lm.type] = (checkedByType[lm.type] || 0) + 1;
  });

  const usedLoopInCommands = commands.some(c => c.repeat > 1);
  const totalBlocksUsed = commands.length;

  // Flatten shortest / optimal commands from subMissions for Algorithm Comparison
  const optimalCommands = currentConfig.interactiveHint.subMissions.flatMap(sub =>
    sub.commands.map(cmd => ({
      action: cmd.action,
      repeat: cmd.repeat,
      subTitle: sub.title,
    }))
  );
  const optimalBlocksCount = optimalCommands.length;

  // Build 3-level Progressive Hint (1. ชวนคิด -> 2. ชี้จุดที่ผิด -> 3. แสดงตัวอย่างแนวคิด) for 5x5 Grid
  const buildProgressiveGridAlert = (
    category: 'obstacle' | 'bounds' | 'checkin' | 'incomplete' | 'loop',
    pinpointText: string,
    alertType: 'warning' | 'error'
  ): {
    title: string;
    text: string;
    type: 'warning' | 'error';
    activeTier: 1 | 2 | 3;
    autoTier: 1 | 2 | 3;
  } => {
    const effectiveMistakeNum = Math.max(1, gridMistakeStreak);
    const autoTier: 1 | 2 | 3 = effectiveMistakeNum >= 3 ? 3 : effectiveMistakeNum === 2 ? 2 : 1;
    const activeTier: 1 | 2 | 3 = manualGridHintTier ?? autoTier;

    let hint1 = '';
    if (category === 'obstacle' || category === 'bounds') {
      hint1 = `ชวนคิด: ลองสังเกตพิกัดรอบตัวละครบนตาราง 5x5 ว่ามีสิ่งกีดขวาง (🌲 ต้นไม้, 🪨 หิน, 💧 บ่อน้ำ) หรือขอบตารางขวางทิศทางที่จะเดินไปหรือไม่? (${currentConfig.interactiveHint.abstractionTip})`;
    } else if (category === 'loop') {
      hint1 = `ชวนคิด: ในชุดคำสั่งมีการก้าวเดินทิศทางเดิมซ้ำติดต่อกันหลายครั้ง ลองคิดดูว่าเราจะใช้ปุ่ม 🔄 วนลูป เพื่อยุบรวมคำสั่งซ้ำให้สั้นลงได้อย่างไร?`;
    } else {
      hint1 = `ชวนคิด: ลองตรวจสอบแถบภารกิจเป้าหมายด้านบนว่าต้องไปที่พิกัดใดบ้าง และต้องกด 📍 เช็คอินที่จุดใด (เพชร 💎 เก็บอัตโนมัติเมื่อเดินผ่าน ส่วนสถานที่ท่องเที่ยวต้องกดเช็คอิน)`;
    }

    const hint2 = `ชี้จุดที่ผิด: ${pinpointText}`;

    const firstSub = currentConfig.interactiveHint.subMissions[0];
    const patEx = currentConfig.interactiveHint.patternExample;
    const hint3 = `${pinpointText} • ตัวอย่างแนวคิด: ${currentConfig.interactiveHint.decompositionSummary}${
      firstSub ? ` | ตัวอย่างช่วงแรก: ${firstSub.suggestedBlocksText}` : ''
    }${patEx ? ` | ตัวอย่างลูป: ${patEx.compressed}` : ''}`;

    const titleByTier: Record<1 | 2 | 3, string> = {
      1: 'คำใบ้ระดับที่ 1/3 : ชวนคิด 💡',
      2: 'คำใบ้ระดับที่ 2/3 : ชี้จุดที่ผิด 🔍',
      3: 'คำใบ้ระดับที่ 3/3 : ตัวอย่างแนวคิด ✨',
    };

    const textByTier: Record<1 | 2 | 3, string> = {
      1: hint1,
      2: hint2,
      3: hint3,
    };

    return {
      title: titleByTier[activeTier],
      text: textByTier[activeTier],
      type: alertType,
      activeTier,
      autoTier,
    };
  };

  // Real-time error/mistake evaluation with 3-level Progressive Hints
  const computeRealtimeMistakeAlert = (): {
    title: string;
    text: string;
    type: 'warning' | 'error';
    activeTier: 1 | 2 | 3;
    autoTier: 1 | 2 | 3;
  } | null => {
    const loopWarning =
      firstRunMissedLoop && !usedLoopInCommands && commands.length > 0
        ? getFirstRunLoopWarningText(commands)
        : null;
    const appendLoopWarning = (msg: string) =>
      loopWarning && !msg.includes('วนลูป') ? `${msg} • ${loopWarning}` : msg;

    // 1. If an execution or action error/warning occurred, show it with progressive hint tier
    if (statusMessage && (statusMessage.type === 'error' || statusMessage.type === 'warning')) {
      const rawText = appendLoopWarning(statusMessage.text);
      const cat: 'obstacle' | 'bounds' | 'checkin' | 'incomplete' | 'loop' =
        rawText.includes('ชนสิ่งกีดขวาง')
          ? 'obstacle'
          : rawText.includes('นอกขอบเขต')
          ? 'bounds'
          : rawText.includes('ไม่ครบตามเป้าหมาย')
          ? 'incomplete'
          : rawText.includes('วนลูป') && !rawText.includes('เช็คอิน')
          ? 'loop'
          : 'checkin';
      return buildProgressiveGridAlert(cat, rawText, statusMessage.type);
    }

    // 2. While building blocks (not running), check if any block in the queue causes a mistake
    if (!isRunning && commands.length > 0) {
      let simX = queueStartPos.x;
      let simY = queueStartPos.y;
      const simChecked = new Set<string>(queueStartCheckedIds);

      for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        const blockNo = i + 1;

        for (let r = 0; r < cmd.repeat; r++) {
          const prevX = simX;
          const prevY = simY;

          if (cmd.action === 'up') simY -= 1;
          else if (cmd.action === 'down') simY += 1;
          else if (cmd.action === 'left') simX -= 1;
          else if (cmd.action === 'right') simX += 1;
          else if (cmd.action === 'checkin') {
            const lm = currentConfig.landmarks.find(l => l.x === simX && l.y === simY && l.type !== 'diamond');
            if (!lm) {
              return buildProgressiveGridAlert(
                'checkin',
                appendLoopWarning(
                  `บล็อกที่ ${blockNo}: คำสั่งเช็คอินไม่ถูกต้อง เพราะที่พิกัด (${simX},${simY}) ไม่มีสถานที่ท่องเที่ยวให้เช็คอิน`
                ),
                'warning'
              );
            }
            if (simChecked.has(lm.id)) {
              return buildProgressiveGridAlert(
                'checkin',
                appendLoopWarning(
                  `บล็อกที่ ${blockNo}: "${lm.name}" ที่พิกัด (${simX},${simY}) ได้รับการเช็คอินไปแล้ว ไม่ต้องเช็คอินซ้ำ`
                ),
                'warning'
              );
            }
            simChecked.add(lm.id);
            continue;
          }

          if (simX < 0 || simX > 4 || simY < 0 || simY > 4) {
            return buildProgressiveGridAlert(
              'bounds',
              appendLoopWarning(
                `บล็อกที่ ${blockNo}: คำสั่งนี้จะทำให้เดินหลุดออกนอกขอบแผนที่ 5x5 จากพิกัด (${prevX},${prevY}) กรุณาลบหรือเปลี่ยนทิศทาง`
              ),
              'error'
            );
          }

          const obs = currentConfig.obstacles.find(o => o.x === simX && o.y === simY);
          if (obs) {
            const obsName = obs.type === 'rock' ? 'หิน 🪨' : obs.type === 'tree' ? 'ต้นไม้ 🌲' : 'บ่อน้ำ 💧';
            return buildProgressiveGridAlert(
              'obstacle',
              appendLoopWarning(
                `บล็อกที่ ${blockNo}: คำสั่งนี้จะพาเดินไปชน ${obsName} ที่พิกัด (${simX},${simY}) กรุณาลบหรือเปลี่ยนทิศทางหลบหลีก`
              ),
              'error'
            );
          }
        }
      }

      if (loopWarning) {
        return buildProgressiveGridAlert('loop', loopWarning, 'warning');
      }
    }

    return null;
  };

  const realtimeAlert = computeRealtimeMistakeAlert();

  // Deduct 1 heart when making a mistake inside an exercise; also record cumulative mistake & advance 3-level progressive hint
  const deductExerciseHeart = (wrongPillarIds?: number[]): number => {
    onRecordMistake?.(currentLevelId, wrongPillarIds);
    setExerciseMistakeStep(prev => prev + 1);
    setManualExerciseHintTier(null);
    const nextHearts = Math.max(0, hearts - 1);
    onHeartsChange(nextHearts);
    if (nextHearts <= 0) {
      setTimeout(() => {
        setShowGameOverModal(true);
      }, 300);
    }
    return nextHearts;
  };

  // Reusable 3-Level Progressive Hint Box for Post-Level Exercises (1. ชวนคิด -> 2. ชี้จุดที่ผิด -> 3. แสดงตัวอย่างแนวคิด)
  const renderProgressiveExerciseHintBox = (
    hint1Text: string,
    hint2Text: string,
    hint3Text: string,
    errorSummaryText: string | null
  ) => {
    if (!errorSummaryText && exerciseMistakeStep === 0) return null;
    const stepCount = Math.max(1, exerciseMistakeStep);
    const autoTier: 1 | 2 | 3 = stepCount >= 3 ? 3 : stepCount === 2 ? 2 : 1;
    const activeTier: 1 | 2 | 3 = manualExerciseHintTier ?? autoTier;

    const hintContent =
      activeTier === 1 ? hint1Text : activeTier === 2 ? hint2Text : hint3Text;

    return (
      <div
        className="mt-2.5 p-3 rounded-2xl bg-slate-950/90 border-2 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.18)] space-y-2"
        id="exercise-progressive-hint-box"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={15} className="text-amber-400 shrink-0" />
            <span className="text-xs font-black text-amber-300">
              ระบบคำใบ้ตามลำดับขั้น (ทำผิดครั้งที่ {stepCount})
            </span>
          </div>

          {/* 3-Step Progressive Pills */}
          <div className="flex items-center gap-1 text-[10px] font-mono">
            {([
              { tier: 1 as const, label: '1. ชวนคิด 💡' },
              { tier: 2 as const, label: '2. ชี้จุดผิด 🔍' },
              { tier: 3 as const, label: '3. ตัวอย่างแนวคิด ✨' },
            ]).map((item) => {
              const isCurrent = activeTier === item.tier;
              const isUnlocked = autoTier >= item.tier;
              return (
                <button
                  key={item.tier}
                  type="button"
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setManualExerciseHintTier(item.tier);
                  }}
                  className={`px-2 py-0.5 rounded-md border font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                      : isUnlocked
                      ? 'bg-amber-950/70 text-amber-200 border-amber-500/50 hover:bg-amber-900/70'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs sm:text-sm text-amber-100 leading-relaxed font-medium bg-amber-950/40 border border-amber-500/30 rounded-xl px-3 py-2">
          {hintContent}
        </p>

        {errorSummaryText && (
          <div className="text-[11px] text-rose-300 flex items-center gap-1.5 pt-0.5">
            <AlertTriangle size={13} className="text-rose-400 shrink-0" />
            <span>{errorSummaryText}</span>
          </div>
        )}
      </div>
    );
  };

  // Capture-phase dragover handler on scrollable exercise containers so child stopPropagation never blocks auto-scrolling
  const handleContainerDragOverAutoScroll = (e: React.DragEvent<HTMLDivElement>) => {
    dragPointerYRef.current = e.clientY;
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const edgeThreshold = Math.min(115, Math.max(65, rect.height * 0.24));
    if (e.clientY < rect.top + edgeThreshold) {
      const ratio = Math.min(1.5, Math.max(0.25, (rect.top + edgeThreshold - e.clientY) / edgeThreshold));
      container.scrollTop -= Math.max(4, Math.round(ratio * 14));
    } else if (e.clientY > rect.bottom - edgeThreshold) {
      const ratio = Math.min(1.5, Math.max(0.25, (e.clientY - (rect.bottom - edgeThreshold)) / edgeThreshold));
      container.scrollTop += Math.max(4, Math.round(ratio * 14));
    }
  };

  // Sticky top/bottom auto-scroll guide bars shown while dragging a card inside an exercise modal
  const renderDragAutoScrollEdgeZone = (direction: 'up' | 'down') => {
    if (!isAnyExerciseDragging) return null;
    const isUp = direction === 'up';
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          dragPointerYRef.current = e.clientY;
          dragAutoScrollDirRef.current = direction;
          if (exerciseScrollContainerRef.current) {
            exerciseScrollContainerRef.current.scrollTop += isUp ? -16 : 16;
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          dragAutoScrollDirRef.current = direction;
        }}
        onDragLeave={() => {
          if (dragAutoScrollDirRef.current === direction) {
            dragAutoScrollDirRef.current = null;
          }
        }}
        onDrop={() => {
          dragAutoScrollDirRef.current = null;
        }}
        className={`sticky ${
          isUp ? 'top-0 mb-2' : 'bottom-0 mt-2'
        } z-30 py-1.5 px-3 rounded-xl bg-cyan-950/95 border border-cyan-400/80 text-cyan-200 text-[11px] font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.35)] backdrop-blur-md select-none transition-all`}
      >
        <span>{isUp ? '🔼' : '🔽'}</span>
        <span>
          {isUp
            ? 'ลากการ์ดมาแตะแถบนี้ (หรือหมุนลูกกลิ้งเมาส์) เพื่อเลื่อนหน้าจอขึ้นอัตโนมัติ'
            : 'ลากการ์ดมาแตะแถบนี้ (หรือหมุนลูกกลิ้งเมาส์) เพื่อเลื่อนหน้าจอลงอัตโนมัติ'}
        </span>
        <span>{isUp ? '🔼' : '🔽'}</span>
      </div>
    );
  };

  // Reset exercise state for the current level (used when hearts reach 0 or replaying level)
  const resetCurrentLevelExerciseState = () => {
    if (currentLevelId === 1) {
      setScienceProjectSteps(['', '', '', '']);
      setTripPlanningSteps(['', '', '', '']);
      setActiveDecompCategory('science');
      setExerciseCompleted(false);
      setExerciseError(null);
      setLevel1LearningStep(null);
      try {
        sessionStorage.removeItem('ct_level1_decomposition_answers_v2');
      } catch (e) {}
    } else if (currentLevelId === 2) {
      setPatternAnswers({
        q1: [null, null, null],
        q2: [null, null, null],
        q3: [null, null, null],
        q4: [null, null, null],
      });
      setLevel2ExerciseCompleted(false);
      setLevel2ExerciseError(null);
      setLevel2LearningStep(null);
      try {
        sessionStorage.removeItem('ct_level2_pattern_answers_v3');
      } catch (e) {}
    } else if (currentLevelId === 3) {
      setAbstractionAnswers({
        s1: [null, null, null, null, null],
        s2: [null, null, null, null, null],
      });
      setLevel3ExerciseCompleted(false);
      setLevel3ExerciseError(null);
      setLevel3LearningStep(null);
      try {
        sessionStorage.removeItem('ct_level3_abstraction_answers_v2');
      } catch (e) {}
    } else if (currentLevelId === 4) {
      setFlowchartAnswers([null, null, null, null, null, null, null, null]);
      setLevel4ExerciseCompleted(false);
      setLevel4ExerciseError(null);
      setLevel4LearningStep(null);
      try {
        sessionStorage.removeItem('ct_level4_algorithm_answers');
      } catch (e) {}
    } else if (currentLevelId === 5) {
      setBossAnswers({
        decomposition: null,
        pattern: null,
        abstraction: null,
        algorithm: null,
      });
      setLevel5ExerciseCompleted(false);
      setLevel5ExerciseError(null);
      setLevel5LearningStep(null);
      try {
        sessionStorage.removeItem('ct_level5_boss_answers');
      } catch (e) {}
    }
  };

  // Reusable Life Hearts HUD rendered inside the Exercise Modals
  const renderExerciseHeartsHUD = () => (
    <div
      className="flex items-center gap-1.5 bg-slate-950/90 border border-rose-500/40 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.15)] shrink-0"
      title="พลังชีวิตในแบบฝึกหัด (หากทำผิดจะลดลงครั้งละ 1 ดวง หากหมดต้องเริ่มด่านนี้ใหม่)"
      id="exercise-hearts-hud"
    >
      <span className="text-[11px] sm:text-xs font-mono font-bold text-rose-400 mr-1">
        พลังชีวิต:
      </span>
      {[1, 2, 3].map((heartIdx) => {
        const isActive = heartIdx <= hearts;
        return (
          <div key={heartIdx} className="relative flex items-center justify-center">
            <Heart
              size={18}
              className={`transition-all duration-300 ${
                isActive
                  ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)] animate-pulse'
                  : 'text-slate-700 fill-slate-950/60'
              }`}
            />
            {!isActive && (
              <span className="absolute inset-0 flex items-center justify-center text-[9px] text-rose-500/70 font-mono font-bold">
                ×
              </span>
            )}
          </div>
        );
      })}
      <span className="text-[11px] font-mono text-rose-300 ml-0.5">({hearts}/3)</span>
    </div>
  );

  return (
    <div className="h-full w-full bg-radial from-slate-900 via-[#0B0F19] to-[#04060b] text-white flex flex-col justify-between select-none px-3 sm:px-5 py-2 font-sans relative overflow-hidden">
      {/* Background visual grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* TOP HEADER BAR */}
      <header className="w-full max-w-7xl mx-auto bg-slate-900/90 border border-slate-800/90 rounded-2xl px-3.5 py-2 mb-2 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-2 z-10 shrink-0">
        {/* Left: Home Button + Level Info & Switchers */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={() => {
              audioSynth.playSfx('click');
              onExitToHome();
            }}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 rounded-xl transition-all text-slate-300 hover:text-cyan-300 text-xs font-semibold cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title="กลับสู่หน้าแรก"
            id="back-to-home-btn"
          >
            <Home size={16} />
            <span className="hidden sm:inline">หน้าแรก</span>
          </button>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                if (currentLevelId > 1) {
                  audioSynth.playSfx('click');
                  onLevelChange(currentLevelId - 1);
                }
              }}
              disabled={currentLevelId <= 1 || isRunning}
              className={`p-2 rounded-xl border transition-all ${
                currentLevelId > 1 && !isRunning
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-cyan-400 cursor-pointer'
                  : 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
              }`}
              title="ด่านก่อนหน้า"
              id="prev-level-btn"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Direct Level 1 - 4 Selector Buttons (Play in any order) */}
            <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
              {[1, 2, 3, 4].map((lvlNum) => {
                const isActive = currentLevelId === lvlNum;
                const isDone = completedLevels.includes(lvlNum);
                return (
                  <button
                    key={lvlNum}
                    type="button"
                    disabled={isRunning}
                    onClick={() => {
                      if (currentLevelId !== lvlNum && !isRunning) {
                        audioSynth.playSfx('click');
                        onLevelChange(lvlNum);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                        : isDone
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/80'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-cyan-300'
                    }`}
                    title={`เลือกเล่นด่านที่ ${lvlNum} ได้ทันที`}
                    id={`select-level-${lvlNum}-btn`}
                  >
                    <span>ด่าน {lvlNum}</span>
                    {isDone && (
                      <Check size={12} className={isActive ? 'text-slate-950 stroke-[3]' : 'text-emerald-400 stroke-[3]'} />
                    )}
                  </button>
                );
              })}

              {maxUnlockedLevel >= 5 && (
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => {
                    if (currentLevelId !== 5 && !isRunning) {
                      audioSynth.playSfx('click');
                      onLevelChange(5);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                    currentLevelId === 5
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : completedLevels.includes(5)
                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/80'
                      : 'bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-900/70'
                  }`}
                  title="ด่านที่ 5 เมืองโบราณลึกลับ"
                  id="select-level-5-btn"
                >
                  <span>ด่าน 5</span>
                  {completedLevels.includes(5) && <Check size={12} className="stroke-[3]" />}
                </button>
              )}
            </div>

            <button
              onClick={() => {
                const maxAllowed = Math.max(4, maxUnlockedLevel);
                if (currentLevelId < maxAllowed && currentLevelId < 5) {
                  audioSynth.playSfx('click');
                  onLevelChange(currentLevelId + 1);
                }
              }}
              disabled={currentLevelId >= Math.max(4, maxUnlockedLevel) || currentLevelId >= 5 || isRunning}
              className={`p-2 rounded-xl border transition-all ${
                currentLevelId < Math.max(4, maxUnlockedLevel) && currentLevelId < 5 && !isRunning
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-cyan-400 cursor-pointer'
                  : 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
              }`}
              title="ด่านถัดไป"
              id="next-level-btn"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div>
            {(() => {
              const match = currentConfig.title.match(/^(.*?)\s*(\(.*\))$/);
              const mainTitle = match ? match[1] : currentConfig.title;
              const subText = match ? match[2] : '';
              return (
                <div className="flex flex-col leading-snug mb-0.5">
                  <span className="text-xs md:text-sm font-extrabold text-cyan-300 font-mono tracking-wider">
                    {mainTitle}
                  </span>
                  {subText && (
                    <span className="text-[11px] md:text-xs font-medium text-cyan-400/85 font-sans">
                      {subText}
                    </span>
                  )}
                </div>
              );
            })()}
            <div className="text-[11px] text-slate-400 font-sans">
              นักเดินทาง: <strong className="text-slate-200">{travelerName}</strong> ({travelerGender === 'female' ? '👧 พอใจ' : '👦 กวิน'})
            </div>
          </div>
        </div>

        {/* Center: Mission Target Tracker */}
        <div className="flex items-center gap-2 sm:gap-3 bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)] flex-wrap justify-center">
          <span className="text-[10px] sm:text-xs font-mono uppercase text-cyan-400 tracking-wider font-bold flex items-center gap-1">
            <Compass size={13} /> ภารกิจเป้าหมาย:
          </span>
          <div className="flex items-center gap-2">
            {(Object.keys(currentConfig.targetCount) as LandmarkType[]).map((type) => {
              const req = currentConfig.targetCount[type];
              if (!req || req === 0) return null;
              const cur = checkedByType[type] || 0;
              const isDone = cur >= req;
              const info = LANDMARK_INFO[type];

              return (
                <div 
                  key={type}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border transition-all ${
                    isDone 
                      ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                  title={`ต้องเช็คอินที่ ${info.name} จำนวน ${req} แห่ง`}
                >
                  <span>{info.icon}</span>
                  <span>{cur}/{req}</span>
                  {isDone && <CheckCircle2 size={13} className="text-emerald-400" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Score Board & Audio Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-end flex-wrap">
          <div className="bg-gradient-to-r from-amber-950/40 to-slate-900 px-3.5 py-1.5 rounded-xl border border-amber-500/40 text-right shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <div className="text-[10px] uppercase font-mono text-amber-400 tracking-wider">
              คะแนนสะสม
            </div>
            <div className="text-xs sm:text-sm font-black text-amber-300 font-mono">
              ด่านนี้: <span className="text-white">{currentLevelPoints}</span> | รวม: <span className="text-amber-400">{totalAccumulatedScore + currentLevelPoints}</span> PTS
            </div>
          </div>

          <button
            onClick={handleToggleAudio}
            className="p-2.5 bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition-all text-cyan-400 cursor-pointer"
            title={soundEnabled ? "ปิดเสียง" : "เปิดเสียง"}
            id="toggle-audio-top-btn"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      {/* MAIN TWO-COLUMN CONTAINER */}
      <main className="w-full max-w-7xl mx-auto flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch z-10 overflow-hidden">
        {/* LEFT COLUMN (~60% width): 5x5 MATRIX GRID & CONTROLS */}
        <div className="md:col-span-7 flex flex-col items-center justify-between bg-slate-900/70 border border-slate-800/90 rounded-3xl p-3 sm:p-3.5 backdrop-blur-md shadow-2xl relative h-full min-h-0 overflow-hidden">
          <div className="w-full flex items-center justify-between mb-1 text-xs text-slate-400 flex-wrap gap-2 shrink-0">
            <span className="font-mono text-cyan-400 flex items-center gap-1">
              <Compass size={14} /> แผนที่เมทริกซ์ 5x5 พิกัดเมืองดิจิทัล
            </span>
            <span className="font-mono text-slate-400">
              เป้าหมาย 3 ดาว: ≤ {currentConfig.targetBlocks3Star} บล็อก
            </span>
          </div>

          {/* 5x5 Matrix Grid Wrapper (Keeps fixed original size; notification is placed in the empty space beside the grid) */}
          <div className="w-full flex-1 min-h-0 relative flex items-center justify-center py-1 overflow-hidden [container-type:size]">
            <div className="relative p-2 sm:p-2.5 bg-slate-950 rounded-2xl border-2 border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.15)] aspect-square flex flex-col justify-between w-[min(420px,98cqw,98cqh)] h-[min(420px,98cqw,98cqh)] max-w-full max-h-full">
              {/* 5 rows */}
              {Array.from({ length: 5 }).map((_, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-5 gap-1.5 sm:gap-2 h-[18%]">
                  {Array.from({ length: 5 }).map((_, colIdx) => {
                    const isPlayerHere = playerPos.x === colIdx && playerPos.y === rowIdx;
                    const isStartPos = currentConfig.startPos.x === colIdx && currentConfig.startPos.y === rowIdx;
                    const obstacle = currentConfig.obstacles.find(o => o.x === colIdx && o.y === rowIdx);
                    const isCollidedObstacle = collidedObstaclePos?.x === colIdx && collidedObstaclePos?.y === rowIdx;
                    const landmark = currentConfig.landmarks.find(l => l.x === colIdx && l.y === rowIdx);
                    const isCheckedIn = landmark && checkedInIds.includes(landmark.id);

                    return (
                      <div
                        key={colIdx}
                        className={`relative rounded-xl flex items-center justify-center transition-all duration-200 border text-center overflow-hidden ${
                          isPlayerHere
                            ? 'bg-cyan-950/70 border-cyan-400 ring-2 ring-cyan-400/80 shadow-[0_0_18px_rgba(6,182,212,0.5)] z-20 scale-105'
                            : isCollidedObstacle
                            ? 'bg-rose-950/90 border-rose-500 ring-2 ring-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.7)] animate-pulse z-10'
                            : obstacle
                            ? obstacle.type === 'rock'
                              ? 'bg-stone-900/80 border-stone-700/80'
                              : obstacle.type === 'tree'
                              ? 'bg-emerald-950/50 border-emerald-800/60'
                              : 'bg-blue-950/70 border-blue-800/80'
                            : landmark
                            ? isCheckedIn
                              ? 'bg-amber-950/60 border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                              : 'bg-slate-900/90 border-slate-700 hover:border-amber-500/50'
                            : isStartPos
                            ? 'bg-slate-900/70 border-dashed border-cyan-500/60'
                            : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/60'
                        }`}
                      >
                        {/* Grid Coordinates watermark */}
                        <span className="absolute top-0.5 left-1 text-[8px] font-mono text-slate-600 pointer-events-none leading-none">
                          {colIdx},{rowIdx}
                        </span>

                        {/* Start flag */}
                        {isStartPos && !isPlayerHere && (
                          <span className="absolute bottom-0.5 right-0.5 text-[7px] sm:text-[8px] font-mono text-cyan-400 bg-cyan-950/80 px-1 rounded leading-tight">
                            START
                          </span>
                        )}

                        {/* Obstacle Icon */}
                        {obstacle && (
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-lg sm:text-xl filter drop-shadow-md animate-pulse leading-none">
                              {obstacle.type === 'rock' ? '🪨' : obstacle.type === 'tree' ? '🌲' : '💧'}
                            </span>
                          </div>
                        )}

                        {/* Landmark Icon */}
                        {landmark && (
                          <div className="flex flex-col items-center justify-center relative">
                            <span className="text-lg sm:text-xl filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] leading-none">
                              {LANDMARK_INFO[landmark.type].icon}
                            </span>
                            {isCheckedIn && (
                              <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow-md">
                                <CheckCircle2 size={11} className="stroke-[3]" />
                              </div>
                            )}
                            <span className="text-[7px] sm:text-[8px] font-mono text-amber-300 font-bold bg-slate-950/80 px-1 rounded mt-0.5 leading-none">
                              +{landmark.points}
                            </span>
                          </div>
                        )}

                        {/* Player Avatar */}
                        {isPlayerHere && (
                          <motion.div
                            layoutId="player-avatar"
                            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                            className="flex flex-col items-center justify-center z-30"
                          >
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-300 flex items-center justify-center text-base sm:text-lg shadow-[0_0_15px_rgba(6,182,212,0.8)] border border-white">
                              {travelerGender === 'female' ? '👧' : '👦'}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Execution Controls under Grid */}
          <div className="w-full max-w-[420px] flex gap-2.5 mt-2 shrink-0">
            <button
              onClick={handleStartTravel}
              disabled={isRunning}
              className={`flex-1 py-2 sm:py-2.5 px-5 rounded-2xl font-extrabold text-sm sm:text-base tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                isRunning
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] transform hover:scale-[1.02] active:scale-95'
              }`}
              id="start-travel-btn"
            >
              <Play size={18} fill="currentColor" />
              <span>เริ่มการเดินทาง</span>
            </button>

            <button
              onClick={() => handleResetSimulation(true)}
              className="py-2 sm:py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-2xl text-slate-200 font-bold transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 hover:border-slate-500 shadow-md"
              id="reset-travel-btn"
              title="รีเซ็ตตำแหน่งตัวละครกลับจุดเริ่มต้น"
            >
              <RotateCcw size={16} />
              <span>เริ่มใหม่</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (~40% width): COMMAND CONSOLE & WORKSPACE QUEUE */}
        <div className="md:col-span-5 flex flex-col bg-slate-900/70 border border-slate-800/90 rounded-3xl p-3 sm:p-3.5 backdrop-blur-md shadow-2xl h-full min-h-0 overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h3 className="font-extrabold text-slate-100 text-xs sm:text-sm tracking-wide">
                คอนโซลควบคุมชุดคำสั่ง (Algorithm Workspace)
              </h3>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
              {commands.length} บล็อก
            </span>
          </div>

          {/* REAL-TIME MISTAKE NOTIFICATION BOX (แสดงด้านบนในส่วนของหน้าควบคุมชุดคำสั่ง) */}
          <AnimatePresence>
            {realtimeAlert && (
              <motion.div
                key={`${realtimeAlert.type}-${realtimeAlert.title}-${realtimeAlert.text}`}
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                id="realtime-notification-box"
                className={`w-full mb-2 px-3 py-2 rounded-xl border-2 shadow-lg flex items-start gap-2.5 transition-colors shrink-0 ${
                  realtimeAlert.type === 'error'
                    ? 'bg-rose-950/90 border-rose-500 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                    : 'bg-amber-950/90 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                }`}
                role="alert"
                aria-live="assertive"
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                    realtimeAlert.type === 'error'
                      ? 'bg-rose-500 text-slate-950 animate-bounce'
                      : 'bg-amber-400 text-slate-950 animate-pulse'
                  }`}
                >
                  <AlertTriangle size={15} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <span
                      className={`text-xs font-black tracking-wide ${
                        realtimeAlert.type === 'error' ? 'text-rose-300' : 'text-amber-300'
                      }`}
                    >
                      {realtimeAlert.title}
                    </span>

                    {/* 3-Level Progressive Hint Stepper Pills */}
                    <div className="flex items-center gap-1 text-[9px] font-mono">
                      {([
                        { tier: 1 as const, label: '1.ชวนคิด' },
                        { tier: 2 as const, label: '2.ชี้จุดผิด' },
                        { tier: 3 as const, label: '3.ตัวอย่าง' },
                      ]).map((t) => {
                        const isCurrent = realtimeAlert.activeTier === t.tier;
                        return (
                          <button
                            key={t.tier}
                            type="button"
                            onClick={() => {
                              audioSynth.playSfx('click');
                              setManualGridHintTier(t.tier);
                            }}
                            className={`px-1.5 py-0.5 rounded border font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-amber-400 text-slate-950 border-amber-200'
                                : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:border-amber-400/60 hover:text-amber-200'
                            }`}
                            title={`คลิกเพื่อดูคำใบ้ระดับที่ ${t.tier}`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[11px] sm:text-xs leading-snug font-medium text-slate-100 mt-0.5">
                    {realtimeAlert.text}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* กล่องข้อความแจ้งเตือนเมื่อเปิดโหมดวนลูป */}
          <AnimatePresence>
            {isLoopModeActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.18 }}
                className="mb-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-950/90 via-purple-900/80 to-indigo-950/90 border-2 border-purple-400/90 shadow-[0_0_15px_rgba(168,85,247,0.4)] flex items-start justify-between gap-2 backdrop-blur-md shrink-0"
                role="alert"
                id="loop-selection-alert-box"
              >
                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-purple-500 text-white rounded-lg shadow-md shrink-0 animate-pulse mt-0.5">
                    <Repeat size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black text-purple-100 tracking-wide">
                        โหมดวนลูปทำงาน ({loopCount} รอบ)
                      </h4>
                      <span className="text-[9px] bg-purple-500/40 text-purple-200 px-1.5 py-0.5 rounded-full border border-purple-400/40 font-mono font-bold animate-pulse">
                        รอเลือกคำสั่ง
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-200/95 mt-0.5 leading-snug font-medium">
                      👇 <strong>กรุณากดเลือกคำสั่งทิศทาง</strong> ด้านล่างนี้ ที่ต้องการให้ทำงานวนซ้ำ <span className="text-amber-300 font-extrabold">{loopCount} รอบ</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setIsLoopModeActive(false);
                    setStatusMessage(null);
                  }}
                  className="text-purple-300 hover:text-white p-1 hover:bg-purple-800/80 rounded-lg transition-colors shrink-0 cursor-pointer"
                  title="ยกเลิกการวนลูป"
                  id="cancel-loop-mode-btn"
                >
                  <X size={15} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1. Direction Buttons Grid */}
          <div className="mb-2.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-300 block mb-1.5 font-mono uppercase tracking-wider">
              1. ปุ่มควบคุมทิศทาง (Direction Blocks)
            </span>
            <div className="grid grid-cols-3 gap-1.5 max-w-[250px] mx-auto">
              <div />
              <button
                onClick={() => addCommand('up')}
                disabled={isRunning}
                className={`p-2 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 shadow-sm ${
                  isLoopModeActive
                    ? 'bg-purple-900/60 hover:bg-purple-600 text-purple-100 border-2 border-purple-400 hover:border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] ring-2 ring-purple-400/30'
                    : 'bg-slate-800 hover:bg-cyan-600 hover:text-white border border-slate-700 hover:border-cyan-400 text-cyan-300'
                }`}
                id="cmd-up-btn"
              >
                <ArrowUp size={18} />
                <span className="text-[11px] font-semibold">{isLoopModeActive ? `ขึ้นบน (x${loopCount})` : 'ขึ้นบน'}</span>
              </button>
              <div />

              <button
                onClick={() => addCommand('left')}
                disabled={isRunning}
                className={`p-2 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 shadow-sm ${
                  isLoopModeActive
                    ? 'bg-purple-900/60 hover:bg-purple-600 text-purple-100 border-2 border-purple-400 hover:border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] ring-2 ring-purple-400/30'
                    : 'bg-slate-800 hover:bg-cyan-600 hover:text-white border border-slate-700 hover:border-cyan-400 text-cyan-300'
                }`}
                id="cmd-left-btn"
              >
                <ArrowLeft size={18} />
                <span className="text-[11px] font-semibold">{isLoopModeActive ? `เลี้ยวซ้าย (x${loopCount})` : 'เลี้ยวซ้าย'}</span>
              </button>

              <button
                onClick={() => addCommand('down')}
                disabled={isRunning}
                className={`p-2 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 shadow-sm ${
                  isLoopModeActive
                    ? 'bg-purple-900/60 hover:bg-purple-600 text-purple-100 border-2 border-purple-400 hover:border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] ring-2 ring-purple-400/30'
                    : 'bg-slate-800 hover:bg-cyan-600 hover:text-white border border-slate-700 hover:border-cyan-400 text-cyan-300'
                }`}
                id="cmd-down-btn"
              >
                <ArrowDown size={18} />
                <span className="text-[11px] font-semibold">{isLoopModeActive ? `ลงล่าง (x${loopCount})` : 'ลงล่าง'}</span>
              </button>

              <button
                onClick={() => addCommand('right')}
                disabled={isRunning}
                className={`p-2 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95 shadow-sm ${
                  isLoopModeActive
                    ? 'bg-purple-900/60 hover:bg-purple-600 text-purple-100 border-2 border-purple-400 hover:border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.5)] ring-2 ring-purple-400/30'
                    : 'bg-slate-800 hover:bg-cyan-600 hover:text-white border border-slate-700 hover:border-cyan-400 text-cyan-300'
                }`}
                id="cmd-right-btn"
              >
                <ArrowRight size={18} />
                <span className="text-[11px] font-semibold">{isLoopModeActive ? `เลี้ยวขวา (x${loopCount})` : 'เลี้ยวขวา'}</span>
              </button>
            </div>
          </div>

          {/* 2. Action & Loop Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2.5 shrink-0">
            {/* Check-in action button */}
            <button
              onClick={() => addCommand('checkin')}
              disabled={isRunning}
              className="py-2 px-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-xs sm:text-sm"
              id="cmd-checkin-btn"
            >
              <MapPin size={16} />
              <span>📍 เช็คอิน</span>
            </button>

            {/* Loop controller */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-purple-500/40">
              <span className="text-[11px] font-mono text-purple-300 px-1">รอบ:</span>
              <input
                type="number"
                min="2"
                max="5"
                value={loopCount}
                onChange={(e) => setLoopCount(Math.max(2, Math.min(5, parseInt(e.target.value) || 2)))}
                disabled={isRunning}
                className="w-9 py-0.5 px-1 bg-slate-900 border border-purple-800 rounded-lg text-center font-bold text-xs text-purple-200 outline-none"
                id="loop-count-input"
              />
              <button
                onClick={() => {
                  audioSynth.playSfx('click');
                  const nextState = !isLoopModeActive;
                  setIsLoopModeActive(nextState);
                  setStatusMessage(null);
                }}
                disabled={isRunning}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  isLoopModeActive
                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)] animate-pulse'
                    : 'bg-purple-950/80 text-purple-300 hover:bg-purple-900 border border-purple-800'
                }`}
                id="cmd-loop-btn"
                title="คลิกแล้วเลือกทิศทางเพื่อทำซ้ำ"
              >
                <Repeat size={13} />
                <span>{isLoopModeActive ? 'เลือกลูกศร...' : '🔁 เพิ่มลูป'}</span>
              </button>
            </div>
          </div>

          {/* 3. Workspace Queue */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950/80 border border-slate-800 rounded-2xl p-2.5 overflow-hidden">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 mb-1.5 shrink-0">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                ลำดับคำสั่ง (Workspace Queue)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                คลิก [❌] เพื่อ Debug ลบบรรทัด
              </span>
            </div>

            {commands.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-xs text-center p-4">
                <span>ยังไม่มีคำสั่งในกล่อง</span>
                <span className="text-[10px] text-slate-700 mt-1">
                  กดเลือกปุ่มทิศทางหรือเช็คอินด้านบนเพื่อสร้างอัลกอริทึม
                </span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                {commands.map((cmd, idx) => {
                  const isCurrent = activeExecutingCmdId === cmd.id;
                  const isLoop = cmd.repeat > 1;
                  const isRepeatedMove =
                    firstRunMissedLoop &&
                    !usedLoopInCommands &&
                    cmd.action !== 'checkin' &&
                    ((idx > 0 && commands[idx - 1].action === cmd.action) ||
                      (idx < commands.length - 1 && commands[idx + 1].action === cmd.action));

                  return (
                    <motion.div
                      key={cmd.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-all ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 border-white font-black shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-[1.02]'
                          : isRepeatedMove
                          ? 'bg-amber-950/50 border-amber-500/70 text-amber-200'
                          : isLoop
                          ? 'bg-purple-950/50 border-purple-700 text-purple-200'
                          : 'bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-mono text-[10px] ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>
                          0{idx + 1}.
                        </span>
                        {isLoop && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-900 text-purple-300 font-mono font-bold text-[10px]">
                            🔁 {cmd.repeat}x
                          </span>
                        )}
                        <span className="font-bold flex items-center gap-1">
                          {cmd.action === 'up' && '⬆️ ก้าวขึ้นบน'}
                          {cmd.action === 'down' && '⬇️ ก้าวลงล่าง'}
                          {cmd.action === 'left' && '⬅️ ก้าวเลี้ยวซ้าย'}
                          {cmd.action === 'right' && '➡️ ก้าวเลี้ยวขวา'}
                          {cmd.action === 'checkin' && '📍 คำสั่งเช็คอิน (Check-in)'}
                        </span>
                        {isRepeatedMove && !isCurrent && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono font-bold text-[10px]">
                            คำสั่งซ้ำ (ควรใช้ 🔄 วนลูป)
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => deleteCommand(cmd.id)}
                        disabled={isRunning}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isCurrent ? 'text-slate-900 hover:bg-cyan-600' : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                        }`}
                        title="ลบคำสั่งนี้"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Clear all queue button */}
          <div className="pt-2 shrink-0">
            <button
              onClick={clearAllCommands}
              disabled={isRunning || commands.length === 0}
              className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                commands.length > 0 && !isRunning
                  ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 hover:border-rose-600'
                  : 'bg-slate-950 text-slate-700 border border-slate-900 cursor-not-allowed'
              }`}
              id="clear-queue-btn"
            >
              <Trash2 size={14} />
              <span>ลบคำสั่งทั้งหมด</span>
            </button>
          </div>
        </div>
      </main>

      {/* ALGORITHM COMPARISON & METACOGNITIVE REFLECTION MODAL (Shown when 5x5 Grid is passed) */}
      <AnimatePresence>
        {showAlgorithmComparisonModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 24 }}
              className="bg-slate-900 border-2 border-cyan-400/80 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-[0_0_55px_rgba(6,182,212,0.35)] relative my-auto max-h-[94vh] flex flex-col overflow-hidden"
              id="algorithm-comparison-modal"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 shrink-0 flex-wrap">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold mb-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span>ภารกิจเดินตาราง 5x5 ด่านที่ {currentLevelId} สำเร็จ! · สะท้อนคิดและเปรียบเทียบอัลกอริทึม</span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-white tracking-wide">
                    ⚡ เปรียบเทียบประสิทธิภาพอัลกอริทึม (Algorithm Comparison)
                  </h3>
                </div>
                <span
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black border shrink-0 ${
                    totalBlocksUsed <= optimalBlocksCount
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                      : 'bg-amber-950/80 border-amber-400 text-amber-300'
                  }`}
                >
                  {totalBlocksUsed <= optimalBlocksCount
                    ? '🏆 ประสิทธิภาพสูงสุด (Optimal!)'
                    : `💡 ย่อเพิ่มได้อีก ${totalBlocksUsed - optimalBlocksCount} บล็อก`}
                </span>
              </div>

              {/* Main Comparison Banner */}
              <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-slate-950 to-emerald-950/70 border-2 border-cyan-500/50 text-center shadow-inner shrink-0">
                <p className="text-sm sm:text-lg font-black text-white tracking-wide">
                  ชุดคำสั่งของนักเรียนใช้{' '}
                  <span
                    className={`px-2.5 py-0.5 rounded-lg font-mono ${
                      totalBlocksUsed <= optimalBlocksCount
                        ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                        : 'bg-amber-500/20 border border-amber-400 text-amber-300'
                    }`}
                  >
                    {totalBlocksUsed} บล็อก
                  </span>{' '}
                  <span className="text-slate-400 font-mono mx-1">vs</span> ชุดคำสั่งที่สั้นที่สุดใช้{' '}
                  <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-mono">
                    {optimalBlocksCount} บล็อก
                  </span>
                </p>
                <p className="text-xs text-slate-300 mt-1.5">
                  {totalBlocksUsed <= optimalBlocksCount
                    ? 'ยอดเยี่ยมมาก! นักเรียนออกแบบอัลกอริทึมได้กระชับที่สุดและใช้การวนลูปได้อย่างคุ้มค่า'
                    : 'ภารกิจสำเร็จแล้ว! ลองเปรียบเทียบดูว่าชุดคำสั่งที่สั้นที่สุดใช้การย่อยภารกิจและวนลูป (🔄) ยุบรวมคำสั่งซ้ำอย่างไร'}
                </p>
              </div>

              {/* Side-by-Side Comparison Columns */}
              <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Left Column: Student's Algorithm */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 flex flex-col">
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                      <span className="text-xs sm:text-sm font-extrabold text-cyan-300">
                        🧑‍💻 ชุดคำสั่งของนักเรียน
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                        ใช้ {totalBlocksUsed} บล็อก
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {commands.map((cmd, idx) => {
                        const isCanCompress =
                          cmd.repeat === 1 &&
                          cmd.action !== 'checkin' &&
                          ((idx > 0 && commands[idx - 1].action === cmd.action) ||
                            (idx < commands.length - 1 && commands[idx + 1].action === cmd.action));
                        return (
                          <div
                            key={cmd.id}
                            className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between border ${
                              cmd.repeat > 1
                                ? 'bg-purple-950/50 border-purple-500/50 text-purple-200'
                                : isCanCompress
                                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                                : 'bg-slate-900 border-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-slate-500">
                                0{idx + 1}.
                              </span>
                              {cmd.repeat > 1 && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-900 text-purple-200 font-mono font-bold text-[10px]">
                                  🔁 {cmd.repeat}x
                                </span>
                              )}
                              <span className="font-bold">
                                {cmd.action === 'up' && '⬆️ ก้าวขึ้นบน'}
                                {cmd.action === 'down' && '⬇️ ก้าวลงล่าง'}
                                {cmd.action === 'left' && '⬅️ ก้าวเลี้ยวซ้าย'}
                                {cmd.action === 'right' && '➡️ ก้าวเลี้ยวขวา'}
                                {cmd.action === 'checkin' && '📍 คำสั่งเช็คอิน'}
                              </span>
                            </div>
                            {isCanCompress && (
                              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                                ยุบด้วย 🔄 ได้
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Shortest / Optimal Algorithm */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 flex flex-col">
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-300">
                        ✨ ชุดคำสั่งที่สั้นที่สุด (Optimal Algorithm)
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        ใช้ {optimalBlocksCount} บล็อก
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                      {optimalCommands.map((cmd, idx) => (
                        <div
                          key={idx}
                          className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between border ${
                            cmd.repeat > 1
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
                              : 'bg-slate-900 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-500">
                              0{idx + 1}.
                            </span>
                            {cmd.repeat > 1 && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-bold text-[10px]">
                                🔁 {cmd.repeat}x
                              </span>
                            )}
                            <span className="font-bold">
                              {cmd.action === 'up' && '⬆️ ก้าวขึ้นบน'}
                              {cmd.action === 'down' && '⬇️ ก้าวลงล่าง'}
                              {cmd.action === 'left' && '⬅️ ก้าวเลี้ยวซ้าย'}
                              {cmd.action === 'right' && '➡️ ก้าวเลี้ยวขวา'}
                              {cmd.action === 'checkin' && '📍 คำสั่งเช็คอิน'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                            {cmd.subTitle}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metacognitive Reflection Box */}
                <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div className="text-xs sm:text-sm space-y-1">
                    <strong className="text-amber-300 block">
                      🧠 มุมสะท้อนคิด (Metacognitive Reflection): ทำไมความสั้นและกระชับของอัลกอริทึมจึงสำคัญ?
                    </strong>
                    <p className="text-slate-200 leading-relaxed">
                      การออกแบบชุดคำสั่งให้ใช้จำนวนบล็อกน้อยที่สุดด้วยการสังเกตรูปแบบซ้ำแล้วใช้{' '}
                      <strong className="text-purple-300">🔄 วนลูป (Loop)</strong>{' '}
                      ช่วยให้โปรแกรมทำงานได้รวดเร็ว ประหยัดหน่วยความจำ อ่านตรวจสอบข้อผิดพลาด (Debug) ได้ง่าย และสะท้อนทักษะการคิดเชิงคำนวณทั้ง 4 ด้านอย่างครบถ้วน!
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setShowAlgorithmComparisonModal(false);
                    handleResetSimulation();
                  }}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  id="optimize-algorithm-retry-btn"
                >
                  <RotateCcw size={16} className="text-cyan-400" />
                  <span>ลองปรับปรุงชุดคำสั่งให้สั้นลง</span>
                </button>

                <button
                  type="button"
                  onClick={handleProceedAfterAlgorithmComparison}
                  className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base transition-all cursor-pointer shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
                  id="proceed-after-comparison-btn"
                >
                  <span>
                    {currentLevelId <= 4
                      ? `เข้าใจแล้ว ➔ เข้าสู่ใบความรู้และแบบฝึกหัดด่านที่ ${currentLevelId}`
                      : 'เข้าใจแล้ว ➔ เข้าสู่ภารกิจสรุปรวบยอด (Boss Challenge) ด่านที่ 5'}
                  </span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEVEL 1 DECOMPOSITION KNOWLEDGE & EXERCISE MODALS (Shown after completing Level 1 Grid Mission) */}
      <AnimatePresence>
        {level1LearningStep === 'knowledge' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 25 }}
              className="bg-slate-900 border-2 border-cyan-400/70 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative my-auto max-h-[90vh] flex flex-col overflow-hidden"
              id="level1-knowledge-modal"
            >
              {/* Scrollable Knowledge Content */}
              <div className="flex-1 min-h-0 overflow-y-auto drag-scroll-container pr-1.5">
                {/* Top Mission Accomplished Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold mb-3.5">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span>ภารกิจการเดินทางด่านที่ 1 สำเร็จ! · ส่วนความรู้ก่อนทำแบบฝึกหัด</span>
                </div>

                {/* Knowledge Title */}
                <div className="flex items-center gap-3 mb-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] shrink-0">
                    <Layers size={26} />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                      การแยกย่อยปัญหาคืออะไร?
                    </h3>
                    <span className="text-xs font-mono text-cyan-300">
                      องค์ประกอบที่ 1 ของแนวคิดเชิงคำนวณ: การแยกย่อยปัญหา (Decomposition)
                    </span>
                  </div>
                </div>

                {/* Definition Box */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/40 mb-4 shadow-inner">
                  <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium">
                    คือ <strong className="text-cyan-300">การแบ่งปัญหาหรืองานใหญ่ ๆ ออกเป็นส่วนย่อย ๆ ที่เล็กลง</strong> เพื่อให้เข้าใจง่าย จัดการได้สะดวก และแก้ไขได้อย่างมีประสิทธิภาพ
                  </p>
                </div>

                {/* Example Section: จัดงานวันเกิด */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 border border-amber-500/40 mb-1">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <span className="text-xs sm:text-sm font-extrabold text-amber-300 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-amber-400" />
                      ตัวอย่างการย่อยปัญหา
                    </span>
                    <span className="text-xs font-bold text-slate-300 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                      ปัญหาใหญ่ : 🎂 จัดงานวันเกิด
                    </span>
                  </div>

                  {/* Visual Diagram of Decomposed Steps */}
                  <div className="flex flex-col items-center">
                    <div className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-sm shadow-[0_0_15px_rgba(245,158,11,0.4)] mb-2.5">
                      🎂 จัดงานวันเกิด
                    </div>
                    <div className="text-xs text-amber-300/90 mb-2 font-mono">
                      ⬇️ แบ่งออกเป็นส่วนย่อย ๆ ได้ดังนี้ ⬇️
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 w-full">
                      {[
                        { step: 1, icon: '📅', text: 'กำหนดวัน-เวลา' },
                        { step: 2, icon: '📝', text: 'ทำรายชื่อแขก' },
                        { step: 3, icon: '🍹', text: 'เตรียมอาหารและเครื่องดื่ม' },
                        { step: 4, icon: '🎈', text: 'จัดสถานที่และตกแต่ง' },
                        { step: 5, icon: '✅', text: 'ตรวจสอบความพร้อม' },
                      ].map((item) => (
                        <div
                          key={item.step}
                          className="p-2.5 rounded-xl bg-slate-900/95 border border-amber-500/30 flex sm:flex-col items-center justify-start sm:justify-center gap-2 sm:text-center shadow-sm"
                        >
                          <span className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/60 text-amber-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                            {item.step}
                          </span>
                          <span className="text-base shrink-0">{item.icon}</span>
                          <span className="text-xs font-bold text-slate-100 leading-snug">
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dedicated Footer Area for Button to Enter Decomposition Exercise */}
              <div className="pt-3.5 mt-3 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setExerciseError(null);
                    setLevel1LearningStep('exercise');
                  }}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-base sm:text-lg tracking-wide rounded-2xl transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                  id="enter-decomposition-exercise-btn"
                >
                  <span>เข้าสู่แบบฝึกหัด การย่อยปัญหา (Decomposition)</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {level1LearningStep === 'exercise' && (() => {
          const DECOMPOSITION_CARDS: {
            id: string;
            text: string;
            icon: string;
            category: 'science' | 'trip' | 'distractor';
            wrongReason: string;
          }[] = [
            {
              id: 'sc_1',
              text: 'กำหนดหัวข้อปัญหาและตั้งสมมติฐาน',
              icon: '🎯',
              category: 'science',
              wrongReason: 'วางสลับหมวดหมู่! การตั้งสมมติฐานเป็นส่วนย่อยของ "การทำโครงงานวิทยาศาสตร์" ไม่ใช่การวางแผนท่องเที่ยว',
            },
            {
              id: 'tr_1',
              text: 'เลือกสถานที่ท่องเที่ยวและกำหนดวัน-เวลาเดินทาง',
              icon: '📅',
              category: 'trip',
              wrongReason: 'วางสลับหมวดหมู่! การเลือกสถานที่เที่ยวและวันเดินทางเป็นส่วนย่อยของ "การวางแผนท่องเที่ยวกับเพื่อน"',
            },
            {
              id: 'ds_1',
              text: 'ทำโครงงานทั้งหมดคนเดียวให้เสร็จในรวดเดียวโดยไม่แบ่งขั้นตอน',
              icon: '🚫',
              category: 'distractor',
              wrongReason: 'การ์ดตัวลวง! การรวบงานใหญ่ทำทีเดียวโดยไม่แบ่งเป็นขั้นตอนย่อย ไม่ใช่หลักการย่อยปัญหา (Decomposition)',
            },
            {
              id: 'sc_2',
              text: 'ค้นคว้าข้อมูลและเตรียมวัสดุอุปกรณ์ทดลอง',
              icon: '🧪',
              category: 'science',
              wrongReason: 'วางสลับหมวดหมู่! การเตรียมวัสดุอุปกรณ์ทดลองเป็นส่วนย่อยของ "การทำโครงงานวิทยาศาสตร์"',
            },
            {
              id: 'tr_2',
              text: 'สำรวจจำนวนเพื่อนร่วมทริปและคำนวณงบประมาณ',
              icon: '💰',
              category: 'trip',
              wrongReason: 'วางสลับหมวดหมู่! การสำรวจเพื่อนร่วมทริปและงบประมาณเป็นส่วนย่อยของ "การวางแผนท่องเที่ยวกับเพื่อน"',
            },
            {
              id: 'ds_2',
              text: 'ออกเดินทางไปเที่ยวทันทีโดยไม่ต้องวางแผนหรือนัดหมายล่วงหน้า',
              icon: '🚫',
              category: 'distractor',
              wrongReason: 'การ์ดตัวลวง! การเดินทางโดยไม่แบ่งส่วนย่อยเพื่อวางแผนล่วงหน้า ขาดการใช้ทักษะการย่อยปัญหา',
            },
            {
              id: 'tr_3',
              text: 'จองที่พักและวางแผนยานพาหนะการเดินทาง',
              icon: '🚌',
              category: 'trip',
              wrongReason: 'วางสลับหมวดหมู่! การจองที่พักและวางแผนยานพาหนะเป็นส่วนย่อยของ "การวางแผนท่องเที่ยวกับเพื่อน"',
            },
            {
              id: 'sc_3',
              text: 'ลงมือทำการทดลองและบันทึกผลการทดลอง',
              icon: '📝',
              category: 'science',
              wrongReason: 'วางสลับหมวดหมู่! การลงมือทดลองและบันทึกผลเป็นส่วนย่อยของ "การทำโครงงานวิทยาศาสตร์"',
            },
            {
              id: 'ds_3',
              text: 'เลือกจำเฉพาะสีปกสมุดรายงานโดยไม่สนใจขั้นตอนการทดลอง',
              icon: '🚫',
              category: 'distractor',
              wrongReason: 'การ์ดตัวลวง! สีปกสมุดเป็นเพียงรายละเอียดปลีกย่อย ไม่ใช่องค์ประกอบหลักของการย่อยปัญหาโครงงานวิทยาศาสตร์',
            },
            {
              id: 'sc_4',
              text: 'วิเคราะห์สรุปผลและจัดทำเล่มรายงานนำเสนอ',
              icon: '📊',
              category: 'science',
              wrongReason: 'วางสลับหมวดหมู่! การวิเคราะห์สรุปผลและทำเล่มรายงานเป็นส่วนย่อยของ "การทำโครงงานวิทยาศาสตร์"',
            },
            {
              id: 'tr_4',
              text: 'จัดกระเป๋าสัมภาระและตรวจสอบความพร้อมก่อนออกเดินทาง',
              icon: '🎒',
              category: 'trip',
              wrongReason: 'วางสลับหมวดหมู่! การจัดกระเป๋าสัมภาระก่อนเดินทางเป็นส่วนย่อยของ "การวางแผนท่องเที่ยวกับเพื่อน"',
            },
            {
              id: 'ds_4',
              text: 'รอให้เพื่อนจัดการเรื่องเที่ยวทุกอย่างทั้งหมดโดยไม่ช่วยแยกงาน',
              icon: '🚫',
              category: 'distractor',
              wrongReason: 'การ์ดตัวลวง! การปล่อยให้เพื่อนทำทั้งหมดโดยไม่แบ่งแยกภารกิจย่อยช่วยกัน ไม่ใช่การย่อยปัญหาที่มีประสิทธิภาพ',
            },
          ];

          const evaluateDecompSlot = (text: string, expectedCategory: 'science' | 'trip') => {
            if (!text || !text.trim()) {
              return { valid: false, status: 'empty' as const, reason: 'ยังไม่ได้เลือกการ์ดส่วนย่อย', icon: '➕' };
            }
            const card = DECOMPOSITION_CARDS.find(c => c.text === text);
            if (!card) {
              return { valid: false, status: 'empty' as const, reason: 'ยังไม่ได้เลือกการ์ดส่วนย่อย', icon: '➕' };
            }
            if (card.category === expectedCategory) {
              return {
                valid: true,
                status: 'valid' as const,
                reason: 'ถูกต้อง! เป็นส่วนย่อยของปัญหานี้',
                icon: card.icon,
              };
            }
            return {
              valid: false,
              status: 'invalid' as const,
              reason: card.wrongReason,
              icon: card.icon,
            };
          };

          const scienceResults = scienceProjectSteps.map(s => evaluateDecompSlot(s, 'science'));
          const tripResults = tripPlanningSteps.map(s => evaluateDecompSlot(s, 'trip'));

          const validScienceCount = scienceResults.filter(r => r.valid).length;
          const validTripCount = tripResults.filter(r => r.valid).length;
          const hasAnyInvalidScience = scienceResults.some(r => r.status === 'invalid');
          const hasAnyInvalidTrip = tripResults.some(r => r.status === 'invalid');

          const usedCardsSet = new Set(
            [...scienceProjectSteps, ...tripPlanningSteps].filter(Boolean)
          );

          const handlePlaceDecompCard = (
            targetCategory: 'science' | 'trip',
            targetSlotIdx: number,
            cardText: string,
            fromCategory?: 'science' | 'trip',
            fromSlotIdx?: number
          ) => {
            const cardObj = DECOMPOSITION_CARDS.find(c => c.text === cardText);
            if (!cardObj) return;

            const isCorrectForTarget = cardObj.category === targetCategory;
            audioSynth.playSfx(isCorrectForTarget ? 'click' : 'wrong');

            // Deduct heart if placing an invalid card (distractor or wrong category)
            const isSameSlotMove = fromCategory === targetCategory && fromSlotIdx === targetSlotIdx;
            if (!isCorrectForTarget && !isSameSlotMove) {
              deductExerciseHeart();
            }

            setExerciseError(null);
            setActiveDecompCategory(targetCategory);

            const nextScience = [...scienceProjectSteps];
            const nextTrip = [...tripPlanningSteps];

            // Remove from previous slot if moved from an existing slot
            if (fromCategory === 'science' && fromSlotIdx !== undefined) {
              nextScience[fromSlotIdx] = '';
            } else if (fromCategory === 'trip' && fromSlotIdx !== undefined) {
              nextTrip[fromSlotIdx] = '';
            } else {
              // Ensure card is not duplicated anywhere else
              const exSc = nextScience.findIndex(v => v === cardText);
              if (exSc !== -1) nextScience[exSc] = '';
              const exTr = nextTrip.findIndex(v => v === cardText);
              if (exTr !== -1) nextTrip[exTr] = '';
            }

            // Swap if target slot already had a card and we dragged from another slot
            const targetArr = targetCategory === 'science' ? nextScience : nextTrip;
            const existingInTarget = targetArr[targetSlotIdx];
            targetArr[targetSlotIdx] = cardText;

            if (existingInTarget && fromCategory && fromSlotIdx !== undefined && !isSameSlotMove) {
              if (fromCategory === 'science') {
                nextScience[fromSlotIdx] = existingInTarget;
              } else {
                nextTrip[fromSlotIdx] = existingInTarget;
              }
            }

            setScienceProjectSteps(nextScience);
            setTripPlanningSteps(nextTrip);

            // Auto-switch active target box if current box is now completely filled
            if (targetCategory === 'science' && nextScience.every(Boolean) && nextTrip.some(s => !s)) {
              setActiveDecompCategory('trip');
            } else if (targetCategory === 'trip' && nextTrip.every(Boolean) && nextScience.some(s => !s)) {
              setActiveDecompCategory('science');
            }
          };

          const handleDropOnDecompBox = (
            targetCategory: 'science' | 'trip',
            cardText: string,
            fromCategory?: 'science' | 'trip',
            fromSlotIdx?: number
          ) => {
            const targetArr = targetCategory === 'science' ? scienceProjectSteps : tripPlanningSteps;
            const firstEmptyIdx = targetArr.findIndex(s => !s);
            const slotToUse = firstEmptyIdx !== -1 ? firstEmptyIdx : 3;
            handlePlaceDecompCard(targetCategory, slotToUse, cardText, fromCategory, fromSlotIdx);
          };

          const handleQuickClickDecompCard = (cardText: string) => {
            const primaryArr = activeDecompCategory === 'science' ? scienceProjectSteps : tripPlanningSteps;
            const firstEmptyPrimary = primaryArr.findIndex(s => !s);
            if (firstEmptyPrimary !== -1) {
              handlePlaceDecompCard(activeDecompCategory, firstEmptyPrimary, cardText);
              return;
            }
            const secondaryCat = activeDecompCategory === 'science' ? 'trip' : 'science';
            const secondaryArr = secondaryCat === 'science' ? scienceProjectSteps : tripPlanningSteps;
            const firstEmptySecondary = secondaryArr.findIndex(s => !s);
            if (firstEmptySecondary !== -1) {
              handlePlaceDecompCard(secondaryCat, firstEmptySecondary, cardText);
              return;
            }
            // Both full: replace last slot of active category
            handlePlaceDecompCard(activeDecompCategory, 3, cardText);
          };

          const handleRemoveDecompSlot = (category: 'science' | 'trip', slotIdx: number) => {
            audioSynth.playSfx('click');
            setExerciseError(null);
            if (category === 'science') {
              setScienceProjectSteps(prev => {
                const updated = [...prev];
                updated[slotIdx] = '';
                return updated;
              });
              setActiveDecompCategory('science');
            } else {
              setTripPlanningSteps(prev => {
                const updated = [...prev];
                updated[slotIdx] = '';
                return updated;
              });
              setActiveDecompCategory('trip');
            }
          };

          const wrongPlacedReasons: string[] = [];
          scienceResults.forEach((r, idx) => {
            if (r.status === 'invalid') {
              wrongPlacedReasons.push(`โครงงานวิทย์ ช่องที่ ${idx + 1}: ${r.reason}`);
            }
          });
          tripResults.forEach((r, idx) => {
            if (r.status === 'invalid') {
              wrongPlacedReasons.push(`วางแผนท่องเที่ยว ช่องที่ ${idx + 1}: ${r.reason}`);
            }
          });

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                className="bg-slate-900 border-2 border-amber-400/70 rounded-3xl max-w-6xl w-full p-4 sm:p-5 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative my-auto max-h-[95vh] flex flex-col overflow-hidden"
                id="level1-exercise-modal"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 shrink-0 flex-wrap">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2.5 py-0.5 rounded-md mb-1">
                      <Layers size={13} />
                      <span>แบบฝึกหัดท้ายด่านที่ 1 : การย่อยปัญหา (Decomposition)</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                      1. คัดแยกและจัดหมวดหมู่ "ส่วนย่อยของปัญหา" ลงในกล่องของแต่ละภารกิจให้ถูกต้อง (ภารกิจละ 4 ส่วนย่อย)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      💡 สามารถ <strong className="text-cyan-300">ลากการ์ด (Drag & Drop)</strong> ไปวางในกล่องภารกิจ หรือ <strong className="text-amber-300">เลือกกล่องเป้าหมายแล้วคลิกที่การ์ด</strong> เพื่อเติมลงช่องว่าง (ระวังการ์ดตัวลวง 4 ใบ!)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {renderExerciseHeartsHUD()}
                    <button
                      onClick={() => {
                        audioSynth.playSfx('click');
                        setLevel1LearningStep('knowledge');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-cyan-300 transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <ChevronLeft size={15} />
                      <span>ดูใบความรู้</span>
                    </button>
                  </div>
                </div>

                {/* Scrollable Exercise Body */}
                <div
                  ref={exerciseScrollContainerRef}
                  onDragOverCapture={handleContainerDragOverAutoScroll}
                  className="flex-1 overflow-y-scroll drag-scroll-container mt-3 pr-2 space-y-3.5"
                >
                  {renderDragAutoScrollEdgeZone('up')}
                  {/* Two Problem Drop Zones */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {/* Problem 1: การทำโครงงานวิทยาศาสตร์ */}
                    <div
                      onClick={() => setActiveDecompCategory('science')}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverDecompTarget({ category: 'science', slotIdx: 'box' });
                      }}
                      onDragLeave={() => setDragOverDecompTarget(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverDecompTarget(null);
                        if (draggingDecompItem) {
                          handleDropOnDecompBox(
                            'science',
                            draggingDecompItem.value,
                            draggingDecompItem.fromCategory,
                            draggingDecompItem.fromSlotIdx
                          );
                          setDraggingDecompItem(null);
                        }
                      }}
                      className={`p-3.5 rounded-2xl bg-slate-950/90 border-2 transition-all flex flex-col justify-between cursor-pointer ${
                        dragOverDecompTarget?.category === 'science'
                          ? 'border-cyan-400 bg-cyan-950/30 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                          : validScienceCount === 4 && !hasAnyInvalidScience
                          ? 'border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : hasAnyInvalidScience
                          ? 'border-rose-500/70'
                          : activeDecompCategory === 'science'
                          ? 'border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                          : 'border-slate-800 hover:border-cyan-500/40'
                      }`}
                      id="decomp-box-science"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🔬</span>
                            <div>
                              <h4 className="text-sm sm:text-base font-extrabold text-cyan-300">
                                ปัญหาที่ 1 : การทำโครงงานวิทยาศาสตร์
                              </h4>
                              <span className="text-[11px] text-slate-400">
                                {activeDecompCategory === 'science'
                                  ? '🎯 กำลังเลือกเติมกล่องนี้ (คลิกการ์ดด้านล่างเพื่อใส่)'
                                  : 'คลิกที่กรอบนี้เพื่อสลับมาเติมกล่องโครงงานวิทย์'}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-mono px-2.5 py-0.5 rounded-full border shrink-0 flex items-center gap-1 ${
                              validScienceCount === 4 && !hasAnyInvalidScience
                                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 font-bold'
                                : hasAnyInvalidScience
                                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 font-bold'
                                : 'bg-slate-900 border-slate-700 text-cyan-300'
                            }`}
                          >
                            {validScienceCount === 4 ? (
                              <>
                                <CheckCircle2 size={12} className="text-emerald-400" />
                                <span>ครบ 4/4 ส่วนย่อย</span>
                              </>
                            ) : (
                              <span>ถูกต้อง {validScienceCount}/4</span>
                            )}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {scienceProjectSteps.map((stepVal, idx) => {
                            const res = scienceResults[idx];
                            const isSlotHovered =
                              dragOverDecompTarget?.category === 'science' &&
                              dragOverDecompTarget?.slotIdx === idx;

                            return (
                              <div key={idx} className="space-y-1">
                                <div
                                  draggable={Boolean(stepVal)}
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    if (stepVal) {
                                      setDraggingDecompItem({
                                        value: stepVal,
                                        fromCategory: 'science',
                                        fromSlotIdx: idx,
                                      });
                                    }
                                  }}
                                  onDragEnd={() => {
                                    setDraggingDecompItem(null);
                                    setDragOverDecompTarget(null);
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverDecompTarget({ category: 'science', slotIdx: idx });
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverDecompTarget(null);
                                    if (draggingDecompItem) {
                                      handlePlaceDecompCard(
                                        'science',
                                        idx,
                                        draggingDecompItem.value,
                                        draggingDecompItem.fromCategory,
                                        draggingDecompItem.fromSlotIdx
                                      );
                                      setDraggingDecompItem(null);
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (stepVal) {
                                      handleRemoveDecompSlot('science', idx);
                                    } else {
                                      setActiveDecompCategory('science');
                                    }
                                  }}
                                  className={`px-3 py-2 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2 transition-all ${
                                    isSlotHovered
                                      ? 'border-cyan-300 bg-cyan-900/40 scale-[1.01]'
                                      : res.status === 'valid'
                                      ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-100 font-bold'
                                      : res.status === 'invalid'
                                      ? 'bg-rose-950/50 border-rose-500/80 text-rose-100 font-bold'
                                      : 'bg-slate-900/80 border-dashed border-slate-700 text-slate-500 hover:border-cyan-500/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono font-bold text-xs text-cyan-400 shrink-0">
                                      ส่วนย่อยที่ {idx + 1}:
                                    </span>
                                    {stepVal ? (
                                      <span className="truncate flex items-center gap-1.5">
                                        <span>{res.icon}</span>
                                        <span className="truncate">{stepVal}</span>
                                      </span>
                                    ) : (
                                      <span className="italic text-xs text-slate-500">
                                        [ วางการ์ดส่วนย่อยของโครงงานวิทยาศาสตร์ที่นี่ ]
                                      </span>
                                    )}
                                  </div>

                                  {stepVal && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {res.status === 'valid' ? (
                                        <CheckCircle2 size={15} className="text-emerald-400" />
                                      ) : (
                                        <AlertTriangle size={15} className="text-rose-400" />
                                      )}
                                      <span className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-900/80 text-[10px] text-slate-300 hover:text-rose-200 font-mono">
                                        ลบ ✕
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {res.status === 'invalid' && (
                                  <p className="text-[11px] text-rose-300 pl-2 flex items-center gap-1">
                                    <span>⚠️ {res.reason} (คลิกที่ช่องเพื่อนำออก)</span>
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Problem 2: การวางแผนท่องเที่ยวกับเพื่อน */}
                    <div
                      onClick={() => setActiveDecompCategory('trip')}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverDecompTarget({ category: 'trip', slotIdx: 'box' });
                      }}
                      onDragLeave={() => setDragOverDecompTarget(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverDecompTarget(null);
                        if (draggingDecompItem) {
                          handleDropOnDecompBox(
                            'trip',
                            draggingDecompItem.value,
                            draggingDecompItem.fromCategory,
                            draggingDecompItem.fromSlotIdx
                          );
                          setDraggingDecompItem(null);
                        }
                      }}
                      className={`p-3.5 rounded-2xl bg-slate-950/90 border-2 transition-all flex flex-col justify-between cursor-pointer ${
                        dragOverDecompTarget?.category === 'trip'
                          ? 'border-amber-400 bg-amber-950/30 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                          : validTripCount === 4 && !hasAnyInvalidTrip
                          ? 'border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : hasAnyInvalidTrip
                          ? 'border-rose-500/70'
                          : activeDecompCategory === 'trip'
                          ? 'border-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : 'border-slate-800 hover:border-amber-500/40'
                      }`}
                      id="decomp-box-trip"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🗺️</span>
                            <div>
                              <h4 className="text-sm sm:text-base font-extrabold text-amber-300">
                                ปัญหาที่ 2 : การวางแผนท่องเที่ยวกับเพื่อน
                              </h4>
                              <span className="text-[11px] text-slate-400">
                                {activeDecompCategory === 'trip'
                                  ? '🎯 กำลังเลือกเติมกล่องนี้ (คลิกการ์ดด้านล่างเพื่อใส่)'
                                  : 'คลิกที่กรอบนี้เพื่อสลับมาเติมกล่องวางแผนท่องเที่ยว'}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-xs font-mono px-2.5 py-0.5 rounded-full border shrink-0 flex items-center gap-1 ${
                              validTripCount === 4 && !hasAnyInvalidTrip
                                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 font-bold'
                                : hasAnyInvalidTrip
                                ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 font-bold'
                                : 'bg-slate-900 border-slate-700 text-amber-300'
                            }`}
                          >
                            {validTripCount === 4 ? (
                              <>
                                <CheckCircle2 size={12} className="text-emerald-400" />
                                <span>ครบ 4/4 ส่วนย่อย</span>
                              </>
                            ) : (
                              <span>ถูกต้อง {validTripCount}/4</span>
                            )}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {tripPlanningSteps.map((stepVal, idx) => {
                            const res = tripResults[idx];
                            const isSlotHovered =
                              dragOverDecompTarget?.category === 'trip' &&
                              dragOverDecompTarget?.slotIdx === idx;

                            return (
                              <div key={idx} className="space-y-1">
                                <div
                                  draggable={Boolean(stepVal)}
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    if (stepVal) {
                                      setDraggingDecompItem({
                                        value: stepVal,
                                        fromCategory: 'trip',
                                        fromSlotIdx: idx,
                                      });
                                    }
                                  }}
                                  onDragEnd={() => {
                                    setDraggingDecompItem(null);
                                    setDragOverDecompTarget(null);
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverDecompTarget({ category: 'trip', slotIdx: idx });
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverDecompTarget(null);
                                    if (draggingDecompItem) {
                                      handlePlaceDecompCard(
                                        'trip',
                                        idx,
                                        draggingDecompItem.value,
                                        draggingDecompItem.fromCategory,
                                        draggingDecompItem.fromSlotIdx
                                      );
                                      setDraggingDecompItem(null);
                                    }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (stepVal) {
                                      handleRemoveDecompSlot('trip', idx);
                                    } else {
                                      setActiveDecompCategory('trip');
                                    }
                                  }}
                                  className={`px-3 py-2 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2 transition-all ${
                                    isSlotHovered
                                      ? 'border-amber-300 bg-amber-900/40 scale-[1.01]'
                                      : res.status === 'valid'
                                      ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-100 font-bold'
                                      : res.status === 'invalid'
                                      ? 'bg-rose-950/50 border-rose-500/80 text-rose-100 font-bold'
                                      : 'bg-slate-900/80 border-dashed border-slate-700 text-slate-500 hover:border-amber-500/50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono font-bold text-xs text-amber-400 shrink-0">
                                      ส่วนย่อยที่ {idx + 1}:
                                    </span>
                                    {stepVal ? (
                                      <span className="truncate flex items-center gap-1.5">
                                        <span>{res.icon}</span>
                                        <span className="truncate">{stepVal}</span>
                                      </span>
                                    ) : (
                                      <span className="italic text-xs text-slate-500">
                                        [ วางการ์ดส่วนย่อยของการวางแผนท่องเที่ยวที่นี่ ]
                                      </span>
                                    )}
                                  </div>

                                  {stepVal && (
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {res.status === 'valid' ? (
                                        <CheckCircle2 size={15} className="text-emerald-400" />
                                      ) : (
                                        <AlertTriangle size={15} className="text-rose-400" />
                                      )}
                                      <span className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-900/80 text-[10px] text-slate-300 hover:text-rose-200 font-mono">
                                        ลบ ✕
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {res.status === 'invalid' && (
                                  <p className="text-[11px] text-rose-300 pl-2 flex items-center gap-1">
                                    <span>⚠️ {res.reason} (คลิกที่ช่องเพื่อนำออก)</span>
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bank: 12 Cards (4 Science + 4 Trip + 4 Distractors) */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-slate-800 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/90">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-extrabold text-white">
                          🗂️ คลังการ์ดตัวเลือก (ลากไปวาง หรือคลิกการ์ดเพื่อเติม):
                        </span>
                        <span className="text-[11px] text-slate-400">
                          มี 12 ใบ (ส่วนย่อยที่ถูกต้อง 8 ใบ · ตัวลวง 4 ใบ)
                        </span>
                      </div>

                      {/* Target Selector Buttons for Quick Click */}
                      <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                        <span className="text-[11px] text-slate-400 px-1.5">คลิกการ์ดเติมลง:</span>
                        <button
                          type="button"
                          onClick={() => {
                            audioSynth.playSfx('click');
                            setActiveDecompCategory('science');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeDecompCategory === 'science'
                              ? 'bg-cyan-500 text-slate-950 shadow-sm'
                              : 'text-cyan-300 hover:bg-slate-800'
                          }`}
                        >
                          🔬 โครงงานวิทย์ ({validScienceCount}/4)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            audioSynth.playSfx('click');
                            setActiveDecompCategory('trip');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            activeDecompCategory === 'trip'
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'text-amber-300 hover:bg-slate-800'
                          }`}
                        >
                          🗺️ วางแผนเที่ยว ({validTripCount}/4)
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {DECOMPOSITION_CARDS.map((card) => {
                        const isUsed = usedCardsSet.has(card.text);
                        return (
                          <button
                            key={card.id}
                            type="button"
                            disabled={isUsed}
                            draggable={!isUsed}
                            onDragStart={() => {
                              if (!isUsed) {
                                setDraggingDecompItem({ value: card.text });
                              }
                            }}
                            onDragEnd={() => {
                              setDraggingDecompItem(null);
                              setDragOverDecompTarget(null);
                            }}
                            onClick={() => {
                              if (!isUsed) {
                                handleQuickClickDecompCard(card.text);
                              }
                            }}
                            className={`p-2.5 rounded-xl border text-left text-xs leading-snug transition-all flex items-start gap-2 ${
                              isUsed
                                ? 'bg-slate-900/40 border-slate-800/60 text-slate-600 line-through cursor-not-allowed opacity-50'
                                : 'bg-slate-900 hover:bg-slate-800/90 border-slate-700 hover:border-cyan-400/70 text-slate-100 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                            }`}
                            id={`decomp-card-${card.id}`}
                          >
                            <span className="text-base shrink-0 mt-0.5">🧩</span>
                            <span className="flex-1 font-medium">{card.text}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {renderProgressiveExerciseHintBox(
                    '💡 คำใบ้ที่ 1 (ชวนคิด): การย่อยปัญหา (Decomposition) คือการแบ่งงานใหญ่ออกเป็นส่วนย่อย ๆ ที่ชัดเจนและนำไปปฏิบัติได้จริง ลองแยกแยะว่าการ์ดใบใดเกี่ยวกับ "การทดลอง/สมมติฐาน/รายงาน" (โครงงานวิทย์) และใบใดเกี่ยวกับ "สถานที่/งบประมาณ/ที่พัก/จัดกระเป๋า" (ท่องเที่ยว) ส่วนการ์ดที่ไม่แบ่งงานหรือทำรวดเดียวคือตัวลวง!',
                    `🔍 คำใบ้ที่ 2 (ชี้จุดที่ผิด): ${
                      wrongPlacedReasons.length > 0
                        ? wrongPlacedReasons.join(' | ')
                        : 'ตรวจสอบให้แน่ใจว่าใส่การ์ดส่วนย่อยที่ถูกต้องครบทั้ง 4 ช่องของ 🔬 โครงงานวิทยาศาสตร์ และ 4 ช่องของ 🗺️ การวางแผนท่องเที่ยวกับเพื่อน โดยไม่มีการ์ดตัวลวงปะปน'
                    }`,
                    '✨ คำใบ้ที่ 3 (ตัวอย่างแนวคิด): [🔬 โครงงานวิทยาศาสตร์ 4 ส่วนย่อย] 1.กำหนดหัวข้อปัญหาและตั้งสมมติฐาน • 2.ค้นคว้าข้อมูลและเตรียมวัสดุอุปกรณ์ทดลอง • 3.ลงมือทำการทดลองและบันทึกผลการทดลอง • 4.วิเคราะห์สรุปผลและจัดทำเล่มรายงานนำเสนอ | [🗺️ วางแผนท่องเที่ยว 4 ส่วนย่อย] 1.เลือกสถานที่ท่องเที่ยวและกำหนดวัน-เวลาเดินทาง • 2.สำรวจจำนวนเพื่อนร่วมทริปและคำนวณงบประมาณ • 3.จองที่พักและวางแผนยานพาหนะการเดินทาง • 4.จัดกระเป๋าสัมภาระและตรวจสอบความพร้อมก่อนออกเดินทาง',
                    exerciseError
                  )}
                  {renderDragAutoScrollEdgeZone('down')}
                </div>

                {/* Footer Actions */}
                <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playSfx('click');
                      setLevel1LearningStep('knowledge');
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft size={16} />
                    <span>ย้อนกลับไปหน้าต่างความรู้</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        validScienceCount < 4 ||
                        validTripCount < 4 ||
                        hasAnyInvalidScience ||
                        hasAnyInvalidTrip
                      ) {
                        audioSynth.playSfx('wrong');
                        const remaining = deductExerciseHeart();
                        setExerciseError(
                          `ยังคัดแยกส่วนย่อยไม่ครบหรือไม่ถูกต้อง! สูญเสียหัวใจพลังชีวิต 1 ดวง (เหลือ ❤️ ${remaining}/3) — โครงงานวิทยาศาสตร์ถูกต้อง ${validScienceCount}/4 และวางแผนท่องเที่ยวถูกต้อง ${validTripCount}/4 กรุณานำการ์ดที่ขึ้นกรอบสีแดงออกแล้วเลือกการ์ดส่วนย่อยที่ถูกต้องแทน`
                        );
                        return;
                      }

                      audioSynth.playSfx('unlock');
                      setExerciseCompleted(true);
                      setExerciseError(null);
                      try {
                        sessionStorage.setItem(
                          'ct_level1_decomposition_answers_v2',
                          JSON.stringify({
                            scienceProjectSteps,
                            tripPlanningSteps,
                            completed: true,
                          })
                        );
                      } catch (e) {}

                      setLevel1LearningStep(null);
                      setShowVictoryModal(true);
                    }}
                    className="w-full sm:flex-1 py-3 px-6 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-sm sm:text-base rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                    id="submit-decomposition-exercise-btn"
                  >
                    <CheckCircle2 size={18} />
                    <span>ตรวจคำตอบและผ่านด่านที่ 1 ({validScienceCount + validTripCount}/8 ส่วนย่อยถูกต้อง)</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* LEVEL 2 POST-MISSION: KNOWLEDGE & PATTERN RECOGNITION EXERCISE MODALS */}
      <AnimatePresence>
        {level2LearningStep === 'knowledge' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 25 }}
              className="bg-slate-900 border-2 border-purple-400/70 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(168,85,247,0.3)] relative my-auto max-h-[90vh] flex flex-col overflow-hidden"
              id="level2-knowledge-modal"
            >
              {/* Scrollable Knowledge Content */}
              <div className="flex-1 min-h-0 overflow-y-auto drag-scroll-container pr-1.5">
                {/* Top Mission Accomplished Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold mb-3.5">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span>ภารกิจการเดินทางด่านที่ 2 สำเร็จ! · ส่วนความรู้ก่อนทำแบบฝึกหัด</span>
                </div>

                {/* Knowledge Title */}
                <div className="flex items-center gap-3 mb-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-fuchsia-600 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.5)] shrink-0">
                    <Repeat size={26} />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                      การหารูปแบบ (Pattern Recognition) คืออะไร?
                    </h3>
                    <span className="text-xs font-mono text-purple-300">
                      องค์ประกอบที่ 2 ของแนวคิดเชิงคำนวณ: การหารูปแบบ (Pattern Recognition)
                    </span>
                  </div>
                </div>

                {/* Definition Box */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-purple-500/40 mb-4 shadow-inner">
                  <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium">
                    <strong className="text-purple-300">การหารูปแบบ</strong> คือ{' '}
                    <strong className="text-cyan-300">
                      การสังเกตหาความเหมือน ความสัมพันธ์ หรือแนวโน้มของข้อมูลหรือปัญหา เพื่อนำไปสู่การคาดการณ์หรือหาคำตอบในอนาคต
                    </strong>
                  </p>
                </div>

                {/* Visual Example Section */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-900 border border-purple-500/40 mb-1">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <span className="text-xs sm:text-sm font-extrabold text-purple-300 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-purple-400" />
                      ตัวอย่างการสังเกตรูปแบบและความสัมพันธ์
                    </span>
                    <span className="text-xs font-bold text-slate-300 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                      สังเกตความเหมือน ➡️ คาดการณ์คำตอบถัดไป
                    </span>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-amber-300 font-bold block mb-1">🔢 รูปแบบตัวเลขที่เพิ่มขึ้นทีละเท่า ๆ กัน:</span>
                        <div className="flex items-center gap-1.5 font-mono text-slate-200 flex-wrap">
                          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">10</span>
                          <span>→</span>
                          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">20</span>
                          <span>→</span>
                          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">30</span>
                          <span>→</span>
                          <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-400 text-emerald-300 font-bold">40</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-500/30 shrink-0">
                        ความสัมพันธ์: เพิ่มขึ้นทีละ +10
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-cyan-300 font-bold block mb-1">🎨 รูปแบบสัญลักษณ์ที่วนซ้ำเป็นชุด:</span>
                        <div className="flex items-center gap-1.5 text-slate-200 flex-wrap">
                          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">⭐</span>
                          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">🌙</span>
                          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">⭐</span>
                          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">🌙</span>
                          <span>→</span>
                          <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-400 text-emerald-300 font-bold">⭐</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/50 px-2.5 py-1 rounded-lg border border-cyan-500/30 shrink-0">
                        ความสัมพันธ์: สลับ ⭐ กับ 🌙
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dedicated Footer Area for Button to Enter Pattern Recognition Exercise */}
              <div className="pt-3.5 mt-3 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setLevel2ExerciseError(null);
                    setLevel2LearningStep('exercise');
                  }}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 hover:from-purple-400 hover:to-cyan-300 text-slate-950 font-black text-base sm:text-lg tracking-wide rounded-2xl transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                  id="enter-pattern-exercise-btn"
                >
                  <span>เข้าสู่แบบฝึกหัด การหารูปแบบ (Pattern Recognition)</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {level2LearningStep === 'exercise' && (() => {
          const PATTERN_QUESTIONS: {
            key: 'q1' | 'q2' | 'q3' | 'q4';
            number: number;
            title: string;
            subtitle?: string;
            givenSequence: string[];
            expectedAnswers: [string, string, string];
            choices: string[];
            guidanceHint: string;
          }[] = [
            {
              key: 'q1',
              number: 1,
              title: 'พิจารณาชุดตัวเลขต่อไปนี้ แล้วหาจำนวนถัดไปอีก 3 จำนวน',
              givenSequence: ['2', '5', '8', '11', '14', '17', '20'],
              expectedAnswers: ['23', '26', '29'],
              choices: ['22', '23', '25', '26', '28', '29'],
              guidanceHint:
                'ลองสังเกตผลต่างระหว่างตัวเลขที่อยู่ติดกัน (เช่น จาก 2 ไป 5 หรือจาก 5 ไป 8) ว่าเพิ่มขึ้นทีละเท่าไร แล้วนำค่าที่เพิ่มขึ้นนั้นไปบวกต่อทีละช่อง',
            },
            {
              key: 'q2',
              number: 2,
              title: 'พิจารณาชุดรูปภาพต่อไปนี้ แล้วหารูปภาพถัดไปอีก 3 รูป',
              subtitle: '(วงกลมสีเหลือง, สี่เหลี่ยมสีเขียว, สามเหลี่ยมสีฟ้า, วงกลมสีเหลือง, สี่เหลี่ยมสีเขียว, สามเหลี่ยมสีฟ้า, วงกลมสีเหลือง, ...)',
              givenSequence: ['🟡', '🟩', '🔺', '🟡', '🟩', '🔺', '🟡'],
              expectedAnswers: ['🟩', '🔺', '🟡'],
              choices: ['🟡', '🟩', '🔺', '🟡', '🟩', '🔺'],
              guidanceHint:
                'ลองสังเกตชุดรูปเรขาคณิต 3 รูปที่เรียงสลับซ้ำกันเป็นรอบ ๆ แล้วดูว่าช่องสุดท้ายที่โจทย์ให้มาคือรูปใด รูปถัดไปที่อยู่ต่อจากรูปนั้นในชุดเดิมคือรูปอะไร',
            },
            {
              key: 'q3',
              number: 3,
              title: 'พิจารณาชุดตัวอักษรต่อไปนี้ แล้วหาตัวอักษรถัดไปอีก 3 ตัว',
              givenSequence: ['ก', 'ฃ', 'ฆ', 'ช', 'ฏ'],
              expectedAnswers: ['ต', 'ผ', 'ล'],
              choices: ['ด', 'ต', 'ป', 'ผ', 'ร', 'ล'],
              guidanceHint:
                'ลองเรียงพยัญชนะไทย ก-ฮ แล้วนับจำนวนตัวอักษรที่ถูกข้ามไปในแต่ละช่วง (ช่วงแรกข้าม 1 ตัว, ช่วงที่สองข้าม 2 ตัว, ช่วงที่สามข้าม 3 ตัว, ช่วงที่สี่ข้าม 4 ตัว) แล้วลองนับข้ามเพิ่มขึ้นทีละขั้นในช่องถัดไป',
            },
            {
              key: 'q4',
              number: 4,
              title: 'พิจารณาชุดจำนวนที่เพิ่มขึ้นแบบกำหนด แล้วหาจำนวนถัดไปอีก 3 จำนวน',
              givenSequence: ['3', '6', '12', '24'],
              expectedAnswers: ['48', '96', '192'],
              choices: ['36', '48', '72', '96', '144', '192'],
              guidanceHint:
                'ลองสังเกตความสัมพันธ์ระหว่างจำนวนหน้ากับจำนวนถัดไป (เช่น จาก 3 ไป 6 และจาก 6 ไป 12) ว่าเกิดจากการคูณเพิ่มเป็นกี่เท่าของตัวเลขก่อนหน้า',
            },
          ];

          const renderTokenVisual = (val: string) => {
            if (val === '🟡') {
              return (
                <span className="inline-flex items-center justify-center" title="วงกลมสีเหลือง">
                  <span className="inline-block w-5 h-5 rounded-full bg-yellow-400 border border-yellow-200 shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                </span>
              );
            }
            if (val === '🟩') {
              return (
                <span className="inline-flex items-center justify-center" title="สี่เหลี่ยมสีเขียว">
                  <span className="inline-block w-5 h-5 rounded-xs bg-emerald-500 border border-emerald-200 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                </span>
              );
            }
            if (val === '🔺') {
              return (
                <span className="inline-flex items-center justify-center" title="สามเหลี่ยมสีฟ้า">
                  <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]">
                    <polygon points="12,3 22,20 2,20" fill="#38bdf8" stroke="#bae6fd" strokeWidth="2" />
                  </svg>
                </span>
              );
            }
            return <span>{val}</span>;
          };

          const handlePlaceInSlot = (
            qKey: 'q1' | 'q2' | 'q3' | 'q4',
            slotIdx: number,
            value: string,
            fromSlotIdx?: number
          ) => {
            const targetQuestion = PATTERN_QUESTIONS.find(item => item.key === qKey);
            const isCorrectPlacement = targetQuestion?.expectedAnswers[slotIdx] === value;
            audioSynth.playSfx(isCorrectPlacement ? 'click' : 'wrong');
            if (!isCorrectPlacement) {
              deductExerciseHeart();
            }
            setLevel2ExerciseError(null);
            setPatternAnswers(prev => {
              const nextArr = [...prev[qKey]];
              if (fromSlotIdx !== undefined && fromSlotIdx !== slotIdx) {
                const existingInTarget = nextArr[slotIdx];
                nextArr[slotIdx] = value;
                nextArr[fromSlotIdx] = existingInTarget;
              } else {
                nextArr[slotIdx] = value;
              }
              return { ...prev, [qKey]: nextArr };
            });
          };

          const handleClearSlot = (qKey: 'q1' | 'q2' | 'q3' | 'q4', slotIdx: number) => {
            audioSynth.playSfx('click');
            setLevel2ExerciseError(null);
            setPatternAnswers(prev => {
              const nextArr = [...prev[qKey]];
              nextArr[slotIdx] = null;
              return { ...prev, [qKey]: nextArr };
            });
          };

          const handleQuickClickChoice = (qKey: 'q1' | 'q2' | 'q3' | 'q4', value: string) => {
            const currentSlots = patternAnswers[qKey];
            const firstEmptyIdx = currentSlots.findIndex(s => s === null);
            const targetIdx = firstEmptyIdx !== -1 ? firstEmptyIdx : 2;
            handlePlaceInSlot(qKey, targetIdx, value);
          };

          const questionStatuses = PATTERN_QUESTIONS.map(q => {
            const userSlots = patternAnswers[q.key];
            const isAllFilled = userSlots.every(s => s !== null);
            const wrongSlotNumbers: number[] = [];
            userSlots.forEach((val, idx) => {
              if (val !== null && val !== q.expectedAnswers[idx]) {
                wrongSlotNumbers.push(idx + 1);
              }
            });
            const hasAnyWrong = wrongSlotNumbers.length > 0;
            const isAllCorrect =
              userSlots[0] === q.expectedAnswers[0] &&
              userSlots[1] === q.expectedAnswers[1] &&
              userSlots[2] === q.expectedAnswers[2];
            return { key: q.key, isAllFilled, isAllCorrect, hasAnyWrong, wrongSlotNumbers };
          });

          const totalCorrectQuestions = questionStatuses.filter(s => s.isAllCorrect).length;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                className="bg-slate-900 border-2 border-purple-400/70 rounded-3xl max-w-6xl w-full p-4 sm:p-5 shadow-[0_0_50px_rgba(168,85,247,0.25)] relative my-auto max-h-[95vh] flex flex-col overflow-hidden"
                id="level2-exercise-modal"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-800 shrink-0 flex-wrap">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono text-purple-300 bg-purple-950/70 border border-purple-500/40 px-2.5 py-0.5 rounded-md mb-1">
                      <Repeat size={13} />
                      <span>แบบฝึกหัดท้ายด่านที่ 2 : การหารูปแบบ (Pattern Recognition)</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                      ลากตัวเลือกไปเติมลงในช่องว่าง [ ] ทั้ง 3 ช่องของแต่ละข้อให้ถูกต้อง
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      💡 สามารถ <strong className="text-cyan-300">ลากวาง (Drag & Drop)</strong> ลงในช่องว่าง <code className="text-amber-300">[ ]</code> หรือ <strong className="text-cyan-300">คลิกที่ตัวเลือก</strong> เพื่อเติมในช่องว่างถัดไป (คลิกที่ช่องเพื่อลบออก)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {renderExerciseHeartsHUD()}
                    <button
                      onClick={() => {
                        audioSynth.playSfx('click');
                        setLevel2LearningStep('knowledge');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-purple-300 transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <ChevronLeft size={15} />
                      <span>ดูใบความรู้</span>
                    </button>
                  </div>
                </div>

                {/* 2x2 Grid Questions List on Desktop */}
                <div
                  ref={exerciseScrollContainerRef}
                  onDragOverCapture={handleContainerDragOverAutoScroll}
                  className="flex-1 overflow-y-scroll drag-scroll-container mt-3 pr-2"
                >
                  {renderDragAutoScrollEdgeZone('up')}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {PATTERN_QUESTIONS.map((q, qIdx) => {
                    const userSlots = patternAnswers[q.key];
                    const status = questionStatuses[qIdx];

                    return (
                      <div
                        key={q.key}
                        className={`p-3 rounded-2xl bg-slate-950/90 border transition-colors flex flex-col justify-between ${
                          status.isAllCorrect
                            ? 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                            : status.hasAnyWrong
                            ? 'border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.12)]'
                            : 'border-slate-800'
                        }`}
                      >
                        {/* Question Title */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="text-xs sm:text-sm font-extrabold text-white">
                              <span className="text-purple-400 font-mono mr-1.5">ข้อที่ {q.number}.</span>
                              {q.title}
                            </h4>
                            {q.subtitle && (
                              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                                {q.subtitle}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border shrink-0 flex items-center gap-1 ${
                              status.isAllCorrect
                                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 font-bold'
                                : status.hasAnyWrong
                                ? 'bg-rose-950/70 border-rose-500/50 text-rose-300 font-bold'
                                : 'bg-slate-900 border-slate-700 text-slate-400'
                            }`}
                          >
                            {status.isAllCorrect ? (
                              <>
                                <CheckCircle2 size={12} className="text-emerald-400" />
                                <span>ถูกต้องครบ 3 ช่อง</span>
                              </>
                            ) : status.hasAnyWrong ? (
                              <>
                                <AlertTriangle size={12} className="text-rose-400" />
                                <span>ช่องที่ {status.wrongSlotNumbers.join(', ')} ยังไม่ถูกต้อง</span>
                              </>
                            ) : (
                              <span>เติมแล้ว {userSlots.filter(Boolean).length}/3</span>
                            )}
                          </span>
                        </div>

                        {/* Sequence Row: Given Items + 3 Drop Slots */}
                        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 my-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800/90">
                          <span className="text-xs font-mono font-bold text-cyan-400 mr-1">ลำดับ:</span>
                          {q.givenSequence.map((item, idx) => (
                            <div
                              key={idx}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs sm:text-sm font-mono font-bold text-slate-200 flex items-center justify-center min-w-[38px]"
                            >
                              <span className="text-slate-500 mr-0.5">[</span>
                              {renderTokenVisual(item)}
                              <span className="text-slate-500 ml-0.5">]</span>
                            </div>
                          ))}

                          {/* 3 Empty Drop Slots [ ] [ ] [ ] */}
                          {[0, 1, 2].map((slotIdx) => {
                            const filledVal = userSlots[slotIdx];
                            const isHovered =
                              dragOverTarget?.questionKey === q.key && dragOverTarget?.slotIdx === slotIdx;
                            const isSlotCorrect =
                              filledVal !== null && filledVal === q.expectedAnswers[slotIdx];

                            return (
                              <div
                                key={slotIdx}
                                draggable={filledVal !== null}
                                onDragStart={() => {
                                  if (filledVal !== null) {
                                    setDraggingItem({
                                      questionKey: q.key,
                                      value: filledVal,
                                      fromSlotIdx: slotIdx,
                                    });
                                  }
                                }}
                                onDragEnd={() => {
                                  setDraggingItem(null);
                                  setDragOverTarget(null);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  if (
                                    draggingItem &&
                                    draggingItem.questionKey === q.key &&
                                    (dragOverTarget?.questionKey !== q.key ||
                                      dragOverTarget?.slotIdx !== slotIdx)
                                  ) {
                                    setDragOverTarget({ questionKey: q.key, slotIdx });
                                  }
                                }}
                                onDragLeave={() => {
                                  if (
                                    dragOverTarget?.questionKey === q.key &&
                                    dragOverTarget?.slotIdx === slotIdx
                                  ) {
                                    setDragOverTarget(null);
                                  }
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setDragOverTarget(null);
                                  if (draggingItem && draggingItem.questionKey === q.key) {
                                    handlePlaceInSlot(
                                      q.key,
                                      slotIdx,
                                      draggingItem.value,
                                      draggingItem.fromSlotIdx
                                    );
                                  }
                                  setDraggingItem(null);
                                }}
                                onClick={() => {
                                  if (filledVal !== null) {
                                    handleClearSlot(q.key, slotIdx);
                                  }
                                }}
                                title={
                                  filledVal !== null
                                    ? 'คลิกเพื่อลบออก หรือลากไปสลับช่อง'
                                    : 'ลากคำตอบมาวางในช่องนี้'
                                }
                                className={`px-3 py-1.5 rounded-lg border-2 border-dashed text-xs sm:text-sm font-mono font-black flex items-center justify-center min-w-[52px] min-h-[36px] transition-all select-none ${
                                  isHovered
                                    ? 'bg-purple-900/60 border-purple-400 scale-105 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                                    : filledVal !== null
                                    ? isSlotCorrect
                                      ? 'bg-emerald-950/80 border-solid border-emerald-400 text-emerald-200 cursor-pointer hover:bg-rose-950/60 hover:border-rose-400'
                                      : 'bg-rose-950/80 border-solid border-rose-500 text-rose-200 cursor-pointer'
                                    : 'bg-slate-950/80 border-amber-400/60 text-amber-300/70'
                                }`}
                              >
                                <span className="opacity-60 mr-1">[</span>
                                {filledVal !== null ? (
                                  renderTokenVisual(filledVal)
                                ) : (
                                  <span className="text-[10px] text-amber-300/50 px-1">ว่าง</span>
                                )}
                                <span className="opacity-60 ml-1">]</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Draggable Choices Bank for this question */}
                        <div className="flex items-center flex-wrap gap-2 pt-1">
                          <span className="text-[11px] font-bold text-slate-400 mr-1">
                            ตัวเลือก (ลากไปวาง หรือคลิก):
                          </span>
                          {q.choices.map((choiceVal, cIdx) => {
                            const usedCount = userSlots.filter(v => v === choiceVal).length;
                            const totalAvailable = q.choices.filter(v => v === choiceVal).length;
                            const isExhausted = usedCount >= totalAvailable;

                            return (
                              <div
                                key={`${choiceVal}-${cIdx}`}
                                draggable={!isExhausted}
                                onDragStart={() => {
                                  if (!isExhausted) {
                                    setDraggingItem({
                                      questionKey: q.key,
                                      value: choiceVal,
                                    });
                                  }
                                }}
                                onDragEnd={() => {
                                  setDraggingItem(null);
                                  setDragOverTarget(null);
                                }}
                                onClick={() => {
                                  if (!isExhausted) {
                                    handleQuickClickChoice(q.key, choiceVal);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-mono font-bold flex items-center gap-1.5 transition-all select-none ${
                                  isExhausted
                                    ? 'bg-slate-900/40 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                                    : 'bg-slate-800 hover:bg-purple-950/80 border-purple-500/50 hover:border-purple-400 text-white cursor-grab active:cursor-grabbing shadow-sm hover:scale-105'
                                }`}
                              >
                                {renderTokenVisual(choiceVal)}
                              </div>
                            );
                          })}
                        </div>

                        {/* Non-Spoiler Guidance Alert when any slot in this question is wrong */}
                        {status.hasAnyWrong && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 p-3 rounded-xl bg-amber-950/60 border border-amber-400/60 flex items-start gap-2.5 text-xs text-amber-100"
                            role="alert"
                          >
                            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">
                              <strong className="text-amber-300 block mb-0.5">
                                ⚠️ คำตอบในช่องว่างที่ {status.wrongSlotNumbers.join(', ')} ยังไม่ถูกต้อง (คลิกที่ช่องเพื่อลบแล้วเลือกใหม่)
                              </strong>
                              <span>💡 <strong>คำแนะนำ:</strong> {q.guidanceHint}</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                  </div>

                  {renderProgressiveExerciseHintBox(
                    '💡 คำใบ้ที่ 1 (ชวนคิด): ลองสังเกตความสัมพันธ์ของข้อมูลจากซ้ายไปขวาในแต่ละข้อว่า "เพิ่มขึ้นทีละเท่าไร" หรือ "วนซ้ำเป็นชุดละกี่ตัว" ก่อนเลือกคำตอบลงในช่องว่างทั้ง 3 ช่อง',
                    '🔍 คำใบ้ที่ 2 (ชี้จุดที่ผิด): ตรวจสอบข้อที่ยังมีช่องว่างหรือมีกรอบเตือนสีเหลือง/แดง — ข้อ 1 เป็นตัวเลขที่เพิ่มทีละค่าคงที่, ข้อ 2 เป็นรูปทรง 3 รูปสลับวนซ้ำ, ข้อ 3 เป็นพยัญชนะไทยที่เว้นระยะห่างเพิ่มขึ้นทีละขั้น, และข้อ 4 เป็นตัวเลขที่ลดลงทีละค่าคงที่',
                    '✨ คำใบ้ที่ 3 (ตัวอย่างแนวคิด): ข้อ 1 เพิ่มทีละ +3 (20 ➔ 23, 26, 29) | ข้อ 2 วนซ้ำ 🟡,🟩,🔺 ต่อจาก 🟡 คือ (🟩, 🔺, 🟡) | ข้อ 3 ข้ามพยัญชนะเพิ่มขึ้น +5, +6, +7 ตัว ได้ (ต, ผ, ล) | ข้อ 4 ลดลงทีละ -5 (80 ➔ 75, 70, 65)',
                    level2ExerciseError
                  )}
                  {renderDragAutoScrollEdgeZone('down')}
                </div>

                {/* Footer Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playSfx('click');
                      setLevel2LearningStep('knowledge');
                    }}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft size={16} />
                    <span>ย้อนกลับไปหน้าต่างความรู้</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (totalCorrectQuestions < 4) {
                        audioSynth.playSfx('wrong');
                        const remaining = deductExerciseHeart();
                        setLevel2ExerciseError(
                          `ยังตอบไม่ครบหรือไม่ถูกต้อง (${totalCorrectQuestions}/4 ข้อ)! สูญเสียหัวใจพลังชีวิต 1 ดวง (เหลือ ❤️ ${remaining}/3) — กรุณาดูคำแนะนำและเติมช่องว่าง [ ] ให้ถูกต้องครบทั้ง 4 ข้อ`
                        );
                        return;
                      }

                      audioSynth.playSfx('unlock');
                      setLevel2ExerciseCompleted(true);
                      setLevel2ExerciseError(null);
                      try {
                        sessionStorage.setItem(
                          'ct_level2_pattern_answers_v3',
                          JSON.stringify({
                            patternAnswers,
                            completed: true,
                          })
                        );
                      } catch (e) {}

                      setLevel2LearningStep(null);
                      setShowVictoryModal(true);
                    }}
                    className="w-full sm:flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-sm sm:text-base rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                    id="submit-pattern-exercise-btn"
                  >
                    <CheckCircle2 size={18} />
                    <span>ตรวจคำตอบและผ่านด่านที่ 2 ({totalCorrectQuestions}/4 ข้อถูกต้อง)</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* LEVEL 3 POST-MISSION: KNOWLEDGE & ABSTRACTION EXERCISE MODALS */}
      <AnimatePresence>
        {level3LearningStep === 'knowledge' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 25 }}
              className="bg-slate-900 border-2 border-amber-400/70 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)] relative my-auto max-h-[90vh] flex flex-col overflow-hidden"
              id="level3-knowledge-modal"
            >
              {/* Scrollable Knowledge Content */}
              <div className="flex-1 min-h-0 overflow-y-auto drag-scroll-container pr-1.5">
                {/* Top Mission Accomplished Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold mb-3.5">
                  <CheckCircle2 size={15} className="text-emerald-400" />
                  <span>ภารกิจการเดินทางด่านที่ 3 สำเร็จ! · ส่วนความรู้ก่อนทำแบบฝึกหัด</span>
                </div>

                {/* Knowledge Title */}
                <div className="flex items-center gap-3 mb-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)] shrink-0">
                    <Sparkles size={26} />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                      การคิดเชิงนามธรรม (Abstraction) คืออะไร?
                    </h3>
                    <span className="text-xs font-mono text-amber-300">
                      องค์ประกอบที่ 3 ของแนวคิดเชิงคำนวณ: การคิดเชิงนามธรรม (Abstraction)
                    </span>
                  </div>
                </div>

                {/* Definition & Goal Boxes */}
                <div className="space-y-2.5 mb-4">
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-inner">
                    <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium">
                      <strong className="text-amber-300">การคิดเชิงนามธรรม</strong> คือ{' '}
                      <strong className="text-cyan-300">
                        การมองหาสิ่งที่สำคัญจริง ๆ และตัดรายละเอียดที่ไม่จำเป็นออก เหลือเฉพาะสาระสำคัญ เพื่อให้เข้าใจและแก้ปัญหาได้ง่ายขึ้น
                      </strong>
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/40">
                    <span className="text-xs sm:text-sm font-extrabold text-cyan-300 block mb-1">
                      🎯 เป้าหมายของการคิดเชิงนามธรรม
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      เพื่อโฟกัสข้อมูลที่สำคัญ ลดความซับซ้อน ทำให้เข้าใจง่าย และนำไปใช้แก้ปัญหาได้อย่างมีประสิทธิภาพ
                    </p>
                  </div>
                </div>

                {/* Example Section */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 border border-amber-500/40 mb-1">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
                    <span className="text-xs sm:text-sm font-extrabold text-amber-300 flex items-center gap-1.5">
                      <Sparkles size={16} className="text-amber-400" />
                      ตัวอย่างการคัดเลือกข้อมูลสำคัญ
                    </span>
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-950/70 px-3 py-1 rounded-lg border border-emerald-500/40">
                      🎒 สิ่งของที่จำเป็นสำหรับไปโรงเรียน
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {/* Before Selection */}
                    <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-800">
                      <span className="text-xs font-bold text-slate-400 block mb-2">
                        ข้อมูลทั้งหมด (ก่อนคัดเลือก) :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: 'กระเป๋านักเรียน', keep: true },
                          { name: 'โดนัท', keep: false },
                          { name: 'ดินสอ', keep: true },
                          { name: 'นาฬิกา', keep: false },
                          { name: 'จอยเกม', keep: false },
                          { name: 'หูฟัง', keep: false },
                          { name: 'ขวดน้ำ', keep: true },
                          { name: 'สมุด', keep: true },
                        ].map((item) => (
                          <span
                            key={item.name}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                              item.keep
                                ? 'bg-slate-800 border-amber-400/50 text-amber-200'
                                : 'bg-slate-950 border-slate-800 text-slate-500 line-through'
                            }`}
                          >
                            {item.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* After Selection */}
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50">
                      <div className="flex items-center justify-between flex-wrap gap-1 mb-2">
                        <span className="text-xs font-extrabold text-emerald-300">
                          ✅ ข้อมูลสำคัญ (หลังคัดเลือก) :
                        </span>
                        <span className="text-[11px] text-emerald-200/80 font-mono">
                          (สิ่งของที่จำเป็นสำหรับไปโรงเรียน)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['กระเป๋านักเรียน', 'สมุด', 'ดินสอ', 'ขวดน้ำ'].map((name) => (
                          <span
                            key={name}
                            className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-200 text-xs sm:text-sm font-black shadow-sm"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dedicated Footer Area for Button to Enter Abstraction Exercise */}
              <div className="pt-3.5 mt-3 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setLevel3ExerciseError(null);
                    setLevel3LearningStep('exercise');
                  }}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base sm:text-lg tracking-wide rounded-2xl transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                  id="enter-abstraction-exercise-btn"
                >
                  <span>เข้าสู่แบบฝึกหัด การคิดเชิงนามธรรม (Abstraction)</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {level3LearningStep === 'exercise' && (() => {
          const ABSTRACTION_SCENARIOS: {
            key: 's1' | 's2';
            number: number;
            title: string;
            allItems: string[];
            validItems: string[];
            wrongGuidanceByItem: Record<string, string>;
            generalGuidance: string;
          }[] = [
            {
              key: 's1',
              number: 1,
              title: 'สถานการณ์ : การจัดกระเป๋าไปค่าย 2 วัน 1 คืน',
              allItems: [
                'หนังสือการ์ตูน',
                'เสื้อยืด 3 ตัว',
                'โทรศัพท์มือถือ',
                'ที่ชาร์จ',
                'ผ้าเช็ดตัว',
                'ขนม',
                'น้ำดื่ม',
                'กล้องถ่ายรูป',
                'ไดร์เป่าผม',
                'ร่ม',
                'ยาประจำตัว',
                'หมอน',
                'แว่นกันแดด',
                'หมวก',
                'เอกสาร/บัตรประชาชน',
              ],
              validItems: [
                'เสื้อยืด 3 ตัว',
                'ผ้าเช็ดตัว',
                'น้ำดื่ม',
                'ยาประจำตัว',
                'เอกสาร/บัตรประชาชน',
              ],
              wrongGuidanceByItem: {
                'หนังสือการ์ตูน': 'เป็นสื่อบันเทิงยามว่าง ไม่ใช่สิ่งจำเป็นหลักในการทำกิจกรรมและพักแรมในค่าย 2 วัน 1 คืน',
                'โทรศัพท์มือถือ': 'ในการเข้าค่ายระยะสั้น ควรโฟกัสที่สิ่งของจำเป็นต่อการดำรงชีพ สุขอนามัย หรือความปลอดภัยเป็นอันดับแรก',
                'ที่ชาร์จ': 'เป็นอุปกรณ์พ่วงของเครื่องใช้ไฟฟ้า ลองเลือกสิ่งของพื้นฐานที่จำเป็นต่อการพักแรมและการดูแลตัวเองก่อน',
                'ขนม': 'เป็นเพียงของทานเล่น ไม่ใช่สิ่งของจำเป็นหลักเมื่อเทียบกับน้ำดื่ม เสื้อผ้า ของใช้ส่วนตัว ยา หรือเอกสารสำคัญ',
                'กล้องถ่ายรูป': 'เป็นอุปกรณ์เสริมที่ไม่จำเป็นต่อการดำรงชีวิตในค่ายพักแรม 2 วัน 1 คืน',
                'ไดร์เป่าผม': 'เป็นเครื่องใช้ไฟฟ้าเสริมที่กินพื้นที่กระเป๋าและไม่จำเป็นในการไปค่ายพักแรม',
                'ร่ม': 'เป็นอุปกรณ์เสริมตามสภาพอากาศ ลองเลือกสิ่งของหลักที่ต้องใช้แน่นอนตลอด 2 วัน 1 คืนก่อน',
                'หมอน': 'มีขนาดใหญ่เทอะทะและสถานที่พักค่ายมักมีเครื่องนอนพื้นฐานให้ แนะนำให้เลือกของใช้ส่วนตัวที่จำเป็นต้องพกไปเอง',
                'แว่นกันแดด': 'เป็นเครื่องประดับ/อุปกรณ์เสริม ไม่ใช่สิ่งสำคัญอันดับแรกสำหรับการเข้าค่ายพักแรม',
                'หมวก': 'เป็นเครื่องแต่งกายเสริม ลองเลือกเสื้อผ้าหลัก ผ้าเช็ดตัว น้ำดื่ม ยาประจำตัว หรือเอกสารสำคัญก่อน',
              },
              generalGuidance:
                'ลองพิจารณาเฉพาะสิ่งที่สำคัญที่สุดเพียง 5 รายการในการเข้าค่าย 2 วัน 1 คืน (เสื้อยืด 3 ตัว, ผ้าเช็ดตัว, น้ำดื่ม, ยาประจำตัว, เอกสาร/บัตรประชาชน) และตัดสิ่งของที่ไม่จำเป็นออก',
            },
            {
              key: 's2',
              number: 2,
              title: 'สถานการณ์ : การจัดงานวันเกิดในงบ 1,000 บาท',
              allItems: [
                'ลูกโป่ง',
                'เค้ก',
                'ป้ายอวยพร',
                'ของตกแต่ง',
                'ของขวัญ',
                'เช่าสถานที่',
                'อาหาร',
                'ดนตรี',
                'เกม',
                'เครื่องดื่ม',
                'รางวัลเกม',
                'กล้องโพลารอยด์',
                'การ์ดเชิญ',
                'ค่าขนส่ง',
                'ดอกไม้',
                'เทียน',
                'ไฟประดับ',
                'เสื้อทีม',
              ],
              validItems: [
                'เค้ก',
                'ของขวัญ',
                'อาหาร',
                'เครื่องดื่ม',
                'เทียน',
              ],
              wrongGuidanceByItem: {
                'ลูกโป่ง': 'เป็นของประดับตกแต่งเพื่อความสวยงาม ซึ่งสามารถตัดออกได้เพื่อประหยัดงบ 1,000 บาทไว้ซื้อของสำคัญหลัก 5 รายการ',
                'ป้ายอวยพร': 'เป็นเพียงของตกแต่งเสริม ไม่ใช่สิ่งจำเป็นหลักภายใต้งบประมาณจำกัด 1,000 บาท',
                'ของตกแต่ง': 'เป็นรายละเอียดเสริมด้านความสวยงาม ลองเลือกสิ่งที่จำเป็นต่อการฉลองและรับประทานร่วมกันในงานก่อน',
                'เช่าสถานที่': 'มีค่าใช้จ่ายสูงมากจนเกินงบ 1,000 บาท แนะนำให้จัดในพื้นที่ที่มีอยู่แล้วนำงบไปใช้กับสิ่งสำคัญในงานแทน',
                'ดนตรี': 'การจ้างดนตรีหรือเช่าเครื่องเสียงใช้งบสูงเกินความจำเป็น สามารถเปิดเพลงทั่วไปแทนได้',
                'เกม': 'เป็นกิจกรรมเสริมที่ไม่จำเป็นต้องใช้งบประมาณซื้อ ลองโฟกัสที่หัวใจหลักของงานวันเกิดและอาหารการกินก่อน',
                'รางวัลเกม': 'เป็นค่าใช้จ่ายเสริมที่ไม่จำเป็นสำหรับงบจำกัด 1,000 บาท',
                'กล้องโพลารอยด์': 'กล้องและฟิล์มมีราคาสูงมากเมื่อเทียบกับงบ 1,000 บาท แนะนำให้ตัดออกและเลือกสิ่งจำเป็นหลักแทน',
                'การ์ดเชิญ': 'ไม่จำเป็นต้องเสียเงินทำบัตรเชิญ เพราะสามารถชวนเพื่อนด้วยตัวเองหรือส่งข้อความออนไลน์ได้ฟรี',
                'ค่าขนส่ง': 'เป็นค่าใช้จ่ายแฝงที่ตัดออกได้หากเลือกซื้อของใกล้บ้าน ลองเลือกสิ่งของที่ใช้ในงานวันเกิดโดยตรง',
                'ดอกไม้': 'เป็นของประดับที่ไม่ใช่สิ่งจำเป็นหลักของงานวันเกิดในงบประหยัด 1,000 บาท',
                'ไฟประดับ': 'เป็นอุปกรณ์ตกแต่งเสริมที่สิ้นเปลืองงบประมาณ สามารถตัดออกได้',
                'เสื้อทีม': 'การทำเสื้อทีมมีราคาสูงเกินงบ 1,000 บาท และไม่ใช่สาระสำคัญของการจัดงานวันเกิด',
              },
              generalGuidance:
                'เมื่อมีงบจำกัดเพียง 1,000 บาท แนะนำให้เลือกเฉพาะสิ่งของที่สำคัญที่สุด 5 รายการ (เค้ก, ของขวัญ, อาหาร, เครื่องดื่ม, เทียน) และตัดสิ่งของที่ไม่จำเป็นออก',
            },
          ];

          const handlePlaceAbstractionItem = (
            sKey: 's1' | 's2',
            targetSlotIdx: number,
            value: string,
            fromSlotIdx?: number
          ) => {
            const scenario = ABSTRACTION_SCENARIOS.find(s => s.key === sKey);
            const currentSlots = abstractionAnswers[sKey];

            // Prevent duplicate item in the same box unless moving within slots
            const existingIdx = currentSlots.findIndex(v => v === value);
            if (existingIdx !== -1 && existingIdx !== fromSlotIdx) {
              audioSynth.playSfx('wrong');
              return;
            }

            const isValidChoice = scenario?.validItems.includes(value);
            audioSynth.playSfx(isValidChoice ? 'click' : 'wrong');
            if (!isValidChoice && fromSlotIdx === undefined) {
              deductExerciseHeart();
            }
            setLevel3ExerciseError(null);

            setAbstractionAnswers(prev => {
              const nextArr = [...prev[sKey]];
              if (fromSlotIdx !== undefined && fromSlotIdx !== targetSlotIdx) {
                const existingInTarget = nextArr[targetSlotIdx];
                nextArr[targetSlotIdx] = value;
                nextArr[fromSlotIdx] = existingInTarget;
              } else {
                nextArr[targetSlotIdx] = value;
              }
              return { ...prev, [sKey]: nextArr };
            });
          };

          const handleDropOnBox = (sKey: 's1' | 's2', value: string, fromSlotIdx?: number) => {
            const currentSlots = abstractionAnswers[sKey];
            const firstEmpty = currentSlots.findIndex(s => s === null);
            const targetIdx = firstEmpty !== -1 ? firstEmpty : 4;
            handlePlaceAbstractionItem(sKey, targetIdx, value, fromSlotIdx);
          };

          const handleRemoveAbstractionSlot = (sKey: 's1' | 's2', slotIdx: number) => {
            audioSynth.playSfx('click');
            setLevel3ExerciseError(null);
            setAbstractionAnswers(prev => {
              const nextArr = [...prev[sKey]];
              nextArr[slotIdx] = null;
              return { ...prev, [sKey]: nextArr };
            });
          };

          const scenarioEvaluations = ABSTRACTION_SCENARIOS.map(sc => {
            const slots = abstractionAnswers[sc.key];
            const wrongItems: { slotNumber: number; name: string; guidance: string }[] = [];
            let validCount = 0;

            slots.forEach((val, idx) => {
              if (val !== null) {
                if (sc.validItems.includes(val)) {
                  validCount += 1;
                } else {
                  wrongItems.push({
                    slotNumber: idx + 1,
                    name: val,
                    guidance: sc.wrongGuidanceByItem[val] || sc.generalGuidance,
                  });
                }
              }
            });

            const isCompleteAndValid = validCount === 5 && wrongItems.length === 0;
            return {
              key: sc.key,
              validCount,
              wrongItems,
              hasWrong: wrongItems.length > 0,
              isCompleteAndValid,
            };
          });

          const totalValidItemsCount =
            scenarioEvaluations[0].validCount + scenarioEvaluations[1].validCount;
          const isAllScenariosPassed =
            scenarioEvaluations[0].isCompleteAndValid &&
            scenarioEvaluations[1].isCompleteAndValid;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                className="bg-slate-900 border-2 border-amber-400/70 rounded-3xl max-w-6xl w-full p-4 sm:p-5 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative my-auto max-h-[95vh] flex flex-col overflow-hidden"
                id="level3-exercise-modal"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-800 shrink-0 flex-wrap">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2.5 py-0.5 rounded-md mb-1">
                      <Sparkles size={13} />
                      <span>แบบฝึกหัดท้ายด่านที่ 3 : การคิดเชิงนามธรรม (Abstraction)</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white leading-snug">
                      คัดเลือกสิ่งของที่สำคัญที่สุดเพียง 5 รายการ โดยการลากใส่กล่อง (นอกนั้นเป็นสิ่งของที่ไม่จำเป็น)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      💡 สามารถ <strong className="text-amber-300">ลากรายการข้อมูล (Drag & Drop)</strong> มาวางในกล่อง หรือ <strong className="text-amber-300">คลิกที่รายการ</strong> เพื่อใส่กล่อง (คลิกที่รายการในกล่องเพื่อนำออก)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {renderExerciseHeartsHUD()}
                    <button
                      onClick={() => {
                        audioSynth.playSfx('click');
                        setLevel3LearningStep('knowledge');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <ChevronLeft size={15} />
                      <span>ดูใบความรู้</span>
                    </button>
                  </div>
                </div>

                {/* Two-Column Scenarios on Desktop */}
                <div
                  ref={exerciseScrollContainerRef}
                  onDragOverCapture={handleContainerDragOverAutoScroll}
                  className="flex-1 overflow-y-scroll drag-scroll-container mt-3 pr-2"
                >
                  {renderDragAutoScrollEdgeZone('up')}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                  {ABSTRACTION_SCENARIOS.map((sc, sIdx) => {
                    const userSlots = abstractionAnswers[sc.key];
                    const evalStat = scenarioEvaluations[sIdx];
                    const isBoxHovered =
                      dragOverAbstractionTarget?.scenarioKey === sc.key &&
                      dragOverAbstractionTarget?.slotIdx === 'box';

                    return (
                      <div
                        key={sc.key}
                        className={`p-3.5 rounded-2xl bg-slate-950/90 border transition-colors flex flex-col justify-between ${
                          evalStat.isCompleteAndValid
                            ? 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.12)]'
                            : evalStat.hasWrong
                            ? 'border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.12)]'
                            : 'border-slate-800'
                        }`}
                      >
                        {/* Scenario Header */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 mb-3 border-b border-slate-800">
                          <h4 className="text-sm sm:text-base font-extrabold text-amber-300">
                            {sc.number}. {sc.title}
                          </h4>
                          <span
                            className={`text-xs font-mono px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                              evalStat.isCompleteAndValid
                                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 font-bold'
                                : evalStat.hasWrong
                                ? 'bg-rose-950/70 border-rose-500/50 text-rose-300 font-bold'
                                : 'bg-slate-900 border-slate-700 text-slate-300'
                            }`}
                          >
                            {evalStat.isCompleteAndValid ? (
                              <>
                                <CheckCircle2 size={13} className="text-emerald-400" />
                                <span>คัดเลือกข้อมูลสำคัญถูกต้องครบ 5/5 รายการ</span>
                              </>
                            ) : (
                              <span>ข้อมูลสำคัญที่ผ่านเกณฑ์: {evalStat.validCount}/5 รายการ</span>
                            )}
                          </span>
                        </div>

                        {/* All Items Pool */}
                        <div className="mb-3">
                          <span className="text-xs font-bold text-slate-300 block mb-2">
                            ข้อมูลทั้งหมด (ลากรายการที่สำคัญใส่กล่องด้านล่าง) :
                          </span>
                          <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                            {sc.allItems.map((item) => {
                              const isSelected = userSlots.includes(item);
                              return (
                                <div
                                  key={item}
                                  draggable={!isSelected}
                                  onDragStart={() => {
                                    if (!isSelected) {
                                      setDraggingAbstractionItem({
                                        scenarioKey: sc.key,
                                        value: item,
                                      });
                                    }
                                  }}
                                  onDragEnd={() => {
                                    setDraggingAbstractionItem(null);
                                    setDragOverAbstractionTarget(null);
                                  }}
                                  onClick={() => {
                                    if (!isSelected) {
                                      handleDropOnBox(sc.key, item);
                                    }
                                  }}
                                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all select-none ${
                                    isSelected
                                      ? 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed line-through'
                                      : 'bg-slate-800 hover:bg-amber-950/80 border-slate-700 hover:border-amber-400 text-slate-100 cursor-grab active:cursor-grabbing hover:scale-105 shadow-sm'
                                  }`}
                                >
                                  {item}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Drop Box for 5 Essential Items */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (
                              draggingAbstractionItem &&
                              draggingAbstractionItem.scenarioKey === sc.key &&
                              dragOverAbstractionTarget?.scenarioKey !== sc.key
                            ) {
                              setDragOverAbstractionTarget({ scenarioKey: sc.key, slotIdx: 'box' });
                            }
                          }}
                          onDragLeave={() => {
                            if (
                              dragOverAbstractionTarget?.scenarioKey === sc.key &&
                              dragOverAbstractionTarget?.slotIdx === 'box'
                            ) {
                              setDragOverAbstractionTarget(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverAbstractionTarget(null);
                            if (
                              draggingAbstractionItem &&
                              draggingAbstractionItem.scenarioKey === sc.key
                            ) {
                              handleDropOnBox(
                                sc.key,
                                draggingAbstractionItem.value,
                                draggingAbstractionItem.fromSlotIdx
                              );
                            }
                            setDraggingAbstractionItem(null);
                          }}
                          className={`p-3.5 rounded-2xl border-2 border-dashed transition-all ${
                            isBoxHovered
                              ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                              : evalStat.isCompleteAndValid
                              ? 'bg-emerald-950/25 border-emerald-500/60'
                              : 'bg-slate-900/60 border-amber-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                              📦 กล่องคัดเลือกข้อมูลที่สำคัญ (5 รายการ)
                            </span>
                            <span className="text-[11px] text-slate-400">
                              คลิกที่รายการในกล่องเพื่อลบออก
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                            {[0, 1, 2, 3, 4].map((slotIdx) => {
                              const val = userSlots[slotIdx];
                              const isValidItem = val !== null && sc.validItems.includes(val);
                              const isSlotHovered =
                                dragOverAbstractionTarget?.scenarioKey === sc.key &&
                                dragOverAbstractionTarget?.slotIdx === slotIdx;

                              return (
                                <div
                                  key={slotIdx}
                                  draggable={val !== null}
                                  onDragStart={() => {
                                    if (val !== null) {
                                      setDraggingAbstractionItem({
                                        scenarioKey: sc.key,
                                        value: val,
                                        fromSlotIdx: slotIdx,
                                      });
                                    }
                                  }}
                                  onDragEnd={() => {
                                    setDraggingAbstractionItem(null);
                                    setDragOverAbstractionTarget(null);
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (
                                      draggingAbstractionItem &&
                                      draggingAbstractionItem.scenarioKey === sc.key
                                    ) {
                                      setDragOverAbstractionTarget({
                                        scenarioKey: sc.key,
                                        slotIdx,
                                      });
                                    }
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDragOverAbstractionTarget(null);
                                    if (
                                      draggingAbstractionItem &&
                                      draggingAbstractionItem.scenarioKey === sc.key
                                    ) {
                                      handlePlaceAbstractionItem(
                                        sc.key,
                                        slotIdx,
                                        draggingAbstractionItem.value,
                                        draggingAbstractionItem.fromSlotIdx
                                      );
                                    }
                                    setDraggingAbstractionItem(null);
                                  }}
                                  onClick={() => {
                                    if (val !== null) {
                                      handleRemoveAbstractionSlot(sc.key, slotIdx);
                                    }
                                  }}
                                  className={`min-h-[44px] px-2.5 py-2 rounded-xl border flex items-center justify-between gap-1.5 text-xs font-bold transition-all select-none ${
                                    isSlotHovered
                                      ? 'bg-amber-900/60 border-amber-300 scale-105'
                                      : val !== null
                                      ? isValidItem
                                        ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 cursor-pointer hover:bg-rose-950/60 hover:border-rose-400'
                                        : 'bg-rose-950/85 border-rose-500 text-rose-200 cursor-pointer'
                                      : 'bg-slate-950/80 border-slate-800 text-slate-500'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="font-mono text-[10px] opacity-70 shrink-0">
                                      #{slotIdx + 1}
                                    </span>
                                    {val !== null ? (
                                      <span className="truncate">{val}</span>
                                    ) : (
                                      <span className="text-[11px] text-slate-500">ว่าง</span>
                                    )}
                                  </div>
                                  {val !== null && (
                                    <span className="shrink-0">
                                      {isValidItem ? (
                                        <CheckCircle2 size={14} className="text-emerald-400" />
                                      ) : (
                                        <AlertTriangle size={14} className="text-rose-400" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Non-Spoiler Guidance Alert when any selected item is non-essential */}
                        {evalStat.hasWrong && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 p-3 rounded-xl bg-amber-950/65 border border-amber-400/60 flex items-start gap-2.5 text-xs text-amber-100"
                            role="alert"
                          >
                            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-1 leading-relaxed">
                              <strong className="text-amber-300 block">
                                ⚠️ มีรายการที่ยังไม่เหมาะเป็นข้อมูลสำคัญหลัก (คลิกที่รายการในกล่องเพื่อนำออก):
                              </strong>
                              {evalStat.wrongItems.map((w) => (
                                <p key={w.slotNumber} className="text-amber-100">
                                  • <strong>"{w.name}" (ช่อง #{w.slotNumber})</strong> — 💡 คำแนะนำ: {w.guidance}
                                </p>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                  </div>

                  {renderProgressiveExerciseHintBox(
                    '💡 คำใบ้ที่ 1 (ชวนคิด): ลองถามตัวเองว่า "สิ่งของชิ้นไหนที่ถ้าไม่มีแล้วจะเกิดปัญหาต่อการเรียนออนไลน์หรือการเดินป่าทันที?" ให้เลือกเฉพาะสิ่งจำเป็นหลัก 5 ชิ้น และตัดของฟุ่มเฟือยออก',
                    '🔍 คำใบ้ที่ 2 (ชี้จุดที่ผิด): ตรวจสอบกล่องคำตอบที่มีกรอบสีแดง (รายการที่ไม่จำเป็น) แล้วคลิกเพื่อนำออก — เช่น ขนมขบเคี้ยว ตุ๊กตา เกมพกพา หรือเครื่องประดับ ไม่ใช่สิ่งจำเป็นหลักในการทำภารกิจ',
                    '✨ คำใบ้ที่ 3 (ตัวอย่างแนวคิด): [สถานการณ์ที่ 1 เรียนออนไลน์ที่บ้าน] คอมพิวเตอร์/แท็บเล็ต, อินเทอร์เน็ต, สมุดและปากกา, หูฟังและไมโครโฟน, ตารางเรียนและหนังสือเรียน | [สถานการณ์ที่ 2 เดินป่าศึกษาธรรมชาติ] น้ำดื่มสะอาด, แผนที่และเข็มทิศ, ชุดปฐมพยาบาล, ไฟฉาย, อาหารแห้งและเสบียง',
                    level3ExerciseError
                  )}
                  {renderDragAutoScrollEdgeZone('down')}
                </div>

                {/* Footer Actions */}
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playSfx('click');
                      setLevel3LearningStep('knowledge');
                    }}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft size={16} />
                    <span>ย้อนกลับไปหน้าต่างความรู้</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isAllScenariosPassed) {
                        audioSynth.playSfx('wrong');
                        const remaining = deductExerciseHeart();
                        setLevel3ExerciseError(
                          `ยังคัดเลือกสิ่งของสำคัญไม่ครบหรือไม่ถูกต้อง (${totalValidItemsCount}/10 รายการ)! สูญเสียหัวใจพลังชีวิต 1 ดวง (เหลือ ❤️ ${remaining}/3) — กรุณาเลือกเฉพาะสิ่งของที่สำคัญที่สุด 5 รายการในแต่ละสถานการณ์`
                        );
                        return;
                      }

                      audioSynth.playSfx('unlock');
                      setLevel3ExerciseCompleted(true);
                      setLevel3ExerciseError(null);
                      try {
                        sessionStorage.setItem(
                          'ct_level3_abstraction_answers_v2',
                          JSON.stringify({
                            abstractionAnswers,
                            completed: true,
                          })
                        );
                      } catch (e) {}

                      setLevel3LearningStep(null);
                      setShowVictoryModal(true);
                    }}
                    className="w-full sm:flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-sm sm:text-base rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                    id="submit-abstraction-exercise-btn"
                  >
                    <CheckCircle2 size={18} />
                    <span>ตรวจคำตอบและผ่านด่านที่ 3 ({totalValidItemsCount}/10 รายการผ่านเกณฑ์)</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* LEVEL 4 POST-MISSION: KNOWLEDGE & ALGORITHM DESIGN (FLOWCHART) EXERCISE MODALS */}
      <AnimatePresence>
        {level4LearningStep === 'knowledge' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 25 }}
              className="bg-slate-900 border-2 border-emerald-400/70 rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(16,185,129,0.3)] relative my-auto max-h-[90vh] flex flex-col overflow-hidden"
              id="level4-knowledge-modal"
            >
              <div className="flex-1 min-h-0 overflow-y-auto drag-scroll-container pr-1.5">
                {/* Top Mission Accomplished Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold mb-2">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <span>ภารกิจการเดินทางด่านที่ 4 สำเร็จ! · ส่วนความรู้ก่อนทำแบบฝึกหัด</span>
                </div>

                {/* Knowledge Title */}
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)] shrink-0">
                    <Compass size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                      การออกแบบอัลกอริทึม (Algorithm Design)
                    </h3>
                    <span className="text-xs font-mono text-emerald-300">
                      องค์ประกอบที่ 4 ของแนวคิดเชิงคำนวณ: การออกแบบอัลกอริทึม (Algorithm Design)
                    </span>
                  </div>
                </div>

                {/* Definition Box */}
                <div className="p-3 rounded-2xl bg-slate-950/90 border border-emerald-500/40 mb-2.5 shadow-inner">
                  <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-medium">
                    <strong className="text-emerald-300">อัลกอริทึม</strong> คือ{' '}
                    <strong className="text-cyan-300">
                      ลำดับขั้นตอนที่ชัดเจน เพื่อใช้แก้ปัญหาให้สำเร็จ
                    </strong>
                  </p>
                </div>

                {/* 5 Qualities of a Good Algorithm */}
                <div className="p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/40 mb-2.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-cyan-300 mb-2 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-cyan-400" />
                    <span>อัลกอริทึมที่ดีควรเป็นอย่างไร?</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                    {[
                      { num: 1, text: 'ชัดเจน เข้าใจง่าย' },
                      { num: 2, text: 'มีลำดับขั้นตอน' },
                      { num: 3, text: 'ทำซ้ำได้ ได้ผลลัพธ์เดิม' },
                      { num: 4, text: 'จบในเวลาที่เหมาะสม' },
                      { num: 5, text: 'แก้ปัญหาได้จริง' },
                    ].map((item) => (
                      <div
                        key={item.num}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex sm:flex-col items-center sm:text-center gap-1.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono font-black text-[11px] flex items-center justify-center shrink-0">
                          {item.num}
                        </span>
                        <span className="text-xs font-bold text-slate-100 leading-snug">
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flowchart Symbols Reference Table */}
                <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 mb-2.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-amber-300 mb-2 flex items-center gap-1.5">
                    <span>📐 สัญลักษณ์พื้นฐานของผังงาน (Flowchart) และความหมาย</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* 1. Start/Stop (Terminator) */}
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center gap-3">
                      <div className="w-28 h-11 flex items-center justify-center shrink-0">
                        <svg width="104" height="38" viewBox="0 0 104 38">
                          <rect
                            x="3"
                            y="3"
                            width="98"
                            height="32"
                            rx="16"
                            ry="16"
                            fill="#f87171"
                            fillOpacity="0.2"
                            stroke="#f87171"
                            strokeWidth="2.5"
                          />
                        </svg>
                      </div>
                      <div className="text-xs">
                        <strong className="text-rose-300 block">เริ่มต้นหรือจบ Flowchart</strong>
                        <span className="text-slate-400 font-mono text-[11px]">(Start or Stop)</span>
                      </div>
                    </div>

                    {/* 2. Process (Rectangle) */}
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center gap-3">
                      <div className="w-28 h-11 flex items-center justify-center shrink-0">
                        <svg width="104" height="38" viewBox="0 0 104 38">
                          <rect
                            x="4"
                            y="4"
                            width="96"
                            height="30"
                            rx="3"
                            ry="3"
                            fill="#fb923c"
                            fillOpacity="0.2"
                            stroke="#fb923c"
                            strokeWidth="2.5"
                          />
                        </svg>
                      </div>
                      <div className="text-xs">
                        <strong className="text-orange-300 block">การประมวลผล</strong>
                        <span className="text-slate-400 font-mono text-[11px]">(Process)</span>
                      </div>
                    </div>

                    {/* 3. Input/Output (Parallelogram) */}
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center gap-3">
                      <div className="w-28 h-11 flex items-center justify-center shrink-0">
                        <svg width="104" height="38" viewBox="0 0 104 38">
                          <polygon
                            points="18,4 100,4 86,34 4,34"
                            fill="#facc15"
                            fillOpacity="0.2"
                            stroke="#facc15"
                            strokeWidth="2.5"
                          />
                        </svg>
                      </div>
                      <div className="text-xs">
                        <strong className="text-yellow-300 block">ส่วนนำเข้าข้อมูลหรือแสดงผลข้อมูล</strong>
                        <span className="text-slate-400 font-mono text-[11px]">(Input or Output)</span>
                      </div>
                    </div>

                    {/* 4. Decision (Diamond) */}
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center gap-3">
                      <div className="w-28 h-11 flex items-center justify-center shrink-0">
                        <svg width="104" height="42" viewBox="0 0 104 42">
                          <polygon
                            points="52,3 100,21 52,39 4,21"
                            fill="#4ade80"
                            fillOpacity="0.2"
                            stroke="#4ade80"
                            strokeWidth="2.5"
                          />
                        </svg>
                      </div>
                      <div className="text-xs">
                        <strong className="text-emerald-300 block">การตัดสินใจ</strong>
                        <span className="text-slate-400 font-mono text-[11px]">(Decision)</span>
                      </div>
                    </div>

                    {/* 5. Connector (Circle) */}
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center gap-3">
                      <div className="w-28 h-11 flex items-center justify-center shrink-0">
                        <svg width="104" height="38" viewBox="0 0 104 38">
                          <circle
                            cx="52"
                            cy="19"
                            r="14"
                            fill="#a78bfa"
                            fillOpacity="0.2"
                            stroke="#a78bfa"
                            strokeWidth="2.5"
                          />
                        </svg>
                      </div>
                      <div className="text-xs">
                        <strong className="text-purple-300 block">จุดเชื่อมต่อ</strong>
                        <span className="text-slate-400 font-mono text-[11px]">(Connector)</span>
                      </div>
                    </div>

                    {/* 6. Direction of Flow (Arrows) */}
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center gap-3">
                      <div className="w-28 h-11 flex items-center justify-center shrink-0">
                        <svg width="104" height="38" viewBox="0 0 104 38">
                          <line x1="12" y1="19" x2="52" y2="19" stroke="#38bdf8" strokeWidth="2.5" />
                          <polygon points="52,13 64,19 52,25" fill="#38bdf8" />
                          <line x1="82" y1="5" x2="82" y2="25" stroke="#38bdf8" strokeWidth="2.5" />
                          <polygon points="76,24 82,34 88,24" fill="#38bdf8" />
                        </svg>
                      </div>
                      <div className="text-xs">
                        <strong className="text-cyan-300 block">ทิศทางการทำงาน</strong>
                        <span className="text-slate-400 font-mono text-[11px]">(Direction of Flow)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dedicated Footer Area for Button to Enter Algorithm Design Exercise */}
              <div className="pt-3.5 mt-3 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setLevel4ExerciseError(null);
                    setLevel4LearningStep('exercise');
                  }}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-base sm:text-lg tracking-wide rounded-2xl transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                  id="enter-algorithm-exercise-btn"
                >
                  <span>เข้าสู่แบบฝึกหัด การออกแบบอัลกอริทึม (Algorithm Design)</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {level4LearningStep === 'exercise' && (() => {
          const FLOWCHART_SLOTS: {
            slotIdx: number;
            shapeType: 'terminator' | 'process' | 'decision';
            shapeLabel: string;
            expectedText: string;
            guidanceHint: string;
          }[] = [
            {
              slotIdx: 0,
              shapeType: 'terminator',
              shapeLabel: 'เริ่มต้น/จบ (Start)',
              expectedText: 'เริ่มต้น',
              guidanceHint:
                'สัญลักษณ์แคปซูลด้านบนสุดเป็นจุดเริ่มผังงาน (Start) แนะนำให้เลือกข้อความที่แสดงถึงการเริ่มทำงาน',
            },
            {
              slotIdx: 1,
              shapeType: 'process',
              shapeLabel: 'การประมวลผล (Process)',
              expectedText: 'เดินออกจากบ้าน',
              guidanceHint:
                'หลังเริ่มต้นผังงาน ก่อนจะไปเลือกวิธีเดินทาง ต้องทำขั้นตอนแรกสุดเมื่อออกจากที่พักอาศัยก่อน',
            },
            {
              slotIdx: 2,
              shapeType: 'decision',
              shapeLabel: 'การตัดสินใจ (Decision)',
              expectedText: 'ถ้าฉันมีเงิน มากกว่า 20 บาท',
              guidanceHint:
                'สัญลักษณ์สี่เหลี่ยมข้าวหลามตัดใช้สำหรับตรวจสอบเงื่อนไข/การตัดสินใจ (Decision) แนะนำให้เลือกข้อความที่เป็นเงื่อนไขเปรียบเทียบจำนวนเงิน',
            },
            {
              slotIdx: 3,
              shapeType: 'process',
              shapeLabel: 'ใช่ (Process)',
              expectedText: 'นั่งรถมอเตอร์ไซค์',
              guidanceHint:
                'เส้นทาง "ใช่" (มีเงินมากกว่า 20 บาท) เป็นทางเลือกที่มีเพียงขั้นตอนเดียวซึ่งพาไปส่งถึงโรงเรียนได้โดยตรง แนะนำให้เลือกพาหนะที่ใช้ในเส้นทาง "ใช่"',
            },
            {
              slotIdx: 4,
              shapeType: 'process',
              shapeLabel: 'ไม่ใช่ ขั้นที่ 1 (Process)',
              expectedText: 'นั่งรถเมล์',
              guidanceHint:
                'เส้นทาง "ไม่ใช่" (มีเงินไม่มากกว่า 20 บาท) มี 2 ขั้นตอนต่อเนื่องกัน (โดยสารรถประจำทางก่อน แล้วจึงเดินต่อเข้าซอย) แนะนำให้เลือกการโดยสารรถประจำทางในช่องแรกของเส้นทาง "ไม่ใช่"',
            },
            {
              slotIdx: 5,
              shapeType: 'process',
              shapeLabel: 'ไม่ใช่ ขั้นที่ 2 (Process)',
              expectedText: 'เดินเข้าซอย',
              guidanceHint:
                'หลังจากลงรถประจำทางในเส้นทาง "ไม่ใช่" แล้ว ต้องทำขั้นตอนใดต่อเพื่อเข้าไปยังโรงเรียนที่อยู่ในซอย',
            },
            {
              slotIdx: 6,
              shapeType: 'process',
              shapeLabel: 'หลังจุดเชื่อมต่อ (Process)',
              expectedText: 'ถึงโรงเรียน',
              guidanceHint:
                'เมื่อเส้นทางทั้งสองฝั่งมารวมกันที่จุดเชื่อมต่อ (วงกลม) เรียบร้อยแล้ว ขั้นตอนถัดมาก่อนจบผังงานคือการไปถึงจุดหมายปลายทาง',
            },
            {
              slotIdx: 7,
              shapeType: 'terminator',
              shapeLabel: 'เริ่มต้น/จบ (Stop)',
              expectedText: 'สิ้นสุด',
              guidanceHint:
                'สัญลักษณ์แคปซูลด้านล่างสุดใช้สำหรับปิดท้ายผังงาน (Stop) เมื่อเดินทางถึงจุดหมายเรียบร้อยแล้ว',
            },
          ];

          const FLOWCHART_CHOICES = [
            'เดินออกจากบ้าน',
            'นั่งรถมอเตอร์ไซค์',
            'เริ่มต้น',
            'เดินเข้าซอย',
            'ถ้าฉันมีเงิน มากกว่า 20 บาท',
            'สิ้นสุด',
            'นั่งรถเมล์',
            'ถึงโรงเรียน',
          ];

          const handlePlaceFlowchartSlot = (
            targetIdx: number,
            value: string,
            fromSlotIdx?: number
          ) => {
            const expected = FLOWCHART_SLOTS[targetIdx].expectedText;
            const isCorrect = value === expected;
            audioSynth.playSfx(isCorrect ? 'click' : 'wrong');
            if (!isCorrect) {
              deductExerciseHeart();
            }
            setLevel4ExerciseError(null);

            setFlowchartAnswers(prev => {
              const nextArr = [...prev];
              const existingIdx = nextArr.findIndex(v => v === value);
              if (fromSlotIdx !== undefined && fromSlotIdx !== targetIdx) {
                const targetOld = nextArr[targetIdx];
                nextArr[targetIdx] = value;
                nextArr[fromSlotIdx] = targetOld;
              } else {
                if (existingIdx !== -1 && existingIdx !== targetIdx) {
                  nextArr[existingIdx] = null;
                }
                nextArr[targetIdx] = value;
              }
              return nextArr;
            });
          };

          const handleClearFlowchartSlot = (slotIdx: number) => {
            audioSynth.playSfx('click');
            setLevel4ExerciseError(null);
            setFlowchartAnswers(prev => {
              const nextArr = [...prev];
              nextArr[slotIdx] = null;
              return nextArr;
            });
          };

          const handleQuickClickFlowchartChoice = (value: string) => {
            const firstEmpty = flowchartAnswers.findIndex(v => v === null);
            const targetIdx = firstEmpty !== -1 ? firstEmpty : 7;
            handlePlaceFlowchartSlot(targetIdx, value);
          };

          const wrongSlots = FLOWCHART_SLOTS.filter(s => {
            const userVal = flowchartAnswers[s.slotIdx];
            return userVal !== null && userVal !== s.expectedText;
          });

          const correctCount = FLOWCHART_SLOTS.filter(
            s => flowchartAnswers[s.slotIdx] === s.expectedText
          ).length;

          const isAllFlowchartCorrect = correctCount === 8;

          const renderFlowchartSlotNode = (slotIdx: number) => {
            const cfg = FLOWCHART_SLOTS[slotIdx];
            const val = flowchartAnswers[slotIdx];
            const isCorrect = val !== null && val === cfg.expectedText;
            const isHovered = dragOverFlowchartSlot === slotIdx;

            const commonDragProps = {
              draggable: val !== null,
              onDragStart: () => {
                if (val !== null) {
                  setDraggingFlowchartItem({ value: val, fromSlotIdx: slotIdx });
                }
              },
              onDragEnd: () => {
                setDraggingFlowchartItem(null);
                setDragOverFlowchartSlot(null);
              },
              onDragOver: (e: React.DragEvent) => {
                e.preventDefault();
                if (draggingFlowchartItem && dragOverFlowchartSlot !== slotIdx) {
                  setDragOverFlowchartSlot(slotIdx);
                }
              },
              onDragLeave: () => {
                if (dragOverFlowchartSlot === slotIdx) {
                  setDragOverFlowchartSlot(null);
                }
              },
              onDrop: (e: React.DragEvent) => {
                e.preventDefault();
                setDragOverFlowchartSlot(null);
                if (draggingFlowchartItem) {
                  handlePlaceFlowchartSlot(
                    slotIdx,
                    draggingFlowchartItem.value,
                    draggingFlowchartItem.fromSlotIdx
                  );
                }
                setDraggingFlowchartItem(null);
              },
              onClick: () => {
                if (val !== null) {
                  handleClearFlowchartSlot(slotIdx);
                }
              },
            };

            if (cfg.shapeType === 'decision') {
              return (
                <div
                  {...commonDragProps}
                  title={val ? 'คลิกเพื่อลบออก หรือลากไปสลับช่อง' : 'ลากข้อความมาวางในสัญลักษณ์นี้'}
                  className={`relative w-52 sm:w-60 h-14 flex items-center justify-center select-none transition-transform ${
                    isHovered ? 'scale-105' : ''
                  } ${val ? 'cursor-pointer' : ''}`}
                >
                  <svg
                    viewBox="0 0 300 80"
                    className="w-full h-full overflow-visible drop-shadow-md"
                  >
                    <polygon
                      points="150,4 294,40 150,76 6,40"
                      fill={
                        isHovered
                          ? 'rgba(16,185,129,0.35)'
                          : val !== null
                          ? isCorrect
                            ? 'rgba(6,78,59,0.85)'
                            : 'rgba(136,19,55,0.85)'
                          : 'rgba(15,23,42,0.9)'
                      }
                      stroke={
                        isHovered
                          ? '#34d399'
                          : val !== null
                          ? isCorrect
                            ? '#34d399'
                            : '#f43f5e'
                          : '#4ade80'
                      }
                      strokeWidth="3"
                      strokeDasharray={val === null ? '6 4' : undefined}
                    />
                  </svg>
                  {val !== null && (
                    <div className="absolute inset-0 flex items-center justify-center px-8 text-center pointer-events-none">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-black text-white leading-tight">
                          {val}
                        </span>
                        {isCorrect ? (
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        ) : (
                          <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            if (cfg.shapeType === 'terminator') {
              return (
                <div
                  {...commonDragProps}
                  title={val ? 'คลิกเพื่อลบออก' : 'ลากข้อความมาวางในสัญลักษณ์นี้'}
                  className={`w-40 sm:w-44 min-h-[34px] px-3 py-1 rounded-full border-2 flex items-center justify-center gap-1.5 text-center transition-all select-none ${
                    isHovered
                      ? 'bg-rose-900/50 border-rose-300 scale-105 shadow-[0_0_15px_rgba(248,113,113,0.4)]'
                      : val !== null
                      ? isCorrect
                        ? 'bg-emerald-950/85 border-solid border-emerald-400 text-emerald-200 cursor-pointer'
                        : 'bg-rose-950/85 border-solid border-rose-500 text-rose-200 cursor-pointer'
                      : 'bg-slate-950/90 border-dashed border-rose-400/75'
                  }`}
                >
                  {val !== null && (
                    <>
                      <span className="text-xs font-black">{val}</span>
                      {isCorrect ? (
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                      )}
                    </>
                  )}
                </div>
              );
            }

            // Default: 'process' rectangle (no redundant text inside when empty)
            return (
              <div
                {...commonDragProps}
                title={val ? 'คลิกเพื่อลบออก' : 'ลากข้อความมาวางในสัญลักษณ์นี้'}
                className={`w-40 sm:w-44 min-h-[34px] px-3 py-1 rounded-md border-2 flex items-center justify-center gap-1.5 text-center transition-all select-none ${
                  isHovered
                    ? 'bg-orange-900/50 border-orange-300 scale-105 shadow-[0_0_15px_rgba(251,146,60,0.4)]'
                    : val !== null
                    ? isCorrect
                      ? 'bg-emerald-950/85 border-solid border-emerald-400 text-emerald-200 cursor-pointer'
                      : 'bg-rose-950/85 border-solid border-rose-500 text-rose-200 cursor-pointer'
                    : 'bg-slate-950/90 border-dashed border-orange-400/75'
                }`}
              >
                {val !== null && (
                  <>
                    <span className="text-xs font-black">{val}</span>
                    {isCorrect ? (
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                    )}
                  </>
                )}
              </div>
            );
          };

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                className="bg-slate-900 border-2 border-emerald-400/70 rounded-3xl max-w-6xl w-full p-4 sm:p-6 shadow-[0_0_50px_rgba(16,185,129,0.25)] relative my-auto max-h-[95vh] flex flex-col overflow-hidden"
                id="level4-exercise-modal"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 shrink-0 flex-wrap">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2.5 py-0.5 rounded-md mb-1">
                      <Compass size={13} />
                      <span>แบบฝึกหัดท้ายด่านที่ 4 : การออกแบบอัลกอริทึม (Algorithm Design)</span>
                    </div>
                    <h3 className="text-base sm:text-xl font-black text-white leading-snug">
                      1. ให้นักเรียนเขียนลำดับขั้นตอนในการเดินทางมาโรงเรียน
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      💡 ลากข้อความจากฝั่งซ้ายไปวางในสัญลักษณ์ผังงานฝั่งขวาให้ถูกต้องตามลำดับ (หรือคลิกที่ข้อความเพื่อเติม / คลิกที่สัญลักษณ์เพื่อลบออก)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {renderExerciseHeartsHUD()}
                    <button
                      onClick={() => {
                        audioSynth.playSfx('click');
                        setLevel4LearningStep('knowledge');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-emerald-300 transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <ChevronLeft size={15} />
                      <span>ดูใบความรู้</span>
                    </button>
                  </div>
                </div>

                {/* Two-Column Split Body: Left = Choices & Guidance, Right = Flowchart */}
                <div
                  ref={exerciseScrollContainerRef}
                  onDragOverCapture={handleContainerDragOverAutoScroll}
                  className="flex-1 overflow-y-scroll drag-scroll-container mt-3.5 pr-2"
                >
                  {renderDragAutoScrollEdgeZone('up')}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* LEFT SIDE (5 cols): Draggable Choices Bank & Mistake Guidance */}
                    <div className="lg:col-span-5 flex flex-col gap-3.5 lg:sticky lg:top-0">
                      <div className="p-4 rounded-2xl bg-slate-950/95 border border-slate-800">
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 mb-3 border-b border-slate-800">
                          <span className="text-xs sm:text-sm font-extrabold text-cyan-300">
                            📋 ข้อความขั้นตอน (ลากไปวางฝั่งขวา)
                          </span>
                          <span className="text-xs font-mono text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                            ถูกต้อง <strong>{correctCount}/8</strong>
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                          {FLOWCHART_CHOICES.map((choiceText) => {
                            const isUsed = flowchartAnswers.includes(choiceText);
                            return (
                              <div
                                key={choiceText}
                                draggable={!isUsed}
                                onDragStart={() => {
                                  if (!isUsed) {
                                    setDraggingFlowchartItem({ value: choiceText });
                                  }
                                }}
                                onDragEnd={() => {
                                  setDraggingFlowchartItem(null);
                                  setDragOverFlowchartSlot(null);
                                }}
                                onClick={() => {
                                  if (!isUsed) {
                                    handleQuickClickFlowchartChoice(choiceText);
                                  }
                                }}
                                className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all select-none flex items-center justify-between ${
                                  isUsed
                                    ? 'bg-slate-900/40 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed line-through'
                                    : 'bg-slate-800 hover:bg-emerald-950/80 border-emerald-500/50 hover:border-emerald-400 text-white cursor-grab active:cursor-grabbing shadow-sm hover:scale-[1.02]'
                                }`}
                              >
                                <span>{choiceText}</span>
                                {!isUsed && (
                                  <span className="text-[10px] font-mono text-emerald-300/80">
                                    ลาก ➔
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Non-Spoiler Guidance Alert when any slot has an incorrect step */}
                      {wrongSlots.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-400/60 flex items-start gap-2.5 text-xs text-amber-100"
                          role="alert"
                        >
                          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1.5 leading-relaxed">
                            <strong className="text-amber-300 block">
                              ⚠️ มีข้อความที่วางไม่ตรงลำดับหรือสัญลักษณ์ (คลิกที่สัญลักษณ์สีแดงเพื่อลบออก):
                            </strong>
                            {wrongSlots.map((ws) => (
                              <p key={ws.slotIdx} className="text-amber-100">
                                • 💡 <strong>คำแนะนำ:</strong> {ws.guidanceHint}
                              </p>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {renderProgressiveExerciseHintBox(
                        '💡 คำใบ้ที่ 1 (ชวนคิด): สังเกตรูปทรงของสัญลักษณ์ผังงาน (Flowchart) ให้ดี — แคปซูลสีชมพูคือจุดเริ่มต้น/สิ้นสุด, สี่เหลี่ยมผืนผ้าสีส้มคือการกระทำ, และสี่เหลี่ยมขนมเปียกปูนสีเขียวคือการตัดสินใจตามเงื่อนไข!',
                        '🔍 คำใบ้ที่ 2 (ชี้จุดที่ผิด): ตรวจสอบช่องที่มีกรอบสีแดงหรือยังว่างอยู่ — โดยเฉพาะจุดตัดสินใจ "ถ้าฉันมีเงินมากกว่า 20 บาท" และเส้นทางแยก "ใช่" (นั่งรถมอเตอร์ไซค์) กับ "ไม่ใช่" (นั่งรถเมล์ ➔ เดินเข้าซอย) ก่อนรวมกันไปถึงโรงเรียน',
                        '✨ คำใบ้ที่ 3 (ตัวอย่างแนวคิด): ช่องที่ 1: เริ่มต้น ➔ ช่องที่ 2: เดินออกจากบ้าน ➔ ช่องที่ 3 (เงื่อนไข): ถ้าฉันมีเงิน มากกว่า 20 บาท ➔ ใช่ ช่องที่ 4: นั่งรถมอเตอร์ไซค์ | ไม่ใช่ ช่องที่ 5: นั่งรถเมล์ แล้วตามด้วย ช่องที่ 6: เดินเข้าซอย ➔ ช่องที่ 7: ถึงโรงเรียน ➔ ช่องที่ 8: สิ้นสุด',
                        level4ExerciseError
                      )}
                    </div>

                    {/* RIGHT SIDE (7 cols): Flowchart Diagram Canvas (Clean geometric symbols without redundant text) */}
                    <div className="lg:col-span-7 p-3 sm:p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col items-center">
                      {/* Slot 0: Start (Capsule) */}
                      {renderFlowchartSlotNode(0)}

                      {/* Arrow Down */}
                      <div className="text-cyan-400 font-bold text-xs leading-none my-0.5">↓</div>

                      {/* Slot 1: เดินออกจากบ้าน (Process) */}
                      {renderFlowchartSlotNode(1)}

                      {/* Arrow Down */}
                      <div className="text-cyan-400 font-bold text-xs leading-none my-0.5">↓</div>

                      {/* Slot 2: ถ้าฉันมีเงิน มากกว่า 20 บาท (Decision Diamond) */}
                      {renderFlowchartSlotNode(2)}

                      {/* Yes (ใช่) & No (ไม่ใช่) Branching */}
                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 mt-1">
                        {/* Left Branch (ใช่): นั่งรถมอเตอร์ไซค์ (1 ช่องตอบ) */}
                        <div className="flex flex-col items-center justify-between p-2 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                          <div className="text-[11px] font-mono font-bold text-emerald-300 mb-1">
                            ← ใช่
                          </div>
                          <div className="my-auto flex flex-col items-center">
                            {renderFlowchartSlotNode(3)}
                          </div>
                          <div className="text-cyan-400 font-bold text-xs mt-0.5">↘</div>
                        </div>

                        {/* Right Branch (ไม่ใช่): นั่งรถเมล์ -> เดินเข้าซอย (2 ช่องตอบ) */}
                        <div className="flex flex-col items-center p-2 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                          <div className="text-[11px] font-mono font-bold text-amber-300 mb-1">
                            → ไม่ใช่
                          </div>
                          {renderFlowchartSlotNode(4)}
                          <div className="text-cyan-400 font-bold text-xs leading-none my-0.5">↓</div>
                          {renderFlowchartSlotNode(5)}
                          <div className="text-cyan-400 font-bold text-xs mt-0.5">↙</div>
                        </div>
                      </div>

                      {/* Connector Symbol (Circle) where both branches merge */}
                      <div className="flex items-center gap-2.5 my-1">
                        <span className="text-cyan-400 font-bold text-xs">→</span>
                        <div
                          className="w-6 h-6 rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.35)]"
                          title="จุดเชื่อมต่อ (Connector)"
                        />
                        <span className="text-cyan-400 font-bold text-xs">←</span>
                      </div>

                      {/* Arrow Down */}
                      <div className="text-cyan-400 font-bold text-xs leading-none my-0.5">↓</div>

                      {/* Slot 6: ถึงโรงเรียน (Process) */}
                      {renderFlowchartSlotNode(6)}

                      {/* Arrow Down */}
                      <div className="text-cyan-400 font-bold text-xs leading-none my-0.5">↓</div>

                      {/* Slot 7: สิ้นสุด (Capsule) */}
                      {renderFlowchartSlotNode(7)}
                    </div>
                  </div>
                  {renderDragAutoScrollEdgeZone('down')}
                </div>

                {/* Footer Actions */}
                <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playSfx('click');
                      setLevel4LearningStep('knowledge');
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft size={16} />
                    <span>ย้อนกลับไปหน้าต่างความรู้</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isAllFlowchartCorrect) {
                        audioSynth.playSfx('wrong');
                        const remaining = deductExerciseHeart();
                        setLevel4ExerciseError(
                          `ยังวางลำดับขั้นตอนไม่ครบหรือไม่ถูกต้อง (${correctCount}/8 ขั้นตอน)! สูญเสียหัวใจพลังชีวิต 1 ดวง (เหลือ ❤️ ${remaining}/3) — กรุณาวางข้อความให้ถูกต้องครบทั้ง 8 สัญลักษณ์`
                        );
                        return;
                      }

                      audioSynth.playSfx('unlock');
                      setLevel4ExerciseCompleted(true);
                      setLevel4ExerciseError(null);
                      try {
                        sessionStorage.setItem(
                          'ct_level4_algorithm_answers',
                          JSON.stringify({
                            flowchartAnswers,
                            completed: true,
                          })
                        );
                      } catch (e) {}

                      setLevel4LearningStep(null);
                      setShowVictoryModal(true);
                    }}
                    className="w-full sm:flex-1 py-3 px-6 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-sm sm:text-base rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                    id="submit-algorithm-exercise-btn"
                  >
                    <CheckCircle2 size={18} />
                    <span>ตรวจคำตอบและผ่านด่านที่ 4 ({correctCount}/8 ขั้นตอนถูกต้อง)</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* LEVEL 5 POST-MISSION CAPSTONE ASSESSMENT: BOSS CHALLENGE (โจทย์สถานการณ์บูรณาการ 4 ทักษะ) */}
      <AnimatePresence>
        {level5LearningStep === 'knowledge' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 25 }}
              className="bg-slate-900 border-2 border-rose-400/70 rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(244,63,94,0.3)] relative my-auto max-h-[90vh] flex flex-col overflow-hidden"
              id="level5-knowledge-modal"
            >
              <div className="flex-1 min-h-0 overflow-y-auto drag-scroll-container pr-1.5 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>สรุปทบทวนก่อนทำภารกิจบอส · การบูรณาการแนวคิดเชิงคำนวณทั้ง 4 ด้าน</span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.5)] shrink-0">
                    <Award size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                      การบูรณาการทักษะการคิดเชิงคำนวณ 4 มิติ (4-Pillar Integration)
                    </h3>
                    <span className="text-xs font-mono text-rose-300">
                      การใช้ทั้ง 4 ทักษะร่วมกันเพื่อแก้ปัญหาสถานการณ์จริงอย่างเป็นระบบ
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/40">
                    <div className="text-xs font-black text-cyan-300 mb-1">
                      1. การแบ่งย่อยปัญหา (Decomposition)
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      ซอยภารกิจหรือระบบใหญ่ที่ซับซ้อนออกเป็นฝ่ายงานหรือช่วงย่อย ๆ ที่จัดการได้ง่าย เช่น แบ่งทีมสำรวจเป็นฝ่ายแผนที่ ฝ่ายเสบียง และฝ่ายบันทึกข้อมูล
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-purple-500/40">
                    <div className="text-xs font-black text-purple-300 mb-1">
                      2. การหารูปแบบ (Pattern Recognition)
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      สังเกตความเหมือนหรือรูปแบบที่ซ้ำกัน เช่น กลไกประตูลับหรือเส้นทางซิกแซกที่ซ้ำกัน แล้วนำวิธีการเดิมหรือลูป (🔄) มาประยุกต์ใช้ซ้ำอย่างรวดเร็ว
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/40">
                    <div className="text-xs font-black text-amber-300 mb-1">
                      3. การคิดเชิงนามธรรม (Abstraction)
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      คัดกรองเฉพาะข้อมูลจำเป็นต่อการแก้ปัญหา เช่น พิกัดจุดปลอดภัยและตำแหน่งสิ่งกีดขวางบนแผนที่ และตัดรายละเอียดที่ไม่จำเป็น (เช่น สีดอกไม้ ลวดลายก้อนหิน) ทิ้งไป
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/40">
                    <div className="text-xs font-black text-emerald-300 mb-1">
                      4. การออกแบบอัลกอริทึม (Algorithm Design)
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      วางลำดับขั้นตอนตั้งแต่เริ่มต้น ➔ ตรวจสอบเงื่อนไข ➔ ปฏิบัติการ ➔ สิ้นสุด อย่างชัดเจนเป็นขั้นเป็นตอนเพื่อให้ทำงานสำเร็จและประหยัดทรัพยากรที่สุด
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3.5 mt-3 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setLevel5ExerciseError(null);
                    setLevel5LearningStep('exercise');
                  }}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 hover:from-rose-400 hover:to-emerald-300 text-slate-950 font-black text-base sm:text-lg tracking-wide rounded-2xl transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                  id="enter-boss-challenge-btn"
                >
                  <span>เข้าสู่ภารกิจสรุปรวบยอด (Boss Challenge ด่านที่ 5)</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {level5LearningStep === 'exercise' && (() => {
          const BOSS_TASKS: {
            key: 'decomposition' | 'pattern' | 'abstraction' | 'algorithm';
            pillarId: number;
            badge: string;
            title: string;
            borderColor: string;
            badgeColor: string;
            question: string;
            correctOptionId: string;
            guidanceHint: string;
            options: { id: string; text: string }[];
          }[] = [
            {
              key: 'decomposition',
              pillarId: 1,
              badge: '🧩 มิติที่ 1 : Decomposition',
              title: 'การแบ่งย่อยปัญหาในการจัดทีมสำรวจเมืองโบราณ',
              borderColor: 'border-cyan-500/50',
              badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
              question:
                '1. ทีมสำรวจ ม.2 ต้องจัดเตรียมภารกิจสำรวจเมืองโบราณที่มีงานซับซ้อนหลายด้าน ข้อใดใช้ทักษะ "การแบ่งย่อยปัญหา (Decomposition)" ได้ถูกต้องที่สุด?',
              correctOptionId: 'd_1',
              guidanceHint:
                'การแบ่งย่อยปัญหา คือการซอยงานใหญ่ที่ซับซ้อนออกเป็นฝ่ายงานหรือขั้นตอนย่อยที่ชัดเจนเพื่อให้ง่ายต่อการจัดการ',
              options: [
                {
                  id: 'd_1',
                  text: 'แบ่งงานออกเป็น 3 ฝ่ายย่อยชัดเจน: 1) ฝ่ายสำรวจเส้นทาง 2) ฝ่ายบันทึกข้อมูลสมบัติ 3) ฝ่ายดูแลความปลอดภัยและเสบียง',
                },
                {
                  id: 'd_2',
                  text: 'ให้หัวหน้าทีมเพียงคนเดียวรับผิดชอบทุกหน้าที่พร้อมกันทั้งหมดโดยไม่ต้องแบ่งงานย่อย',
                },
                {
                  id: 'd_3',
                  text: 'เลือกจดจำเฉพาะสีเสื้อผ้าและของเล่นที่เพื่อนนำมาโดยไม่วางแผนแบ่งงาน',
                },
              ],
            },
            {
              key: 'pattern',
              pillarId: 2,
              badge: '🔄 มิติที่ 2 : Pattern Recognition',
              title: 'การหารูปแบบกลไกประตูลับโบราณ',
              borderColor: 'border-purple-500/50',
              badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
              question:
                '2. ประตูวิหารโบราณแห่งที่ 1 และ 2 เปิดออกด้วยรหัสกลไกเดียวกันคือ "ก้าวขึ้นบน 3 ช่อง ➔ เช็คอิน" เมื่อพบประตูวิหารแห่งที่ 3 ที่มีสัญลักษณ์ตระกูลเดียวกัน ควรทำอย่างไร?',
              correctOptionId: 'p_2',
              guidanceHint:
                'การหารูปแบบ คือการสังเกตความคล้ายคลึงหรือลำดับที่ซ้ำกันจากปัญหาเดิม แล้วนำรูปแบบนั้นมาประยุกต์แก้ปัญหาใหม่',
              options: [
                {
                  id: 'p_1',
                  text: 'สุ่มกดคำสั่งทิศทางใหม่ทั้งหมดตั้งแต่ต้นโดยไม่สนใจรหัสที่เคยเปิดสำเร็จมาก่อน',
                },
                {
                  id: 'p_2',
                  text: 'สังเกตรูปแบบที่ซ้ำกัน แล้วนำชุดคำสั่งลูป "🔁 3x ⬆️ ขึ้นบน ➔ 📍 เช็คอิน" ไปใช้ปลดล็อกวิหารแห่งที่ 3 ทันที',
                },
                {
                  id: 'p_3',
                  text: 'คัดลอกลวดลายตะไคร่น้ำบนกำแพงวิหารทุกก้อนลงในสมุดวาดภาพ',
                },
              ],
            },
            {
              key: 'abstraction',
              pillarId: 3,
              badge: '🎯 มิติที่ 3 : Abstraction',
              title: 'การคิดเชิงนามธรรมสร้างแผนที่นำทางฉุกเฉิน',
              borderColor: 'border-amber-500/50',
              badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
              question:
                '3. ในการสร้าง "แผนที่ดิจิทัลนำทางออกจากเมืองโบราณ" เพื่อให้ทีมเดินทางได้ปลอดภัยและรวดเร็วที่สุด ข้อใดใช้ทักษะ "การคิดเชิงนามธรรม (Abstraction)" ได้ถูกต้อง?',
              correctOptionId: 'a_3',
              guidanceHint:
                'การคิดเชิงนามธรรม คือการคัดกรองเฉพาะข้อมูลจำเป็นต่อเป้าหมาย (เช่น พิกัดและสิ่งกีดขวาง) และตัดรายละเอียดส่วนเกินออก',
              options: [
                {
                  id: 'a_1',
                  text: 'วาดรายละเอียดก้อนกรวดทุกก้อน สีของใบไม้ และรูปร่างก้อนเมฆลงในแผนที่ทั้งหมด',
                },
                {
                  id: 'a_2',
                  text: 'บันทึกเฉพาะรายชื่อเพลงโปรดและสีกระเป๋าของสมาชิกในทีมลงในแผนที่นำทาง',
                },
                {
                  id: 'a_3',
                  text: 'แสดงเฉพาะพิกัดจุดเริ่มต้น จุดเป้าหมาย เส้นทางหลัก และตำแหน่งสิ่งกีดขวาง โดยตัดลวดลายตกแต่งที่ไม่จำเป็นออก',
                },
              ],
            },
            {
              key: 'algorithm',
              pillarId: 4,
              badge: '⚡ มิติที่ 4 : Algorithm Design',
              title: 'การออกแบบอัลกอริทึมหุ่นยนต์สำรวจสมบัติ',
              borderColor: 'border-emerald-500/50',
              badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
              question:
                '4. ข้อใดคือลำดับขั้นตอนวิธี "การออกแบบอัลกอริทึม (Algorithm Design)" สำหรับสั่งงานหุ่นยนต์สำรวจเมืองโบราณที่ถูกต้องและชัดเจนที่สุด?',
              correctOptionId: 'al_2',
              guidanceHint:
                'การออกแบบอัลกอริทึม ต้องจัดลำดับขั้นตอนจากเริ่มต้น ➔ ตรวจสอบเงื่อนไขหลบสิ่งกีดขวาง ➔ ทำภารกิจที่จุดหมาย ➔ สิ้นสุด',
              options: [
                {
                  id: 'al_1',
                  text: 'สิ้นสุด ➔ กดเช็คอินทันทีตั้งแต่จุดเริ่มต้น ➔ เดินหน้าชนสิ่งกีดขวาง ➔ เริ่มต้น',
                },
                {
                  id: 'al_2',
                  text: 'เริ่มต้น ➔ ตรวจจับสิ่งกีดขวางข้างหน้า (ถ้ามีให้เลี้ยวหลบ / ถ้าไม่มีให้เดินหน้า) ➔ เมื่อถึงสถานที่ให้กดเช็คอิน ➔ สิ้นสุด',
                },
                {
                  id: 'al_3',
                  text: 'สั่งให้หุ่นยนต์เดินสุ่มทิศทางไปเรื่อย ๆ โดยไม่มีการตั้งเงื่อนไขและไม่มีจุดสิ้นสุด',
                },
              ],
            },
          ];

          const answeredCount = BOSS_TASKS.filter(t => bossAnswers[t.key] !== null).length;
          const correctTasks = BOSS_TASKS.filter(t => bossAnswers[t.key] === t.correctOptionId);
          const wrongAnsweredTasks = BOSS_TASKS.filter(
            t => bossAnswers[t.key] !== null && bossAnswers[t.key] !== t.correctOptionId
          );
          const isAllBossCorrect = correctTasks.length === 4;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                className="bg-slate-900 border-2 border-rose-500/70 rounded-3xl max-w-6xl w-full p-4 sm:p-6 shadow-[0_0_55px_rgba(244,63,94,0.28)] relative my-auto max-h-[95vh] flex flex-col overflow-hidden"
                id="level5-boss-challenge-modal"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800 shrink-0 flex-wrap">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono text-rose-300 bg-rose-950/80 border border-rose-500/40 px-2.5 py-0.5 rounded-md mb-1">
                      <Sparkles size={13} className="text-amber-400" />
                      <span>ภารกิจสรุปรวบยอดท้ายด่านที่ 5 (Boss Challenge : Capstone Assessment)</span>
                    </div>
                    <h3 className="text-base sm:text-xl font-black text-white leading-snug">
                      โจทย์สถานการณ์บูรณาการ 4 ทักษะ : ภารกิจสำรวจเมืองโบราณลึกลับ
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      🎯 สถานการณ์: หลังจากเดินตาราง 5x5 สำเร็จ ทีมสำรวจ ม.2 ต้องวางระบบบริหารจัดการและนำทางออกจากเมืองโบราณ จงเลือกวิธีแก้ปัญหาให้ถูกต้องครบทั้ง 4 ทักษะ
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {renderExerciseHeartsHUD()}
                    <button
                      type="button"
                      onClick={() => {
                        audioSynth.playSfx('click');
                        setLevel5LearningStep('knowledge');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-rose-300 transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                      id="view-level5-knowledge-btn"
                    >
                      <ChevronLeft size={15} />
                      <span>ทบทวนสรุป 4 ทักษะ</span>
                    </button>
                  </div>
                </div>

                {/* Body: 2x2 Grid of the 4 Integrated CT Pillar Tasks */}
                <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {BOSS_TASKS.map((task) => {
                      const selectedId = bossAnswers[task.key];
                      return (
                        <div
                          key={task.key}
                          className={`p-3.5 rounded-2xl bg-slate-950/90 border ${task.borderColor} flex flex-col justify-between gap-2.5`}
                          id={`boss-task-${task.key}`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span
                                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${task.badgeColor}`}
                              >
                                {task.badge}
                              </span>
                              {selectedId && (
                                <span className="text-[10px] font-mono text-cyan-300">
                                  เลือกคำตอบแล้ว ✓
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-slate-100 leading-relaxed">
                              {task.question}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            {task.options.map((opt, optIdx) => {
                              const isSelected = selectedId === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    audioSynth.playSfx('click');
                                    setLevel5ExerciseError(null);
                                    setBossAnswers(prev => ({
                                      ...prev,
                                      [task.key]: opt.id,
                                    }));
                                  }}
                                  className={`w-full p-2.5 rounded-xl border text-left text-xs leading-snug transition-all flex items-start gap-2 cursor-pointer ${
                                    isSelected
                                      ? 'bg-cyan-950/85 border-cyan-400 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-600 text-slate-300'
                                  }`}
                                  id={`boss-option-${opt.id}`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-md font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                      isSelected
                                        ? 'bg-cyan-400 text-slate-950'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="flex-1">{opt.text}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progressive 3-Level Hint Box when an error occurs */}
                  {renderProgressiveExerciseHintBox(
                    '💡 คำใบ้ที่ 1 (ชวนคิด): ลองจับคู่คำสำคัญของแต่ละทักษะ — Decomposition = แบ่งฝ่ายงานย่อย, Pattern = ใช้รูปแบบลูปที่ซ้ำกัน, Abstraction = คัดเฉพาะพิกัดสำคัญตัดสิ่งฟุ่มเฟือยออก, Algorithm = เรียงลำดับเริ่มต้น ➔ เงื่อนไข ➔ สิ้นสุด',
                    `🔍 คำใบ้ที่ 2 (ชี้จุดที่ผิด): ${
                      wrongAnsweredTasks.length > 0
                        ? wrongAnsweredTasks
                            .map(t => `${t.badge}: ${t.guidanceHint}`)
                            .join(' | ')
                        : 'กรุณาเลือกคำตอบให้ครบทั้ง 4 มิติทักษะก่อนกดส่งคำตอบ'
                    }`,
                    '✨ คำใบ้ที่ 3 (ตัวอย่างแนวคิด): มิติที่ 1 เลือกการแบ่งงานเป็น 3 ฝ่ายย่อย (A) • มิติที่ 2 เลือกการนำชุดคำสั่งลูปรูปแบบเดิมไปใช้ปลดล็อก (B) • มิติที่ 3 เลือกแสดงเฉพาะพิกัดจุดปลอดภัยและสิ่งกีดขวาง (C) • มิติที่ 4 เลือกลำดับ เริ่มต้น ➔ ตรวจจับสิ่งกีดขวาง ➔ เช็คอิน ➔ สิ้นสุด (B)',
                    level5ExerciseError
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playSfx('click');
                      setLevel5LearningStep('knowledge');
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft size={16} />
                    <span>ดูใบความรู้สรุป 4 ทักษะ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (answeredCount < 4) {
                        audioSynth.playSfx('wrong');
                        setLevel5ExerciseError(
                          `กรุณาเลือกคำตอบให้ครบทั้ง 4 มิติทักษะก่อนตรวจคำตอบ (เลือกแล้ว ${answeredCount}/4 ข้อ)`
                        );
                        return;
                      }

                      if (!isAllBossCorrect) {
                        audioSynth.playSfx('wrong');
                        const wrongPillarIds = wrongAnsweredTasks.map(t => t.pillarId);
                        const remaining = deductExerciseHeart(wrongPillarIds);
                        const wrongNames = wrongAnsweredTasks.map(t => t.badge).join(', ');
                        setLevel5ExerciseError(
                          `คำตอบยังไม่ถูกต้อง (${correctTasks.length}/4 มิติ — จุดที่ต้องแก้ไข: ${wrongNames})! สูญเสียหัวใจพลังชีวิต 1 ดวง (เหลือ ❤️ ${remaining}/3)`
                        );
                        return;
                      }

                      audioSynth.playSfx('unlock');
                      setLevel5ExerciseCompleted(true);
                      setLevel5ExerciseError(null);
                      try {
                        sessionStorage.setItem(
                          'ct_level5_boss_answers',
                          JSON.stringify({
                            bossAnswers,
                            completed: true,
                          })
                        );
                      } catch (e) {}

                      setLevel5LearningStep(null);
                      setShowVictoryModal(true);
                    }}
                    className="w-full sm:flex-1 py-3 px-6 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 hover:from-rose-400 hover:to-emerald-300 text-slate-950 font-black text-sm sm:text-base rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-95 shadow-[0_0_25px_rgba(244,63,94,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                    id="submit-boss-challenge-btn"
                  >
                    <CheckCircle2 size={18} />
                    <span>ตรวจคำตอบภารกิจสรุปรวบยอดและผ่านด่านที่ 5 ({answeredCount}/4 ข้อ)</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* VICTORY MODAL: Mission Accomplished -> Proceed to Next Level */}
      <AnimatePresence>
        {showVictoryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.3)] relative overflow-hidden"
            >
              <div className="w-20 h-20 bg-emerald-950/60 border-2 border-emerald-400 rounded-full flex items-center justify-center text-emerald-300 mx-auto mb-4 shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-bounce duration-1000">
                <Award size={44} />
              </div>

              <h3 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent tracking-wider mb-2">
                ยินดีด้วย! คุณผ่านด่านที่ {currentLevelId} แล้ว! 🎉
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">
                ยอดเยี่ยมมากนักเดินทาง <strong className="text-cyan-300">{travelerName}</strong>! คุณทำภารกิจเช็คอินและเก็บสะสมเป้าหมายในด่านที่ {currentLevelId} ครบถ้วนสมบูรณ์แล้ว
              </p>

              {currentLevelId === 1 && exerciseCompleted && (
                <div className="mb-4 p-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-between gap-2 text-xs text-cyan-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>ทำแบบฝึกหัดการแยกย่อยปัญหา (Decomposition) สำเร็จแล้ว!</span>
                  </span>
                  <button
                    onClick={() => {
                      audioSynth.playSfx('click');
                      setShowVictoryModal(false);
                      setLevel1LearningStep('exercise');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 cursor-pointer shrink-0"
                  >
                    ดูคำตอบ
                  </button>
                </div>
              )}

              {currentLevelId === 2 && level2ExerciseCompleted && (
                <div className="mb-4 p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/40 flex items-center justify-between gap-2 text-xs text-purple-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>ทำแบบฝึกหัดการหารูปแบบ (Pattern Recognition) สำเร็จแล้ว!</span>
                  </span>
                  <button
                    onClick={() => {
                      audioSynth.playSfx('click');
                      setShowVictoryModal(false);
                      setLevel2LearningStep('exercise');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-purple-500/40 text-[11px] font-bold text-purple-300 cursor-pointer shrink-0"
                  >
                    ดูคำตอบ
                  </button>
                </div>
              )}

              {currentLevelId === 3 && level3ExerciseCompleted && (
                <div className="mb-4 p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/40 flex items-center justify-between gap-2 text-xs text-amber-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>ทำแบบฝึกหัดการคิดเชิงนามธรรม (Abstraction) สำเร็จแล้ว!</span>
                  </span>
                  <button
                    onClick={() => {
                      audioSynth.playSfx('click');
                      setShowVictoryModal(false);
                      setLevel3LearningStep('exercise');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-[11px] font-bold text-amber-300 cursor-pointer shrink-0"
                  >
                    ดูคำตอบ
                  </button>
                </div>
              )}

              {currentLevelId === 4 && level4ExerciseCompleted && (
                <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between gap-2 text-xs text-emerald-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>ทำแบบฝึกหัดการออกแบบอัลกอริทึม (Algorithm Design) สำเร็จแล้ว!</span>
                  </span>
                  <button
                    onClick={() => {
                      audioSynth.playSfx('click');
                      setShowVictoryModal(false);
                      setLevel4LearningStep('exercise');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 cursor-pointer shrink-0"
                  >
                    ดูคำตอบ
                  </button>
                </div>
              )}

              {currentLevelId === 5 && level5ExerciseCompleted && (
                <div className="mb-4 p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/40 flex items-center justify-between gap-2 text-xs text-rose-200">
                  <span className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>ทำภารกิจสรุปรวบยอด (Boss Challenge: บูรณาการ 4 ทักษะ) สำเร็จแล้ว!</span>
                  </span>
                  <button
                    onClick={() => {
                      audioSynth.playSfx('click');
                      setShowVictoryModal(false);
                      setLevel5LearningStep('exercise');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-rose-500/40 text-[11px] font-bold text-rose-300 cursor-pointer shrink-0"
                  >
                    ดูคำตอบ
                  </button>
                </div>
              )}

              {/* Stats Summary Box (5x5 Grid Mission + Post-Level Exercise Directly Linked to CT Skill Score) */}
              {(() => {
                const trueStats = calculateTrueSkillScore(
                  levelDiagnostics?.[currentLevelId],
                  currentLevelId,
                  { blocks: totalBlocksUsed, usedLoop: usedLoopInCommands },
                  levelDiagnostics?.[5],
                  levelGridBlocksUsed?.[5]
                );
                return (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6 space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="border-r border-slate-800">
                        <span className="text-[10px] text-slate-400 font-mono block">
                          ภารกิจตาราง 5x5
                        </span>
                        <span className="text-lg sm:text-xl font-black text-cyan-400 font-mono block mt-1">
                          {trueStats.gridScore}/50
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {totalBlocksUsed}/{currentConfig.targetBlocks3Star} บล็อก {usedLoopInCommands ? '· 🔄 ใช้ลูป' : ''}
                        </span>
                      </div>
                      <div className="border-r border-slate-800">
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {currentLevelId <= 4 ? 'แบบฝึกหัดท้ายด่าน' : 'ภารกิจบอส 4 ทักษะ'}
                        </span>
                        <span className="text-lg sm:text-xl font-black text-purple-400 font-mono block mt-1">
                          {trueStats.exerciseScore}/50
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ผิด {trueStats.exerciseMistakes} ครั้ง
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono block">คะแนนทักษะรวม</span>
                        <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono block leading-tight mt-0.5">
                          {trueStats.score}%
                        </span>
                        <div className="flex items-center justify-center gap-0.5">
                          {trueStats.stars >= 3 ? (
                            <span className="text-amber-400 text-xs">⭐⭐⭐</span>
                          ) : trueStats.stars === 2 ? (
                            <span className="text-amber-400 text-xs">⭐⭐</span>
                          ) : (
                            <span className="text-amber-400 text-xs">⭐</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-800/90 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-slate-300">
                      <span>
                        พลาดตาราง 5x5: <strong className="text-rose-400">{trueStats.gridMistakes} ครั้ง</strong>
                      </span>
                      <span>
                        {currentLevelId <= 4 ? 'ผิดแบบฝึกหัด:' : 'ผิดภารกิจบอส:'}{' '}
                        <strong className="text-rose-400">{trueStats.exerciseMistakes} ครั้ง</strong>
                      </span>
                      <span>
                        เริ่มใหม่รวม: <strong className="text-amber-300">{trueStats.retryCount} รอบ</strong>
                      </span>
                      <span className="text-cyan-300 font-sans font-bold">
                        {trueStats.shortTier}
                      </span>
                    </div>

                    {/* Algorithm Comparison Summary Banner inside Victory Modal */}
                    <div className="pt-2.5 border-t border-slate-800/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-left">
                      <div className="text-[11px] sm:text-xs font-mono text-slate-200">
                        <span className="text-amber-300 font-bold">⚡ เปรียบเทียบอัลกอริทึม: </span>
                        ชุดคำสั่งของนักเรียนใช้ <strong className="text-cyan-300">{totalBlocksUsed} บล็อก</strong> vs ชุดคำสั่งที่สั้นที่สุดใช้ <strong className="text-emerald-300">{optimalBlocksCount} บล็อก</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          audioSynth.playSfx('click');
                          setShowVictoryModal(false);
                          setShowAlgorithmComparisonModal(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 text-[11px] font-bold transition-all cursor-pointer shrink-0"
                        id="reopen-algorithm-comparison-btn"
                      >
                        🔍 ดูเปรียบเทียบชุดคำสั่ง
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Quick Level 1-4 Picker inside Victory Modal */}
              {currentLevelId <= 4 && (
                <div className="mb-4 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <span className="text-xs text-slate-400 block mb-2">
                    สามารถเลือกเล่นด่านที่ 1 – 4 ด่านไหนก่อนก็ได้:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((lvlNum) => {
                      const isDone = completedLevels.includes(lvlNum) || lvlNum === currentLevelId;
                      return (
                        <button
                          key={lvlNum}
                          type="button"
                          onClick={() => {
                            audioSynth.playSfx('click');
                            setShowVictoryModal(false);
                            onMissionSuccess(currentLevelId, currentLevelPoints, totalBlocksUsed, usedLoopInCommands, 'replay');
                            onLevelChange(lvlNum);
                          }}
                          className={`py-2 px-2 rounded-xl text-xs font-mono font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isDone
                              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/70'
                              : 'bg-slate-900 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60'
                          }`}
                        >
                          <span>ด่าน {lvlNum}</span>
                          {isDone && <Check size={12} className="text-emerald-400 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons: Next Level & Replay Current Level */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setShowVictoryModal(false);
                    onRecordRetry?.(currentLevelId);
                    resetCurrentLevelExerciseState();
                    onMissionSuccess(currentLevelId, currentLevelPoints, totalBlocksUsed, usedLoopInCommands, 'replay');
                    handleResetSimulation();
                    setCommands([]);
                  }}
                  className="flex-1 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-400/60 text-slate-100 font-bold text-sm sm:text-base tracking-wide rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  id="replay-level-btn"
                >
                  <RotateCcw size={18} className="text-cyan-400" />
                  <span>เล่นด่านนี้อีกครั้ง</span>
                </button>

                <button
                  onClick={() => {
                    audioSynth.playSfx('click');
                    setShowVictoryModal(false);
                    onMissionSuccess(currentLevelId, currentLevelPoints, totalBlocksUsed, usedLoopInCommands, 'next');
                  }}
                  className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base tracking-wide rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                  id="next-level-modal-btn"
                >
                  <span>{currentLevelId < 5 ? 'เล่นด่านถัดไป' : 'ดูสรุปผลการเรียนรู้ 🏆'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* GAME OVER MODAL: All 3 Hearts Depleted in Exercise */}
        {showGameOverModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              className="bg-slate-950 border-2 border-rose-500 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(244,63,94,0.4)] relative overflow-hidden"
              id="travel-gameover-modal"
            >
              <div className="w-16 h-16 bg-rose-950/60 border-2 border-rose-500 rounded-full flex items-center justify-center text-rose-400 mx-auto mb-4 animate-bounce">
                <RotateCcw size={32} />
              </div>

              <h3 className="text-2xl font-black text-rose-400 tracking-wider uppercase mb-1">
                หัวใจพลังชีวิตหมดเกลี้ยง! ❤️❌
              </h3>
              <p className="text-xs text-slate-400 font-mono mb-4 uppercase tracking-widest">
                &lt; LIFE CORES DEPLETED IN EXERCISE &gt;
              </p>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-6 font-sans">
                คุณตอบแบบฝึกหัดผิดพลาดจนสูญเสียหัวใจครบทั้ง 3 ดวงแล้ว!<br />
                ไม่เป็นไรนะ ลองทบทวนใบความรู้และคำแนะนำ แล้วเริ่มทำภารกิจใน <span className="text-amber-400 font-bold">ด่านที่ {currentLevelId} ใหม่อีกครั้ง</span> (หัวใจจะรีเซ็ตใหม่เพื่อให้เล่นต่อได้)
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    onRecordRetry?.(currentLevelId);
                    resetCurrentLevelExerciseState();
                    handleResetSimulation();
                    setCommands([]);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-slate-950 text-base font-extrabold tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                  id="restart-travel-level-btn"
                >
                  เริ่มด่านที่ {currentLevelId} ใหม่อีกครั้ง 🔄
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
