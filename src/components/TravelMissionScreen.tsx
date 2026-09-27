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

  // Victory modal after reaching targets & Game Over modal when hearts reach 0
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);

  // Level 1 Post-Mission Learning & Exercise Flow: 'knowledge' -> 'exercise' -> Victory Modal
  const [level1LearningStep, setLevel1LearningStep] = useState<'knowledge' | 'exercise' | null>(null);
  const [scienceProjectSteps, setScienceProjectSteps] = useState<string[]>(['', '', '', '']);
  const [tripPlanningSteps, setTripPlanningSteps] = useState<string[]>(['', '', '', '']);
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

  // Refs for tracking execution cancellation
  const isCancelledRef = useRef(false);

  // Load saved Decomposition, Pattern & Abstraction Exercise answers if available
  useEffect(() => {
    try {
      const savedEx = sessionStorage.getItem('ct_level1_decomposition_answers');
      if (savedEx) {
        const parsed = JSON.parse(savedEx);
        if (Array.isArray(parsed.scienceProjectSteps) && parsed.scienceProjectSteps.length >= 4) {
          setScienceProjectSteps(parsed.scienceProjectSteps);
        }
        if (Array.isArray(parsed.tripPlanningSteps) && parsed.tripPlanningSteps.length >= 4) {
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
    } catch (e) {}
  }, []);

  // Reset grid state whenever level changes
  useEffect(() => {
    setPlayerPos(currentConfig.startPos);
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
    setExerciseError(null);
    setLevel2ExerciseError(null);
    setLevel3ExerciseError(null);
    setLevel4ExerciseError(null);
    setIsLoopModeActive(false);
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

    const repeat = isLoopModeActive && action !== 'checkin' ? Math.max(2, Math.min(5, loopCount)) : 1;
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
    setCommands(prev => prev.filter(c => c.id !== id));
  };

  // Clear all commands without resetting player position
  const clearAllCommands = () => {
    if (isRunning) return;
    audioSynth.playSfx('click');
    setCommands([]);
    setStatusMessage(null);
  };

  // Reset simulation to start
  const handleResetSimulation = () => {
    audioSynth.playSfx('click');
    isCancelledRef.current = true;
    setIsRunning(false);
    setActiveExecutingCmdId(null);
    setPlayerPos(currentConfig.startPos);
    setCollidedObstaclePos(null);
    setCheckedInIds([]);
    setCurrentLevelPoints(0);
    onHeartsChange(3);
    setShowGameOverModal(false);
    setStatusMessage(null);
  };

  // Run execution
  const handleStartTravel = async () => {
    if (commands.length === 0) {
      audioSynth.playSfx('wrong');
      setStatusMessage({ text: 'ยังไม่ได้เพิ่มบล็อกคำสั่ง! กรุณาเพิ่มบล็อกคำสั่งก่อนกดเริ่มการเดินทาง', type: 'warning' });
      return;
    }

    // Start running from the player's current position on the grid
    isCancelledRef.current = false;
    setCollidedObstaclePos(null);
    setIsRunning(true);
    setStatusMessage(null);
    audioSynth.playSfx('click');

    let curX = playerPos.x;
    let curY = playerPos.y;
    let currentChecked: string[] = [...checkedInIds];
    let earnedPts = currentLevelPoints;
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
              setStatusMessage({ 
                text: `เช็คอินซ้ำ! "${landmark.name}" ได้รับการเช็คอินไปแล้ว`, 
                type: 'warning' 
              });
            }
          } else {
            audioSynth.playSfx('wrong');
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

    if (isAllChecked) {
      audioSynth.playSfx('unlock');
      setStatusMessage(null);
      onHeartsChange(3);
      if (currentLevelId === 1) {
        setLevel1LearningStep('knowledge');
      } else if (currentLevelId === 2) {
        setLevel2LearningStep('knowledge');
      } else if (currentLevelId === 3) {
        setLevel3LearningStep('knowledge');
      } else if (currentLevelId === 4) {
        setLevel4LearningStep('knowledge');
      } else {
        setShowVictoryModal(true);
      }
    } else {
      audioSynth.playSfx('wrong');
      setStatusMessage({ 
        text: `สิ้นสุดคำสั่งที่พิกัด (${curX},${curY}) แต่ยังเช็คอินหรือเก็บเพชรไม่ครบตามเป้าหมายของด่าน!`, 
        type: 'warning' 
      });
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

  // Real-time error/mistake evaluation (returns null unless the player makes a mistake)
  const computeRealtimeMistakeAlert = (): { title: string; text: string; type: 'warning' | 'error' } | null => {
    // 1. If an execution or action error/warning occurred, show it
    if (statusMessage && (statusMessage.type === 'error' || statusMessage.type === 'warning')) {
      return {
        title: statusMessage.type === 'error' ? '🚨 แจ้งเตือนข้อผิดพลาด!' : '⚠️ แจ้งเตือนคำสั่งไม่ถูกต้อง',
        text: statusMessage.text,
        type: statusMessage.type,
      };
    }

    // 2. While building blocks (not running), check if any block in the queue causes a mistake
    if (!isRunning && commands.length > 0) {
      let simX = playerPos.x;
      let simY = playerPos.y;
      const simChecked = new Set<string>(checkedInIds);

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
              return {
                title: `⚠️ แจ้งเตือนทำผิดพลาด (บล็อกที่ ${blockNo})`,
                text: `คำสั่งเช็คอินไม่ถูกต้อง เพราะที่พิกัด (${simX},${simY}) ไม่มีสถานที่ท่องเที่ยวให้เช็คอิน`,
                type: 'warning',
              };
            }
            if (simChecked.has(lm.id)) {
              return {
                title: `⚠️ แจ้งเตือนทำผิดพลาด (บล็อกที่ ${blockNo})`,
                text: `"${lm.name}" ที่พิกัด (${simX},${simY}) ได้รับการเช็คอินไปแล้ว ไม่ต้องเช็คอินซ้ำ`,
                type: 'warning',
              };
            }
            simChecked.add(lm.id);
            continue;
          }

          if (simX < 0 || simX > 4 || simY < 0 || simY > 4) {
            return {
              title: `🚨 แจ้งเตือนทำผิดพลาด (บล็อกที่ ${blockNo})`,
              text: `คำสั่งนี้จะทำให้เดินหลุดออกนอกขอบแผนที่ 5x5 จากพิกัด (${prevX},${prevY}) กรุณาลบหรือเปลี่ยนทิศทาง`,
              type: 'error',
            };
          }

          const obs = currentConfig.obstacles.find(o => o.x === simX && o.y === simY);
          if (obs) {
            const obsName = obs.type === 'rock' ? 'หิน 🪨' : obs.type === 'tree' ? 'ต้นไม้ 🌲' : 'บ่อน้ำ 💧';
            return {
              title: `🚨 แจ้งเตือนชนสิ่งกีดขวาง (บล็อกที่ ${blockNo})`,
              text: `คำสั่งนี้จะพาเดินไปชน ${obsName} ที่พิกัด (${simX},${simY}) กรุณาลบหรือเปลี่ยนทิศทางหลบหลีก`,
              type: 'error',
            };
          }
        }
      }
    }

    return null;
  };

  const realtimeAlert = computeRealtimeMistakeAlert();

  // Deduct 1 heart when making a mistake inside an exercise; trigger Game Over if hearts reach 0
  const deductExerciseHeart = (): number => {
    const nextHearts = Math.max(0, hearts - 1);
    onHeartsChange(nextHearts);
    if (nextHearts <= 0) {
      setTimeout(() => {
        setShowGameOverModal(true);
      }, 300);
    }
    return nextHearts;
  };

  // Reset exercise state for the current level (used when hearts reach 0 or replaying level)
  const resetCurrentLevelExerciseState = () => {
    if (currentLevelId === 1) {
      setScienceProjectSteps(['', '', '', '']);
      setTripPlanningSteps(['', '', '', '']);
      setExerciseCompleted(false);
      setExerciseError(null);
      setLevel1LearningStep(null);
      try {
        sessionStorage.removeItem('ct_level1_decomposition_answers');
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
      <main className="w-full max-w-7xl mx-auto flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch z-10">
        {/* LEFT COLUMN (~60% width): 5x5 MATRIX GRID & CONTROLS */}
        <div className="lg:col-span-7 flex flex-col items-center justify-between bg-slate-900/70 border border-slate-800/90 rounded-3xl p-3 sm:p-4 backdrop-blur-md shadow-2xl relative min-h-0 overflow-hidden">
          <div className="w-full flex items-center justify-between mb-1.5 text-xs text-slate-400 flex-wrap gap-2 shrink-0">
            <span className="font-mono text-cyan-400 flex items-center gap-1">
              <Compass size={14} /> แผนที่เมทริกซ์ 5x5 พิกัดเมืองดิจิทัล
            </span>
            <span className="font-mono text-slate-400">
              เป้าหมาย 3 ดาว: ≤ {currentConfig.targetBlocks3Star} บล็อก
            </span>
          </div>

          {/* 5x5 Matrix Grid */}
          <div className="relative p-2 sm:p-2.5 bg-slate-950 rounded-2xl border-2 border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.15)] w-full max-w-[min(420px,calc(100vh-250px))] aspect-square flex flex-col justify-between my-auto">
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
                      className={`relative rounded-xl flex items-center justify-center transition-all duration-200 border text-center ${
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
                      <span className="absolute top-1 left-1 text-[8px] sm:text-[9px] font-mono text-slate-600 pointer-events-none">
                        {colIdx},{rowIdx}
                      </span>

                      {/* Start flag */}
                      {isStartPos && !isPlayerHere && (
                        <span className="absolute bottom-1 right-1 text-[8px] font-mono text-cyan-400 bg-cyan-950/80 px-1 rounded">
                          START
                        </span>
                      )}

                      {/* Obstacle Icon */}
                      {obstacle && (
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-xl sm:text-2xl filter drop-shadow-md animate-pulse">
                            {obstacle.type === 'rock' ? '🪨' : obstacle.type === 'tree' ? '🌲' : '💧'}
                          </span>
                        </div>
                      )}

                      {/* Landmark Icon */}
                      {landmark && (
                        <div className="flex flex-col items-center justify-center relative">
                          <span className="text-xl sm:text-2xl filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                            {LANDMARK_INFO[landmark.type].icon}
                          </span>
                          {isCheckedIn && (
                            <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 rounded-full p-0.5 shadow-md">
                              <CheckCircle2 size={12} className="stroke-[3]" />
                            </div>
                          )}
                          <span className="text-[8px] font-mono text-amber-300 font-bold bg-slate-950/80 px-1 rounded mt-0.5 leading-none">
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
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-300 flex items-center justify-center text-lg sm:text-xl shadow-[0_0_15px_rgba(6,182,212,0.8)] border border-white">
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

          {/* REAL-TIME MISTAKE NOTIFICATION BOX (แสดงเฉพาะตอนที่ทำผิด) */}
          <AnimatePresence>
            {realtimeAlert && (
              <motion.div
                key={`${realtimeAlert.type}-${realtimeAlert.title}-${realtimeAlert.text}`}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                id="realtime-notification-box"
                className={`w-full max-w-[460px] mt-3.5 p-3.5 rounded-2xl border-2 shadow-lg flex items-start gap-3 transition-colors ${
                  realtimeAlert.type === 'error'
                    ? 'bg-rose-950/85 border-rose-500 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                    : 'bg-amber-950/85 border-amber-400 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                }`}
                role="alert"
                aria-live="assertive"
              >
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    realtimeAlert.type === 'error'
                      ? 'bg-rose-500 text-slate-950 animate-bounce'
                      : 'bg-amber-400 text-slate-950 animate-pulse'
                  }`}
                >
                  <AlertTriangle size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span
                      className={`text-xs sm:text-sm font-black tracking-wide ${
                        realtimeAlert.type === 'error' ? 'text-rose-300' : 'text-amber-300'
                      }`}
                    >
                      {realtimeAlert.title}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900/90 text-rose-300 border border-rose-500/40 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                      แจ้งเตือนข้อผิดพลาด
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed font-medium text-slate-100">
                    {realtimeAlert.text}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Execution Controls under Grid */}
          <div className="w-full max-w-[420px] flex gap-2.5 mt-2 shrink-0">
            <button
              onClick={handleStartTravel}
              disabled={isRunning}
              className={`flex-1 py-2.5 px-5 rounded-2xl font-extrabold text-sm sm:text-base tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
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
              onClick={handleResetSimulation}
              className="py-2.5 px-4 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-2xl text-slate-200 font-bold transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 hover:border-slate-500 shadow-md"
              id="reset-travel-btn"
              title="รีเซ็ตตำแหน่งตัวละครกลับจุดเริ่มต้น"
            >
              <RotateCcw size={16} />
              <span>เริ่มใหม่</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (~40% width): COMMAND CONSOLE & WORKSPACE QUEUE */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900/70 border border-slate-800/90 rounded-3xl p-3.5 sm:p-4 backdrop-blur-md shadow-2xl h-full min-h-0 overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5 shrink-0">
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

          {/* กล่องข้อความแจ้งเตือนเมื่อเปิดโหมดวนลูป */}
          <AnimatePresence>
            {isLoopModeActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-purple-950/90 via-purple-900/80 to-indigo-950/90 border-2 border-purple-400/90 shadow-[0_0_20px_rgba(168,85,247,0.45)] flex items-start justify-between gap-2.5 backdrop-blur-md"
                role="alert"
                id="loop-selection-alert-box"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-purple-500 text-white rounded-xl shadow-md shrink-0 animate-pulse">
                    <Repeat size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-purple-100 tracking-wide">
                        โหมดวนลูปทำงาน ({loopCount} รอบ)
                      </h4>
                      <span className="text-[10px] bg-purple-500/40 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/40 font-mono font-bold animate-pulse">
                        รอเลือกคำสั่ง
                      </span>
                    </div>
                    <p className="text-xs text-purple-200/95 mt-1 leading-relaxed font-medium">
                      👇 <strong>กรุณากดเลือกคำสั่งทิศทาง</strong> (ขึ้นบน, ลงล่าง, เลี้ยวซ้าย, เลี้ยวขวา) ด้านล่างนี้ ที่ต้องการให้ทำงานวนซ้ำ <span className="text-amber-300 font-extrabold">{loopCount} รอบ</span>
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
                  <X size={16} />
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

                  return (
                    <motion.div
                      key={cmd.id}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-all ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 border-white font-black shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-[1.02]'
                          : isLoop
                          ? 'bg-purple-950/50 border-purple-700 text-purple-200'
                          : 'bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
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
              className="bg-slate-900 border-2 border-cyan-400/70 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative my-auto max-h-[94vh] flex flex-col overflow-hidden"
              id="level1-knowledge-modal"
            >
              {/* Top Mission Accomplished Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold mb-4">
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span>ภารกิจการเดินทางด่านที่ 1 สำเร็จ! · ส่วนความรู้ก่อนทำแบบฝึกหัด</span>
              </div>

              {/* Knowledge Title */}
              <div className="flex items-center gap-3 mb-4">
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
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 mb-5 shadow-inner">
                <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium">
                  คือ <strong className="text-cyan-300">การแบ่งปัญหาหรืองานใหญ่ ๆ ออกเป็นส่วนย่อย ๆ ที่เล็กลง</strong> เพื่อให้เข้าใจง่าย จัดการได้สะดวก และแก้ไขได้อย่างมีประสิทธิภาพ
                </p>
              </div>

              {/* Example Section: จัดงานวันเกิด */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 border border-amber-500/40 mb-6">
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
                <div className="flex flex-col items-center mb-2">
                  <div className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-sm shadow-[0_0_15px_rgba(245,158,11,0.4)] mb-3">
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

              {/* Button to Enter Decomposition Exercise */}
              <button
                onClick={() => {
                  audioSynth.playSfx('click');
                  setExerciseError(null);
                  setLevel1LearningStep('exercise');
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-base sm:text-lg tracking-wide rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-95 shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                id="enter-decomposition-exercise-btn"
              >
                <span>เข้าสู่แบบฝึกหัด การย่อยปัญหา (Decomposition)</span>
                <ArrowRight size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}

        {level1LearningStep === 'exercise' && (() => {
          const SCIENCE_KEYWORDS = [
            'หัวข้อ', 'ปัญหา', 'เรื่อง', 'ชื่อ', 'ศึกษา', 'ค้นคว้า', 'ข้อมูล', 'สำรวจ', 'คำถาม', 'วัตถุประสงค์', 'จุดประสงค์', 'เป้าหมาย',
            'สมมติฐาน', 'วางแผน', 'ออกแบบ', 'กำหนด', 'เตรียม', 'จัดหา', 'ซื้อ', 'อุปกรณ์', 'วัสดุ', 'เครื่องมือ', 'ตัวแปร', 'แบ่งหน้าที่', 'แบ่งงาน', 'กลุ่ม', 'ปรึกษา', 'ครู',
            'ทดลอง', 'ปฏิบัติ', 'ลงมือ', 'โครงงาน', 'สร้าง', 'ประดิษฐ์', 'ทำ', 'ทดสอบ', 'บันทึก', 'เก็บผล', 'สังเกต', 'รวบรวม', 'วัดผล',
            'สรุป', 'วิเคราะห์', 'อภิปราย', 'ตรวจสอบ', 'แก้ไข', 'รายงาน', 'เล่ม', 'นำเสนอ', 'พรีเซนต์', 'เผยแพร่', 'ประเมิน', 'ผล', 'จัดบอร์ด'
          ];

          const TRIP_KEYWORDS = [
            'สถานที่', 'ที่เที่ยว', 'จังหวัด', 'ทะเล', 'ภูเขา', 'น้ำตก', 'ค่าย', 'วัน', 'เวลา', 'กำหนดการ', 'ตาราง', 'ตกลง', 'คุย', 'ปรึกษา', 'เลือก', 'วางแผน', 'กำหนด', 'หาข้อมูล',
            'เพื่อน', 'สมาชิก', 'รายชื่อ', 'คน', 'ชวน', 'งบ', 'เงิน', 'ค่าใช้จ่าย', 'หาร', 'สำรวจ', 'รวบรวม',
            'จอง', 'ที่พัก', 'โรงแรม', 'รีสอร์ท', 'เต็นท์', 'บ้านพัก', 'เดินทาง', 'รถ', 'ตั๋ว', 'เครื่องบิน', 'รถไฟ', 'เส้นทาง', 'แผนที่', 'อาหาร', 'กิน', 'ร้าน', 'กิจกรรม', 'เที่ยว',
            'สัมภาระ', 'กระเป๋า', 'เสื้อผ้า', 'ของใช้', 'ยา', 'เตรียม', 'จัดของ', 'ตรวจสอบ', 'เช็ค', 'ความพร้อม', 'นัดหมาย', 'นัด', 'ออกเดินทาง'
          ];

          const evaluateStep = (text: string, allSteps: string[], idx: number, keywords: string[], topicType: 'science' | 'trip') => {
            const cleaned = text.replace(/[\.\s\-_0-9]/g, '').trim();
            if (!text.trim()) {
              return { valid: false, status: 'empty' as const, reason: 'ยังไม่ได้กรอกข้อมูล' };
            }
            if (cleaned.length < 4 || /(.)\1{3,}/.test(cleaned)) {
              return {
                valid: false,
                status: 'invalid' as const,
                reason: 'ข้อความสั้นเกินไป แนะนำให้เขียนอธิบายเป็นขั้นตอนการทำงานที่ชัดเจน (เช่น กริยา + สิ่งที่ทำ)',
              };
            }
            const isDuplicate = allSteps.some(
              (other, otherIdx) => otherIdx !== idx && other.trim() === text.trim()
            );
            if (isDuplicate) {
              return {
                valid: false,
                status: 'invalid' as const,
                reason: 'ขั้นตอนนี้ซ้ำกับข้ออื่น แนะนำให้แยกเป็นขั้นตอนย่อยอื่นที่แตกต่างกันในงานนี้',
              };
            }
            const hasKeyword = keywords.some(kw => text.includes(kw));
            if (!hasKeyword) {
              return {
                valid: false,
                status: 'invalid' as const,
                reason:
                  topicType === 'science'
                    ? 'คำตอบยังไม่สอดคล้อง — แนะนำให้ลองนึกถึงลำดับตั้งแต่การคิดหัวข้อ การเตรียมการ การลงมือปฏิบัติ ไปจนถึงการสรุปผล'
                    : 'คำตอบยังไม่สอดคล้อง — แนะนำให้ลองนึกถึงสิ่งที่ต้องตกลงกับเพื่อน การเตรียมการเรื่องค่าใช้จ่าย การเดินทาง หรือการจัดของ',
              };
            }
            return { valid: true, status: 'valid' as const, reason: 'ถูกต้องตามหลักการย่อยปัญหา' };
          };

          const scienceResults = scienceProjectSteps.map((s, idx) =>
            evaluateStep(s, scienceProjectSteps, idx, SCIENCE_KEYWORDS, 'science')
          );
          const tripResults = tripPlanningSteps.map((s, idx) =>
            evaluateStep(s, tripPlanningSteps, idx, TRIP_KEYWORDS, 'trip')
          );

          const validScienceCount = scienceResults.filter(r => r.valid).length;
          const validTripCount = tripResults.filter(r => r.valid).length;

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
                className="bg-slate-900 border-2 border-amber-400/70 rounded-3xl max-w-5xl w-full p-4 sm:p-5 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative my-auto max-h-[94vh] flex flex-col overflow-hidden"
                id="level1-exercise-modal"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-800 shrink-0 flex-wrap">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2.5 py-0.5 rounded-md mb-1.5">
                      <Layers size={13} />
                      <span>แบบฝึกหัดท้ายด่านที่ 1 : การย่อยปัญหา (Decomposition)</span>
                    </div>
                    <h3 className="text-base sm:text-xl font-black text-white leading-snug">
                      1. ให้นักเรียนย่อยปัญหาต่อไปนี้ออกเป็นส่วนย่อย ๆ (อย่างน้อย 4 ขั้นตอน)
                    </h3>
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
                <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Problem 1: การทำโครงงานวิทยาศาสตร์ */}
                    <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/40 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🔬</span>
                            <h4 className="text-sm sm:text-base font-extrabold text-cyan-300">
                              ปัญหา : การทำโครงงานวิทยาศาสตร์
                            </h4>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 shrink-0">
                            ผ่านเกณฑ์: <strong className={validScienceCount >= 4 ? 'text-emerald-400' : 'text-amber-300'}>{validScienceCount}/4</strong>
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {scienceProjectSteps.map((stepVal, idx) => {
                            const res = scienceResults[idx];
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs sm:text-sm text-cyan-400 w-7 shrink-0">
                                    {idx + 1} :
                                  </span>
                                  <input
                                    type="text"
                                    value={stepVal}
                                    onChange={(e) => {
                                      const updated = [...scienceProjectSteps];
                                      updated[idx] = e.target.value;
                                      setScienceProjectSteps(updated);
                                      if (exerciseError) setExerciseError(null);
                                    }}
                                    placeholder="............................................................"
                                    className={`flex-1 bg-slate-900 border rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-600 outline-none transition-colors ${
                                      res.status === 'valid'
                                        ? 'border-emerald-500/70 focus:border-emerald-400'
                                        : res.status === 'invalid'
                                        ? 'border-rose-500/70 focus:border-rose-400'
                                        : 'border-slate-700 focus:border-cyan-400'
                                    }`}
                                  />
                                  {res.status === 'valid' && (
                                    <span className="text-emerald-400 shrink-0" title={res.reason}>
                                      <CheckCircle2 size={16} />
                                    </span>
                                  )}
                                  {res.status === 'invalid' && (
                                    <span className="text-rose-400 shrink-0" title={res.reason}>
                                      <AlertTriangle size={16} />
                                    </span>
                                  )}
                                  {scienceProjectSteps.length > 4 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setScienceProjectSteps(prev => prev.filter((_, i) => i !== idx));
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                                      title="ลบขั้นตอนนี้"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                                {res.status === 'invalid' && (
                                  <p className="text-[11px] text-rose-300 pl-9">
                                    ⚠️ {res.reason}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          audioSynth.playSfx('click');
                          setScienceProjectSteps(prev => [...prev, '']);
                        }}
                        className="mt-3 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 text-xs font-bold text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                      >
                        + เพิ่มขั้นตอนย่อย (ขั้นตอนที่ {scienceProjectSteps.length + 1})
                      </button>
                    </div>

                    {/* Problem 2: การวางแผนท่องเที่ยวกับเพื่อน */}
                    <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🗺️</span>
                            <h4 className="text-sm sm:text-base font-extrabold text-amber-300">
                              ปัญหา : การวางแผนท่องเที่ยวกับเพื่อน
                            </h4>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 shrink-0">
                            ผ่านเกณฑ์: <strong className={validTripCount >= 4 ? 'text-emerald-400' : 'text-amber-300'}>{validTripCount}/4</strong>
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {tripPlanningSteps.map((stepVal, idx) => {
                            const res = tripResults[idx];
                            return (
                              <div key={idx} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs sm:text-sm text-amber-400 w-7 shrink-0">
                                    {idx + 1} :
                                  </span>
                                  <input
                                    type="text"
                                    value={stepVal}
                                    onChange={(e) => {
                                      const updated = [...tripPlanningSteps];
                                      updated[idx] = e.target.value;
                                      setTripPlanningSteps(updated);
                                      if (exerciseError) setExerciseError(null);
                                    }}
                                    placeholder="............................................................"
                                    className={`flex-1 bg-slate-900 border rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-600 outline-none transition-colors ${
                                      res.status === 'valid'
                                        ? 'border-emerald-500/70 focus:border-emerald-400'
                                        : res.status === 'invalid'
                                        ? 'border-rose-500/70 focus:border-rose-400'
                                        : 'border-slate-700 focus:border-amber-400'
                                    }`}
                                  />
                                  {res.status === 'valid' && (
                                    <span className="text-emerald-400 shrink-0" title={res.reason}>
                                      <CheckCircle2 size={16} />
                                    </span>
                                  )}
                                  {res.status === 'invalid' && (
                                    <span className="text-rose-400 shrink-0" title={res.reason}>
                                      <AlertTriangle size={16} />
                                    </span>
                                  )}
                                  {tripPlanningSteps.length > 4 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTripPlanningSteps(prev => prev.filter((_, i) => i !== idx));
                                      }}
                                      className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                                      title="ลบขั้นตอนนี้"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                                {res.status === 'invalid' && (
                                  <p className="text-[11px] text-rose-300 pl-9">
                                    ⚠️ {res.reason}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          audioSynth.playSfx('click');
                          setTripPlanningSteps(prev => [...prev, '']);
                        }}
                        className="mt-3 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 text-xs font-bold text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        + เพิ่มขั้นตอนย่อย (ขั้นตอนที่ {tripPlanningSteps.length + 1})
                      </button>
                    </div>
                  </div>

                  {exerciseError && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs sm:text-sm text-rose-200 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                      <span>{exerciseError}</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      audioSynth.playSfx('click');
                      setLevel1LearningStep('knowledge');
                    }}
                    className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ChevronLeft size={16} />
                    <span>ย้อนกลับไปหน้าต่างความรู้</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (validScienceCount < 4 || validTripCount < 4) {
                        audioSynth.playSfx('wrong');
                        const remaining = deductExerciseHeart();
                        setExerciseError(
                          `คำตอบยังไม่ผ่านเกณฑ์! สูญเสียหัวใจพลังชีวิต 1 ดวง (เหลือ ❤️ ${remaining}/3) — 💡 คำแนะนำ: โครงงานวิทยาศาสตร์ผ่าน ${validScienceCount}/4 และวางแผนท่องเที่ยวผ่าน ${validTripCount}/4 กรุณาปรับแก้ขั้นตอนให้มีความหมายสอดคล้องและไม่ซ้ำกัน`
                        );
                        return;
                      }

                      audioSynth.playSfx('unlock');
                      setExerciseCompleted(true);
                      setExerciseError(null);
                      try {
                        sessionStorage.setItem(
                          'ct_level1_decomposition_answers',
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
                    className="w-full sm:flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-sm sm:text-base rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                    id="submit-decomposition-exercise-btn"
                  >
                    <CheckCircle2 size={18} />
                    <span>ตรวจคำตอบและผ่านด่านที่ 1 ({validScienceCount + validTripCount}/8 ขั้นตอนผ่านเกณฑ์)</span>
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
              className="bg-slate-900 border-2 border-purple-400/70 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(168,85,247,0.3)] relative my-auto max-h-[94vh] flex flex-col overflow-hidden"
              id="level2-knowledge-modal"
            >
              {/* Top Mission Accomplished Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold mb-4">
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span>ภารกิจการเดินทางด่านที่ 2 สำเร็จ! · ส่วนความรู้ก่อนทำแบบฝึกหัด</span>
              </div>

              {/* Knowledge Title */}
              <div className="flex items-center gap-3 mb-4">
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
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-purple-500/40 mb-5 shadow-inner">
                <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium">
                  <strong className="text-purple-300">การหารูปแบบ</strong> คือ{' '}
                  <strong className="text-cyan-300">
                    การสังเกตหาความเหมือน ความสัมพันธ์ หรือแนวโน้มของข้อมูลหรือปัญหา เพื่อนำไปสู่การคาดการณ์หรือหาคำตอบในอนาคต
                  </strong>
                </p>
              </div>

              {/* Visual Example Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-950 to-slate-900 border border-purple-500/40 mb-6">
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

              {/* Button to Enter Pattern Recognition Exercise */}
              <button
                onClick={() => {
                  audioSynth.playSfx('click');
                  setLevel2ExerciseError(null);
                  setLevel2LearningStep('exercise');
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 hover:from-purple-400 hover:to-cyan-300 text-slate-950 font-black text-base sm:text-lg tracking-wide rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-95 shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                id="enter-pattern-exercise-btn"
              >
                <span>เข้าสู่แบบฝึกหัด การหารูปแบบ (Pattern Recognition)</span>
                <ArrowRight size={20} />
              </button>
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
                <div className="flex-1 overflow-y-auto mt-3 pr-1">
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

                  {level2ExerciseError && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs sm:text-sm text-rose-200 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                      <span>{level2ExerciseError}</span>
                    </div>
                  )}
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
              className="bg-slate-900 border-2 border-amber-400/70 rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)] relative my-auto max-h-[94vh] flex flex-col overflow-hidden"
              id="level3-knowledge-modal"
            >
              {/* Top Mission Accomplished Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold mb-4">
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span>ภารกิจการเดินทางด่านที่ 3 สำเร็จ! · ส่วนความรู้ก่อนทำแบบฝึกหัด</span>
              </div>

              {/* Knowledge Title */}
              <div className="flex items-center gap-3 mb-4">
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
              <div className="space-y-3 mb-5">
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-inner">
                  <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-medium">
                    <strong className="text-amber-300">การคิดเชิงนามธรรม</strong> คือ{' '}
                    <strong className="text-cyan-300">
                      การมองหาสิ่งที่สำคัญจริง ๆ และตัดรายละเอียดที่ไม่จำเป็นออก เหลือเฉพาะสาระสำคัญ เพื่อให้เข้าใจและแก้ปัญหาได้ง่ายขึ้น
                    </strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/40">
                  <span className="text-xs sm:text-sm font-extrabold text-cyan-300 block mb-1">
                    🎯 เป้าหมายของการคิดเชิงนามธรรม
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    เพื่อโฟกัสข้อมูลที่สำคัญ ลดความซับซ้อน ทำให้เข้าใจง่าย และนำไปใช้แก้ปัญหาได้อย่างมีประสิทธิภาพ
                  </p>
                </div>
              </div>

              {/* Example Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-950 to-slate-900 border border-amber-500/40 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <span className="text-xs sm:text-sm font-extrabold text-amber-300 flex items-center gap-1.5">
                    <Sparkles size={16} className="text-amber-400" />
                    ตัวอย่างการคัดเลือกข้อมูลสำคัญ
                  </span>
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-950/70 px-3 py-1 rounded-lg border border-emerald-500/40">
                    🎒 สิ่งของที่จำเป็นสำหรับไปโรงเรียน
                  </span>
                </div>

                <div className="space-y-3">
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

              {/* Button to Enter Abstraction Exercise */}
              <button
                onClick={() => {
                  audioSynth.playSfx('click');
                  setLevel3ExerciseError(null);
                  setLevel3LearningStep('exercise');
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base sm:text-lg tracking-wide rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-95 shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                id="enter-abstraction-exercise-btn"
              >
                <span>เข้าสู่แบบฝึกหัด การคิดเชิงนามธรรม (Abstraction)</span>
                <ArrowRight size={20} />
              </button>
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
                <div className="flex-1 overflow-y-auto mt-3 pr-1">
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

                  {level3ExerciseError && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs sm:text-sm text-rose-200 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                      <span>{level3ExerciseError}</span>
                    </div>
                  )}
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
              className="bg-slate-900 border-2 border-emerald-400/70 rounded-3xl max-w-4xl w-full p-4 sm:p-5 shadow-[0_0_50px_rgba(16,185,129,0.3)] relative my-auto max-h-[95vh] flex flex-col overflow-hidden"
              id="level4-knowledge-modal"
            >
              <div className="flex-1 overflow-y-auto pr-1">
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

              {/* Button to Enter Algorithm Design Exercise */}
              <button
                onClick={() => {
                  audioSynth.playSfx('click');
                  setLevel4ExerciseError(null);
                  setLevel4LearningStep('exercise');
                }}
                className="mt-1.5 w-full py-3 px-6 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-sm sm:text-base tracking-wide rounded-2xl transition-all duration-300 transform hover:scale-[1.01] active:scale-95 shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer shrink-0"
                id="enter-algorithm-exercise-btn"
              >
                <span>เข้าสู่แบบฝึกหัด การออกแบบอัลกอริทึม (Algorithm Design)</span>
                <ArrowRight size={20} />
              </button>
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
              shapeLabel: 'ฝั่งซ้าย ขั้นที่ 1 (Process)',
              expectedText: 'นั่งรถเมล์',
              guidanceHint:
                'เส้นทางฝั่งซ้ายมี 2 ขั้นตอนต่อเนื่องกัน (โดยสารรถประจำทางก่อน แล้วจึงเดินต่อเข้าซอย) แนะนำให้เลือกการโดยสารรถประจำทางในช่องแรกของฝั่งซ้าย',
            },
            {
              slotIdx: 4,
              shapeType: 'process',
              shapeLabel: 'ฝั่งซ้าย ขั้นที่ 2 (Process)',
              expectedText: 'เดินเข้าซอย',
              guidanceHint:
                'หลังจากลงรถประจำทางในฝั่งซ้ายแล้ว ต้องทำขั้นตอนใดต่อเพื่อเข้าไปยังโรงเรียนที่อยู่ในซอย',
            },
            {
              slotIdx: 5,
              shapeType: 'process',
              shapeLabel: 'ฝั่งขวา (Process)',
              expectedText: 'นั่งรถมอเตอร์ไซค์',
              guidanceHint:
                'เส้นทางฝั่งขวาเป็นทางเลือกที่มีเพียงขั้นตอนเดียวซึ่งพาไปส่งถึงที่ได้โดยตรง แนะนำให้เลือกพาหนะที่ใช้ในฝั่งขวา',
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
                <div className="flex-1 overflow-y-auto mt-3.5 pr-1">
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

                      {level4ExerciseError && (
                        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs sm:text-sm text-rose-200 flex items-center gap-2">
                          <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                          <span>{level4ExerciseError}</span>
                        </div>
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

                      {/* Left & Right Branching */}
                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 mt-1">
                        {/* Left Branch: นั่งรถเมล์ -> เดินเข้าซอย */}
                        <div className="flex flex-col items-center p-2 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                          <div className="text-[11px] font-mono font-bold text-amber-300 mb-1">
                            ← ฝั่งซ้าย
                          </div>
                          {renderFlowchartSlotNode(3)}
                          <div className="text-cyan-400 font-bold text-xs leading-none my-0.5">↓</div>
                          {renderFlowchartSlotNode(4)}
                          <div className="text-cyan-400 font-bold text-xs mt-0.5">↘</div>
                        </div>

                        {/* Right Branch: นั่งรถมอเตอร์ไซค์ */}
                        <div className="flex flex-col items-center justify-between p-2 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                          <div className="text-[11px] font-mono font-bold text-emerald-300 mb-1">
                            → ฝั่งขวา
                          </div>
                          <div className="my-auto flex flex-col items-center">
                            {renderFlowchartSlotNode(5)}
                          </div>
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

              {/* Stats Summary Box */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6 grid grid-cols-3 gap-2 text-center">
                <div className="border-r border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">พลังชีวิตคงเหลือ</span>
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    {[1, 2, 3].map((idx) => (
                      <Heart
                        key={idx}
                        size={16}
                        className={
                          idx <= hearts
                            ? 'text-rose-500 fill-rose-500'
                            : 'text-slate-700 fill-slate-900'
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="border-r border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block">คะแนนแบบฝึกหัด</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                    {hearts >= 3 ? 100 : hearts === 2 ? 80 : 60}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">ระดับดาว</span>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {hearts >= 3 ? (
                      <span className="text-amber-400 text-base">⭐⭐⭐</span>
                    ) : hearts === 2 ? (
                      <span className="text-amber-400 text-base">⭐⭐</span>
                    ) : (
                      <span className="text-amber-400 text-base">⭐</span>
                    )}
                  </div>
                </div>
              </div>

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
                ไม่เป็นไรนะ ลองทบทวนใบความรู้และคำแนะนำ แล้วเริ่มทำภารกิจใน <span className="text-amber-400 font-bold">ด่านที่ {currentLevelId} ใหม่อีกครั้ง</span>
              </p>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
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
