import React, { useEffect, useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Lock, LockOpen, Star, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { audioSynth } from '../utils/audio';
import { questionsData } from '../data/questions';
import FeedbackOverlay from './FeedbackOverlay';

interface LevelSelectionScreenProps {
  unlockedLevels: number[];
  completedLevels: number[];
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  justUnlockedLevelId: number | null;
  onClearJustUnlocked: () => void;
  onResetProgress: () => void;
  studentName?: string;
  studentClass?: string;
  studentNumber?: string;
  onEditProfile?: () => void;
}

export default function LevelSelectionScreen({
  unlockedLevels,
  completedLevels,
  onSelectLevel,
  onBack,
  soundEnabled,
  onToggleSound,
  justUnlockedLevelId,
  onClearJustUnlocked,
  onResetProgress,
  studentName,
  studentClass,
  studentNumber,
  onEditProfile
}: LevelSelectionScreenProps) {
  const [animatingUnlockId, setAnimatingUnlockId] = useState<number | null>(null);
  const [showFinalReport, setShowFinalReport] = useState(false);

  useEffect(() => {
    // If we have a level that was just unlocked, trigger the animation & sound
    if (justUnlockedLevelId !== null) {
      setAnimatingUnlockId(justUnlockedLevelId);
      audioSynth.playSfx('unlock');
      
      const timer = setTimeout(() => {
        setAnimatingUnlockId(null);
        onClearJustUnlocked();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [justUnlockedLevelId]);

  const handleSelect = (levelId: number) => {
    if (!unlockedLevels.includes(levelId)) {
      audioSynth.playSfx('wrong');
      return;
    }
    audioSynth.playSfx('click');
    onSelectLevel(levelId);
  };

  const handleBack = () => {
    audioSynth.playSfx('click');
    onBack();
  };

  const handleToggleAudio = () => {
    onToggleSound();
    audioSynth.playSfx('click');
  };

  const handleReset = () => {
    audioSynth.playSfx('unlock');
    onResetProgress();
  };

  // Coordinates for nodes to draw SVG connections between them (Path-based map)
  // Designed to fit nicely on responsive screens
  const nodesConfig = [
    { id: 1, cx: "20%", cy: "75%", label: "ด่านที่ 1" },
    { id: 2, cx: "45%", cy: "60%", label: "ด่านที่ 2" },
    { id: 3, cx: "30%", cy: "35%", label: "ด่านที่ 3" },
    { id: 4, cx: "65%", cy: "30%", label: "ด่านที่ 4" },
    { id: 5, cx: "80%", cy: "65%", label: "ด่านประยุกต์" }
  ];

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0B0F19] text-white overflow-hidden font-sans select-none pb-8">
      {/* Grid Pattern and Stars Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* Ambient background particles */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-cyan-400 rounded-full blur-[1px] animate-pulse" />
      <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-purple-500 rounded-full blur-[2px] animate-pulse duration-300" />
      <div className="absolute bottom-20 left-1/3 w-1.5 h-1.5 bg-pink-500 rounded-full blur-[1px] animate-pulse duration-1000" />

      {/* Top Bar */}
      <header className="w-full bg-slate-950/80 border-b border-slate-900/60 backdrop-blur-md p-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 text-cyan-400 font-medium rounded-xl transition-all duration-200 cursor-pointer"
            id="map-back-btn"
          >
            <ArrowLeft size={18} />
            กลับหน้าหลัก
          </button>

          {studentName && (
            <button
              onClick={() => {
                audioSynth.playSfx('click');
                if (onEditProfile) onEditProfile();
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 text-xs text-slate-300 rounded-xl transition-all duration-200 cursor-pointer shadow-md"
              title="คลิกเพื่อแก้ไขข้อมูลผู้เรียน"
              id="edit-profile-btn"
            >
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px] font-mono">
                {studentNumber}
              </div>
              <span className="font-semibold max-w-[120px] truncate">{studentName}</span>
              <span className="text-[10px] text-slate-500 font-mono hidden xs:inline-block">ชั้น {studentClass}</span>
            </button>
          )}

          <div className="flex items-center gap-4">
            <span className="hidden lg:inline-block text-xs font-mono bg-cyan-950/40 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-cyan-400">
              พิกัดแผนที่ : ดินแดนแนวคิดเชิงคำนวณ ม.2
            </span>
            <button
              onClick={handleToggleAudio}
              className="p-2.5 bg-slate-900/40 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/80 rounded-xl transition-all duration-200 text-cyan-400 cursor-pointer"
              id="map-audio-toggle-btn"
            >
              {soundEnabled ? <Volume2 size={20} className="animate-pulse" /> : <VolumeX size={20} />}
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 bg-slate-900/40 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 rounded-xl transition-all duration-200 text-slate-400 hover:text-rose-400 cursor-pointer"
              title="รีเซ็ตเริ่มด่าน 1 ใหม่ทั้งหมด"
              id="reset-progress-btn"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Galaxy Map Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col justify-between relative z-10">
        <div className="text-center my-4">
          <h2 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent font-mono uppercase">
            Computational Land (CT-World)
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            แผนที่มิติอวกาศพิชิตแนวคิดเชิงคำนวณ - เลือกสถานีที่ปลดล็อกเพื่อเข้าตะลุยภารกิจฝึกทักษะแสนสนุก!
          </p>
        </div>

        {/* Pulsating golden banner when they complete level 5 */}
        {completedLevels.includes(5) && (
          <motion.button
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => {
              audioSynth.playSfx('click');
              setShowFinalReport(true);
            }}
            className="w-full mt-1 mb-3 p-4 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-600/20 border border-amber-500/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left cursor-pointer hover:bg-amber-950/20 transition-all shadow-[0_0_20px_rgba(245,158,11,0.15)]"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl">
                <Star size={24} className="fill-current animate-pulse text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-300">🎉 ยินดีด้วย คุณพิชิตทุกฐานการเรียนรู้สำเร็จแล้ว!</h4>
                <p className="text-xs text-slate-300">คลิกที่นี่เพื่อแสดงสรุปใบประกาศผลคะแนนรายบุคคล & ล้างข้อมูลเพื่อความปลอดภัย</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-1.5 rounded-xl uppercase tracking-wider font-mono shadow-sm shrink-0">
              เปิดสรุปใบรายงานผล 📋
            </span>
          </motion.button>
        )}

        {/* Path-based Interactive Map Stage */}
        <div className="relative w-full aspect-[4/3] md:aspect-[16/9] min-h-[360px] max-h-[500px] bg-slate-950/40 border border-slate-900 rounded-3xl overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] mt-4">
          {/* Constellation Star lines Backdrop */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Background connecting lines (gray dashed line) */}
            <line x1="20%" y1="75%" x2="45%" y2="60%" stroke="#1e293b" strokeWidth="4" strokeDasharray="8 6" />
            <line x1="45%" y1="60%" x2="30%" y2="35%" stroke="#1e293b" strokeWidth="4" strokeDasharray="8 6" />
            <line x1="30%" y1="35%" x2="65%" y2="30%" stroke="#1e293b" strokeWidth="4" strokeDasharray="8 6" />
            <line x1="65%" y1="30%" x2="80%" y2="65%" stroke="#1e293b" strokeWidth="4" strokeDasharray="8 6" />

            {/* Glowing active path from Level 1 to Level 2 (unlocked if level 2 is unlocked) */}
            <line
              x1="20%"
              y1="75%"
              x2="45%"
              y2="60%"
              stroke={unlockedLevels.includes(2) ? "#06b6d4" : "#1e293b"}
              strokeWidth={unlockedLevels.includes(2) ? "3" : "1"}
              strokeDasharray={unlockedLevels.includes(2) ? "6 12" : "none"}
              className={unlockedLevels.includes(2) ? "animate-dash" : ""}
              style={{ filter: unlockedLevels.includes(2) ? 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))' : 'none' }}
            />

            {/* Glowing active path from Level 2 to Level 3 */}
            <line
              x1="45%"
              y1="60%"
              x2="30%"
              y2="35%"
              stroke={unlockedLevels.includes(3) ? "#a855f7" : "#1e293b"}
              strokeWidth={unlockedLevels.includes(3) ? "3" : "1"}
              strokeDasharray={unlockedLevels.includes(3) ? "6 12" : "none"}
              className={unlockedLevels.includes(3) ? "animate-dash" : ""}
              style={{ filter: unlockedLevels.includes(3) ? 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.6))' : 'none' }}
            />

            {/* Glowing active path from Level 3 to Level 4 */}
            <line
              x1="30%"
              y1="35%"
              x2="65%"
              y2="30%"
              stroke={unlockedLevels.includes(4) ? "#f59e0b" : "#1e293b"}
              strokeWidth={unlockedLevels.includes(4) ? "3" : "1"}
              strokeDasharray={unlockedLevels.includes(4) ? "6 12" : "none"}
              className={unlockedLevels.includes(4) ? "animate-dash" : ""}
              style={{ filter: unlockedLevels.includes(4) ? 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))' : 'none' }}
            />

            {/* Glowing active path from Level 4 to Level 5 */}
            <line
              x1="65%"
              y1="30%"
              x2="80%"
              y2="65%"
              stroke={unlockedLevels.includes(5) ? "#f43f5e" : "#1e293b"}
              strokeWidth={unlockedLevels.includes(5) ? "3" : "1"}
              strokeDasharray={unlockedLevels.includes(5) ? "6 12" : "none"}
              className={unlockedLevels.includes(5) ? "animate-dash" : ""}
              style={{ filter: unlockedLevels.includes(5) ? 'drop-shadow(0 0 4px rgba(244, 63, 94, 0.6))' : 'none' }}
            />
          </svg>

          {/* Interactive Stations (Nodes) */}
          {questionsData.map((level) => {
            const isUnlocked = unlockedLevels.includes(level.id);
            const isCompleted = completedLevels.includes(level.id);
            const isBoss = level.id === 5;
            const node = nodesConfig.find((n) => n.id === level.id);
            const isAnimatingUnlock = animatingUnlockId === level.id;

            if (!node) return null;

            return (
              <div
                key={level.id}
                style={{ left: node.cx, top: node.cy }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
              >
                {/* Station Container */}
                <div className="relative group">
                  {/* Energy Barrier / Shield for Locked Levels */}
                  <AnimatePresence>
                    {!isUnlocked && !isAnimatingUnlock && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0.7 }}
                        animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.6, 0.9, 0.6] }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 2.5 }}
                        className="absolute -inset-4 border border-rose-500/40 rounded-full bg-rose-950/20 pointer-events-none flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                        title="ด่านนี้ถูกล็อกชั่วคราว"
                      />
                    )}
                  </AnimatePresence>

                  {/* Unlock Shatter Effect Animation */}
                  {isAnimatingUnlock && (
                    <motion.div
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 1.2 }}
                      className="absolute -inset-6 border-4 border-cyan-400 rounded-full bg-cyan-400/30 pointer-events-none z-20 shadow-[0_0_40px_rgba(34,211,238,0.8)]"
                    />
                  )}

                  {/* Glowing core shadow under active/completed stations */}
                  {isUnlocked && (
                    <div
                      className={`absolute -inset-3 rounded-full blur-md opacity-40 group-hover:opacity-75 transition-opacity duration-300 ${
                        isCompleted
                          ? "bg-emerald-500"
                          : isBoss
                          ? "bg-rose-500 animate-pulse"
                          : level.id === 1
                          ? "bg-cyan-500"
                          : level.id === 2
                          ? "bg-purple-500"
                          : level.id === 3
                          ? "bg-pink-500"
                          : "bg-amber-500"
                      }`}
                    />
                  )}

                  {/* Main Station Circle */}
                  <button
                    onClick={() => handleSelect(level.id)}
                    className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 cursor-pointer shadow-lg ${
                      isUnlocked
                        ? isCompleted
                          ? "bg-emerald-950/90 border-emerald-400 text-emerald-400 hover:scale-110 shadow-emerald-500/20"
                          : isBoss
                          ? "bg-rose-950/90 border-rose-400 text-rose-400 hover:scale-115 shadow-rose-500/30 animate-pulse"
                          : level.id === 1
                          ? "bg-cyan-950/90 border-cyan-400 text-cyan-400 hover:scale-110 shadow-cyan-500/20"
                          : level.id === 2
                          ? "bg-purple-950/90 border-purple-400 text-purple-400 hover:scale-110 shadow-purple-500/20"
                          : level.id === 3
                          ? "bg-pink-950/90 border-pink-400 text-pink-400 hover:scale-110 shadow-pink-500/20"
                          : "bg-amber-950/90 border-amber-400 text-amber-400 hover:scale-110 shadow-amber-500/20"
                        : "bg-slate-900/90 border-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                    disabled={!isUnlocked && !isAnimatingUnlock}
                  >
                    {/* Inner content */}
                    {isUnlocked ? (
                      isCompleted ? (
                        <Star size={24} fill="currentColor" className="animate-bounce" />
                      ) : (
                        <span className="font-mono text-lg font-bold">{level.id}</span>
                      )
                    ) : (
                      <Lock size={18} className="text-rose-500" />
                    )}

                    {/* Completion Mini-Star badges */}
                    {isCompleted && (
                      <span className="absolute -top-1 -right-1 bg-emerald-400 text-slate-950 rounded-full p-0.5 shadow-md">
                        <Star size={10} fill="currentColor" />
                      </span>
                    )}
                  </button>

                  {/* Float-up Tooltip on Hover */}
                  <div className="absolute top-16 md:top-18 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-slate-800 px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none text-center shadow-xl z-20">
                    <p className="text-xs font-semibold text-slate-300 font-mono">{node.label}</p>
                    <p
                      className={`text-[10px] font-mono mt-0.5 ${
                        isUnlocked
                          ? isCompleted
                            ? "text-emerald-400 font-semibold"
                            : isBoss
                            ? "text-rose-400 font-bold"
                            : "text-cyan-400"
                          : "text-rose-400"
                      }`}
                    >
                      {isUnlocked
                        ? isCompleted
                          ? "ผ่านด่านเรียบร้อย"
                          : isBoss
                          ? "ลานประลองปัญญา"
                          : "พร้อมสำรวจ"
                        : "ล็อกอยู่"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Station Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
          {questionsData.map((level) => {
            const isUnlocked = unlockedLevels.includes(level.id);
            const isCompleted = completedLevels.includes(level.id);
            const isBoss = level.id === 5;

            return (
              <div
                key={level.id}
                onClick={() => isUnlocked && handleSelect(level.id)}
                className={`border p-4 rounded-2xl transition-all duration-200 flex flex-col justify-between ${
                  isUnlocked
                    ? `cursor-pointer ${
                        isCompleted
                          ? "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/30"
                          : isBoss
                          ? "bg-rose-950/20 border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/30 animate-pulse"
                          : level.id === 1
                          ? "bg-cyan-950/20 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/30"
                          : level.id === 2
                          ? "bg-purple-950/20 border-purple-500/30 hover:border-purple-400 hover:bg-purple-950/30"
                          : level.id === 3
                          ? "bg-pink-950/20 border-pink-500/30 hover:border-pink-400 hover:bg-pink-950/30"
                          : "bg-amber-950/20 border-amber-500/30 hover:border-amber-400 hover:bg-amber-950/30"
                      }`
                    : "bg-slate-950/30 border-slate-900/60 opacity-50 cursor-not-allowed"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                      ด่านที่ {level.id}
                    </span>
                    {isUnlocked ? (
                      isCompleted ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-full font-bold">
                          PASSED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 rounded-full animate-pulse">
                          PLAY
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-950/40 border border-rose-500/30 text-rose-500 rounded-full flex items-center gap-1">
                        <Lock size={8} /> LOCKED
                      </span>
                    )}
                  </div>
                  <h4
                    className={`font-bold text-sm md:text-base ${
                      isUnlocked ? "text-slate-100" : "text-slate-500"
                    }`}
                  >
                    {level.thaiName}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {level.conceptDescription}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-900/60 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {level.name}
                  </span>
                  {isUnlocked && (
                    <span className="text-[10px] text-cyan-400 font-semibold">
                      5 ภารกิจ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Final Report Card Overlay Modal */}
      <AnimatePresence>
        {showFinalReport && (
          <FeedbackOverlay
            type="level-completed"
            isFinalLevel={true}
            starsCount={3}
            studentName={studentName}
            studentClass={studentClass}
            studentNumber={studentNumber}
            onAction={() => setShowFinalReport(false)}
            onClearAndExit={() => {
              setShowFinalReport(false);
              onResetProgress();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
