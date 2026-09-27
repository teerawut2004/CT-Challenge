import React from 'react';
import { 
  Award, RotateCcw, Heart,
  BrainCircuit, Layers, Grid, EyeOff, Cpu, CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { audioSynth } from '../utils/audio';

interface FinalDashboardScreenProps {
  travelerName: string;
  travelerGender: 'female' | 'male';
  totalAccumulatedScore: number;
  levelScores: Record<number, number>; // remaining hearts in each exercise (1-3)
  levelGridScores: Record<number, number>;
  levelGridBlocksUsed: Record<number, { blocks: number; usedLoop: boolean }>;
  onPlayAgain: () => void;
}

export default function FinalDashboardScreen({
  travelerName,
  travelerGender,
  levelScores,
  onPlayAgain,
}: FinalDashboardScreenProps) {

  const calculateExercisePillarStats = (
    levelId: number,
    baseTitle: string,
    englishName: string,
    exerciseSubtitle: string,
    icon: React.ElementType,
    barColor: string,
    iconColor: string
  ) => {
    const remainingHearts = Math.max(1, Math.min(3, levelScores[levelId] || 3));
    // Score measured directly from the exercise performance (remaining hearts out of 3)
    const exerciseScore = remainingHearts === 3 ? 100 : remainingHearts === 2 ? 80 : 60;
    const mistakesCount = 3 - remainingHearts;
    const tier = exerciseScore >= 85 ? 'ยอดเยี่ยม' : exerciseScore >= 75 ? 'ดีมาก' : 'ผ่านเกณฑ์';

    return {
      id: levelId,
      title: baseTitle,
      englishName,
      exerciseSubtitle,
      remainingHearts,
      mistakesCount,
      percent: exerciseScore,
      points: exerciseScore,
      tier,
      icon,
      barColor,
      iconColor,
    };
  };

  const ctPillars = [
    calculateExercisePillarStats(
      1,
      'การแบ่งย่อยปัญหา',
      'Decomposition',
      'แบบฝึกหัดด่านที่ 1 : แยกย่อยขั้นตอนแก้ปัญหา',
      Layers,
      'from-cyan-500 to-teal-400',
      'text-cyan-400'
    ),
    calculateExercisePillarStats(
      2,
      'การหารูปแบบ',
      'Pattern Recognition',
      'แบบฝึกหัดด่านที่ 2 : คาดการณ์ลำดับและรูปแบบ',
      Grid,
      'from-purple-500 to-indigo-400',
      'text-purple-400'
    ),
    calculateExercisePillarStats(
      3,
      'การคิดเชิงนามธรรม',
      'Abstraction',
      'แบบฝึกหัดด่านที่ 3 : คัดเลือกสิ่งของที่สำคัญที่สุด 5 รายการ',
      EyeOff,
      'from-pink-500 to-rose-400',
      'text-pink-400'
    ),
    calculateExercisePillarStats(
      4,
      'การออกแบบอัลกอริทึม',
      'Algorithm Design',
      'แบบฝึกหัดด่านที่ 4 : ออกแบบผังงาน (Flowchart)',
      Cpu,
      'from-amber-500 to-orange-400',
      'text-amber-400'
    ),
  ];

  const totalExercisePoints = ctPillars.reduce((acc, curr) => acc + curr.points, 0);
  const maxExercisePoints = ctPillars.length * 100;

  const averageCTScore = Math.round(
    ctPillars.reduce((acc, curr) => acc + curr.percent, 0) / ctPillars.length
  );

  const overallTier =
    averageCTScore >= 85
      ? 'ระดับยอดเยี่ยม (Master)'
      : averageCTScore >= 75
      ? 'ระดับดีมาก (Advanced)'
      : 'ระดับผ่านเกณฑ์ (Pass)';

  return (
    <div className="h-full w-full bg-radial from-slate-900 via-[#0B0F19] to-[#04060b] text-white flex flex-col items-center justify-center px-4 py-2 font-sans select-none relative overflow-hidden">
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-5xl mx-auto z-10 bg-slate-900/85 border border-slate-800 rounded-3xl p-4 sm:p-5 backdrop-blur-md shadow-2xl"
      >
        {/* 1. COMPACT HEADER & PROFILE ROW */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-2xl sm:text-3xl shadow-[0_0_15px_rgba(6,182,212,0.25)] shrink-0">
              {travelerGender === 'female' ? '👧' : '👦'}
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-amber-400 font-bold mb-0.5">
                <Award size={15} className="shrink-0" />
                <span>แดชบอร์ดสรุปผลการเรียนรู้ (วัดผลจากการทำแบบฝึกหัด)</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-100">
                {travelerName || 'นักเดินทางยอดเยี่ยม'}
              </h1>
              <div className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <span>{travelerGender === 'female' ? 'นักเดินทางหญิง (พอใจ)' : 'นักเดินทางชาย (กวิน)'}</span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-400 font-semibold">{overallTier}</span>
              </div>
            </div>
          </div>

          {/* Score Summary from Exercises */}
          <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 shrink-0">
            <div className="text-center pr-4 border-r border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                คะแนนแบบฝึกหัดรวม
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {totalExercisePoints} <span className="text-xs font-normal text-slate-400">/ {maxExercisePoints}</span>
              </span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                สมรรถนะเฉลี่ย
              </span>
              <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                {averageCTScore}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. 4 CT PILLARS COMPACT 2x2 GRID (MEASURED FROM EXERCISES) */}
        <div className="my-4">
          <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
            <h2 className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5">
              <BrainCircuit size={16} className="text-cyan-400" />
              <span>ผลประเมินทักษะการคิดเชิงคำนวณ 4 มิติ (จากแบบฝึกหัดท้ายด่าน)</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              เกณฑ์พลังชีวิตคงเหลือ: ❤️❤️❤️ = 100% | ❤️❤️ = 80% | ❤️ = 60%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ctPillars.map((pillar) => {
              const IconComp = pillar.icon;
              return (
                <div
                  key={pillar.id}
                  className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${pillar.iconColor} shrink-0`}>
                        <IconComp size={16} />
                      </div>
                      <div className="truncate">
                        <h3 className="font-bold text-slate-100 text-xs sm:text-sm truncate">
                          {pillar.title}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400 block truncate">
                          {pillar.englishName}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-black text-amber-400 font-mono block leading-none">
                        {pillar.percent}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {pillar.tier}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full bg-gradient-to-r ${pillar.barColor} rounded-full`}
                      style={{ width: `${pillar.percent}%` }}
                    />
                  </div>

                  {/* Exercise Heart & Accuracy Detail */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                    <span className="truncate">{pillar.exerciseSubtitle}</span>
                    <span className="flex items-center gap-1 font-mono text-rose-300 shrink-0">
                      <span>เหลือ</span>
                      {[1, 2, 3].map((idx) => (
                        <Heart
                          key={idx}
                          size={12}
                          className={
                            idx <= pillar.remainingHearts
                              ? 'text-rose-500 fill-rose-500'
                              : 'text-slate-700 fill-slate-900'
                          }
                        />
                      ))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. EXERCISE SUMMARY STRIP (EXERCISES 1 - 4) */}
        <div className="mb-5">
          <h2 className="text-xs sm:text-sm font-bold text-slate-200 mb-2.5">
            สรุปคะแนนแบบฝึกหัดรายด่าน (แบบฝึกหัดที่ 1 – 4)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ctPillars.map((pillar) => (
              <div
                key={pillar.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/90 text-center flex flex-col items-center justify-center gap-1"
              >
                <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-400 flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span>แบบฝึกหัดที่ {pillar.id}</span>
                </span>
                <span className="text-xs text-slate-100 font-bold truncate max-w-full leading-tight">
                  {pillar.title}
                </span>
                <div className="flex items-center justify-center gap-1 my-0.5">
                  {[1, 2, 3].map((idx) => (
                    <Heart
                      key={idx}
                      size={14}
                      className={
                        idx <= pillar.remainingHearts
                          ? 'text-rose-500 fill-rose-500'
                          : 'text-slate-700 fill-slate-900'
                      }
                    />
                  ))}
                </div>
                <span className="text-xs font-mono font-extrabold text-amber-300">
                  {pillar.points} / 100 คะแนน
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. ACTION BUTTON (Print button removed as requested) */}
        <div className="flex justify-end items-center pt-3 border-t border-slate-800/80">
          <button
            onClick={() => {
              audioSynth.playSfx('click');
              onPlayAgain();
            }}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-teal-400 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95"
            id="play-again-btn"
          >
            <RotateCcw size={16} />
            <span>เล่นอีกครั้ง (กลับหน้าแรก)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
